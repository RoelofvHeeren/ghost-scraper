import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, Sparkles, Key, Globe, ShieldCheck, MessageSquare, Briefcase, Users, Plus, Clock, Trash2 } from "lucide-react";

const steps = [
    { id: 1, title: "API Configuration", icon: Key },
    { id: 2, title: "Connect Sources", icon: Globe },
    { id: 3, title: "Safety & Proxies", icon: ShieldCheck },
    { id: 4, title: "Message Flow", icon: MessageSquare },
];

export function OnboardingPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const navigate = useNavigate();

    // Form State
    const [formData, setFormData] = useState({
        openaiKey: "",
        twilioSid: "",
        twilioToken: "",
        nextdoorUser: "",
        nextdoorPass: "",
        proxyUrl: "",
        safetyEnabled: true,
        campaignName: "Default Outreach",
        persona: "BUSINESS",
        steps: [
            { id: "1", delayMinutes: 2, content: "Hi! I noticed you were looking for help with {service}. I might be able to assist." }
        ]
    });

    const updateForm = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const addStep = () => {
        setFormData(prev => ({
            ...prev,
            steps: [...prev.steps, { id: Date.now().toString(), delayMinutes: 15, content: "" }]
        }));
    };

    const updateStep = (id: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            steps: prev.steps.map(s => s.id === id ? { ...s, [field]: value } : s)
        }));
    };

    const removeStep = (id: string) => {
        setFormData(prev => ({
            ...prev,
            steps: prev.steps.filter(s => s.id !== id)
        }));
    };

    const handleNext = () => {
        if (currentStep < 4) {
            setCurrentStep(curr => curr + 1);
        } else {
            // Save data (mock)
            console.log("Saving onboarding data:", formData);
            localStorage.setItem("ghost_onboarding_complete", "true");
            navigate("/");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative">
            {/* Background Video (Reused) */}
            <video autoPlay muted loop playsInline className="bg-video">
                <source src="/background.mp4" type="video/mp4" />
            </video>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-luxury max-w-2xl w-full mx-4 relative z-10 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-black border border-white/10 shadow-sharp mb-4">
                        <Sparkles className="w-8 h-8 text-teal-accent" />
                    </div>
                    <h1 className="font-serif text-3xl font-bold text-white mb-2">Welcome to Ghost Scraper</h1>
                    <p className="text-gray-400">Let's get your autonomous lead engine set up.</p>
                </div>

                {/* Stepper */}
                <div className="flex justify-between items-center mb-12 relative px-8">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -z-10"></div>
                    {steps.map((step) => (
                        <div key={step.id} className="flex flex-col items-center gap-2 bg-[#0a0a0a] px-2 z-10">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${currentStep >= step.id
                                ? 'bg-teal-accent text-white border-teal-accent'
                                : 'bg-black border-white/20 text-gray-500'
                                }`}>
                                {currentStep > step.id ? <Check size={16} /> : <step.icon size={16} />}
                            </div>
                            <span className={`text-xs font-medium ${currentStep >= step.id ? 'text-white' : 'text-gray-500'}`}>
                                {step.title}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Content Area */}
                <div className="min-h-[300px]">
                    {currentStep === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-bold text-white">API Keys</h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">OpenAI API Key</label>
                                    <input
                                        type="password"
                                        value={formData.openaiKey}
                                        onChange={(e) => updateForm('openaiKey', e.target.value)}
                                        placeholder="sk-..."
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-accent/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Twilio Account SID</label>
                                    <input
                                        type="text"
                                        value={formData.twilioSid}
                                        onChange={(e) => updateForm('twilioSid', e.target.value)}
                                        placeholder="AC..."
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-accent/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Twilio Auth Token</label>
                                    <input
                                        type="password"
                                        value={formData.twilioToken}
                                        onChange={(e) => updateForm('twilioToken', e.target.value)}
                                        placeholder="Token..."
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-accent/50"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-bold text-white">Connect Nextdoor</h2>
                            <p className="text-sm text-gray-400 mb-4">Add your primary account for scraping.</p>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Username / Email</label>
                                    <input
                                        type="text"
                                        value={formData.nextdoorUser}
                                        onChange={(e) => updateForm('nextdoorUser', e.target.value)}
                                        placeholder="neighbor@example.com"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-accent/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Password</label>
                                    <input
                                        type="password"
                                        value={formData.nextdoorPass}
                                        onChange={(e) => updateForm('nextdoorPass', e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-accent/50"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-bold text-white">Safety & Proxies</h2>
                            <div className="bg-teal-500/10 border border-teal-500/20 p-4 rounded-xl flex gap-3 text-teal-200">
                                <ShieldCheck className="shrink-0" />
                                <p className="text-sm">Safety limits are enabled. We recommend using 4G residential proxies for Nextdoor.</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Proxy Connection String (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.proxyUrl}
                                    onChange={(e) => updateForm('proxyUrl', e.target.value)}
                                    placeholder="http://user:pass@host:port"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-accent/50"
                                />
                                <p className="text-xs text-gray-500 mt-2">Leave blank to use local IP (not recommended for production).</p>
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-white">First Campaign</h2>
                                    <p className="text-sm text-gray-400">Design your initial outreach flow.</p>
                                </div>
                                <div className="flex bg-black/40 rounded-lg p-1">
                                    <button
                                        onClick={() => updateForm('persona', 'BUSINESS')}
                                        className={`px-3 py-1 rounded text-xs font-bold transition-all ${formData.persona === 'BUSINESS' ? 'bg-teal-500 text-white shadow-lg' : 'text-gray-500'}`}
                                    >
                                        Business
                                    </button>
                                    <button
                                        onClick={() => updateForm('persona', 'COMMUNITY')}
                                        className={`px-3 py-1 rounded text-xs font-bold transition-all ${formData.persona === 'COMMUNITY' ? 'bg-purple-500 text-white shadow-lg' : 'text-gray-500'}`}
                                    >
                                        Community
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Campaign Name</label>
                                    <input
                                        type="text"
                                        value={formData.campaignName}
                                        onChange={(e) => updateForm('campaignName', e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-accent/50"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sequence Steps</label>
                                        <button onClick={addStep} className="text-xs flex items-center gap-1 text-teal-accent hover:text-teal-300 transition-colors">
                                            <Plus size={14} /> Add Step
                                        </button>
                                    </div>

                                    {formData.steps.map((step, idx) => (
                                        <div key={step.id} className="bg-black/20 p-4 rounded-xl border border-white/5 relative group">
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => removeStep(step.id)} className="p-1 text-gray-500 hover:text-red-400">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className="bg-white/10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono text-gray-400">{idx + 1}</span>
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} className="text-gray-500" />
                                                    <span className="text-xs text-gray-400">Wait</span>
                                                    <input
                                                        type="number"
                                                        value={step.delayMinutes}
                                                        onChange={(e) => updateStep(step.id, 'delayMinutes', parseInt(e.target.value) || 0)}
                                                        className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white text-center focus:border-teal-accent"
                                                    />
                                                    <span className="text-xs text-gray-400">minutes</span>
                                                </div>
                                            </div>
                                            <textarea
                                                value={step.content}
                                                onChange={(e) => updateStep(step.id, 'content', e.target.value)}
                                                placeholder="Type your message here..."
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-teal-accent/50 min-h-[80px]"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
                    <button
                        onClick={() => currentStep > 1 && setCurrentStep(c => c - 1)}
                        className={`px-4 py-3 text-gray-400 font-medium hover:text-white transition-colors ${currentStep === 1 ? 'invisible' : ''}`}
                    >
                        Back
                    </button>
                    <button
                        onClick={handleNext}
                        className="px-6 py-3 bg-white text-black font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-gray-200 transition-all duration-300 flex items-center gap-2"
                    >
                        {currentStep === 4 ? "Finish Setup" : "Next Step"}
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
