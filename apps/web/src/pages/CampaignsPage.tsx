import { useState } from "react";
import { MessageSquare, Clock, Plus, Trash2, PlayCircle, Settings, ChevronRight } from "lucide-react";
import { Modal } from "../components/Modal";

type Step = {
    id: string;
    delayMinutes: number;
    content: string;
};

type Campaign = {
    id: string;
    name: string;
    status: "ACTIVE" | "PAUSED";
    steps: Step[];
};

export function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([
        {
            id: "1",
            name: "Standard Outreach",
            status: "ACTIVE",
            steps: [
                { id: "s1", delayMinutes: 2, content: "Hey! I think I can help with this. Let me check my schedule..." },
                { id: "s2", delayMinutes: 5, content: "Just checked, we have an opening tomorrow. Give us a call at 555-0123. - John" }
            ]
        }
    ]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newCampaignName, setNewCampaignName] = useState("");

    const handleCreate = () => {
        if (!newCampaignName) return;
        setCampaigns([
            ...campaigns,
            {
                id: Date.now().toString(),
                name: newCampaignName,
                status: "PAUSED",
                steps: []
            }
        ]);
        setNewCampaignName("");
        setIsCreateOpen(false);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-3xl font-bold text-white flex items-center gap-3">
                        <MessageSquare className="w-8 h-8 text-teal-accent" />
                        Message Flows
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Design autonomous reply sequences with human-like delays.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="px-6 py-3 bg-teal-accent text-white font-semibold rounded-xl shadow-lg hover:shadow-teal-accent/25 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                >
                    <Plus size={20} />
                    New Campaign
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {campaigns.map((camp) => (
                    <div key={camp.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl group">
                        {/* Campaign Header */}
                        <div className="p-6 border-b border-white/5 flex justify-between items-start bg-black/20">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${camp.status === 'ACTIVE' ? 'bg-teal-accent/20 text-teal-accent' : 'bg-gray-700/50 text-gray-400'}`}>
                                    <Settings size={22} className={camp.status === 'ACTIVE' ? 'animate-spin-slow' : ''} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-xl">{camp.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className={`h-2 w-2 rounded-full ${camp.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                                        <span className="text-xs text-gray-400 tracking-wider font-medium">{camp.status}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                    <Settings size={18} />
                                </button>
                                <button className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Sequence Visualizer */}
                        <div className="p-6 space-y-6 relative">
                            {/* Vertical Line */}
                            <div className="absolute left-10 top-6 bottom-6 w-0.5 bg-white/10" />

                            {/* Trigger Node */}
                            <div className="relative flex gap-6 z-10">
                                <div className="w-8 h-8 rounded-full bg-teal-accent border-4 border-[#0a0a0a] flex items-center justify-center shrink-0 shadow-lg shadow-teal-accent/20">
                                    <PlayCircle size={16} className="text-white" />
                                </div>
                                <div className="pt-1">
                                    <span className="text-xs font-bold text-teal-accent uppercase tracking-wider">Trigger</span>
                                    <p className="text-sm text-gray-300">Lead Identified & Qualified</p>
                                </div>
                            </div>

                            {/* Steps */}
                            {camp.steps.map((step, idx) => (
                                <div key={step.id} className="relative flex gap-6 z-10 group/step">
                                    <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-white/20 flex items-center justify-center shrink-0">
                                        <span className="text-xs font-mono text-gray-500">{idx + 1}</span>
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        {/* Delay Badge */}
                                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#111] border border-white/10 text-[10px] text-gray-400 uppercase tracking-wider">
                                            <Clock size={10} />
                                            Wait {step.delayMinutes} mins
                                        </div>

                                        {/* Message Bubble */}
                                        <div className="bg-[#222] border border-white/5 rounded-r-xl rounded-bl-xl p-4 text-sm text-gray-200 relative group-hover/step:border-teal-accent/30 transition-colors">
                                            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover/step:opacity-100 cursor-pointer text-gray-500 hover:text-white">
                                                <Settings size={12} />
                                            </div>
                                            "{step.content}"
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Add Step Button */}
                            <div className="relative flex gap-6 z-10 pt-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                                <div className="w-8 h-8 rounded-full bg-white/5 border border-dashed border-gray-500 flex items-center justify-center shrink-0">
                                    <Plus size={14} className="text-gray-400" />
                                </div>
                                <div className="pt-2">
                                    <span className="text-sm text-gray-500 font-medium">Add next step...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Campaign Modal */}
            <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Campaign">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Campaign Name</label>
                        <input
                            type="text"
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-teal-accent"
                            placeholder="e.g., HVAC Outreach 2024"
                            value={newCampaignName}
                            onChange={(e) => setNewCampaignName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <button
                        onClick={handleCreate}
                        disabled={!newCampaignName}
                        className="w-full py-3 bg-teal-accent text-white font-bold rounded-lg hover:bg-teal-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Create Flow
                    </button>
                </div>
            </Modal>
        </div>
    );
}
