import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LeadsPage } from "./pages/LeadsPage";
import { ClientsPage } from "./pages/ClientsPage";
import { SimulatorPage } from "./pages/SimulatorPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { CampaignsPage } from "./pages/CampaignsPage";

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    {/* Onboarding Route (No Sidebar Layout) */}
                    <Route path="/onboarding" element={<OnboardingPage />} />

                    {/* Main App Routes */}
                    <Route element={<Layout />}>
                        <Route path="/" element={<LeadsPage />} />
                        <Route path="/clients" element={<ClientsPage />} />
                        <Route path="/sources" element={<div>Sources Page</div>} />
                        <Route path="/accounts" element={<div>Bot Accounts Page</div>} />
                        <Route path="/simulator" element={<SimulatorPage />} />
                        <Route path="/campaigns" element={<CampaignsPage />} />
                        <Route path="/settings" element={<div>Settings Page</div>} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;
