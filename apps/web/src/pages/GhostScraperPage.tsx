
import React, { useState } from 'react';
import { api } from '../lib/api';

export function GhostScraperPage() {
    const [proxies, setProxies] = useState('');
    const [baseEmail, setBaseEmail] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [status, setStatus] = useState<string>('idle');
    const [logs, setLogs] = useState<string[]>([]);

    const startFactory = async () => {
        try {
            setStatus('running');
            setLogs(prev => [...prev, '🚀 Starting Factory...']);

            const proxyList = proxies.split('\n').filter(p => p.trim().length > 0);

            await api.post('/bots/create-batch', {
                proxies: proxyList,
                baseEmail,
                textVerifiedApiKey: apiKey
            });

            setStatus('success');
            setLogs(prev => [...prev, '✅ Batch completed successfully!']);
        } catch (e: any) {
            setStatus('error');
            setLogs(prev => [...prev, `❌ Error: ${e.message}`]);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">👻 Ghost Scraper Dashboard</h1>

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4 text-purple-600">Account Factory (Wizard)</h2>

                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">TextVerified API Key (Bearer)</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full p-2 border rounded focus:ring-purple-500 focus:border-purple-500"
                            placeholder="eyJhbGciOi..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Base Gmail (e.g. user@gmail.com)</label>
                        <input
                            type="text"
                            value={baseEmail}
                            onChange={(e) => setBaseEmail(e.target.value)}
                            className="w-full p-2 border rounded focus:ring-purple-500 focus:border-purple-500"
                            placeholder="ghostleads@gmail.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Proxy List (One per line)</label>
                        <textarea
                            value={proxies}
                            onChange={(e) => setProxies(e.target.value)}
                            className="w-full h-32 p-2 border rounded font-mono text-sm"
                            placeholder="http://user:pass@host:port"
                        />
                    </div>

                    <button
                        onClick={startFactory}
                        disabled={status === 'running'}
                        className={`w-full py-3 px-4 rounded-md text-white font-medium 
                            ${status === 'running' ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
                    >
                        {status === 'running' ? 'Factory Running...' : 'Start Factory'}
                    </button>

                    {logs.length > 0 && (
                        <div className="mt-4 p-4 bg-gray-900 text-green-400 rounded font-mono text-sm max-h-40 overflow-y-auto">
                            {logs.map((log, i) => <div key={i}>{log}</div>)}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-2">Bot Army Status</h2>
                <div className="text-gray-500 text-center py-8">
                    No active bots found. Use the Factory above to recruit ghosts.
                </div>
            </div>
        </div>
    );
}
