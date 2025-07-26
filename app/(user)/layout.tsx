import DashboardLayout from "@/components/layout/UserDashboardLayout";
import { auth } from "@/lib/auth/auth";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
    const session = await auth.api.getSession({ headers: new Headers() });
    const user = session?.user
        ? {
                id: session.user.id,
                email: session.user.email,
                emailVerified: session.user.emailVerified,
                name: session.user.name,
                createdAt: session.user.createdAt,
                updatedAt: session.user.updatedAt,
                image: session.user.image ?? null,
            }
        : null;

    return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
