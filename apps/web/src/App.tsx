import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LeadsPage } from "./pages/LeadsPage";
import { ClientsPage } from "./pages/ClientsPage";
import { SimulatorPage } from "./pages/SimulatorPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { CampaignsPage } from "./pages/CampaignsPage";
import { SourcesPage } from "./pages/SourcesPage";
import { BotAccountsPage } from "./pages/BotAccountsPage";
import { SettingsPage } from "./pages/SettingsPage";

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

function RequireOnboarding({ children }: { children: JSX.Element }) {
    const isOnboarded = localStorage.getItem("ghost_onboarding_complete") === "true";

    if (!isOnboarded) {
        return <Navigate to="/onboarding" replace />;
    }

    return children;
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
                        <Route element={<RequireOnboarding><Layout /></RequireOnboarding>}>
                            <Route path="/" element={<LeadsPage />} />
                            <Route path="/clients" element={<ClientsPage />} />
                            <Route path="/sources" element={<SourcesPage />} />
                            <Route path="/accounts" element={<BotAccountsPage />} />
                            <Route path="/simulator" element={<SimulatorPage />} />
                            <Route path="/campaigns" element={<CampaignsPage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                        </Route>
                    </Routes>
                </BrowserRouter>
                {/* Force Deploy Trigger */}
            </QueryClientProvider>
        </ErrorBoundary>
    );
}

export default App;
