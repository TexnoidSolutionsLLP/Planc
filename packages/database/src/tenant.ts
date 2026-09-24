import { Prisma } from "@prisma/client";
import { prisma } from "./index";

/**
 * Every merchant-facing query MUST go through a TenantDb instead of the raw
 * prisma client. This forces storeId into every where/create clause so a
 * bug in a route handler can't leak another merchant's data.
 */
export function getTenantDb(storeId: string) {
  if (!storeId) throw new Error("getTenantDb requires a storeId");

  return {
    storeId,

    product: {
      findMany: <T extends Omit<Prisma.ProductFindManyArgs, "where">>(
        args?: T
      ) => prisma.product.findMany({ ...args, where: { ...(args as any)?.where, storeId } } as any) as Promise<
        Prisma.ProductGetPayload<T>[]
      >,
      findFirst: <T extends Omit<Prisma.ProductFindFirstArgs, "where">>(
        args?: T
      ) => prisma.product.findFirst({ ...args, where: { ...(args as any)?.where, storeId } } as any) as Promise<
        Prisma.ProductGetPayload<T> | null
      >,
      count: (args: Omit<Prisma.ProductCountArgs, "where"> & { where?: Prisma.ProductWhereInput } = {}) =>
        prisma.product.count({ ...args, where: { ...args?.where, storeId } }),
      create: (data: any, include?: any) => prisma.product.create({ data: { ...data, storeId }, include }),
      update: (id: string, data: any) => prisma.product.updateMany({ where: { id, storeId }, data }),
      delete: (id: string) => prisma.product.deleteMany({ where: { id, storeId } }),
    },

    collection: {
      findMany: <T extends Omit<Prisma.CollectionFindManyArgs, "where">>(
        args?: T
      ) => prisma.collection.findMany({ ...args, where: { ...(args as any)?.where, storeId } } as any) as Promise<
        Prisma.CollectionGetPayload<T>[]
      >,
      findFirst: <T extends Omit<Prisma.CollectionFindFirstArgs, "where">>(
        args?: T
      ) => prisma.collection.findFirst({ ...args, where: { ...(args as any)?.where, storeId } } as any) as Promise<
        Prisma.CollectionGetPayload<T> | null
      >,
      create: (data: any) => prisma.collection.create({ data: { ...data, storeId } }),
      update: (id: string, data: any) => prisma.collection.updateMany({ where: { id, storeId }, data }),
      delete: (id: string) => prisma.collection.deleteMany({ where: { id, storeId } }),
    },

    order: {
      findMany: <T extends Omit<Prisma.OrderFindManyArgs, "where">>(
        args?: T
      ) => prisma.order.findMany({ ...args, where: { ...(args as any)?.where, storeId } } as any) as Promise<
        Prisma.OrderGetPayload<T>[]
      >,
      findFirst: <T extends Omit<Prisma.OrderFindFirstArgs, "where">>(
        args?: T
      ) => prisma.order.findFirst({ ...args, where: { ...(args as any)?.where, storeId } } as any) as Promise<
        Prisma.OrderGetPayload<T> | null
      >,
      count: (args: Omit<Prisma.OrderCountArgs, "where"> & { where?: Prisma.OrderWhereInput } = {}) =>
        prisma.order.count({ ...args, where: { ...args?.where, storeId } }),
      create: (data: any, include?: any) => prisma.order.create({ data: { ...data, storeId }, include }),
      update: (id: string, data: any) => prisma.order.updateMany({ where: { id, storeId }, data }),
    },

    customer: {
      findMany: <T extends Omit<Prisma.CustomerFindManyArgs, "where">>(
        args?: T
      ) => prisma.customer.findMany({ ...args, where: { ...(args as any)?.where, storeId } } as any) as Promise<
        Prisma.CustomerGetPayload<T>[]
      >,
      findFirst: <T extends Omit<Prisma.CustomerFindFirstArgs, "where">>(
        args?: T
      ) => prisma.customer.findFirst({ ...args, where: { ...(args as any)?.where, storeId } } as any) as Promise<
        Prisma.CustomerGetPayload<T> | null
      >,
      upsertByPhone: async (phone: string, data: { name: string; email?: string }) => {
        const existing = await prisma.customer.findFirst({ where: { storeId, phone } });
        if (existing) return existing;
        return prisma.customer.create({ data: { ...data, phone, storeId } });
      },
    },

    discount: {
      findMany: <T extends Omit<Prisma.DiscountFindManyArgs, "where">>(
        args?: T
      ) => prisma.discount.findMany({ ...args, where: { ...(args as any)?.where, storeId } } as any) as Promise<
        Prisma.DiscountGetPayload<T>[]
      >,
      create: (data: any) => prisma.discount.create({ data: { ...data, storeId } }),
    },

    raw: prisma,
  };
}

export type TenantDb = ReturnType<typeof getTenantDb>;
