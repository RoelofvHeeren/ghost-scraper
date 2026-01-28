import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Loader2, ExternalLink, Briefcase, MapPin, Building2, Calendar, User } from "lucide-react";
import { apiSvc } from "../lib/api";

type Lead = {
    id: string;
    candidate: {
        title: string;
        body: string;
        url: string;
        author: string;
        source: { name: string; type: string };
        cityHint: string;
    };
    client: { name: string };
    score: number;
    status: string;
    createdAt: string;
};

export function LeadsPage() {
    const { data, isLoading, error } = useQuery<{ data: Lead[] }>({
        queryKey: ["leads"],
        queryFn: apiSvc.getLeads,
        refetchInterval: 15000,
    });

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-[60vh] text-gray-400">
                <Loader2 className="animate-spin text-teal-accent mb-4" size={48} />
                <p className="animate-pulse">Scouring the web for opportunities...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 backdrop-blur-md">
                <h3 className="text-xl font-bold mb-2">Connection Error</h3>
                <p>Could not load leads. Please check your connection or try again later.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <h2 className="text-4xl font-serif font-bold text-white tracking-tight mb-2">Lead Intelligence</h2>
                    <p className="text-gray-400">Real-time opportunities from across the web.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="flex h-2 w-2 rounded-full bg-teal-accent animate-pulse"></span>
                    <span className="text-sm text-teal-accent font-mono">Live Feed Active</span>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {data?.data?.map((lead) => (
                    <div
                        key={lead.id}
                        className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-teal-accent/30 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-teal-accent/5"
                    >
                        {/* Card Header */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide border ${lead.status === 'NEW' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                    lead.status === 'CONTACTED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                    }`}>
                                    {lead.status}
                                </span>
                                <span className="bg-teal-accent/10 text-teal-accent text-xs px-2 py-1 rounded-full border border-teal-accent/20 font-mono">
                                    {lead.score} pts
                                </span>
                            </div>
                            <span className="text-xs text-gray-500 flex items-center gap-1 font-mono">
                                <Calendar size={12} />
                                {formatDistanceToNow(new Date(lead.createdAt))} ago
                            </span>
                        </div>

                        {/* Title & Body */}
                        <h3 className="text-lg font-semibold text-gray-100 mb-3 line-clamp-2 leading-tight group-hover:text-teal-accent transition-colors">
                            {lead.candidate.title || "No Title Available"}
                        </h3>
                        <p className="text-sm text-gray-400 mb-6 line-clamp-3 leading-relaxed">
                            {lead.candidate.body}
                        </p>

                        {/* Meta Data */}
                        <div className="space-y-3 pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between text-xs text-gray-400">
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} className="text-gray-500" />
                                    <span>{lead.candidate.cityHint || "Unknown Location"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <User size={14} className="text-gray-500" />
                                    <span>{lead.candidate.author || "Anonymous"}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-400">
                                <div className="flex items-center gap-2">
                                    <Building2 size={14} className="text-gray-500" />
                                    <span className="text-gray-300 font-medium">{lead.client.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Briefcase size={14} className="text-gray-500" />
                                    <span>{lead.candidate.source?.name || "Web"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-5 pt-4 flex items-center justify-end border-t border-white/5 opacity-60 group-hover:opacity-100 transition-opacity">
                            <a
                                href={lead.candidate.url || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-medium text-white hover:text-teal-accent transition-colors"
                            >
                                Open Source <ExternalLink size={14} />
                            </a>
                        </div>
                    </div>
                ))}

                {data?.data?.length === 0 && (
                    <div className="col-span-full py-20 text-center rounded-3xl border border-dashed border-white/10 bg-white/5">
                        <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Briefcase className="text-gray-500" size={32} />
                        </div>
                        <h3 className="text-xl font-medium text-white mb-2">No Leads Found Yet</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            The ghost scraper is active and listening. New leads will appear here automatically.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
