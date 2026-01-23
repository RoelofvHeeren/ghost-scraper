import { Activity, Shield, UserPlus, Power, AlertCircle } from "lucide-react";

export function BotAccountsPage() {
    // Mock data for display
    const bots = [
        { id: 1, username: "John Smith", platform: "Nextdoor", status: "online", battery: 92, actions: 142 },
        { id: 2, username: "Sarah Connor", platform: "Reddit", status: "online", battery: 85, actions: 89 },
        { id: 3, username: "Helpful Neighbor", platform: "Nextdoor", status: "cooldown", battery: 45, actions: 312 },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <h2 className="text-4xl font-serif font-bold text-white tracking-tight mb-2">Bot Army</h2>
                    <p className="text-gray-400">Manage the identities interacting with leads.</p>
                </div>
                <button className="flex items-center gap-2 bg-teal-accent hover:bg-teal-accent/90 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg hover:shadow-teal-accent/25 hover:-translate-y-0.5">
                    <UserPlus size={18} /> Add New Identity
                </button>
            </div>

            {/* Bots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {bots.map((bot) => (
                    <div key={bot.id} className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 overflow-hidden">
                        {/* Status Indicator */}
                        <div className="absolute top-0 right-0 p-4">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${bot.status === 'online'
                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${bot.status === 'online' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></span>
                                {bot.status}
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center border border-white/10 shadow-inner">
                                <Shield className="text-gray-400" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{bot.username}</h3>
                                <p className="text-xs text-gray-500">{bot.platform}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Health Bar */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>Health / Trust Score</span>
                                    <span>{bot.battery}%</span>
                                </div>
                                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className="h-full bg-gradient-to-r from-teal-accent to-emerald-500 transition-all duration-1000"
                                        style={{ width: `${bot.battery}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="bg-black/20 p-3 rounded-lg border border-white/5 text-center">
                                    <div className="text-2xl font-mono text-white">{bot.actions}</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wider">Actions</div>
                                </div>
                                <button className="flex flex-col items-center justify-center bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 p-3 rounded-lg transition-colors group">
                                    <Power size={20} className="text-red-400 group-hover:scale-110 transition-transform mb-1" />
                                    <span className="text-xs text-red-300">Stop</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Warning / Notice */}
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex gap-3 text-sm text-blue-200/80">
                <AlertCircle className="shrink-0" size={20} />
                <p>
                    Ensure you rotate user agents and proxies regularly. 2 accounts are approaching daily limits.
                </p>
            </div>
        </div>
    );
}
