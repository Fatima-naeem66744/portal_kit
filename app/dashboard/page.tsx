import { Suspense } from "react";
import DashboardContent from "./dashboardclient";

export default function DashboardPage() {
  return (
    <main>
      <Suspense fallback={<p>Loading your dashboard...</p>}>
        <DashboardContent />
      </Suspense>
    </main>
  );
}