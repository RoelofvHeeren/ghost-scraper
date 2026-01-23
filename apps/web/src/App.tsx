import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LeadsPage } from "./pages/LeadsPage";
import { ClientsPage } from "./pages/ClientsPage";
import { SimulatorPage } from "./pages/SimulatorPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { CampaignsPage } from "./pages/CampaignsPage";

import { Component, ErrorInfo, ReactNode } from "react";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 20, color: "red", border: "1px solid red", margin: 20 }}>
                    <h1>Something went wrong.</h1>
                    <pre>{this.state.error?.message}</pre>
                    <pre>{this.state.error?.stack}</pre>
                </div>
            );
        }

        return this.props.children;
    }
}

const queryClient = new QueryClient();

function App() {
    return (
        <ErrorBoundary>
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
                {/* Force Deploy Trigger */}
            </QueryClientProvider>
        </ErrorBoundary>
    );
}

export default App;
