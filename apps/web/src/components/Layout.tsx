import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Map, Settings, Activity, Sparkles, Terminal, Factory } from "lucide-react";
import clsx from "clsx";

const navItems = [
    { href: "/", label: "Leads", icon: LayoutDashboard },
    { href: "/clients", label: "Clients", icon: Users },
    { href: "/sources", label: "Sources", icon: Map },
    { href: "/accounts", label: "Bot Accounts", icon: Activity },
    { href: "/factory", label: "Bot Factory", icon: Factory }, // New
    { href: "/simulator", label: "Simulator", icon: Terminal },
    { href: "/settings", label: "Settings", icon: Settings },
];

export function Layout() {
    const location = useLocation();

    return (
        <div className="min-h-screen text-gray-200 font-sans selection:bg-teal-accent/30 selection:text-white">
            {/* Video Background */}
            <video
                autoPlay
                muted
                loop
                playsInline
                className="bg-video"
            >
                <source src="/background.mp4" type="video/mp4" />
            </video>

            <div className="flex h-screen overflow-hidden relative z-10">
                {/* Sidebar */}
                <aside className="w-72 bg-white/5 backdrop-blur-md border-r border-white/10 flex flex-col p-6 shadow-2xl">
                    <div className="mb-10 flex items-center gap-3 px-2">
                        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black shadow-luxury border border-white/10">
                            <Sparkles className="h-6 w-6 text-teal-accent" />
                        </div>
                        <span className="font-serif text-2xl font-bold tracking-tight text-white">Ghost</span>
                    </div>

                    <nav className="flex-1 space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    className={clsx(
                                        "group relative flex items-center gap-3 rounded-lg py-3.5 px-4 text-sm font-medium transition-all duration-300",
                                        isActive
                                            ? "bg-black/40 text-white shadow-3d translate-x-1 border border-white/5"
                                            : "text-gray-400 hover:bg-white/5 hover:text-white hover:translate-x-1"
                                    )}
                                >
                                    <Icon className={clsx("h-5 w-5 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-teal-accent" : "text-gray-500 group-hover:text-teal-accent")} />
                                    <span>{item.label}</span>
                                    {isActive && (
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-teal-accent rounded-l-full shadow-[0_0_10px_rgba(19,145,135,0.5)]"></div>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-auto p-4 bg-black/20 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-teal-accent/20 flex items-center justify-center text-teal-accent text-xs font-bold font-mono">
                                JS
                            </div>
                            <div>
                                <div className="text-sm font-medium text-white">John Smith</div>
                                <div className="text-xs text-gray-400">Admin</div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-auto">
                    <div className="p-8 max-w-[1600px] mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
