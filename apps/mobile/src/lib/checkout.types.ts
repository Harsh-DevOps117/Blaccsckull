export type CheckoutOrder = {
  registered: false;
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: { name: string; email: string };
};
export type CheckoutResult = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
export function checkoutOptions(order: CheckoutOrder) {
  return {
    key: order.keyId,
    order_id: order.orderId,
    amount: order.amount,
    currency: order.currency,
    name: order.name,
    description: order.description,
    prefill: order.prefill,
    theme: { color: '#007F8B' },
    retry: { enabled: false },
  };
}
