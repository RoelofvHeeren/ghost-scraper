import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Camera, Activity, Maximize2, Minimize2, MousePointer2 } from 'lucide-react';

interface LiveBotMonitorProps {
    logs: string[];
    screenshot: string | null;
    currentStep: string;
    isProcessing: boolean;
    isManualMode: boolean;
    onRemoteClick?: (x: number, y: number) => void;
    onRemoteScroll?: (deltaY: number) => void;
    onRemoteType?: (key: string) => void;
    onToggleManual?: (paused: boolean) => void;
}

export function LiveBotMonitor({
    logs,
    screenshot,
    currentStep,
    isProcessing,
    isManualMode,
    onRemoteClick,
    onRemoteScroll,
    onRemoteType,
    onToggleManual
}: LiveBotMonitorProps) {
    const logEndRef = useRef<HTMLDivElement>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
        if (!imgRef.current || !onRemoteClick) return;

        // Auto-focus container to capture keys
        containerRef.current?.focus();

        const rect = imgRef.current.getBoundingClientRect();
        const containerWidth = rect.width;
        const containerHeight = rect.height;
        const naturalWidth = imgRef.current.naturalWidth;
        const naturalHeight = imgRef.current.naturalHeight;

        const naturalAR = naturalWidth / naturalHeight;
        const containerAR = containerWidth / containerHeight;

        let imgDisplayedWidth, imgDisplayedHeight, offsetX, offsetY;

        if (containerAR > naturalAR) {
            // Height-constrained (bars on left/right)
            imgDisplayedWidth = containerHeight * naturalAR;
            imgDisplayedHeight = containerHeight;
            offsetX = (containerWidth - imgDisplayedWidth) / 2;
            offsetY = 0;
        } else {
            // Width-constrained (bars on top/bottom)
            imgDisplayedWidth = containerWidth;
            imgDisplayedHeight = containerWidth / naturalAR;
            offsetX = 0;
            offsetY = (containerHeight - imgDisplayedHeight) / 2;
        }

        const clickX = e.clientX - rect.left - offsetX;
        const clickY = e.clientY - rect.top - offsetY;

        // Ensure we are clicking within the actual image bounds
        if (clickX < 0 || clickX > imgDisplayedWidth || clickY < 0 || clickY > imgDisplayedHeight) {
            return;
        }

        const scaleX = naturalWidth / imgDisplayedWidth;
        const scaleY = naturalHeight / imgDisplayedHeight;

        onRemoteClick(Math.round(clickX * scaleX), Math.round(clickY * scaleY));
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (!isManualMode || !onRemoteScroll) return;
        onRemoteScroll(Math.round(e.deltaY));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isManualMode || !onRemoteType) return;

        // Prevent default browser actions (like scrolling with space) while typing to bot
        if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Tab', 'Enter'].includes(e.key)) {
            e.preventDefault();
        }
        onRemoteType(e.key);
    };

    if (!isProcessing && logs.length === 0) return null;

    return (
        <div className={`mt-8 grid grid-cols-1 ${isExpanded ? 'lg:grid-cols-1' : 'lg:grid-cols-2'} gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            {/* Live Screenshot Viewport */}
            <div className={`space-y-3 ${isExpanded ? 'order-first' : ''}`}>
                <div className="flex justify-between items-center text-zinc-400">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                        <Camera className="w-4 h-4" /> Live Web View
                        {isExpanded && <span className="text-[10px] text-green-500 font-mono tracking-widest px-2 py-0.5 bg-green-500/10 rounded uppercase">Remote Control Active</span>}
                        {isManualMode && <span className="text-[10px] text-orange-500 font-mono tracking-widest px-2 py-0.5 bg-orange-500/10 rounded uppercase">Automation Paused</span>}
                    </h3>
                    <div className="flex items-center gap-2">
                        {isManualMode && (
                            <span className="text-[10px] text-zinc-500 animate-pulse border border-zinc-800 px-2 py-1 rounded hidden sm:inline">
                                Scroll & Type Enabled
                            </span>
                        )}
                        <button
                            onClick={() => onToggleManual?.(!isManualMode)}
                            className={`p-1 px-3 rounded text-[10px] font-bold border transition-all ${isManualMode
                                ? 'bg-orange-500 border-orange-400 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700'
                                }`}
                        >
                            {isManualMode ? 'RESUME AUTOMATION' : 'PAUSE AUTOMATION'}
                        </button>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1 px-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] flex items-center gap-1 transition-colors border border-zinc-700"
                        >
                            {isExpanded ? <><Minimize2 className="w-3 h-3" /> Collapse</> : <><Maximize2 className="w-3 h-3" /> Expand</>}
                        </button>
                    </div>
                </div>

                <div
                    ref={containerRef}
                    tabIndex={0}
                    onKeyDown={handleKeyDown}
                    onWheel={handleWheel}
                    className={`bg-zinc-950 rounded-xl border-2 transition-all duration-300 relative overflow-hidden shadow-2xl outline-none ${isManualMode ? 'border-orange-500/50 shadow-orange-500/10 focus:border-orange-400' : 'border-zinc-800 shadow-black'
                        } ${isExpanded ? 'aspect-[16/10] max-h-[85vh]' : 'aspect-video'}`}>
                    {screenshot ? (
                        <div className="relative group cursor-crosshair h-full w-full">
                            <img
                                ref={imgRef}
                                src={screenshot}
                                alt="Live Bot View"
                                className="w-full h-full object-contain"
                                onClick={handleImageClick}
                            />
                            <div className="absolute inset-0 pointer-events-none border-2 border-transparent group-hover:border-green-500/30 transition-colors flex items-center justify-center">
                                <MousePointer2 className="w-8 h-8 text-white/10 group-hover:text-green-500/50 transition-all scale-150" />
                            </div>
                            {isManualMode && (
                                <div className="absolute inset-0 bg-orange-500/5 pointer-events-none flex items-center justify-center">
                                    <div className="bg-orange-500/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-orange-500/30 text-orange-400 text-sm font-bold tracking-widest flex items-center gap-2">
                                        <Activity className="w-4 h-4 animate-pulse" /> MANUAL CONTROL ON
                                    </div>
                                </div>
                            )}
                        </div>
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
                        <div className={`${isManualMode ? 'bg-orange-600' : 'bg-green-600'} px-3 py-1 rounded-md text-xs font-bold text-white shadow-lg transition-colors`}>
                            {isManualMode ? 'Paused: Manual Mode' : (currentStep || 'Initializing...')}
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Terminal Logs */}
            <div className={`space-y-3 ${isExpanded ? 'h-[200px]' : ''}`}>
                <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <Terminal className="w-4 h-4" /> System Logs
                </h3>
                <div className="h-[250px] lg:h-full bg-black border border-zinc-800 rounded-xl p-4 font-mono text-[11px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 transition-all">
                    <div className="space-y-1">
                        {logs.map((log, i) => (
                            <div key={i} className="flex gap-3">
                                <span className="text-zinc-600 shrink-0">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                <span className={
                                    log.includes('❌') ? 'text-red-400' :
                                        log.includes('✅') ? 'text-green-400' :
                                            log.includes('🤖') ? 'text-blue-400' :
                                                log.includes('🎓') ? 'text-purple-400' :
                                                    log.includes('⚠️') ? 'text-orange-400' :
                                                        'text-zinc-300'
                                }>
                                    {log}
                                </span>
                            </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                    {isProcessing && !isManualMode && (
                        <div className="flex items-center gap-2 text-green-500 mt-2 animate-pulse">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            <span>Automation Running...</span>
                        </div>
                    )}
                    {isManualMode && (
                        <div className="flex items-center gap-2 text-orange-500 mt-2">
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping" />
                            <span>Awaiting Manual Interaction...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
