import type { ReactNode } from "react";

import DashboardLayout from "@/components/layout/UserDashboardLayout";
import { getSession } from "@/lib/auth/auth-client";

interface DashboardPageProps {
    children: ReactNode;
}

export default async function UserDashboardPageLayout({ children }: DashboardPageProps) {
    const session = await getSession();
    const user = session?.data?.user || null;

    return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
