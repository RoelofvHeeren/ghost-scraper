import { Activity, Shield, UserPlus, Power, AlertCircle, Share2, PlayCircle, Lock } from "lucide-react";
import { useState } from "react";
import { Modal } from "../components/Modal";

export function BotAccountsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Mock Data (In a real app, these would come from your API/Query)
    const mockSources = [
        { id: 1, name: "Nextdoor - Denver Neighborhoods", platform: "Nextdoor" },
        { id: 2, name: "r/realestateinvesting", platform: "Reddit" },
    ];

    const mockCampaigns = [
        { id: 1, name: "Standard Outreach v1" },
        { id: 2, name: "Aggressive Follow-up" },
    ];

    const [bots, setBots] = useState([
        { id: 1, username: "John Smith", platform: "Nextdoor", source: "Nextdoor - Denver Neighborhoods", campaign: "Standard Outreach v1", status: "online", battery: 92, actions: 142 },
        { id: 2, username: "Sarah Connor", platform: "Reddit", source: "r/realestateinvesting", campaign: "Standard Outreach v1", status: "online", battery: 85, actions: 89 },
        { id: 3, username: "Helpful Neighbor", platform: "Nextdoor", source: "Nextdoor - Denver Neighborhoods", campaign: "Aggressive Follow-up", status: "cooldown", battery: 45, actions: 312 },
    ]);

    const [newBot, setNewBot] = useState({
        username: "",
        password: "",
        platform: "Nextdoor",
        sourceId: "",
        campaignId: "",
        proxy: ""
    });

    const handleAddBot = () => {
        const source = mockSources.find(s => s.id.toString() === newBot.sourceId);
        const campaign = mockCampaigns.find(c => c.id.toString() === newBot.campaignId);

        const bot = {
            id: Date.now(),
            username: newBot.username,
            platform: newBot.platform,
            source: source?.name || "Unassigned",
            campaign: campaign?.name || "Unassigned",
            status: "online",
            battery: 100,
            actions: 0
        };

        setBots([...bots, bot]);
        setIsModalOpen(false);
        setNewBot({ username: "", password: "", platform: "Nextdoor", sourceId: "", campaignId: "", proxy: "" });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <h2 className="text-4xl font-serif font-bold text-white tracking-tight mb-2">Bot Army</h2>
                    <p className="text-gray-400">Manage the identities interacting with leads.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-teal-accent hover:bg-teal-accent/90 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg hover:shadow-teal-accent/25 hover:-translate-y-0.5"
                >
                    <UserPlus size={18} /> Add New Identity
                </button>
            </div>

            {/* Bots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {bots.map((bot) => (
                    <div key={bot.id} className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 overflow-hidden hover:border-teal-accent/20 transition-all">
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

                        {/* Configuration Details */}
                        <div className="mb-6 space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-300 bg-black/20 p-2 rounded-lg border border-white/5">
                                <Share2 size={14} className="text-blue-400" />
                                <span className="text-xs text-gray-500 uppercase tracking-wider w-16">Source</span>
                                <span className="truncate flex-1">{bot.source}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-300 bg-black/20 p-2 rounded-lg border border-white/5">
                                <PlayCircle size={14} className="text-purple-400" />
                                <span className="text-xs text-gray-500 uppercase tracking-wider w-16">Campaign</span>
                                <span className="truncate flex-1">{bot.campaign}</span>
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

            {/* Add Bot Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Bot Identity">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Username / Email</label>
                            <input
                                type="text"
                                value={newBot.username}
                                onChange={(e) => setNewBot({ ...newBot, username: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-accent/50"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Password</label>
                            <div className="relative">
                                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="password"
                                    value={newBot.password}
                                    onChange={(e) => setNewBot({ ...newBot, password: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white focus:outline-none focus:border-teal-accent/50"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Platform</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['Nextdoor', 'Reddit'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setNewBot({ ...newBot, platform: p })}
                                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${newBot.platform === p
                                            ? `bg-teal-500/20 border-teal-500 text-white`
                                            : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/5'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Assign Source</label>
                        <select
                            value={newBot.sourceId}
                            onChange={(e) => setNewBot({ ...newBot, sourceId: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-accent/50 appearance-none"
                        >
                            <option value="">Select a source...</option>
                            {mockSources.filter(s => s.platform === newBot.platform).map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Assign Workflow</label>
                        <select
                            value={newBot.campaignId}
                            onChange={(e) => setNewBot({ ...newBot, campaignId: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-accent/50 appearance-none"
                        >
                            <option value="">Select a campaign...</option>
                            {mockCampaigns.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Proxy String (Optional)</label>
                        <input
                            type="text"
                            value={newBot.proxy}
                            onChange={(e) => setNewBot({ ...newBot, proxy: e.target.value })}
                            placeholder="http://user:pass@host:port"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-accent/50"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                        <button onClick={handleAddBot} className="px-6 py-2 bg-white text-black font-bold rounded-lg shadow-lg hover:bg-gray-200 transition-all">
                            Add Identity
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
