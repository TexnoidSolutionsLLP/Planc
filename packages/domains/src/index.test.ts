import { afterEach, describe, expect, it, vi } from "vitest";
import { isReservedStoreSlug, isValidStoreSlug, refreshStorefront, resolveStoreHost, slugifyStoreName, storeAddress, storeUrl } from "./index";

afterEach(() => vi.unstubAllEnvs());

describe("storeUrl", () => {
  it("uses the storefront path while no store domain is set", () => {
    vi.stubEnv("STOREFRONT_DOMAIN", "");
    vi.stubEnv("STOREFRONT_URL", "https://sellly-storefront.vercel.app/");
    expect(storeUrl("aria-jewelry")).toBe("https://sellly-storefront.vercel.app/aria-jewelry");
    expect(storeAddress("aria-jewelry")).toBe("sellly-storefront.vercel.app/aria-jewelry");
  });

  it("falls back to the local storefront", () => {
    vi.stubEnv("STOREFRONT_DOMAIN", "");
    vi.stubEnv("STOREFRONT_URL", "");
    expect(storeUrl("aot")).toBe("http://localhost:3001/aot");
  });

  it("uses a subdomain once a store domain is set", () => {
    vi.stubEnv("STOREFRONT_DOMAIN", " https://*.Zelyfi.com/ ");
    expect(storeUrl("aria-jewelry")).toBe("https://aria-jewelry.zelyfi.com");
    expect(storeAddress("aot")).toBe("aot.zelyfi.com");
  });
});

describe("resolveStoreHost", () => {
  const domain = "zelyfi.com";

  it("serves a store from its subdomain", () => {
    expect(resolveStoreHost("aria-jewelry.zelyfi.com", domain)).toEqual({ kind: "store", slug: "aria-jewelry" });
    expect(resolveStoreHost("AOT.Zelyfi.com:443", domain)).toEqual({ kind: "store", slug: "aot" });
  });

  it("treats the storefront's own addresses as path-style", () => {
    for (const host of ["zelyfi.com", "www.zelyfi.com", "sellly-storefront.vercel.app", "localhost:3001"]) {
      expect(resolveStoreHost(host, domain)).toEqual({ kind: "root" });
    }
    expect(resolveStoreHost("sellly-storefront.vercel.app", null)).toEqual({ kind: "root" });
  });

  it("supports subdomains locally", () => {
    expect(resolveStoreHost("aot.localhost:3001", null)).toEqual({ kind: "store", slug: "aot" });
  });

  it("rejects reserved names, nested subdomains and unrelated hosts", () => {
    for (const host of ["admin.zelyfi.com", "a.b.zelyfi.com", "shop.theirbrand.com", "evilzelyfi.com", ""]) {
      expect(resolveStoreHost(host, domain)).toEqual({ kind: "unknown" });
    }
    expect(resolveStoreHost("aot.example.com", null)).toEqual({ kind: "unknown" });
  });
});

describe("store slugs", () => {
  it("slugifies names to DNS-safe labels", () => {
    expect(slugifyStoreName("  Aria Jewelry! ")).toBe("aria-jewelry");
    expect(slugifyStoreName("x".repeat(80))).toHaveLength(50);
    expect(slugifyStoreName(`${"a".repeat(49)} b`)).toBe("a".repeat(49));
  });

  it("knows reserved names", () => {
    expect(isReservedStoreSlug("Admin")).toBe(true);
    expect(isReservedStoreSlug("aria-jewelry")).toBe(false);
  });
});

describe("isValidStoreSlug", () => {
  it("accepts slugs and rejects paths or odd characters", () => {
    expect(isValidStoreSlug("aria-jewelry")).toBe(true);
    for (const bad of ["", "-aria", "Aria", "a/b", "../x", "a".repeat(64)]) expect(isValidStoreSlug(bad)).toBe(false);
  });
});

describe("refreshStorefront", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("posts the slug to the storefront with the shared secret", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "s3cret");
    vi.stubEnv("STOREFRONT_URL", "https://sellly-storefront.vercel.app");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await refreshStorefront("aria-jewelry");

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://sellly-storefront.vercel.app/api/revalidate");
    expect(init.headers.authorization).toBe("Bearer s3cret");
    expect(JSON.parse(init.body)).toEqual({ slug: "aria-jewelry" });
  });

  it("does nothing without a secret, and never throws", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("down"));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("REVALIDATE_SECRET", "");
    await refreshStorefront("aria-jewelry");
    expect(fetchMock).not.toHaveBeenCalled();

    vi.stubEnv("REVALIDATE_SECRET", "s3cret");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(refreshStorefront("aria-jewelry")).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
