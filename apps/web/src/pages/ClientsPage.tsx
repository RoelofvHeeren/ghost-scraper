import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, Plus, Building, MapPin, Phone, Hash, Users } from "lucide-react";

type Client = {
    id: string;
    name: string;
    services: string[];
    areas: { city: string; state: string }[];
    twilioNumber?: string;
};

export function ClientsPage() {
    const queryClient = useQueryClient();

    const { data: clients, isLoading } = useQuery({
        queryKey: ["clients"],
        queryFn: () => {
            const baseUrl = import.meta.env.VITE_API_URL || "";
            return axios.get(`${baseUrl}/admin/clients`).then((res) => res.data);
        },
    });

    const createClientMutation = useMutation({
        mutationFn: (newClient: { name: string }) => {
            const baseUrl = import.meta.env.VITE_API_URL || "";
            return axios.post(`${baseUrl}/admin/clients`, newClient);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
        },
    });

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-[60vh] text-gray-400">
                <Loader2 className="animate-spin text-teal-accent mb-4" size={48} />
                <p className="animate-pulse">Loading client portfolio...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <h2 className="text-4xl font-serif font-bold text-white tracking-tight mb-2">Client Portfolio</h2>
                    <p className="text-gray-400">Manage your partners and their target markets.</p>
                </div>
                <button
                    onClick={() => {
                        const name = prompt("Enter Client Name:");
                        if (name) createClientMutation.mutate({ name });
                    }}
                    className="flex items-center gap-2 bg-teal-accent hover:bg-teal-accent/90 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg hover:shadow-teal-accent/25 hover:-translate-y-0.5"
                >
                    <Plus size={18} /> Add New Client
                </button>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {clients?.map((client: any) => (
                    <div
                        key={client.id}
                        className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 border-t border-t-white/10 transition-all duration-300 hover:-translate-y-1 shadow-2xl"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-teal-accent/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                                    <Building className="text-white" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white leading-none">{client.name}</h3>
                                    <span className="text-xs text-gray-500 font-mono">ID: {client.id.slice(0, 8)}...</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Stats/Info */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                                    <span className="text-xs text-gray-500 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                                        <Hash size={10} /> Services
                                    </span>
                                    <span className="text-lg font-mono font-medium text-gray-200">
                                        {client.services?.length || 0}
                                    </span>
                                </div>
                                <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                                    <span className="text-xs text-gray-500 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                                        <MapPin size={10} /> Areas
                                    </span>
                                    <span className="text-lg font-mono font-medium text-gray-200">
                                        {client.areas?.length || 0}
                                    </span>
                                </div>
                            </div>

                            {/* Tracking Number */}
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-teal-accent/5 border border-teal-accent/10">
                                <Phone size={16} className="text-teal-accent" />
                                <span className={`text-sm font-mono ${client.twilioNumber ? 'text-teal-100' : 'text-gray-500 italic'}`}>
                                    {client.twilioNumber || "No tracking number"}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {clients?.length === 0 && (
                    <div className="col-span-full py-20 text-center rounded-3xl border border-dashed border-white/10 bg-white/5">
                        <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="text-gray-500" size={32} />
                        </div>
                        <h3 className="text-xl font-medium text-white mb-2">No Clients Yet</h3>
                        <p className="text-gray-500">Add a client to start routing leads.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
