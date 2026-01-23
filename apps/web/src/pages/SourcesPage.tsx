import { Map, Rss, Globe, Plus, Search, Tag, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Modal } from "../components/Modal";

const SUPPORTED_PLATFORMS = [
    { id: 'nextdoor', name: 'Nextdoor', icon: Map, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
    { id: 'reddit', name: 'Reddit', icon: Rss, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
    { id: 'custom', name: 'Custom Site', icon: Globe, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
];

export function SourcesPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeSources, setActiveSources] = useState([
        { id: 1, name: 'Nextdoor - Neighborhoods', platform: 'nextdoor', query: 'landscaper near Denver', context: 'service_providers', status: 'active', leadsFound: 124 },
        { id: 2, name: 'r/realestateinvesting', platform: 'reddit', query: 'r/realestateinvesting', context: 'investors', status: 'paused', leadsFound: 45 },
    ]);

    const [newSource, setNewSource] = useState({
        name: '',
        platform: 'nextdoor',
        query: '',
        context: ''
    });

    const handleAddSource = () => {
        const source = {
            id: Date.now(),
            name: newSource.name || `${newSource.platform} - ${newSource.query}`,
            platform: newSource.platform,
            query: newSource.query,
            context: newSource.context,
            status: 'active',
            leadsFound: 0
        };
        setActiveSources([...activeSources, source]);
        setIsModalOpen(false);
        setNewSource({ name: '', platform: 'nextdoor', query: '', context: '' });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <h2 className="text-4xl font-serif font-bold text-white tracking-tight mb-2">Data Sources</h2>
                    <p className="text-gray-400">Configure where the ghost scraper hunts for leads.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-teal-accent hover:bg-teal-accent/90 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg hover:shadow-teal-accent/25 hover:-translate-y-0.5"
                >
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
                                <div key={source.id} className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5 hover:border-teal-accent/20 transition-all gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-12 w-12 shrink-0 rounded-lg flex items-center justify-center ${source.platform === 'nextdoor' ? 'bg-green-500/20 text-green-400' :
                                                source.platform === 'reddit' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                                            }`}>
                                            {source.platform === 'nextdoor' ? <Map size={24} /> : source.platform === 'reddit' ? <Rss size={24} /> : <Globe size={24} />}
                                        </div>
                                        <div>
                                            <h4 className="text-white font-medium text-lg">{source.name}</h4>
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                                                <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                                    <Search size={10} />
                                                    <span className="font-mono text-gray-400">{source.query}</span>
                                                </div>
                                                {source.context && (
                                                    <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                                        <Tag size={10} />
                                                        <span>{source.context}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1.5 ml-1">
                                                    <span className={`h-1.5 w-1.5 rounded-full ${source.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
                                                    <span className="uppercase tracking-wider">{source.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
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
                                <div key={platform.id} onClick={() => { setNewSource(prev => ({ ...prev, platform: platform.id })); setIsModalOpen(true); }} className={`p-4 rounded-xl border ${platform.bg} ${platform.border} flex items-center gap-3 transition-opacity hover:opacity-80 cursor-pointer`}>
                                    <platform.icon className={platform.color} size={24} />
                                    <div>
                                        <h4 className={`font-medium ${platform.color}`}>{platform.name}</h4>
                                        <p className="text-xs text-gray-400">Click to add</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Source Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Data Source">
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Platform</label>
                        <div className="grid grid-cols-3 gap-2">
                            {SUPPORTED_PLATFORMS.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setNewSource({ ...newSource, platform: p.id })}
                                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${newSource.platform === p.id
                                            ? `bg-teal-500/20 border-teal-500 text-white shadow-[0_0_15px_rgba(20,184,166,0.3)]`
                                            : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/5'
                                        }`}
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Source Name</label>
                        <input
                            type="text"
                            value={newSource.name}
                            onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                            placeholder='e.g. "Denver Landscapers"'
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-accent/50"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">
                            {newSource.platform === 'reddit' ? 'Subreddit / Search Query' : 'Search Query / URL'}
                        </label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input
                                type="text"
                                value={newSource.query}
                                onChange={(e) => setNewSource({ ...newSource, query: e.target.value })}
                                placeholder={newSource.platform === 'reddit' ? 'r/investing or "keyword"' : 'landscapers in Denver, CO'}
                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-teal-accent/50"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Context Tags (Optional)</label>
                        <div className="relative">
                            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input
                                type="text"
                                value={newSource.context}
                                onChange={(e) => setNewSource({ ...newSource, context: e.target.value })}
                                placeholder="service_providers, high_ticket, etc."
                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-teal-accent/50"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                        <button onClick={handleAddSource} className="px-6 py-2 bg-white text-black font-bold rounded-lg shadow-lg hover:bg-gray-200 transition-all">
                            Add Source
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
