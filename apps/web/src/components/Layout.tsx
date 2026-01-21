import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Map, Settings, Activity } from "lucide-react";
import clsx from "clsx";

const navItems = [
    { href: "/", label: "Leads", icon: LayoutDashboard },
    { href: "/clients", label: "Clients", icon: Users },
    { href: "/sources", label: "Sources", icon: Map },
    { href: "/accounts", label: "Bot Accounts", icon: Activity },
    { href: "/settings", label: "Settings", icon: Settings },
];

export function Layout() {
    const location = useLocation();

    return (
        <div className="flex h-screen bg-gray-50 text-gray-900">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-gray-200">
                    <span className="text-xl font-bold text-indigo-600">Ghost Scraper</span>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={clsx(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-indigo-50 text-indigo-700"
                                        : "text-gray-700 hover:bg-gray-100"
                                )}
                            >
                                <Icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between">
                    <h1 className="text-lg font-semibold">Dashboard</h1>
                </header>
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
