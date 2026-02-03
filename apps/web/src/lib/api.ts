import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const api = axios.create({
    baseURL: API_BASE_URL,
});

export const apiSvc = {
    // Clients
    getClients: () => api.get("/admin/clients").then(r => r.data),
    createClient: (data: any) => api.post("/admin/clients", data).then(r => r.data),

    // Sources
    getSources: () => api.get("/admin/sources").then(r => r.data),
    createSource: (data: any) => api.post("/admin/sources", data).then(r => r.data),

    // Bot Accounts
    getBots: () => api.get("/admin/bot-accounts").then(r => r.data),
    createBot: (data: any) => api.post("/admin/bot-accounts", data).then(r => r.data),
    updateBotSources: (id: string, sourceIds: string[]) => api.put(`/admin/bot-accounts/${id}/sources`, { sourceIds }).then(r => r.data),
    startBot: (id: string) => api.post(`/admin/bot-accounts/${id}/start`).then(r => r.data),

    // Campaigns
    getCampaigns: () => api.get("/admin/campaigns").then(r => r.data),
    createCampaign: (data: any) => api.post("/admin/campaigns", data).then(r => r.data),
    updateCampaign: (id: string, data: any) => api.put(`/admin/campaigns/${id}`, data).then(r => r.data),
    deleteCampaign: (id: string) => api.delete(`/admin/campaigns/${id}`).then(r => r.data),

    // Leads
    getLeads: () => api.get("/leads").then(r => r.data),

    // Candidates
    getCandidates: () => api.get("/admin/candidates").then(r => r.data),
};
