import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { RefreshCw, Calculator, ShoppingCart, Truck, Zap, Trash2, Info, Link2, Unlink } from 'lucide-react';

// --- 1. PRECISE SCIENTIFIC CONSTANTS (Source: Uploaded PDFs) ---

// Waste Rates (Used for downstream calc)
const TOTAL_WASTE_RATE_TSM = 0.227;
const TOTAL_WASTE_RATE_FSB = 0.076;

// EXACT Emission Factors (kg CO2e per kg) [Source: PDF Data Sheets]
const FOOD_EMISSION_FACTORS: Record<string, number> = {
    'Rice': 1.68,
    'Dhal': 1.99,
    'Chicken': 5.70,
    'Eggs': 0.668,
    'Carrots': 0.810,
    'Beans': 0.410,
    'Onions': 0.500,
    'Tomatoes': 3.29,
    'Potatoes': 0.132,
    'Bananas': 0.098,
    'Coconut Milk': 1.50,
    'Coconut Oil': 0.187
};

// Derived Factors from Data Sheets
const FACTORS = {
    // TSM Pack: (0.307 Packing + 0.144 Storage Bags) / 10.6 kg = 0.0425
    PACKAGING_INTENSITY_TSM: 0.0425,
    // FSB Pack: 0.610 / 8.87 kg = 0.0688
    PACKAGING_INTENSITY_FSB: 0.0688,

    BULK_TRANSPORT_PER_KG: 0.0138, // 0.146 / 10.6
    STORAGE_PER_KG_TSM: 0.0054, // 0.057 / 10.6
    STORAGE_PER_KG_FSB: 0.0005, // Negligible

    // Landfill Factor (Biodegradable Waste) [Source: TSM PDF 0.513 kgCO2e/kg]
    LANDFILL_PER_KG: 0.513,

    FSB_LAST_MILE_FIXED: 0.019
};

const TRANSPORT_SCENARIOS = {
    'gampaha': { label: 'Gampaha Mix', factor: 0.013 },
    'western': { label: 'Western (Car)', factor: 0.0231 }
};

// --- DEFAULT PURCHASED AMOUNTS (Directly from PDFs) ---

// Source: 'TSM data.pdf' [Source: 90]
const DEFAULT_BASKET_TSM = [
    { id: 'rice', name: 'Rice', amount: 2.72 },
    { id: 'dhal', name: 'Dhal', amount: 0.518 },
    { id: 'chicken', name: 'Chicken', amount: 0.518 },
    { id: 'eggs', name: 'Eggs', amount: 0.776 },
    { id: 'carrots', name: 'Carrots', amount: 0.647 },
    { id: 'beans', name: 'Beans', amount: 0.647 },
    { id: 'onions', name: 'Onions', amount: 0.647 },
    { id: 'tomatoes', name: 'Tomatoes', amount: 0.647 },
    { id: 'pot', name: 'Potatoes', amount: 0.647 },
    { id: 'fruit', name: 'Bananas', amount: 1.55 },
    { id: 'coc_milk', name: 'Coconut Milk', amount: 1.03 },
    { id: 'coc_oil', name: 'Coconut Oil', amount: 0.259 },
];

// Source: 'FSB data.pdf' [Source: 4]
const DEFAULT_BASKET_FSB = [
    { id: 'rice', name: 'Rice', amount: 2.27 },
    { id: 'dhal', name: 'Dhal', amount: 0.433 },
    { id: 'chicken', name: 'Chicken', amount: 0.433 },
    { id: 'eggs', name: 'Eggs', amount: 0.649 },
    { id: 'carrots', name: 'Carrots', amount: 0.541 },
    { id: 'beans', name: 'Beans', amount: 0.541 },
    { id: 'onions', name: 'Onions', amount: 0.541 },
    { id: 'tomatoes', name: 'Tomatoes', amount: 0.541 },
    { id: 'pot', name: 'Potatoes', amount: 0.541 },
    { id: 'fruit', name: 'Bananas', amount: 1.30 },
    { id: 'coc_milk', name: 'Coconut Milk', amount: 0.866 },
    { id: 'coc_oil', name: 'Coconut Oil', amount: 0.216 },
];

