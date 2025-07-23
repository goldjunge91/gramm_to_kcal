export interface NavItem {
    title: string;
    href?: string;
    disabled?: boolean;
}

export interface MainNavItem extends NavItem {}

export interface SidebarNavItem extends NavItem {
  icon: keyof typeof import("lucide-react").icons;
}

export interface DashboardConfig {
    mainNav: MainNavItem[];
    sidebarNav: SidebarNavItem[];
}
