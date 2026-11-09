export type OverviewData = {
  name: string;
  sample: boolean;
  periodLabel: string;
  days: {
    key: string;
    label: string;
    paid: number;
    cod: number;
    other: number;
    paidCount: number;
    codCount: number;
    otherCount: number;
  }[];
  stores: {
    total: number;
    published: number;
    draft: number;
    suspended: number;
  };
  plans: { label: string; count: number }[];
  mrr: number;
  paidPlans: number;
  activeGrants: number;
  orderActivity: { label: string; count: number; color: string }[];
  cancelledOrders: number;
  /** The five most recently created stores, newest first. */
  newStores: {
    id: string;
    name: string;
    owner: string | null;
    status: string;
    joined: string;
  }[];
};
