import { Settings, Server, Database, Activity, Save, ToggleLeft, ToggleRight } from "lucide-react";

export function SettingsPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <h2 className="text-4xl font-serif font-bold text-white tracking-tight mb-2">System Control</h2>
                    <p className="text-gray-400">Global configuration and system health status.</p>
                </div>
                <button className="flex items-center gap-2 bg-teal-accent hover:bg-teal-accent/90 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg hover:shadow-teal-accent/25 hover:-translate-y-0.5">
                    <Save size={18} /> Save Changes
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* System Health */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Activity className="text-teal-accent" size={20} /> System Health
                    </h3>
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <Server className="text-gray-400" size={18} />
                                <span className="text-gray-200">API Service</span>
                            </div>
                            <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded border border-green-500/20 uppercase font-bold tracking-wider">Operational</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <Database className="text-gray-400" size={18} />
                                <span className="text-gray-200">Database</span>
                            </div>
                            <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded border border-green-500/20 uppercase font-bold tracking-wider">Connected</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <Activity className="text-gray-400" size={18} />
                                <span className="text-gray-200">Scraper Worker</span>
                            </div>
                            <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded border border-blue-500/20 uppercase font-bold tracking-wider">Processing</span>
                        </div>
                    </div>
                </div>

                {/* Configuration */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Settings className="text-teal-accent" size={20} /> Workflow Configuration
                    </h3>

                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-8">
                        {/* Group 1 */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-white font-medium">Auto-Response Mode</h4>
                                    <p className="text-sm text-gray-400">Automatically reply to high-scoring leads (&gt;40)</p>
                                </div>
                                <ToggleRight className="text-teal-accent w-10 h-10 cursor-pointer" />
                            </div>
                            <div className="h-px bg-white/5"></div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-white font-medium">Notifications</h4>
                                    <p className="text-sm text-gray-400">Send alerts to Slack/Discord on new qualified leads</p>
                                </div>
                                <ToggleRight className="text-teal-accent w-10 h-10 cursor-pointer" />
                            </div>
                        </div>

                        {/* Templates */}
                        <div className="space-y-4">
                            <h4 className="text-xs uppercase text-gray-500 tracking-wider font-bold">Default Outreach Template</h4>
                            <textarea
                                className="w-full h-32 bg-black/20 border border-white/10 rounded-xl p-4 text-gray-200 text-sm focus:outline-none focus:border-teal-accent/50 transition-colors"
                                defaultValue="Hi there! I saw you're looking for help with {service}. We specialize in that and have availability this week. Give us a call at {phone}."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
