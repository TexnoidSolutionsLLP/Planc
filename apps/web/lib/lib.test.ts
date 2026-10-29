import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";
import { whatsappNumber, whatsappOrderLink } from "./whatsapp";
import { stockState, unitEconomics } from "./product-metrics";
import { canBulkAdvance } from "./order-status";

describe("toCsv", () => {
  it("quotes fields, escapes quotes, uses CRLF and a BOM", () => {
    const csv = toCsv(["Name", "Note"], [["Asha \"A\" Rao", "line1\nline2"], [null, 12.5]]);
    expect(csv).toBe('﻿"Name","Note"\r\n"Asha ""A"" Rao","line1\nline2"\r\n"","12.5"\r\n');
  });

  it("neutralises spreadsheet formulas in text but not in numbers", () => {
    const csv = toCsv(["a", "b", "c", "d"], [["=HYPERLINK(\"x\")", "+91 98765", "@SUM(A1)", -5]]);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).toContain(`"'+91 98765"`);
    expect(csv).toContain(`"'@SUM(A1)"`);
    expect(csv).toContain(`"-5"`);
  });

  it("formats dates as ISO", () => {
    expect(toCsv(["d"], [[new Date("2026-01-02T03:04:05Z")]])).toContain('"2026-01-02T03:04:05.000Z"');
  });
});

describe("whatsappNumber", () => {
  it.each([
    ["9876543210", "919876543210"],
    ["98765 43210", "919876543210"],
    ["09876543210", "919876543210"],
    ["+91 98765-43210", "919876543210"],
    ["919876543210", "919876543210"],
    ["+44 7700 900123", "447700900123"],
    ["0044 7700 900123", "447700900123"],
  ])("%s → %s", (input, expected) => expect(whatsappNumber(input)).toBe(expected));

  it.each([[""], [null], ["12345"], ["1234567890"], ["+12"], ["abc"]])("rejects %s", (input) => {
    expect(whatsappNumber(input as any)).toBeNull();
  });
});

describe("whatsappOrderLink", () => {
  it("pre-fills a message with the order reference", () => {
    const link = whatsappOrderLink({ phone: "9876543210", customerName: "Priya Sharma", storeName: "Aria & Co", orderNumber: 1042 });
    expect(link).toBe(`https://wa.me/919876543210?text=${encodeURIComponent("Hi Priya, this is Aria & Co about your order #1042.")}`);
  });

  it("returns null without a usable number", () => {
    expect(whatsappOrderLink({ phone: "12", customerName: "X", storeName: "S", orderNumber: 1 })).toBeNull();
  });
});

describe("product metrics", () => {
  it("computes unit profit and margin only when cost is recorded", () => {
    expect(unitEconomics(1000, 600)).toEqual({ profit: 400, margin: 0.4 });
    expect(unitEconomics(1000, null)).toEqual({ profit: null, margin: null });
    expect(unitEconomics(0, 10)).toEqual({ profit: null, margin: null });
    expect(unitEconomics(500, 700).profit).toBe(-200);
  });

  it("classifies stock", () => {
    expect(stockState({ trackInventory: false, inventoryQty: 0 })).toBe("untracked");
    expect(stockState({ trackInventory: true, inventoryQty: 0 })).toBe("out");
    expect(stockState({ trackInventory: true, inventoryQty: 5 })).toBe("low");
    expect(stockState({ trackInventory: true, inventoryQty: 6 })).toBe("ok");
  });
});

describe("canBulkAdvance", () => {
  it("only moves forward along the fulfilment flow", () => {
    expect(canBulkAdvance("PENDING", "CONFIRMED")).toBe(true);
    expect(canBulkAdvance("CONFIRMED", "SHIPPED")).toBe(true);
    expect(canBulkAdvance("SHIPPED", "PACKED")).toBe(false);
    expect(canBulkAdvance("SHIPPED", "SHIPPED")).toBe(false);
    expect(canBulkAdvance("CANCELLED", "DELIVERED")).toBe(false);
    expect(canBulkAdvance("PENDING", "CANCELLED")).toBe(false);
  });
});
