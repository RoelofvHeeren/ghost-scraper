import React, { useEffect, useRef } from 'react';
import { Terminal, Camera, Activity } from 'lucide-react';

interface LiveBotMonitorProps {
    logs: string[];
    screenshot: string | null;
    currentStep: string;
    isProcessing: boolean;
}

export function LiveBotMonitor({ logs, screenshot, currentStep, isProcessing }: LiveBotMonitorProps) {
    const logEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    if (!isProcessing && logs.length === 0) return null;

    return (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Live Screenshot Viewport */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Live Web View
                </h3>
                <div className="aspect-video bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden relative shadow-2xl">
                    {screenshot ? (
                        <img
                            src={screenshot}
                            alt="Live Bot View"
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
                            <Activity className="w-8 h-8 mb-2 animate-pulse" />
                            <p className="text-xs">Waiting for first frame...</p>
                        </div>
                    )}

                    {/* Step Overlay */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                        <div className="bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-green-400 uppercase tracking-wider">
                            LIVE STREAM
                        </div>
                        <div className="bg-green-600 px-3 py-1 rounded-md text-xs font-bold text-white shadow-lg">
                            {currentStep || 'Initializing...'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Terminal Logs */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <Terminal className="w-4 h-4" /> System Logs
                </h3>
                <div className="h-[250px] lg:h-full bg-black border border-zinc-800 rounded-xl p-4 font-mono text-[11px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
                    <div className="space-y-1">
                        {logs.map((log, i) => (
                            <div key={i} className="flex gap-3">
                                <span className="text-zinc-600 shrink-0">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                <span className={log.includes('❌') ? 'text-red-400' : log.includes('✅') ? 'text-green-400' : 'text-zinc-300'}>
                                    {log}
                                </span>
                            </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                    {isProcessing && (
                        <div className="flex items-center gap-2 text-green-500 mt-2 animate-pulse">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            <span>Processing...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
