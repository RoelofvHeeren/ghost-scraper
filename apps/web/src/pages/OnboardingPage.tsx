import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, Sparkles, Key, Globe, ShieldCheck } from "lucide-react";

const steps = [
    { id: 1, title: "API Configuration", icon: Key },
    { id: 2, title: "Connect Sources", icon: Globe },
    { id: 3, title: "Safety & Proxies", icon: ShieldCheck },
];

export function OnboardingPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const navigate = useNavigate();

    const handleNext = () => {
        if (currentStep < 3) {
            setCurrentStep(curr => curr + 1);
        } else {
            navigate("/");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative">
            {/* Background Video (Reused) */}
            <video autoPlay muted loop playsInline className="bg-video">
                <source src="/background.mp4" type="video/mp4" />
            </video>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-luxury max-w-2xl w-full mx-4 relative z-10">
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
                <div className="min-h-[250px]">
                    {currentStep === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-bold text-white">API Keys</h2>
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 uppercase tracking-wider">OpenAI API Key</label>
                                <input type="password" placeholder="sk-..." className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-accent/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 uppercase tracking-wider">Twilio Account SID</label>
                                <input type="text" placeholder="AC..." className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-accent/50" />
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-bold text-white">Connect Nextdoor</h2>
                            <p className="text-sm text-gray-400 mb-4">You can add more accounts later in the dashboard.</p>
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 uppercase tracking-wider">Username / Email</label>
                                <input type="text" placeholder="neighbor@example.com" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-accent/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 uppercase tracking-wider">Password</label>
                                <input type="password" placeholder="••••••••" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-accent/50" />
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-bold text-white">Safety & Proxies</h2>
                            <div className="bg-teal-500/10 border border-teal-500/20 p-4 rounded-xl flex gap-3 text-teal-200">
                                <ShieldCheck className="shrink-0" />
                                <p className="text-sm">Safety limits are enabled by default. The bot will not exceed 4 posts per day per account to prevent bans.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 uppercase tracking-wider">Proxy Server (Optional)</label>
                                <input type="text" placeholder="http://user:pass@host:port" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-accent/50" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end mt-8 pt-6 border-t border-white/10">
                    <button
                        onClick={handleNext}
                        className="px-6 py-3 bg-white text-black font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-gray-200 transition-all duration-300 flex items-center gap-2"
                    >
                        {currentStep === 3 ? "Complete Setup" : "Next Step"}
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
