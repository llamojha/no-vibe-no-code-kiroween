import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function KiroweenDashboardPage() {
  // Redirect to the unified dashboard
  redirect("/dashboard");
}
