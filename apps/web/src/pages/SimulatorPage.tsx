import { useState } from "react";
import { Play, Sparkles, MessageSquare, Terminal } from "lucide-react";

// Local scoring logic for frontend demo to avoid shared package build issues
function scoreCandidate(text: string, include: string[], exclude: string[]) {
    const lower = text.toLowerCase();

    // 1. Exclusion
    for (const bad of exclude) {
        if (lower.includes(bad.toLowerCase())) {
            return { score: 0, reasons: [`exclude:${bad}`] };
        }
    }

    let score = 0;
    const reasons: string[] = [];

    // 2. Inclusion
    for (const inc of include) {
        if (lower.includes(inc.toLowerCase()) || lower.includes(inc.toLowerCase().slice(0, -1))) { // Simple fuzzy match (e.g. landscaping -> landscap)
            score += 20;
            reasons.push(`keyword:${inc}`);
        }
    }

    // 3. Intent
    if (lower.includes("looking for") || lower.includes("need") || lower.includes("recommend")) {
        score += 25;
        reasons.push("intent:seeking_service");
    }

    if (lower.includes("asap") || lower.includes("emergency")) {
        score += 15;
        reasons.push("intent:urgent");
    }

    return { score, reasons };
}

export function SimulatorPage() {
    const [postContent, setPostContent] = useState("");
    const [result, setResult] = useState<any>(null);

    const handleSimulate = () => {
        const includeKeywords = ["landscaping", "plumbing", "hvac", "roofing", "clean"];
        const excludeKeywords = ["hiring", "job", "career"];

        const score = scoreCandidate(postContent, includeKeywords, excludeKeywords);
        setResult(score);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <h1 className="font-serif text-3xl font-bold text-white flex items-center gap-3">
                    <Terminal className="w-8 h-8 text-teal-accent" />
                    Lead Simulator
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                    Test how the bot perceives and scores a potential post before it goes live.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Column */}
                <div className="space-y-6">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                        <label className="block text-sm font-medium text-gray-300 mb-3 uppercase tracking-wider">
                            Simulate Post Content
                        </label>
                        <textarea
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                            className="w-full h-64 bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-teal-accent/50 focus:ring-1 focus:ring-teal-accent/50 transition-all resize-none font-mono text-sm"
                            placeholder="Paste a raw Nextdoor post or Reddit thread content here..."
                        />
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleSimulate}
                                className="px-6 py-3 bg-gradient-to-r from-[#139187] to-[#0d6b63] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2"
                            >
                                <Play size={18} />
                                Run Simulation
                            </button>
                        </div>
                    </div>
                </div>

                {/* Result Column */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 min-h-[400px]">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Sparkles size={18} className="text-teal-accent" />
                        Analysis Result
                    </h3>

                    {!result ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4 pb-20">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                <Terminal size={32} className="opacity-20" />
                            </div>
                            <p>Enter post content to see analysis</p>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            {/* Score Card */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Lead Score</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-4xl font-bold ${result.score > 50 ? 'text-green-400' : 'text-gray-400'}`}>
                                            {result.score}
                                        </span>
                                        <span className="text-sm text-gray-500">/ 100</span>
                                    </div>
                                </div>
                                <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Status</p>
                                    <div className={`inline-flex px-3 py-1 rounded-full text-xs font-bold mt-2 ${result.score > 30 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-700 text-gray-400'}`}>
                                        {result.score > 30 ? "QUALIFIED" : "IGNORED"}
                                    </div>
                                </div>
                            </div>

                            {/* Reasons */}
                            <div className="space-y-3">
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Detection Logic</p>
                                {result.reasons.length > 0 ? (
                                    result.reasons.map((r: string, i: number) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-teal-accent/10 border border-teal-accent/20 text-teal-200 text-sm">
                                            <Sparkles size={14} className="text-teal-accent" />
                                            {r}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-3 rounded-lg bg-white/5 text-gray-500 text-sm italic">
                                        No specific keywords matched.
                                    </div>
                                )}

                                {/* Reply Preview */}
                                {result.score > 30 && (
                                    <div className="mt-8 pt-6 border-t border-white/10">
                                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <MessageSquare size={14} />
                                            Draft Reply Preview
                                        </p>
                                        <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/10 text-gray-300 text-sm leading-relaxed relative">
                                            <div className="absolute top-4 right-4 text-xs bg-black/40 px-2 py-1 rounded text-gray-500">
                                                Wait 2m...
                                            </div>
                                            "Hey neighbor! I noticed you are looking for help. We actually have availability this week for that. Feel free to call us at 555-0123. - John"
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
