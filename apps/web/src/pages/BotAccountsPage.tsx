import { useState } from "react";
import { Modal } from "../components/Modal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiSvc } from "../lib/api";
import { Plus, Power, Shield, MapPin, Edit2, Play, MessageSquare, Lock, UserPlus, PlayCircle, Loader2, Activity } from "lucide-react";
import { LiveBotMonitor } from "../components/LiveBotMonitor";
import { socketSvc } from "../lib/sockets";
import { useEffect } from "react";

export function BotAccountsPage() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [editingBot, setEditingBot] = useState<any>(null);
    const [viewHistoryBot, setViewHistoryBot] = useState<string | null>(null);

    // Verification State
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [verifyBotId, setVerifyBotId] = useState<string | null>(null);
    const [verificationCode, setVerificationCode] = useState("");

    // Live Monitor State
    const [monitoredBotId, setMonitoredBotId] = useState<string | null>(null);
    const [liveLogs, setLiveLogs] = useState<string[]>([]);
    const [liveScreenshot, setLiveScreenshot] = useState<string | null>(null);
    const [liveStep, setLiveStep] = useState<string>("");

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

    const { data: candidates, isLoading: isLoadingCandidates } = useQuery({
        queryKey: ['candidates', viewHistoryBot],
        queryFn: () => viewHistoryBot ? apiSvc.getCandidates(viewHistoryBot) : Promise.resolve([]),
        enabled: !!viewHistoryBot
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

    const verifyMutation = useMutation({
        mutationFn: ({ id, code }: { id: string, code: string }) => apiSvc.verifyBot(id, code),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bots"] });
            setIsVerifyModalOpen(false);
            setVerifyBotId(null);
            setVerificationCode("");
            alert("Verification successful! Bot is now ACTIVE.");
        },
        onError: (err: any) => {
            alert(`Verification failed: ${err.response?.data?.error || err.message}`);
        }
    });

    const handleVerifySubmit = () => {
        if (verifyBotId && verificationCode.length >= 6) {
            verifyMutation.mutate({ id: verifyBotId, code: verificationCode });
        }
    };

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



    // Socket Connection Effect
    useEffect(() => {
        if (!monitoredBotId) return;

        console.log("Connecting to socket for bot:", monitoredBotId);
        socketSvc.joinBotSession(monitoredBotId);

        // Reset logs on new connection
        setLiveLogs([]);
        setLiveScreenshot(null);
        setLiveStep("Initializing...");

        const handleLog = (data: any) => {
            const timestamp = new Date().toLocaleTimeString();
            const icon = data.type === 'error' ? '❌' : data.type === 'success' ? '✅' : 'ℹ️';
            setLiveLogs(prev => [...prev.slice(-100), `[${timestamp}] ${icon} ${data.message}`]);
        };

        const handleScreenshot = (base64: string) => {
            setLiveScreenshot(base64);
        };

        const handleStep = (step: string) => {
            setLiveStep(step);
        };

        socketSvc.onLog(handleLog);
        socketSvc.onScreenshot(handleScreenshot);
        socketSvc.onStepUpdate(handleStep);

        return () => {
            socketSvc.disconnect();
        };
    }, [monitoredBotId]);

    const handleStartMonitor = async (botId: string) => {
        try {
            await apiSvc.startBot(botId);
            setMonitoredBotId(botId);
            // Auto open history modal or a specific monitor modal?
            // For now, let's put the monitor at the top of the page if active
        } catch (err) {
            alert("Failed to start monitoring");
        }
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


            {/* Live Monitor Section */}
            {
                monitoredBotId && (
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Activity className="text-green-400 animate-pulse" /> Live Monitor
                            </h3>
                            <button
                                onClick={() => setMonitoredBotId(null)}
                                className="text-xs text-gray-500 hover:text-white"
                            >
                                Close Monitor
                            </button>
                        </div>
                        <LiveBotMonitor
                            logs={liveLogs}
                            screenshot={liveScreenshot}
                            currentStep={liveStep}
                            isProcessing={true}
                            isManualMode={false}
                        />
                    </div>
                )
            }

            {/* Bots Grid */}
            {
                isLoadingBots ? (
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
                                    {bot.status === 'VERIFICATION_REQUIRED' && (
                                        <button
                                            onClick={() => { setVerifyBotId(bot.id); setIsVerifyModalOpen(true); }}
                                            className="mt-2 text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded w-full animate-bounce font-bold shadow-lg"
                                        >
                                            🔓 Verify Now
                                        </button>
                                    )}
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

                                    <button
                                        onClick={() => { setViewHistoryBot(bot.id); setIsHistoryOpen(true); }}
                                        className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-xs px-3 py-2 rounded text-gray-300 transition-colors"
                                    >
                                        <MessageSquare size={12} /> History
                                    </button>
                                    <button onClick={() => openEdit(bot)} className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-xs px-3 py-2 rounded text-gray-300 transition-colors">
                                        <Edit2 size={12} /> Config
                                    </button>

                                    <button
                                        onClick={() => handleStartMonitor(bot.id)}
                                        className="flex items-center gap-1 bg-teal-accent/10 hover:bg-teal-accent/20 text-xs px-3 py-2 rounded text-teal-accent transition-colors border border-teal-accent/20"
                                    >
                                        <Play size={12} /> Monitor
                                    </button>
                                </div>
                            </div>
                        ))
                        }
                        {
                            (!bots || bots.length === 0) && (
                                <div className="col-span-full text-center py-20 text-gray-500 border border-dashed border-white/10 rounded-2xl">
                                    No bot identities created yet.
                                </div>
                            )
                        }
                    </div >
                )
            }

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
                    </div >

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

            {/* History Modal */}
            <Modal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title="Monitoring History">
                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                    {isLoadingCandidates ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-teal-accent" /></div>
                    ) : candidates?.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">No messages scraped yet.</div>
                    ) : (
                        candidates?.map((c: any) => (
                            <div key={c.id} className="bg-white/5 p-4 rounded-xl border border-white/10 text-sm">
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold text-white max-w-[70%] truncate">{c.title || "No Title"}</span>
                                    <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-gray-400 mb-3">{c.body}</p>
                                <div className="flex items-center gap-2">
                                    {c.lead ? (
                                        <span className="text-green-400 text-xs bg-green-500/10 px-2 py-1 rounded border border-green-500/20">Qualified Lead</span>
                                    ) : (
                                        <span className="text-gray-500 text-xs bg-white/5 px-2 py-1 rounded">Disqualified</span>
                                    )}
                                    <span className="text-xs text-gray-600">{c.source?.name}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Modal>

            {/* Verification Modal */}
            <Modal isOpen={isVerifyModalOpen} onClose={() => setIsVerifyModalOpen(false)} title="🔐 Enter Verification Code">
                <div className="space-y-4">
                    <p className="text-gray-300 text-sm">
                        Nextdoor has sent a verification code to the bot's email. Please enter it below to unblock the account.
                    </p>
                    <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">6-Digit Code</label>
                        <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            placeholder="123456"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-[1em] focus:outline-none focus:border-teal-accent/50"
                            maxLength={6}
                        />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button onClick={() => setIsVerifyModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                        <button
                            disabled={verifyMutation.isPending || verificationCode.length < 6}
                            onClick={handleVerifySubmit}
                            className="px-6 py-2 bg-teal-accent text-white font-bold rounded-lg shadow-lg hover:bg-teal-accent/90 transition-all disabled:opacity-50"
                        >
                            {verifyMutation.isPending ? 'Verifying...' : 'Submit Code'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div >
    );
}
