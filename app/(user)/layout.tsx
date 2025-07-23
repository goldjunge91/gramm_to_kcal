import DashboardLayout from "@/components/layout/UserDashboardLayout";

export default function UserLayout({ children }: { children: React.ReactNode }) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
