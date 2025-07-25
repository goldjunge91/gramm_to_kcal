import type { ReactNode } from "react";

import DashboardLayout from "@/components/layout/UserDashboardLayout";

interface DashboardPageProps {
    children: ReactNode;
}

export default function UserDashboardPageLayout({ children }: DashboardPageProps) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
