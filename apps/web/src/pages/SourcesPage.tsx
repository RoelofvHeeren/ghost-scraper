import { Map, Rss, Globe, Plus, Search } from "lucide-react";
import { useState } from "react";

const SUPPORTED_PLATFORMS = [
    { id: 'nextdoor', name: 'Nextdoor', icon: Map, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
    { id: 'reddit', name: 'Reddit', icon: Rss, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
    { id: 'custom', name: 'Custom Site', icon: Globe, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
];

export function SourcesPage() {
    const [activeSources] = useState([
        { id: 1, name: 'Nextdoor - Neighborhoods', type: 'nextdoor', status: 'active', leadsFound: 124 },
        { id: 2, name: 'r/realestateinvesting', type: 'reddit', status: 'paused', leadsFound: 45 },
    ]);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <h2 className="text-4xl font-serif font-bold text-white tracking-tight mb-2">Data Sources</h2>
                    <p className="text-gray-400">Configure where the ghost scraper hunts for leads.</p>
                </div>
                <button className="flex items-center gap-2 bg-teal-accent hover:bg-teal-accent/90 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg hover:shadow-teal-accent/25 hover:-translate-y-0.5">
                    <Plus size={18} /> Add New Source
                </button>
            </div>

            {/* Platform Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Sources List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 min-h-[400px]">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Search size={18} className="text-teal-accent" /> Active Monitors
                        </h3>

                        <div className="space-y-3">
                            {activeSources.map(source => (
                                <div key={source.id} className="group flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5 hover:border-teal-accent/20 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${source.type === 'nextdoor' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                            {source.type === 'nextdoor' ? <Map size={20} /> : <Rss size={20} />}
                                        </div>
                                        <div>
                                            <h4 className="text-white font-medium">{source.name}</h4>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span className={`h-1.5 w-1.5 rounded-full ${source.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
                                                <span className="uppercase tracking-wider">{source.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-serif text-white">{source.leadsFound}</div>
                                        <div className="text-xs text-gray-500">Leads Found</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Supported Platforms */}
                <div className="space-y-6">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Supported Platforms</h3>
                        <div className="grid gap-3">
                            {SUPPORTED_PLATFORMS.map(platform => (
                                <div key={platform.id} className={`p-4 rounded-xl border ${platform.bg} ${platform.border} flex items-center gap-3 transition-opacity hover:opacity-80 cursor-pointer`}>
                                    <platform.icon className={platform.color} size={24} />
                                    <div>
                                        <h4 className={`font-medium ${platform.color}`}>{platform.name}</h4>
                                        <p className="text-xs text-gray-400">Ready to scrape</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
