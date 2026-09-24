import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import { prisma } from "@sellly/database";
import { Card, buttonVariants } from "@sellly/ui";
import { getPublishedStore } from "@/lib/store";

export default async function OrderConfirmationPage({ params }: { params: { store: string; id: string } }) {
  const store = await getPublishedStore(params.store);
  const order = await prisma.order.findFirst({
    where: { id: params.id, storeId: store.id },
    include: { items: true, payment: true },
  });
  if (!order) notFound();

  const paymentPending = order.payment?.provider === "razorpay" && order.payment.status === "PENDING";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      {paymentPending ? (
        <>
          <Clock className="mx-auto h-12 w-12 text-warning" />
          <h1 className="mt-4 text-h1 text-primary">Confirming your payment</h1>
          <p className="mt-2 text-body text-muted">
            Order <span className="font-medium text-primary">#{order.orderNumber}</span> is being confirmed. This
            page will update once your payment is verified — refresh in a few seconds, or check{" "}
            <Link href={`/${store.slug}/track?order=${order.id}`} className="text-accent hover:underline">
              order tracking
            </Link>
            .
          </p>
        </>
      ) : (
        <>
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <h1 className="mt-4 text-h1 text-primary">Order confirmed</h1>
          <p className="mt-2 text-body text-muted">
            Thanks {order.customerName.split(" ")[0]}, your order <span className="font-medium text-primary">#{order.orderNumber}</span> has
            been placed.
          </p>
        </>
      )}

      <Card className="mt-8 text-left">
        <ul className="divide-y divide-border">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between py-3 text-small">
              <span>
                {item.title} × {item.quantity}
              </span>
              <span>₹{(Number(item.price) * item.quantity).toLocaleString("en-IN")}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-border pt-3 font-medium text-primary">
          <span>Total</span>
          <span>₹{Number(order.total).toLocaleString("en-IN")}</span>
        </div>
      </Card>

      <div className="mt-8 flex justify-center gap-3">
        <Link href={`/${store.slug}/track?order=${order.id}`} className={buttonVariants({ variant: "secondary" })}>
          Track order
        </Link>
        <Link href={`/${store.slug}`} className={buttonVariants({})}>
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
