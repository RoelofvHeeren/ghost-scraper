
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { MapPin, Globe, User, Radio, Play, AlertCircle } from 'lucide-react';

export function AccountCreatorPage() {
    const [formData, setFormData] = useState({
        baseEmail: 'roelof818@gmail.com',
        proxy: '',
        address: '9012 Grand Bayou Ct, Tampa, FL 33635',
        lat: 28.0360,
        lng: -82.6060,
        firstName: '',
        lastName: ''
    });

    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const res = await api.post('/bots/factory', data);
            return res.data;
        }
    });

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
                        <label className="text-sm text-zinc-400">Target Address (Exact Google Maps String)</label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
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
                        <Radio className="w-5 h-5 animate-pulse" />
                        Bot Factory Started! Check the server logs/console for live progress.
                    </div>
                )}

            </form>
        </div>
    );
}