export default function ImpactCalculator({ isDarkMode }: { isDarkMode: boolean }) {
    const [activeTab, setActiveTab] = useState<'basket' | 'scenarios'>('basket');

    // INDEPENDENT STATE for each model
    const [basketTSM, setBasketTSM] = useState(DEFAULT_BASKET_TSM);
    const [basketFSB, setBasketFSB] = useState(DEFAULT_BASKET_FSB);
    const [isSynced, setIsSynced] = useState(false); // NEW: Sync Toggle State

    const [transportDist, setTransportDist] = useState(10);
    const [transportMode, setTransportMode] = useState<'gampaha' | 'western'>('gampaha');

    // Sensitivity Inputs
    const [wasteRateTSM, setWasteRateTSM] = useState(TOTAL_WASTE_RATE_TSM);
    const [wasteRateFSB, setWasteRateFSB] = useState(TOTAL_WASTE_RATE_FSB);

    const [results, setResults] = useState<any[]>([]);
    const [breakdown, setBreakdown] = useState<any>(null);

    // --- Calculation Engine ---
    useEffect(() => {
        let tsm = { raw: 0, pack: 0, transport: 0, storage: 0, eol: 0, total: 0, wasteKg: 0, totalWeight: 0 };
        let fsb = { raw: 0, pack: 0, transport: 0, storage: 0, eol: 0, total: 0, wasteKg: 0, totalWeight: 0 };

        // --- PROCESS TSM ---
        basketTSM.forEach(item => {
            const factor = FOOD_EMISSION_FACTORS[item.name] || 1;
            const input = item.amount;

            tsm.raw += input * factor;
            tsm.transport += input * FACTORS.BULK_TRANSPORT_PER_KG;
            tsm.wasteKg += input * wasteRateTSM; // Waste is % of purchased
            tsm.totalWeight += input;
        });

        // --- PROCESS FSB ---
        basketFSB.forEach(item => {
            const factor = FOOD_EMISSION_FACTORS[item.name] || 1;
            const input = item.amount;

            fsb.raw += input * factor;
            fsb.transport += input * FACTORS.BULK_TRANSPORT_PER_KG;
            fsb.wasteKg += input * wasteRateFSB; // Waste is % of purchased
            fsb.totalWeight += input;
        });

        // Packaging & Storage (Based on Purchased Weight)
        tsm.pack = tsm.totalWeight * FACTORS.PACKAGING_INTENSITY_TSM;
        fsb.pack = fsb.totalWeight * FACTORS.PACKAGING_INTENSITY_FSB;
        tsm.storage = tsm.totalWeight * FACTORS.STORAGE_PER_KG_TSM;
        fsb.storage = fsb.totalWeight * FACTORS.STORAGE_PER_KG_FSB;

        // Transport (Last Mile)
        const transportFactor = TRANSPORT_SCENARIOS[transportMode].factor;
        tsm.transport += transportDist * transportFactor;
        fsb.transport += FACTORS.FSB_LAST_MILE_FIXED;

        // End-of-Life (Landfill + Recycling Adjustment)
        // TSM Waste: Food Waste + 90% Packaging
        const tsmLandfillWaste = tsm.wasteKg + (tsm.pack * 0.9);
        const fsbLandfillWaste = fsb.wasteKg + (fsb.pack * 0.9);

        tsm.eol = tsmLandfillWaste * FACTORS.LANDFILL_PER_KG;
        fsb.eol = fsbLandfillWaste * FACTORS.LANDFILL_PER_KG;

        // Totals
        tsm.total = tsm.raw + tsm.pack + tsm.transport + tsm.storage + tsm.eol;
        fsb.total = fsb.raw + fsb.pack + fsb.transport + fsb.storage + fsb.eol;

        setResults([
            { name: 'Total Impact', TSM: parseFloat(tsm.total.toFixed(2)), FSB: parseFloat(fsb.total.toFixed(2)) }
        ]);

        setBreakdown({ tsm, fsb });

    }, [basketTSM, basketFSB, transportDist, transportMode, wasteRateTSM, wasteRateFSB]);

    // Handlers for independent updates
    const updateTSM = (id: string, value: string) => {
        const num = parseFloat(value) || 0;
        setBasketTSM(prev => prev.map(item => item.id === id ? { ...item, amount: num } : item));
        // If Synced, also update FSB
        if (isSynced) {
            setBasketFSB(prev => prev.map(item => item.id === id ? { ...item, amount: num } : item));
        }
    };

    const updateFSB = (id: string, value: string) => {
        const num = parseFloat(value) || 0;
        setBasketFSB(prev => prev.map(item => item.id === id ? { ...item, amount: num } : item));
        // If Synced, also update TSM
        if (isSynced) {
            setBasketTSM(prev => prev.map(item => item.id === id ? { ...item, amount: num } : item));
        }
    };

    // Toggle Sync Function
    const toggleSync = () => {
        const newState = !isSynced;
        setIsSynced(newState);
        // Optional: When enabling sync, snap FSB to TSM values immediately
        if (newState) {
            setBasketFSB([...basketTSM]);
        }
    };

    const theme = {
        card: isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200',
        text: isDarkMode ? 'text-slate-200' : 'text-slate-800',
        textMuted: isDarkMode ? 'text-slate-400' : 'text-slate-500',
        input: isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-800'
    };

    return (
        <div className="h-full flex flex-col p-4 animate-in fade-in space-y-6 overflow-y-auto pb-20">

            {/* Header */}
            <div className={`p-6 rounded-xl border ${theme.card} flex flex-col md:flex-row justify-between items-center gap-4`}>
                <div>
                    <h2 className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
                        <Calculator /> Research Scenario Simulator
                    </h2>
                    <p className={`text-sm ${theme.textMuted}`}>
                        Comparing Independent Purchasing Models. <span className="text-emerald-400">FSB Data</span> vs <span className="text-red-400">TSM Data</span>.
                    </p>
                </div>
                <div className="flex gap-4 text-center">
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 min-w-[120px]">
                        <div className="text-xs text-red-400 uppercase font-bold tracking-wider">TSM Impact</div>
                        <div className="text-3xl font-bold text-red-500 mt-1">{results[0]?.TSM} <span className="text-sm">kg</span></div>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 min-w-[120px]">
                        <div className="text-xs text-emerald-400 uppercase font-bold tracking-wider">FSB Impact</div>
                        <div className="text-3xl font-bold text-emerald-500 mt-1">{results[0]?.FSB} <span className="text-sm">kg</span></div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-full">

                {/* Controls */}
                <div className={`w-full lg:w-5/12 p-0 rounded-xl border ${theme.card} overflow-hidden flex flex-col max-h-[650px]`}>
                    <div className="flex border-b border-slate-700">
                        <button onClick={() => setActiveTab('basket')} className={`flex-1 py-3 text-xs font-bold uppercase ${activeTab === 'basket' ? 'bg-slate-700/50 text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-white'}`}>1. Independent Input</button>
                        <button onClick={() => setActiveTab('scenarios')} className={`flex-1 py-3 text-xs font-bold uppercase ${activeTab === 'scenarios' ? 'bg-slate-700/50 text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-white'}`}>2. Scenarios</button>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1">
                        {activeTab === 'basket' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className={`font-bold ${theme.text} flex items-center gap-2`}><ShoppingCart size={18} /> Purchased Quantities (kg)</h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={toggleSync}
                                            title={isSynced ? "Unlink Inputs" : "Link Inputs (Sync Quantities)"}
                                            className={`p-2 rounded-full transition-colors flex items-center gap-2 text-xs font-bold ${isSynced ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-400'}`}
                                        >
                                            {isSynced ? <Link2 size={14} /> : <Unlink size={14} />} {isSynced ? "Synced" : "Sync"}
                                        </button>
                                        <button onClick={() => { setBasketTSM(DEFAULT_BASKET_TSM); setBasketFSB(DEFAULT_BASKET_FSB); }} title="Reset" className="p-2 hover:bg-slate-700 rounded-full"><RefreshCw size={14} /></button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-5 gap-2 text-[10px] text-slate-500 uppercase font-bold text-center mb-2">
                                    <div className="col-span-2 text-left">Food Item</div>
                                    <div className="text-red-400">TSM</div>
                                    <div className="text-emerald-400">FSB</div>
                                    <div>Unit</div>
                                </div>

                                {basketTSM.map((itemTSM, index) => {
                                    const itemFSB = basketFSB[index];
                                    return (
                                        <div key={itemTSM.id} className="grid grid-cols-5 gap-2 items-center p-2 rounded border border-slate-700/30 hover:border-slate-600">
                                            <div className={`col-span-2 text-xs font-bold ${theme.textMuted}`}>{itemTSM.name}</div>
                                            <input
                                                type="number" min="0" step="0.01"
                                                value={itemTSM.amount}
                                                onChange={(e) => updateTSM(itemTSM.id, e.target.value)}
                                                className={`w-full text-center px-1 py-1 rounded text-xs font-mono border focus:outline-none focus:border-red-500 border-slate-700 bg-slate-900/50 text-red-300`}
                                            />
                                            <input
                                                type="number" min="0" step="0.01"
                                                value={itemFSB.amount}
                                                onChange={(e) => updateFSB(itemFSB.id, e.target.value)}
                                                className={`w-full text-center px-1 py-1 rounded text-xs font-mono border focus:outline-none focus:border-emerald-500 border-slate-700 bg-slate-900/50 text-emerald-300`}
                                            />
                                            <div className="text-xs text-slate-500 text-center">kg</div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {activeTab === 'scenarios' && (
                            <div className="space-y-8 animate-in fade-in">
                                <div className="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
                                    <h3 className="text-emerald-400 font-bold text-sm mb-2">Policy Testing</h3>
                                    <p className="text-xs text-slate-400">
                                        Modify waste rates or logistics to see if TSM can compete with FSB efficiency.
                                    </p>
                                </div>

                                <div>
                                    <h3 className={`font-bold ${theme.text} mb-4 flex items-center gap-2`}><Trash2 size={16} /> Total Waste Rate</h3>
                                    <div className="mb-6">
                                        <div className="flex justify-between text-xs mb-2">
                                            <span className="text-red-400 font-bold">TSM Total Waste</span>
                                            <span className="font-mono text-white">{(wasteRateTSM * 100).toFixed(1)}%</span>
                                        </div>
                                        <input type="range" min="0" max="0.40" step="0.01" value={wasteRateTSM} onChange={(e) => setWasteRateTSM(parseFloat(e.target.value))} className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-red-500" />
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-xs mb-2">
                                            <span className="text-emerald-400 font-bold">FSB Total Waste</span>
                                            <span className="font-mono text-white">{(wasteRateFSB * 100).toFixed(1)}%</span>
                                        </div>
                                        <input type="range" min="0" max="0.40" step="0.01" value={wasteRateFSB} onChange={(e) => setWasteRateFSB(parseFloat(e.target.value))} className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                                    </div>
                                </div>

                                <div className="border-t border-slate-700 pt-6">
                                    <h3 className={`font-bold ${theme.text} mb-3 flex items-center gap-2`}><Truck size={16} /> Logistics</h3>
                                    <div className="space-y-4">
                                        <input type="range" min="1" max="50" step="1" value={transportDist} onChange={(e) => setTransportDist(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                                        <div className="flex bg-slate-800 rounded p-1 border border-slate-700">
                                            <button onClick={() => setTransportMode('gampaha')} className={`flex-1 py-1 text-xs rounded ${transportMode === 'gampaha' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>Gampaha Mix</button>
                                            <button onClick={() => setTransportMode('western')} className={`flex-1 py-1 text-xs rounded ${transportMode === 'western' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Western (Car)</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Analytics */}
                <div className="flex-1 flex flex-col gap-6">
                    <div className={`flex-1 p-6 rounded-xl border ${theme.card} flex flex-col min-h-[350px]`}>
                        <h3 className={`font-bold ${theme.text} mb-6`}>Real-time Comparative Projection</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={results} barSize={80}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                <XAxis dataKey="name" stroke="#94a3b8" hide />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} cursor={{ fill: 'transparent' }} />
                                <Legend />
                                <ReferenceLine y={13.21} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'right', value: 'Baseline', fill: '#10b981', fontSize: 10 }} />
                                <Bar dataKey="TSM" fill="#ef4444" radius={[4, 4, 0, 0]} label={{ position: 'top', fill: '#ef4444', fontWeight: 'bold' }} />
                                <Bar dataKey="FSB" fill="#10b981" radius={[4, 4, 0, 0]} label={{ position: 'top', fill: '#10b981', fontWeight: 'bold' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className={`p-4 rounded-xl border ${theme.card}`}>
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><Trash2 size={14} /> Supply Chain Waste</h4>
                            <div className="flex justify-between items-end">
                                <div className="text-left"><div className="text-xl font-bold text-red-400">{breakdown?.tsm.wasteKg.toFixed(2)} kg</div><div className="text-[10px] text-slate-500">TSM</div></div>
                                <div className="text-right"><div className="text-xl font-bold text-emerald-400">{breakdown?.fsb.wasteKg.toFixed(2)} kg</div><div className="text-[10px] text-slate-500">FSB</div></div>
                            </div>
                        </div>
                        <div className={`p-4 rounded-xl border ${theme.card}`}>
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><Zap size={14} /> Facility Energy</h4>
                            <div className="flex justify-between items-end">
                                <div className="text-left"><div className="text-xl font-bold text-red-400">{breakdown?.tsm.storage.toFixed(2)}</div><div className="text-[10px] text-slate-500">TSM</div></div>
                                <div className="text-right"><div className="text-xl font-bold text-emerald-400">{breakdown?.fsb.storage.toFixed(2)}</div><div className="text-[10px] text-slate-500">FSB</div></div>
                            </div>
                        </div>
                        <div className={`p-4 rounded-xl border ${theme.card}`}>
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><Truck size={14} /> Transport</h4>
                            <div className="flex justify-between items-end">
                                <div className="text-left"><div className="text-xl font-bold text-red-400">{breakdown?.tsm.transport.toFixed(2)}</div><div className="text-[10px] text-slate-500">TSM</div></div>
                                <div className="text-right"><div className="text-xl font-bold text-emerald-400">{breakdown?.fsb.transport.toFixed(2)}</div><div className="text-[10px] text-slate-500">FSB</div></div>
                            </div>
                        </div>
                    </div>

                    <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'} flex gap-3 items-start`}>
                        <Info size={24} className="text-blue-400 shrink-0 mt-1" />
                        <div>
                            <h4 className={`text-sm font-bold ${theme.text} mb-1`}>Supervisor Insight: Independent Inputs</h4>
                            <p className={`text-xs ${theme.textMuted} leading-relaxed`}>
                                This mode allows you to edit the <strong>Purchased Quantity</strong> for each model independently.
                                Enable <strong>Sync Mode</strong> to simulate hypothetical "Equal Purchase" scenarios for comparative analysis.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}