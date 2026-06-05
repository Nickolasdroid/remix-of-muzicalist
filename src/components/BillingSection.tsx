import ManageSubscriptionCard from "@/components/ManageSubscriptionCard";
import PaymentMethodCard from "@/components/PaymentMethodCard";

export default function BillingSection() {
  return (
    <div className="space-y-4">
      <ManageSubscriptionCard />
      <PaymentMethodCard />
    </div>
  );
}
