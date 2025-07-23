import { UserDashboardNavbar } from "@/components/layout/UserDashboardNavbar";
import { MainNav } from "@/components/main-nav";
import { SiteFooter } from "@/components/site-footer";
import { dashboardConfig } from "@/config/dashboard";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col space-y-6">
            <header className="sticky top-0 z-40 border-b bg-background">
                <div className="container flex h-16 items-center justify-between py-4">
                    <UserDashboardNavbar items={dashboardConfig.mainNav} />
                    <MainNav items={dashboardConfig.mainNav} />
                </div>
            </header>
            <div className="container grid flex-1 gap-12 md:grid-cols-[200px_1fr]">
                <aside className="hidden w-[200px] flex-col md:flex">
                    <nav className="grid items-start gap-2">
                        {dashboardConfig.sidebarNav.map((item, index) => (
                            <a
                                key={index}
                                href={item.disabled ? "#" : item.href}
                                className="flex w-full items-center rounded-md p-2 text-sm font-medium hover:underline"
                            >
                                {item.title}
                            </a>
                        ))}
                    </nav>
                </aside>
                <main className="flex w-full flex-1 flex-col overflow-hidden">
                    {children}
                </main>
            </div>
            <SiteFooter className="border-t" />
        </div>
    );
}
