import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, Plus } from "lucide-react";

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

    if (isLoading) return <Loader2 className="animate-spin" />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
                <button
                    onClick={() => {
                        const name = prompt("Client Name:");
                        if (name) createClientMutation.mutate({ name });
                    }}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                    <Plus size={16} /> Add Client
                </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Areas</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking Number</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {clients?.map((client: any) => (
                            <tr key={client.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{client.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {client.services?.length || 0} services
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {client.areas?.map((a: any) => a.city).join(", ") || "None"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {client.twilioNumber || "N/A"}
                                </td>
                            </tr>
                        ))}
                        {clients?.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No clients yet</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
