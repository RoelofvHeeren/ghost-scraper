import { useState } from "react";
import { MessageSquare, Clock, Plus, Trash2, PlayCircle } from "lucide-react";

type Campaign = {
    id: string;
    name: string;
    steps: { delayMinutes: number; content: string }[];
    status: "ACTIVE" | "PAUSED";
};

export function CampaignsPage() {
    const [campaigns] = useState<Campaign[]>([
        {
            id: "1",
            name: "Standard Outreach",
            status: "ACTIVE",
            steps: [
                { delayMinutes: 2, content: "Hey! I think I can help with this. Let me check my schedule..." },
                { delayMinutes: 5, content: "Just checked, we have an opening tomorrow. Give us a call at 555-0123. - John" }
            ]
        }
    ]);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex-1 mr-6">
                    <h1 className="font-serif text-3xl font-bold text-white flex items-center gap-3">
                        <MessageSquare className="w-8 h-8 text-teal-accent" />
                        Comment Campaigns
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Design human-like reply sequences with natural delays.
                    </p>
                </div>
                <button className="px-6 py-4 bg-gradient-to-r from-[#139187] to-[#0d6b63] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2">
                    <Plus size={20} />
                    New Campaign
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((camp) => (
                    <div key={camp.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 group hover:border-teal-accent/30 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-teal-accent/10 rounded-lg text-teal-accent">
                                    <PlayCircle size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">{camp.name}</h3>
                                    <span className="text-xs text-green-400 font-mono bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">ACTIVE</span>
                                </div>
                            </div>
                            <button className="p-2 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div className="space-y-4 relative pl-4 border-l-2 border-white/5 ml-4">
                            {camp.steps.map((step, idx) => (
                                <div key={idx} className="relative">
                                    <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-gray-700 border-2 border-[#0a0a0a]"></div>
                                    <div className="mb-1 flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider">
                                        <Clock size={12} />
                                        Wait {step.delayMinutes} mins
                                    </div>
                                    <div className="bg-black/40 p-3 rounded-lg border border-white/5 text-sm text-gray-300 italic">
                                        "{step.content}"
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Placeholder for 'Add New' visual */}
                <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-500 hover:border-white/20 hover:text-gray-300 transition-colors cursor-pointer min-h-[300px]">
                    <Plus size={48} className="mb-4 opacity-50" />
                    <span className="font-medium">Create New Flow</span>
                </div>
            </div>
        </div>
    );
}
