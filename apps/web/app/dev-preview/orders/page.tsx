import { OrdersView } from "../../[store]/orders/orders-view";
import { demoNoopAction } from "../demo-actions";
import { DEMO_ORDERS, DEMO_STORE } from "../fixtures";

export default function DevPreviewOrders() {
  return <OrdersView store={DEMO_STORE} orders={DEMO_ORDERS} notice={null} bulkAction={demoNoopAction} />;
}
