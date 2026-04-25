import SubscriptionCheckout from "@/components/subscriptions/SubscriptionCheckout";

export default function SubscribePage() {
  return (
    <main className="mx-auto max-w-xl p-6">
      <SubscriptionCheckout
        userId="88e32420-959a-4415-bdb6-da6ea25a0852"
        payerEmail="test-vyk4bfj0v@srv1.mail-tester.com"
        planKey="financia_pro_monthly"
      />
    </main>
  );
}