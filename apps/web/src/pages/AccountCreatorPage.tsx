
import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { MapPin, Globe, User, Radio, Play, AlertCircle } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { LiveBotMonitor } from '../components/LiveBotMonitor';

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:8080";

export function AccountCreatorPage() {
    const [formData, setFormData] = useState({
        baseEmail: 'nextdoorneighbor01@gmail.com',
        proxy: 'http://juvgugun-US:m1c1h51kdgjm@192.53.67.129:5678',
        address: '4598 Nautilus Dr Miami Beach, FL 33140',
        lat: 25.8123,
        lng: -80.1341,
        firstName: '',
        lastName: '',
        password: '',
        textVerifiedApiKey: ''
    });

    // Live Monitoring State
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState<string>('');
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isManualMode, setIsManualMode] = useState(false);

    useEffect(() => {
        const s = io(API_BASE_URL);
        setSocket(s);

        s.on('connect', () => console.log('Connected to WebSocket server'));

        s.on('step_update', (step: string) => setCurrentStep(step));
        s.on('log', (msg: string) => setLogs(prev => [...prev.slice(-49), msg]));
        s.on('screenshot', (b64: string) => setScreenshot(b64));
        s.on('manual_state', (state: boolean) => setIsManualMode(state));

        return () => {
            s.disconnect();
        };
    }, []);

    const onToggleManual = () => {
        if (socket && sessionId) {
            socket.emit('toggle_manual', { sessionId });
        }
    };

    const [isGeocoding, setIsGeocoding] = useState(false);

    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const sid = Math.random().toString(36).substring(7);
            setSessionId(sid);
            setLogs(['🚀 Initializing factory session...']);
            setCurrentStep('Initializing');
            setScreenshot(null);
            setIsManualMode(false);

            if (socket) {
                socket.emit('join_bot_session', sid);
            }

            const res = await api.post('/bots/factory', { ...data, sessionId: sid });
            return res.data;
        }
    });

    const handleGeocode = async () => {
        if (!formData.address) return;

        setIsGeocoding(true);
        try {
            console.log(`🌍 Geocoding: ${formData.address}`);
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address)}`);
            const data = await res.json();

            if (data && data[0]) {
                const { lat, lon } = data[0];
                console.log(`📍 Found: ${lat}, ${lon}`);
                setFormData(prev => ({
                    ...prev,
                    lat: parseFloat(lat),
                    lng: parseFloat(lon)
                }));
            }
        } catch (e) {
            console.error("Geocode failed", e);
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <header>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-green-600">
                    Bot Factory 🏭
                </h1>
                <p className="text-zinc-400 mt-2">
                    Spin up new "Ghost" identities with GPS Spoofing & SMS Verification.
                </p>
            </header>

            <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl space-y-6">

                {/* Section 1: Identity */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <User className="w-5 h-5 text-purple-400" /> Identity
                    </h3>

                    {/* Name & Password */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm text-zinc-400">First Name</label>
                            <input
                                type="text"
                                placeholder="Random"
                                value={formData.firstName}
                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                className="w-full bg-black/50 border border-zinc-700 rounded p-2 focus:ring-2 focus:ring-green-500/50 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-zinc-400">Last Name</label>
                            <input
                                type="text"
                                placeholder="Random"
                                value={formData.lastName}
                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                className="w-full bg-black/50 border border-zinc-700 rounded p-2 focus:ring-2 focus:ring-green-500/50 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-zinc-400">Password</label>
                            <input
                                type="text"
                                placeholder="Random if empty"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="w-full bg-black/50 border border-zinc-700 rounded p-2 focus:ring-2 focus:ring-green-500/50 outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm text-zinc-400">Base Email (Gmail Alias)</label>
                            <input
                                type="email"
                                value={formData.baseEmail}
                                onChange={e => setFormData({ ...formData, baseEmail: e.target.value })}
                                className="w-full bg-black/50 border border-zinc-700 rounded p-2 focus:ring-2 focus:ring-green-500/50 outline-none"
                            />
                            <p className="text-xs text-zinc-500">Bot will be: base+first123@gmail.com</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-zinc-400">Proxy URL</label>
                            <input
                                type="text"
                                placeholder="http://user:pass@ip:port"
                                value={formData.proxy}
                                onChange={e => setFormData({ ...formData, proxy: e.target.value })}
                                className="w-full bg-black/50 border border-zinc-700 rounded p-2 focus:ring-2 focus:ring-green-500/50 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-zinc-400">TextVerified API Key (Optional)</label>
                            <input
                                type="password"
                                placeholder="Uses server env if empty"
                                value={formData.textVerifiedApiKey}
                                onChange={e => setFormData({ ...formData, textVerifiedApiKey: e.target.value })}
                                className="w-full bg-black/50 border border-zinc-700 rounded p-2 focus:ring-2 focus:ring-green-500/50 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="h-px bg-zinc-800" />

                {/* Section 2: Location (GPS Spoofing) */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-red-400" /> Target Location (GPS Spoof)
                    </h3>
                    <div className="p-3 bg-blue-900/10 border border-blue-500/20 rounded-lg text-sm text-blue-200">
                        <Globe className="w-4 h-4 inline mr-2" />
                        <b>Why GPS?</b> Nextdoor trusts the device location more than IP. We override the browser's GPS to match this exact address, bypassing potential proxy flags.
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-zinc-400 flex justify-between">
                            <span>Target Address (Exact Google Maps String)</span>
                            {isGeocoding && <span className="text-yellow-400 animate-pulse text-xs">Fetching GPS...</span>}
                        </label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            onBlur={handleGeocode}
                            className="w-full bg-black/50 border border-zinc-700 rounded p-2 focus:ring-2 focus:ring-green-500/50 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm text-zinc-400">Latitude</label>
                            <input
                                type="number"
                                step="any"
                                value={formData.lat}
                                onChange={e => setFormData({ ...formData, lat: parseFloat(e.target.value) })}
                                className="w-full bg-black/50 border border-zinc-700 rounded p-2 focus:ring-2 focus:ring-green-500/50 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-zinc-400">Longitude</label>
                            <input
                                type="number"
                                step="any"
                                value={formData.lng}
                                onChange={e => setFormData({ ...formData, lng: parseFloat(e.target.value) })}
                                className="w-full bg-black/50 border border-zinc-700 rounded p-2 focus:ring-2 focus:ring-green-500/50 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="h-px bg-zinc-800" />

                <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
                >
                    {createMutation.isPending ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <Play className="w-5 h-5 fill-current" /> Initialize Bot Creation
                        </>
                    )}
                </button>

                {createMutation.isError && (
                    <div className="p-4 bg-red-900/20 border border-red-500/30 rounded text-red-200 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {String(createMutation.error)}
                    </div>
                )}

                {createMutation.isSuccess && (
                    <div className="p-4 bg-green-900/20 border border-green-500/30 rounded text-green-200 flex items-center gap-2">
                        <Radio className="w-5 h-5" />
                        Bot Factory Success!
                    </div>
                )}

            </form>

            {/* Live Monitoring Section */}
            {(createMutation.isPending || logs.length > 0) && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Session ID: {sessionId}</span>
                    </div>
                    <LiveBotMonitor
                        logs={logs}
                        screenshot={screenshot}
                        currentStep={currentStep}
                        isProcessing={createMutation.isPending}
                        isManualMode={isManualMode}
                        onToggleManual={onToggleManual}
                        onRemoteScroll={(deltaY) => {
                            if (socket && sessionId) {
                                socket.emit('remote_scroll', { sessionId, deltaY });
                            }
                        }}
                        onRemoteType={(key) => {
                            if (socket && sessionId) {
                                socket.emit('remote_type', { sessionId, key });
                            }
                        }}
                        onRemoteClick={(x, y) => {
                            if (socket && sessionId) {
                                socket.emit('remote_click', { sessionId, x, y });
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
}
