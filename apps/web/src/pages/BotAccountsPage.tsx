import { useState } from "react";
import { Modal } from "../components/Modal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiSvc } from "../lib/api";
import { Plus, Bot, Power, Shield, MapPin, Edit2, Play, MessageSquare, Lock, UserPlus, Share2, PlayCircle, Loader2 } from "lucide-react";

export function BotAccountsPage() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBot, setEditingBot] = useState<any>(null);

    // Form State
    const [newBot, setNewBot] = useState({
        username: "",
        password: "",
        platform: "NEXTDOOR",
        sourceIds: [] as string[],
        campaignId: "",
        proxyUrl: "",
        cityMatches: ""
    });

    // Real Data Fetching
    const { data: bots, isLoading: isLoadingBots } = useQuery({
        queryKey: ['bots'],
        queryFn: apiSvc.getBots
    });

    const { data: sources } = useQuery({
        queryKey: ['sources'],
        queryFn: apiSvc.getSources
    });

    const { data: campaigns } = useQuery({
        queryKey: ['campaigns'],
        queryFn: apiSvc.getCampaigns
    });

    const createMutation = useMutation({
        mutationFn: apiSvc.createBot,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bots'] });
            setIsModalOpen(false);
            setEditingBot(null);
            setNewBot({ username: "", password: "", platform: "NEXTDOOR", sourceIds: [], campaignId: "", proxyUrl: "", cityMatches: "" });
        }
    });

    const updateSourcesMutation = useMutation({
        mutationFn: ({ id, sourceIds }: { id: string, sourceIds: string[] }) => apiSvc.updateBotSources(id, sourceIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bots"] });
        }
    });

    const handleSaveBot = () => {
        const payload = {
            username: newBot.username,
            password: newBot.password,
            platform: newBot.platform,
            cityMatches: newBot.cityMatches.split(",").map(c => c.trim()).filter(c => c),
            campaignId: newBot.campaignId || undefined,
            sourceIds: newBot.sourceIds,
            proxyUrl: newBot.proxyUrl || undefined
        };

        if (editingBot) {
            // For MVP editing, mainly focusing on source reassignment
            // Simple check if sources changed
            const currentids = editingBot.assignedSources?.map((s: any) => s.sourceId).sort().join(',') || "";
            const newids = newBot.sourceIds.sort().join(',');

            if (currentids !== newids) {
                updateSourcesMutation.mutate({ id: editingBot.id, sourceIds: newBot.sourceIds });
            }
            setIsModalOpen(false);
        } else {
            createMutation.mutate(payload);
        }
    };

    const openEdit = (bot: any) => {
        setEditingBot(bot);
        setNewBot({
            username: bot.username,
            password: "", // Don't fill password security
            platform: bot.platform,
            sourceIds: bot.assignedSources?.map((a: any) => a.sourceId) || [],
            campaignId: bot.campaignId || "",
            proxyUrl: bot.proxyUrl || "",
            cityMatches: bot.cityMatches?.join(", ") || ""
        });
        setIsModalOpen(true);
    };

    const toggleSourceSelection = (sourceId: string) => {
        setNewBot(prev => {
            const exists = prev.sourceIds.includes(sourceId);
            if (exists) {
                return { ...prev, sourceIds: prev.sourceIds.filter((id) => id !== sourceId) };
            } else {
                if (prev.sourceIds.length >= 4) return prev; // Max 4 sources
                return { ...prev, sourceIds: [...prev.sourceIds, sourceId] };
            }
        });
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
                    onClick={() => { setEditingBot(null); setNewBot({ username: "", password: "", platform: "NEXTDOOR", sourceIds: [], campaignId: "", proxyUrl: "", cityMatches: "" }); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-teal-accent hover:bg-teal-accent/90 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg hover:shadow-teal-accent/25 hover:-translate-y-0.5"
                >
                    <UserPlus size={18} /> Deploy New Identity
                </button>
            </div>

            {/* Bots Grid */}
            {isLoadingBots ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-teal-accent" size={32} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {bots?.map((bot: any) => (
                        <div key={bot.id} className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 overflow-hidden hover:border-teal-accent/20 transition-all">
                            {/* Status Indicator */}
                            <div className="absolute top-0 right-0 p-4">
                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${bot.status === 'ACTIVE'
                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                    }`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${bot.status === 'ACTIVE' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></span>
                                    {bot.status}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center border border-white/10 shadow-inner">
                                    <Shield className="text-gray-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white max-w-[150px] truncate">{bot.username}</h3>
                                    <p className="text-xs text-gray-500 uppercase">{bot.platform}</p>
                                </div>
                            </div>

                            {/* Configuration Details */}
                            <div className="mb-6 space-y-4">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500 flex items-center gap-2"><MapPin size={14} /> Assigned Sources</span>
                                        <span className="text-white font-mono bg-white/10 px-2 py-0.5 rounded text-xs">{bot.assignedSources?.length || 0}/4</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 min-h-[28px]">
                                        {bot.assignedSources?.map((a: any) => (
                                            <span key={a.source.id} className="text-xs bg-teal-accent/10 text-teal-accent px-2 py-1 rounded border border-teal-accent/20 truncate max-w-[150px]">
                                                {a.source.name}
                                            </span>
                                        ))}
                                        {(!bot.assignedSources || bot.assignedSources.length === 0) && (
                                            <span className="text-xs text-gray-600 italic">No sources assigned</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-300 bg-black/20 p-2 rounded-lg border border-white/5">
                                    <PlayCircle size={14} className="text-purple-400" />
                                    <span className="text-xs text-gray-500 uppercase tracking-wider w-16">Workflow</span>
                                    <span className="truncate flex-1">{bot.campaign?.name || 'Unassigned'}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <div className="bg-black/20 p-3 rounded-lg border border-white/5 text-center">
                                        <div className="text-2xl font-mono text-white">{bot.dailyScrapeCount}</div>
                                        <div className="text-xs text-gray-500 uppercase tracking-wider">Scrapes</div>
                                    </div>
                                    <div className="bg-black/20 p-3 rounded-lg border border-white/5 text-center">
                                        <div className={`text-2xl font-mono ${bot.status === 'ACTIVE' ? 'text-green-400' : 'text-red-400'}`}>
                                            {bot.dailyPostCount}
                                        </div>
                                        <div className="text-xs text-gray-500 uppercase tracking-wider">Posts</div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                                    <button onClick={() => openEdit(bot)} className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-xs px-3 py-2 rounded text-gray-300 transition-colors">
                                        <Edit2 size={12} /> Edit
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {bots?.length === 0 && (
                        <div className="col-span-full text-center py-20 text-gray-500 border border-dashed border-white/10 rounded-2xl">
                            No bot identities created yet.
                        </div>
                    )}
                </div>
            )}

            {/* Add Bot Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBot ? "Edit Identity" : "Add New Identity"}>
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
                            {['NEXTDOOR', 'REDDIT'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setNewBot({ ...newBot, platform: p })}
                                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${newBot.platform === p
                                        ? `bg-teal-500/20 border-teal-500 text-white shadow-[0_0_15px_rgba(20,184,166,0.3)]`
                                        : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/5'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">
                            Assign Sources (Max 4) <span className="text-teal-accent ml-2">{newBot.sourceIds.length}/4 selected</span>
                        </label>
                        <div className="max-h-40 overflow-y-auto border border-white/10 rounded-xl bg-black/40 p-2 space-y-1">
                            {sources?.filter((s: any) => s.type === newBot.platform).map((s: any) => (
                                <div
                                    key={s.id}
                                    onClick={() => toggleSourceSelection(s.id)}
                                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${newBot.sourceIds.includes(s.id)
                                            ? 'bg-teal-accent/20 border border-teal-accent/30'
                                            : 'hover:bg-white/5 border border-transparent'
                                        }`}
                                >
                                    <span className="text-sm text-gray-300">{s.name}</span>
                                    {newBot.sourceIds.includes(s.id) && <div className="w-2 h-2 rounded-full bg-teal-accent"></div>}
                                </div>
                            ))}
                            {(!sources || sources.length === 0) && <div className="text-gray-500 text-sm p-2">No sources available. Create one first.</div>}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Assign Campaign workflow</label>
                        <select
                            value={newBot.campaignId}
                            onChange={(e) => setNewBot({ ...newBot, campaignId: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-accent/50 appearance-none cursor-pointer"
                        >
                            <option value="">Select a campaign...</option>
                            {campaigns?.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Proxy String (Optional)</label>
                        <input
                            type="text"
                            value={newBot.proxyUrl}
                            onChange={(e) => setNewBot({ ...newBot, proxyUrl: e.target.value })}
                            placeholder="http://user:pass@host:port"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-accent/50"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                        <button
                            disabled={createMutation.isPending || updateSourcesMutation.isPending}
                            onClick={handleSaveBot}
                            className="px-6 py-2 bg-white text-black font-bold rounded-lg shadow-lg hover:bg-gray-200 transition-all disabled:opacity-50"
                        >
                            {createMutation.isPending || updateSourcesMutation.isPending ? 'Saving...' : (editingBot ? 'Save Changes' : 'Deploy Identity')}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
