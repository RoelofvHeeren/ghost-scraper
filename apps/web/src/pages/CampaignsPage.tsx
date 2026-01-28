import { useState } from "react";
import { MessageSquare, Clock, Plus, Trash2, PlayCircle, Settings, ChevronRight, User, Briefcase, Users, Loader2 } from "lucide-react";
import { Modal } from "../components/Modal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiSvc } from "../lib/api";

type Step = {
    id: string;
    delayMinutes: number;
    content: string;
    order?: number;
};

type Campaign = {
    id: string;
    name: string;
    status: "ACTIVE" | "PAUSED";
    persona: "BUSINESS" | "COMMUNITY";
    steps: Step[];
};

export function CampaignsPage() {
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

    // Real Data Fetching
    const { data: campaigns, isLoading } = useQuery({
        queryKey: ['campaigns'],
        queryFn: apiSvc.getCampaigns
    });

    const saveMutation = useMutation({
        mutationFn: (data: any) =>
            editingCampaign
                ? apiSvc.updateCampaign(editingCampaign.id, data)
                : apiSvc.createCampaign(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaigns'] });
            setIsCreateOpen(false);
            setEditingCampaign(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: apiSvc.deleteCampaign,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    });

    // Form State for New/Edit
    const [formData, setFormData] = useState<{
        name: string;
        persona: "BUSINESS" | "COMMUNITY";
        steps: Step[];
    }>({
        name: "",
        persona: "BUSINESS",
        steps: [{ id: "1", delayMinutes: 2, content: "" }]
    });

    const openCreateModal = () => {
        setFormData({ name: "", persona: "BUSINESS", steps: [{ id: Date.now().toString(), delayMinutes: 2, content: "" }] });
        setEditingCampaign(null);
        setIsCreateOpen(true);
    };

    const handleSave = () => {
        if (!formData.name) return;

        const payload = {
            name: formData.name,
            persona: formData.persona,
            steps: formData.steps.map((s, idx) => ({
                order: idx,
                delayMinutes: s.delayMinutes,
                content: s.content
            }))
        };

        saveMutation.mutate(payload);
    };

    const addStep = () => {
        setFormData(prev => ({
            ...prev,
            steps: [...prev.steps, { id: Date.now().toString(), delayMinutes: 15, content: "" }]
        }));
    };

    const updateStep = (id: string, field: keyof Step, value: any) => {
        setFormData(prev => ({
            ...prev,
            steps: prev.steps.map(s => s.id === id ? { ...s, [field]: value } : s)
        }));
    };

    const removeStep = (id: string) => {
        setFormData(prev => ({
            ...prev,
            steps: prev.steps.filter(s => s.id !== id)
        }));
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
                    onClick={openCreateModal}
                    className="px-6 py-3 bg-teal-accent text-white font-semibold rounded-xl shadow-lg hover:shadow-teal-accent/25 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                >
                    <Plus size={20} />
                    New Campaign
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-teal-accent" size={32} />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {campaigns?.map((camp: any) => (
                        <div key={camp.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl group">
                            {/* Campaign Header */}
                            <div className="p-6 border-b border-white/5 flex justify-between items-start bg-black/20">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${camp.status === 'ACTIVE' ? 'bg-teal-accent/20 text-teal-accent' : 'bg-gray-700/50 text-gray-400'}`}>
                                        <Settings size={22} className={camp.status === 'ACTIVE' ? 'animate-spin-slow' : ''} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-xl">{camp.name}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <div className={`h-2 w-2 rounded-full ${camp.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                                            <span className="text-xs text-gray-400 tracking-wider font-medium">{camp.status}</span>
                                            <span className="text-gray-600">|</span>
                                            <div className="flex items-center gap-1.5 text-xs text-blue-300">
                                                {camp.persona === 'BUSINESS' ? <Briefcase size={12} /> : <Users size={12} />}
                                                <span className="uppercase tracking-wider font-bold">{camp.persona}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => { setEditingCampaign(camp); setFormData({ ...camp }); setIsCreateOpen(true); }}
                                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <Settings size={18} />
                                    </button>
                                    <button
                                        onClick={() => deleteMutation.mutate(camp.id)}
                                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Sequence Visualizer (Read Only) */}
                            <div className="p-6 space-y-6 relative">
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
                                {camp.steps?.sort((a: any, b: any) => a.order - b.order).map((step: any, idx: number) => (
                                    <div key={step.id} className="relative flex gap-6 z-10 group/step">
                                        <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-white/20 flex items-center justify-center shrink-0">
                                            <span className="text-xs font-mono text-gray-500">{idx + 1}</span>
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#111] border border-white/10 text-[10px] text-gray-400 uppercase tracking-wider">
                                                <Clock size={10} />
                                                Wait {step.delayMinutes} mins
                                            </div>
                                            <div className="bg-[#222] border border-white/5 rounded-r-xl rounded-bl-xl p-4 text-sm text-gray-200">
                                                "{step.content}"
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {campaigns?.length === 0 && (
                        <div className="col-span-full text-center py-20 text-gray-500 border border-dashed border-white/10 rounded-2xl">
                            No message flows configured yet.
                        </div>
                    )}
                </div>
            )}

            {/* Create/Edit Campaign Modal */}
            <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title={editingCampaign ? "Edit Campaign Flow" : "Create New Campaign"}>
                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Campaign Name</label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-teal-accent"
                                placeholder="e.g., HVAC Outreach 2024"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Representation Mode (Persona)</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setFormData({ ...formData, persona: "BUSINESS" })}
                                    className={`p-3 rounded-lg border text-left transition-all ${formData.persona === 'BUSINESS'
                                        ? 'bg-teal-500/10 border-teal-500 text-white'
                                        : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5'}`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Briefcase size={16} className={formData.persona === 'BUSINESS' ? 'text-teal-400' : 'text-gray-500'} />
                                        <span className="font-bold text-sm">Official Business</span>
                                    </div>
                                    <p className="text-xs opacity-70">"Hi, I'm with Acme Corp..."</p>
                                </button>
                                <button
                                    onClick={() => setFormData({ ...formData, persona: "COMMUNITY" })}
                                    className={`p-3 rounded-lg border text-left transition-all ${formData.persona === 'COMMUNITY'
                                        ? 'bg-purple-500/10 border-purple-500 text-white'
                                        : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5'}`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Users size={16} className={formData.persona === 'COMMUNITY' ? 'text-purple-400' : 'text-gray-500'} />
                                        <span className="font-bold text-sm">Community Member</span>
                                    </div>
                                    <p className="text-xs opacity-70">"I used these guys, they're great..."</p>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Steps Builder */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-white/10 pb-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sequence Steps</label>
                            <button onClick={addStep} className="text-xs flex items-center gap-1 text-teal-accent hover:text-teal-300 transition-colors">
                                <Plus size={14} /> Add Step
                            </button>
                        </div>

                        {formData.steps.map((step, idx) => (
                            <div key={step.id} className="bg-black/20 p-4 rounded-xl border border-white/5 relative group">
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => removeStep(step.id)} className="p-1 text-gray-500 hover:text-red-400">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="bg-white/10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono text-gray-400">{idx + 1}</span>
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-gray-500" />
                                        <span className="text-xs text-gray-400">Wait</span>
                                        <input
                                            type="number"
                                            value={step.delayMinutes}
                                            onChange={(e) => updateStep(step.id, 'delayMinutes', parseInt(e.target.value) || 0)}
                                            className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white text-center focus:border-teal-accent"
                                        />
                                        <span className="text-xs text-gray-400">minutes</span>
                                    </div>
                                </div>
                                <textarea
                                    value={step.content}
                                    onChange={(e) => updateStep(step.id, 'content', e.target.value)}
                                    placeholder="Type your message here..."
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-teal-accent/50 min-h-[80px]"
                                />
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={!formData.name || saveMutation.isPending}
                        className="w-full py-3 bg-teal-accent text-white font-bold rounded-lg hover:bg-teal-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4"
                    >
                        {saveMutation.isPending ? "Saving..." : (editingCampaign ? "Save Changes" : "Create Campaign")}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
