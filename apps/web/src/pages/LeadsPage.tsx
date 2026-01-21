import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { Loader2, ExternalLink } from "lucide-react";

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
        queryFn: () => axios.get("/api/leads").then((res) => res.data),
        refetchInterval: 15000,
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500">Error loading leads</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Leads</h2>
                <span className="text-sm text-gray-500">
                    Auto-refreshing every 15s
                </span>
            </div>

            <div className="grid gap-4">
                {data?.data.map((lead) => (
                    <div
                        key={lead.id}
                        className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-indigo-300 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${lead.status === 'NEW' ? 'bg-blue-100 text-blue-800' :
                                    lead.status === 'CONTACTED' ? 'bg-green-100 text-green-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                    {lead.status}
                                </span>
                                <span className="text-sm text-gray-500 ml-2">
                                    Score: {lead.score}
                                </span>
                                <span className="text-sm font-semibold text-gray-900">
                                    {lead.candidate.cityHint || "Unknown City"}
                                </span>
                            </div>
                            <span className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(lead.createdAt))} ago
                            </span>
                        </div>

                        <h3 className="text-lg font-semibold mb-2">{lead.candidate.title || "No Title"}</h3>
                        <p className="text-gray-600 mb-4 line-clamp-3">{lead.candidate.body}</p>

                        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>Client: <strong>{lead.client.name}</strong></span>
                                <span>Source: {lead.candidate.source?.name || "Unknown"}</span>
                            </div>

                            <div className="flex gap-2">
                                <a
                                    href={lead.candidate.url || "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-indigo-600 hover:underline text-sm"
                                >
                                    <ExternalLink size={14} /> View Post
                                </a>
                                {/* Actions like Respond, Verify etc would go here */}
                            </div>
                        </div>
                    </div>
                ))}

                {data?.data.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No leads found yet. Waiting for scraper...
                    </div>
                )}
            </div>
        </div>
    );
}
