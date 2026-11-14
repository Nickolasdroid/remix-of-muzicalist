import ManageSubscriptionCard from "@/components/ManageSubscriptionCard";
import PaymentMethodCard from "@/components/PaymentMethodCard";
import { canManagePlans } from "@/lib/native";

export default function BillingSection() {
  // Subscriptions are not sold or managed inside the Android app (Google Play billing rules)
  if (!canManagePlans()) return null;
  return (
    <div className="space-y-4">
      <ManageSubscriptionCard />
      <PaymentMethodCard />
    </div>
  );
}
