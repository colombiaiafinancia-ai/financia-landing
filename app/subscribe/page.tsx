import SubscriptionCheckout from "@/components/subscriptions/SubscriptionCheckout";

export default function SubscribePage() {
  return (
    <main className="mx-auto max-w-xl p-6">
      <SubscriptionCheckout
        userId="3357848177"
        payerEmail="test@testuser.com"
        planKey="financia_pro_monthly"
      />
    </main>
  );
}