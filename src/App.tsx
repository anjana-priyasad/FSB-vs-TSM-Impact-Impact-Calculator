import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import ImpactCalculator from './ImpactCalculator';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ReferenceLine, LabelList
} from 'recharts';
import {
  ChevronRight, ChevronLeft, Leaf, Box, ShoppingCart,
  BarChart2, Truck, Trash2, Activity, Globe,
  Info, TrendingDown, Layers,
  BookOpen, Target, AlertTriangle, Scale, CheckCircle,
  LayoutDashboard, GitMerge, FileText, X,
  Settings, Play, PenTool, MousePointer2, Eraser, User, Image as ImageIcon,
  Minimize2, Maximize2, Edit3, Save, Upload, Sun, Moon,
  List, Plus, Trash, Code, Type, AlignLeft, AlignCenter, AlignRight,
  MoveUp, MoveDown, LayoutTemplate, Grid, Columns, PanelTop, Eye, EyeOff,
  Square, Sidebar, Palette, GripVertical, Printer, Minus, Heading as HeadingIcon,
  RotateCcw, SplitSquareVertical, ArrowUpToLine, ArrowDownToLine, Equal
} from 'lucide-react';

// --- Types ---
type ViewMode = 'dashboard' | 'slides' | 'analyze' | 'lifecycle' | 'settings' | 'calculator';

type ContentBlock = {
  id: string;
  zone: string;
  type: 'paragraph' | 'list' | 'image' | 'heading' | 'visual';
  content: any;
  style?: {
    align?: 'left' | 'center' | 'right';
    color?: string;
    sizeScale?: number;
  };
};

type SlideLayoutType = 'single' | 'split' | 'top-bottom' | 'tri' | 'quad' | 'six-grid' | 'header-split' | 'left-sidebar' | 'right-sidebar';

type SlideData = {
  id: number;
  section: string;
  title: string;
  subtitle?: string;
  bullets?: string[];
  imageUrl?: string | null;
  images?: string[];
  layoutType: SlideLayoutType;
  blocks: ContentBlock[];
  iconName: string;
  visualType?: 'none' | 'image' | 'barChart' | 'pieChart' | 'tradeoffChart' | 'stackedBar';
  visualData?: any;
  showDefaultVisual?: boolean;
  backgroundStyle?: string;
  enable3DImages?: boolean;
  customStyle?: {
    textAlign?: 'left' | 'center' | 'right';
    verticalAlign?: 'start' | 'center' | 'end';
    reverseSplit?: boolean;
    columnCount?: number;
    fontFamily?: string;
    // Specific element styling
    titleColor?: string;
    titleSizeScale?: number;
    subtitleColor?: string;
    subtitleSizeScale?: number;
    headingColor?: string;
    headingSizeScale?: number;
    textColor?: string;
    textSizeScale?: number;
  };
  footerText?: string;
};

// --- Layout Definitions ---
const LAYOUT_ZONES: Record<SlideLayoutType, { id: string, label: string }[]> = {
  'single': [{ id: 'main', label: 'Main Content' }],
  'split': [{ id: 'left', label: 'Left Column' }, { id: 'right', label: 'Right Column' }],
  'top-bottom': [{ id: 'top', label: 'Top Section' }, { id: 'bottom', label: 'Bottom Section' }],
  'tri': [{ id: 'left', label: 'Left' }, { id: 'center', label: 'Center' }, { id: 'right', label: 'Right' }],
  'quad': [{ id: 'top-left', label: 'Top Left' }, { id: 'top-right', label: 'Top Right' }, { id: 'bottom-left', label: 'Bottom Left' }, { id: 'bottom-right', label: 'Bottom Right' }],
  'six-grid': [
    { id: 'p1', label: 'Panel 1' }, { id: 'p2', label: 'Panel 2' }, { id: 'p3', label: 'Panel 3' },
    { id: 'p4', label: 'Panel 4' }, { id: 'p5', label: 'Panel 5' }, { id: 'p6', label: 'Panel 6' }
  ],
  'header-split': [{ id: 'header', label: 'Header/Top' }, { id: 'left', label: 'Bottom Left' }, { id: 'right', label: 'Bottom Right' }],
  'left-sidebar': [{ id: 'sidebar', label: 'Sidebar (Left)' }, { id: 'main', label: 'Main Content (Right)' }],
  'right-sidebar': [{ id: 'main', label: 'Main Content (Left)' }, { id: 'sidebar', label: 'Sidebar (Right)' }],
};

// --- Options ---
const FONT_OPTIONS = [
  { label: 'Sans Serif (Default)', value: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  { label: 'Serif (Times New Roman)', value: '"Times New Roman", Times, serif' },
  { label: 'Monospace (Code)', value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' },
  { label: 'Slab Serif', value: 'Rockwell, "Courier Bold", Courier, Georgia, Times, "Times New Roman", serif' },
  { label: 'Modern Geometric', value: '"Futura", "Century Gothic", "Tw Cen MT", sans-serif' },
];

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const BG_PALETTE = [
  { name: 'Dark Slate', value: '#0f172a' },
  { name: 'Midnight', value: '#020617' },
  { name: 'Clean White', value: '#ffffff' },
  { name: 'Forest', value: 'linear-gradient(to bottom right, #064e3b, #022c22)' },
  { name: 'Ocean', value: 'linear-gradient(to bottom right, #1e3a8a, #172554)' },
  { name: 'Sunset', value: 'linear-gradient(to bottom right, #7c2d12, #451a03)' },
  { name: 'Royal', value: 'linear-gradient(to bottom right, #4c1d95, #2e1065)' },
  { name: 'Charcoal', value: '#18181b' },
];

// --- Data Constants ---
const DEFAULT_CHART_DATA = [
  { name: 'Category A', value: 40 },
  { name: 'Category B', value: 30 },
  { name: 'Category C', value: 20 },
  { name: 'Category D', value: 10 },
];

const DATA_COMPARISON = [
  { name: 'Raw Materials', TSM: 14.10, FSB: 11.80 },
  { name: 'Packaging', TSM: 0.45, FSB: 0.61 },
  { name: 'Logistics', TSM: 0.28, FSB: 0.14 },
  { name: 'End-of-Life', TSM: 1.33, FSB: 0.66 },
  { name: 'Storage', TSM: 0.06, FSB: 0.00 },
];

const DATA_TOTALS = [
  { name: 'TSM Model', value: 16.21, fill: '#ef4444', label: '16.21 kg' },
  { name: 'FSB Model', value: 13.21, fill: '#10b981', label: '13.21 kg' },
];

const DATA_PACKAGING = [
  { name: 'TSM Bags (HDPE)', weight: 56, fill: '#ef4444' },
  { name: 'FSB Box (Corrugated)', weight: 259, fill: '#10b981' },
];

const DATA_TRADEOFF = [
  { name: 'Packaging Penalty', value: 0.16, fill: '#ef4444' },
  { name: 'Food Waste Savings', value: -2.30, fill: '#10b981' },
  { name: 'Logistics Savings', value: -0.135, fill: '#10b981' },
];

const HOTSPOT_TSM = [
  { name: 'Raw Materials', value: 87.0, color: '#ef4444' },
  { name: 'Use/End-of-Life', value: 8.2, color: '#f87171' },
  { name: 'Packaging', value: 2.8, color: '#fca5a5' },
  { name: 'Logistics', value: 1.7, color: '#fecaca' },
];

const HOTSPOT_FSB = [
  { name: 'Raw Materials', value: 89.3, color: '#10b981' },
  { name: 'Packaging', value: 4.6, color: '#34d399' },
  { name: 'Use/End-of-Life', value: 5.0, color: '#6ee7b7' },
  { name: 'Transport', value: 1.1, color: '#a7f3d0' },
];

const LOGISTICS_MODAL_SPLIT = [
  { name: 'Motorcycle', value: 40, color: '#f59e0b' },
  { name: 'Three-wheel', value: 35, color: '#eab308' },
  { name: 'Car', value: 20, color: '#ef4444' },
  { name: 'Jeep/Diesel', value: 4.5, color: '#7c2d12' },
  { name: 'Walk', value: 0.5, color: '#10b981' },
];

const GLOBAL_WASTE_IMPACT = [
  { name: 'Food Waste Impact', value: 10, color: '#ef4444' },
  { name: 'Other Emissions', value: 90, color: '#94a3b8' },
];

const LIFECYCLE_STEPS = [
  { id: 'raw', title: 'Raw Materials', icon: Leaf, tsm: 14.1, fsb: 11.8, unit: 'kg CO2e', desc: 'Agricultural production & food waste (Embodied Carbon).' },
  { id: 'pack', title: 'Packaging', icon: Box, tsm: 0.45, fsb: 0.61, unit: 'kg CO2e', desc: 'Includes TSM Carrier Bags (0.14) & FSB Boxes.' },
  { id: 'log', title: 'Logistics', icon: Truck, tsm: 0.28, fsb: 0.14, unit: 'kg CO2e', desc: 'Transport to facility & last-mile delivery.' },
  { id: 'eol', title: 'End-of-Life', icon: Trash2, tsm: 1.33, fsb: 0.66, unit: 'kg CO2e', desc: 'Disposal to landfill & methane emissions.' },
];

const IconMap: Record<string, any> = { Globe, Layers, TrendingDown, AlertTriangle, Target, CheckCircle, BookOpen, Scale, Leaf, GitMerge, Activity, Box, FileText, Truck, BarChart2, PieChart, Trash2, ShoppingCart };

// --- Helper to convert legacy bullets/visuals to blocks ---
const normalizeBlocks = (slide: any): ContentBlock[] => {
  if (slide.blocks && slide.blocks.length > 0) return slide.blocks;

  const blocks: ContentBlock[] = [];
  const mainZone = (slide.layoutType === 'split' || slide.layoutType === 'left-sidebar') ? 'left' : 'main';
  const visualZone = (slide.layoutType === 'split' || slide.layoutType === 'left-sidebar') ? 'right' : (slide.layoutType === 'right-sidebar' ? 'sidebar' : 'main');

  if (slide.bullets && slide.bullets.length > 0) {
    blocks.push({
      id: 'legacy-bullets',
      zone: mainZone,
      type: 'list',
      content: slide.bullets
    });
  }

  if (slide.visualType && slide.visualType !== 'none') {
    blocks.push({
      id: 'legacy-visual',
      zone: visualZone,
      type: 'visual',
      content: null
    });
  } else if (slide.imageUrl) {
    blocks.push({
      id: 'legacy-image',
      zone: visualZone,
      type: 'image',
      content: slide.imageUrl
    });
  }
  return blocks;
};

// --- Initial Slide Data ---
const INITIAL_SLIDES: SlideData[] = ([
  { id: 1, section: "Introduction", title: "Comparative Life Cycle Analysis", subtitle: "Subscription Box Models vs. Supermarket Purchasing", bullets: ["Candidate: W.K.A. Priyasad (19MAM6386)", "Degree: B.Sc. Honours in EcoBusiness Management", "Dept: Tourism Management, Sabaragamuwa University", "Supervisor: Mr. R.A.D.C. Ranathunga"], layoutType: 'single', blocks: [], iconName: 'Globe', visualType: 'image' },
  { id: 2, section: "Introduction", title: "Presentation Structure", bullets: ["Chapter 1: Introduction", "Chapter 2: Literature Review", "Chapter 3: Methodology", "Chapter 4: Results & Discussion", "Chapter 5: Conclusion & Recommendations"], layoutType: 'single', blocks: [], iconName: 'Layers' },
  { id: 3, section: "Introduction", title: "Background: Global Shift", bullets: ["Food systems shifting due to digitalization & urbanization.", "Traditional Supermarket (TSM): Physical stores, high friction.", "Food Subscription Box (FSB): Direct-to-consumer, pre-portioned.", "Growth: Meal kit market booming ($1 billion+ industries)."], layoutType: 'split', blocks: [], iconName: 'TrendingDown' },
  { id: 4, section: "Introduction", title: "Background: Sri Lankan Context", bullets: ["Local Context: Rapid digital transformation in Gampaha.", "Consumer Shift: Young adults adopting online food platforms.", "Eco Awareness: Growing concern about climate impact."], layoutType: 'single', blocks: [], iconName: 'Globe' },
  { id: 5, section: "Introduction", title: "Research Problem", bullets: ["FSB Critique: High packaging waste (individually wrapped).", "TSM Hidden Costs: High food loss & inefficient transport.", "The Unknown: No comparative data for South Asia.", "Problem Statement: Lack of LCA specific to urban Sri Lanka."], layoutType: 'split', blocks: [], iconName: 'AlertTriangle' },
  { id: 6, section: "Objectives", title: "Research Questions", bullets: ["Primary: What is the comparative carbon footprint of FSB vs TSM in Gampaha?", "Secondary: What are the primary environmental 'hotspots' for each model?"], layoutType: 'single', blocks: [], iconName: 'Target' },
  { id: 7, section: "Objectives", title: "Research Objectives", bullets: ["Obj 1: Conduct comparative Life Cycle Impact Assessment (LCIA).", "Obj 2: Perform contribution analysis to identify hotspots."], layoutType: 'single', blocks: [], iconName: 'CheckCircle' },
  { id: 8, section: "Significance", title: "Significance of the Study", bullets: ["Academic: Fills geographical gap (South Asia) in LCA literature.", "Industrial: Actionable data for logistics optimization.", "Policy: Supports evidence-based policies (SDG 12 & 13)."], layoutType: 'single', blocks: [], iconName: 'BookOpen' },
  { id: 9, section: "Scope", title: "Scope & Limitations", bullets: ["Scope: Cradle-to-Grave assessment in Gampaha.", "Limitation: Secondary data for food production (Ecoinvent).", "Limitation: Focus restricted to Carbon Footprint (GWP).", "Food basket: Based on USDA/Mayo Clinic standards."], layoutType: 'split', blocks: [], iconName: 'Scale' },
  { id: 10, section: "Lit Review", title: "Theoretical Framework (LCA)", bullets: ["Global standard (ISO 14040/14044) for environmental accounting.", "Cradle-to-Grave: Extraction to Disposal.", "Prevents 'Problem Shifting' between stages."], layoutType: 'single', blocks: [], iconName: 'BookOpen' },
  { id: 11, section: "Lit Review", title: "Environmental Hotspots", bullets: ["Agricultural Production: Usually largest impact.", "Food Waste: 8-10% of global GHG emissions.", "Last-Mile Logistics: Personal trips vs delivery vans."], layoutType: 'split', blocks: [], iconName: 'Leaf', visualType: 'pieChart', visualData: GLOBAL_WASTE_IMPACT },
  { id: 12, section: "Lit Review", title: "Previous Studies & Gap", bullets: ["Western Findings: Heard et al. (USA) found FSBs better due to less waste.", "The Gap: Findings may not apply to Sri Lanka (tuk-tuks, waste infra)."], layoutType: 'split', blocks: [], iconName: 'GitMerge' },
  { id: 13, section: "Methodology", title: "Conceptual Framework", bullets: ["Input: Two Models (FSB vs. TSM).", "Process: LCA using CCaLC 2 Software.", "Output: Life Cycle Carbon Footprint (kg CO2e)."], layoutType: 'single', blocks: [], iconName: 'Activity' },
  { id: 14, section: "Methodology", title: "The Functional Unit", subtitle: "Crucial for fair comparison", bullets: ["Definition: Provision of 16,222 kcal weekly food basket (8.2 kg) for one active adult.", "Basis: Mayo Clinic calorie needs.", "Items: Rice, Dhal, Chicken, Coconut Milk."], layoutType: 'single', blocks: [], iconName: 'Scale' },
  { id: 15, section: "Methodology", title: "System Boundaries", bullets: ["Included: Farming, Packaging, Storage, Distribution, Disposal.", "Excluded: Home cooking energy (identical)."], layoutType: 'split', blocks: [], iconName: 'Box' },
  { id: 16, section: "Methodology", title: "Data Collection", bullets: ["Secondary: Ecoinvent & CCaLC databases.", "Primary (Fieldwork): Weighed checkout bags (56g).", "Primary (Fieldwork): Surveyed 200 shoppers at Cargills."], layoutType: 'single', blocks: [], iconName: 'FileText' },
  { id: 17, section: "Methodology", title: "Mass Balance Correction", bullets: ["Logic: Must buy more raw food to account for waste.", "TSM Input: 10.61 kg (22.7% waste rate).", "FSB Input: 8.87 kg (7.6% waste rate).", "Note: Difference drives 'Raw Material' impact."], layoutType: 'single', blocks: [], iconName: 'Scale' },
  { id: 18, section: "Methodology", title: "Modeling Logistics", bullets: ["FSB: Delivery Van (2.5 km per customer).", "TSM: Mixed Fleet (10 km round-trip).", "Survey: 40% Motorcycle, 35% Three-wheel, 20% Car."], layoutType: 'split', blocks: [], iconName: 'Truck', visualType: 'pieChart', visualData: LOGISTICS_MODAL_SPLIT },
  { id: 19, section: "Methodology", title: "Modeling Packaging", bullets: ["FSB: 259.1g Corrugated Box.", "TSM: 56g HDPE Checkout Bags.", "Observation: FSB uses significantly more material."], layoutType: 'split', blocks: [], iconName: 'Box', visualType: 'barChart', visualData: DATA_PACKAGING },
  { id: 20, section: "Results", title: "Overall Carbon Footprint", bullets: ["TSM Total: 16.21 kg CO2e.", "FSB Total: 13.21 kg CO2e.", "Verdict: FSB is 18.5% more efficient."], layoutType: 'split', blocks: [], iconName: 'BarChart2', visualType: 'barChart', visualData: DATA_TOTALS },
  { id: 21, section: "Results", title: "Hotspot Analysis", bullets: ["Dominant Stage: Raw Materials.", "TSM: 87.0% of total.", "FSB: 89.3% of total.", "Insight: Growing food dwarfs packaging."], layoutType: 'split', blocks: [], iconName: 'PieChart', visualType: 'pieChart', visualData: HOTSPOT_TSM },
  { id: 22, section: "Results", title: "Deep Dive: Raw Materials", bullets: ["TSM: 14.1 kg CO2e.", "FSB: 11.8 kg CO2e.", "Difference: TSM is 2.3 kg higher.", "Reason: Embodied Carbon of extra food wasted."], layoutType: 'split', blocks: [], iconName: 'Leaf', visualType: 'barChart', visualData: [{ name: 'TSM', value: 14.1, fill: '#ef4444' }, { name: 'FSB', value: 11.8, fill: '#10b981' }] },
  { id: 23, section: "Results", title: "Deep Dive: Packaging", bullets: ["TSM: 0.31 kg CO2e.", "FSB: 0.61 kg CO2e.", "Result: FSB has double the packaging footprint.", "Paradox: Packaging Penalty vs. Waste Savings."], layoutType: 'split', blocks: [], iconName: 'Box', visualType: 'barChart', visualData: [{ name: 'TSM', value: 0.31, fill: '#ef4444' }, { name: 'FSB', value: 0.61, fill: '#10b981' }] },
  { id: 24, section: "Results", title: "Deep Dive: Logistics", bullets: ["TSM Transport: 0.28 kg.", "FSB Transport: 0.14 kg.", "TSM trips are 6.8x more carbon-intensive.", "Reason: Consolidated delivery is far more efficient."], layoutType: 'split', blocks: [], iconName: 'Truck', visualType: 'barChart', visualData: [{ name: 'TSM', value: 0.28, fill: '#ef4444' }, { name: 'FSB', value: 0.14, fill: '#10b981' }] },
  { id: 25, section: "Results", title: "Deep Dive: End-of-Life", bullets: ["TSM: 1.33 kg CO2e.", "FSB: 0.66 kg CO2e.", "Reason: TSM sends more organic waste to landfill."], layoutType: 'split', blocks: [], iconName: 'Trash2', visualType: 'barChart', visualData: [{ name: 'TSM', value: 1.33, fill: '#ef4444' }, { name: 'FSB', value: 0.66, fill: '#10b981' }] },
  { id: 26, section: "Results", title: "The 'Trade-Off' Summary", bullets: ["FSB Packaging Penalty: +0.303 kg.", "FSB Food Waste Savings: -2.30 kg.", "FSB Logistics Savings: -0.135 kg.", "Conclusion: Waste savings > Packaging cost."], layoutType: 'split', blocks: [], iconName: 'Scale', visualType: 'tradeoffChart', visualData: DATA_TRADEOFF },
  { id: 27, section: "Conclusion", title: "Conclusion", bullets: ["FSB is the sustainable option for Gampaha.", "Preventing food waste is a powerful climate lever.", "TSM bulk buying promotes waste."], layoutType: 'single', blocks: [], iconName: 'CheckCircle' },
  { id: 28, section: "Recommendations", title: "For Policymakers", bullets: ["Shift Focus: From 'Anti-Packaging' to 'Waste Reduction'.", "Smart Policies: Incentivize shelf-life packaging.", "Logistics: Support EVs for fleets."], layoutType: 'single', blocks: [], iconName: 'FileText' },
  { id: 29, section: "Recommendations", title: "Industry & Consumers", bullets: ["Supermarkets: Add 'Meal Kit' sections.", "FSB: Invest in bio-packaging.", "Consumers: Meal planning is key."], layoutType: 'split', blocks: [], iconName: 'ShoppingCart' },
  { id: 30, section: "Closing", title: "Future Research & Q&A", bullets: ["Use primary data for food production.", "Expand to Multi-Criteria LCA.", "Conduct Life Cycle Costing.", "Thank You / Q&A"], layoutType: 'single', blocks: [], iconName: 'Globe' },
] as any[]).map(slide => ({ ...slide, blocks: normalizeBlocks(slide), showDefaultVisual: true, enable3DImages: false })) as SlideData[];

// --- Helper Components ---
const GlassCard = ({ children, className = "", hover = false, onClick }: { children: React.ReactNode, className?: string, hover?: boolean, onClick?: () => void }) => (
  <motion.div
    onClick={onClick}
    className={`backdrop-blur-md rounded-xl p-6 shadow-sm ${hover ? 'hover:border-emerald-500/30 cursor-pointer transition-all duration-300' : ''} ${className}`}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

const NavItem = ({ active, icon: Icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
  >
    <Icon size={20} className={active ? 'text-emerald-400' : 'text-slate-500 group-hover:text-white'} />
    <span className="font-medium text-sm">{label}</span>
    {active && <motion.div layoutId="activeIndicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />}
  </button>
);

const CountUp = ({ end, duration = 2, suffix = "" }: { end: number, duration?: number, suffix?: string }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = end / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start > end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return <>{count.toFixed(1)}{suffix}</>;
};

// --- Modals ---
const RawEditorModal = ({ slide, onClose, onSave, theme }: any) => {
  const [content, setContent] = useState(JSON.stringify(slide, null, 2));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={`${theme.card} w-full max-w-2xl h-[80vh] flex flex-col rounded-xl overflow-hidden shadow-2xl`}>
        <div className={`p-4 border-b ${theme.header} flex justify-between items-center`}>
          <h3 className={`text-lg font-bold ${theme.text}`}>Raw Slide Code (JSON)</h3>
          <button onClick={onClose}><X size={20} className={theme.textMuted} /></button>
        </div>
        <div className="flex-1 p-0 relative">
          <textarea
            className="w-full h-full p-4 bg-slate-900 text-emerald-400 font-mono text-xs focus:outline-none resize-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <div className={`p-4 border-t ${theme.header} flex justify-end space-x-3`}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600">Cancel</button>
          <button
            onClick={() => {
              try {
                const parsed = JSON.parse(content);
                onSave(parsed);
                onClose();
              } catch (e) {
                alert("Invalid JSON format");
              }
            }}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// Slide Editor (Advanced)
const SlideEditorModal = ({ slide, onClose, onSave, theme, onBulkApply }: any) => {
  const [formData, setFormData] = useState<SlideData>({ ...slide });
  const [activeTab, setActiveTab] = useState<'content' | 'layout' | 'style'>('content');

  const handleLayoutChange = (type: SlideLayoutType) => setFormData(prev => ({ ...prev, layoutType: type }));

  const addBlock = (type: ContentBlock['type'], zoneId: string) => {
    setFormData(prev => {
      let updates: any = {};
      if (type === 'visual' && (!prev.visualType || prev.visualType === 'none')) {
        updates.visualType = 'barChart';
      }

      const newBlock: ContentBlock = {
        id: Date.now().toString(),
        zone: zoneId,
        type,
        content: type === 'list' ? ['New Item'] : type === 'image' ? null : type === 'heading' ? 'New Heading' : 'New Text Block'
      };

      return {
        ...prev,
        ...updates,
        blocks: [...prev.blocks, newBlock]
      };
    });
  };

  const updateBlock = (id: string, updates: Partial<ContentBlock>) => setFormData(prev => ({ ...prev, blocks: prev.blocks.map(b => b.id === id ? { ...b, ...updates } : b) }));
  const removeBlock = (id: string) => setFormData(prev => ({ ...prev, blocks: prev.blocks.filter(b => b.id !== id) }));
  const moveBlock = (id: string, direction: -1 | 1) => {
    const index = formData.blocks.findIndex(b => b.id === id);
    if (index === -1) return;
    const newBlocks = [...formData.blocks];
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < newBlocks.length) {
      [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
      setFormData({ ...formData, blocks: newBlocks });
    }
  };
  const changeBlockZone = (id: string, newZone: string) => updateBlock(id, { zone: newZone });
  const handleImageBlockUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => updateBlock(id, { content: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleResetSlide = () => {
    if (window.confirm("Reset all styles and layout for this slide? Content will remain.")) {
      setFormData({ ...formData, layoutType: 'single', customStyle: {} });
    }
  }

  const currentZones = LAYOUT_ZONES[formData.layoutType] || LAYOUT_ZONES['single'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`${theme.card} w-full max-w-5xl max-h-[95vh] flex flex-col rounded-2xl shadow-2xl border-2 border-emerald-500/30 overflow-hidden`}>
        <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-900 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white flex items-center gap-2"><Edit3 size={18} className="text-emerald-400" /> Slide Editor</h3>
          <div className="flex items-center gap-2">
            <button onClick={handleResetSlide} className="px-3 py-1 bg-red-900/30 hover:bg-red-900/50 text-red-300 text-xs rounded border border-red-900/50 flex items-center gap-1"><RotateCcw size={12} /> Reset Styles</button>
            <button onClick={onClose}><X size={24} className="text-white hover:text-red-400 transition-colors" /></button>
          </div>
        </div>
        <div className="flex border-b border-slate-700/50 bg-slate-800">
          <button onClick={() => setActiveTab('layout')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'layout' ? 'border-emerald-500 text-emerald-400 bg-slate-700/50' : 'border-transparent text-slate-400 hover:text-white'}`}>Layout & Grid</button>
          <button onClick={() => setActiveTab('content')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'content' ? 'border-emerald-500 text-emerald-400 bg-slate-700/50' : 'border-transparent text-slate-400 hover:text-white'}`}>Content Zones</button>
          <button onClick={() => setActiveTab('style')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'style' ? 'border-emerald-500 text-emerald-400 bg-slate-700/50' : 'border-transparent text-slate-400 hover:text-white'}`}>Styles & Fonts</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900/95 space-y-6">
          {/* ... (Layout Tab) ... */}
          {activeTab === 'layout' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { id: 'single', icon: Square, label: 'Single Column' },
                  { id: 'split', icon: Columns, label: 'Two Columns' },
                  { id: 'top-bottom', icon: SplitSquareVertical, label: 'Top / Bottom' },
                  { id: 'tri', icon: LayoutTemplate, label: 'Three Columns' },
                  { id: 'quad', icon: Grid, label: '2x2 Grid' },
                  { id: 'six-grid', icon: Grid, label: '2x3 Grid' },
                  { id: 'header-split', icon: PanelTop, label: 'Header + Split' },
                  { id: 'left-sidebar', icon: Sidebar, label: 'Left Sidebar' },
                  { id: 'right-sidebar', icon: Sidebar, label: 'Right Sidebar' }
                ].map((layout) => (
                  <button key={layout.id} onClick={() => handleLayoutChange(layout.id as SlideLayoutType)} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${formData.layoutType === layout.id ? 'border-emerald-500 bg-emerald-500/10 text-white' : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-emerald-500/50'}`}>
                    <layout.icon size={32} />
                    <span className="text-sm font-bold">{layout.label}</span>
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-white flex items-center gap-2"><Grid size={16} /> Grid Column Control (Advanced)</label>
                <input type="number" min="1" max="6" value={formData.customStyle?.columnCount || 1} onChange={(e) => setFormData({ ...formData, customStyle: { ...formData.customStyle, columnCount: parseInt(e.target.value) } })} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none" />
              </div>
            </div>
          )}
          {/* ... (Content Tab) ... */}
          {activeTab === 'content' && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <div className="space-y-1"><label className="text-xs font-bold text-emerald-400 uppercase">Slide Title</label><input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500" /></div>
                <div className="space-y-1"><label className="text-xs font-bold text-blue-400 uppercase">Subtitle</label><input value={formData.subtitle || ''} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500" placeholder="Optional" /></div>
              </div>
              <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase flex items-center gap-2"><Minus size={12} /> Footer Text Override</label>
                  <input
                    value={formData.footerText || ''}
                    onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Leave empty to use global footer..."
                  />
                </div>
              </div>
              <div className="space-y-8">
                {currentZones.map(zone => (
                  <div key={zone.id} className="border border-slate-700 rounded-xl overflow-hidden">
                    <div className="bg-slate-800 p-3 flex justify-between items-center border-b border-slate-700">
                      <span className="font-bold text-emerald-400 uppercase text-xs tracking-wider">{zone.label}</span>
                      <div className="flex items-center gap-3">
                        {/* Zone Vertical Align Controls */}
                        <div className="flex bg-slate-700 rounded p-0.5" title="Vertical Alignment (Layout)">
                          <button onClick={() => setFormData({ ...formData, customStyle: { ...formData.customStyle, verticalAlign: 'start' } })} className={`p-1 rounded ${(!formData.customStyle?.verticalAlign || formData.customStyle?.verticalAlign === 'start') ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}><ArrowUpToLine size={14} /></button>
                          <button onClick={() => setFormData({ ...formData, customStyle: { ...formData.customStyle, verticalAlign: 'center' } })} className={`p-1 rounded ${formData.customStyle?.verticalAlign === 'center' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}><Equal size={14} /></button>
                          <button onClick={() => setFormData({ ...formData, customStyle: { ...formData.customStyle, verticalAlign: 'end' } })} className={`p-1 rounded ${formData.customStyle?.verticalAlign === 'end' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}><ArrowDownToLine size={14} /></button>
                        </div>
                        <div className="h-4 w-px bg-slate-600 mx-1" />
                        <div className="flex gap-2">
                          <button onClick={() => addBlock('heading', zone.id)} className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white flex gap-1 items-center"><HeadingIcon size={12} /> Heading</button>
                          <button onClick={() => addBlock('paragraph', zone.id)} className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white flex gap-1 items-center"><Type size={12} /> Text</button>
                          <button onClick={() => addBlock('list', zone.id)} className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white flex gap-1 items-center"><List size={12} /> List</button>
                          <button onClick={() => addBlock('image', zone.id)} className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white flex gap-1 items-center"><ImageIcon size={12} /> Image</button>
                          <button onClick={() => addBlock('visual', zone.id)} className={`p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white flex gap-1 items-center ${formData.visualType === 'none' ? 'opacity-50 cursor-not-allowed' : ''}`} title="Insert Default Slide Chart"><BarChart2 size={12} /> Chart</button>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-4 bg-slate-900/50 min-h-[100px]">
                      {formData.blocks.filter(b => b.zone === zone.id).map((block) => (
                        <div key={block.id} className="bg-slate-800 border border-slate-700 rounded-lg p-3 relative group hover:border-emerald-500/50 transition-colors">
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-slate-900/80 rounded-lg p-1">
                            {/* Block Horizontal Align Controls */}
                            {(block.type === 'paragraph' || block.type === 'heading') && (
                              <div className="flex mr-2 bg-slate-700 rounded p-0.5">
                                <button onClick={() => updateBlock(block.id, { style: { ...block.style, align: 'left' } })} className={`p-1 rounded ${(!block.style?.align || block.style.align === 'left') ? 'bg-slate-500 text-white' : 'text-slate-400 hover:text-white'}`}><AlignLeft size={12} /></button>
                                <button onClick={() => updateBlock(block.id, { style: { ...block.style, align: 'center' } })} className={`p-1 rounded ${block.style?.align === 'center' ? 'bg-slate-500 text-white' : 'text-slate-400 hover:text-white'}`}><AlignCenter size={12} /></button>
                                <button onClick={() => updateBlock(block.id, { style: { ...block.style, align: 'right' } })} className={`p-1 rounded ${block.style?.align === 'right' ? 'bg-slate-500 text-white' : 'text-slate-400 hover:text-white'}`}><AlignRight size={12} /></button>
                              </div>
                            )}
                            <select className="bg-slate-700 text-xs text-white rounded px-1" value={block.zone} onChange={(e) => changeBlockZone(block.id, e.target.value)}>{currentZones.map(z => <option key={z.id} value={z.id}>{z.label}</option>)}</select>
                            <button onClick={() => moveBlock(block.id, -1)} className="p-1 hover:text-emerald-400"><MoveUp size={12} /></button>
                            <button onClick={() => moveBlock(block.id, 1)} className="p-1 hover:text-emerald-400"><MoveDown size={12} /></button>
                            <button onClick={() => removeBlock(block.id)} className="p-1 hover:text-red-400"><Trash size={12} /></button>
                          </div>
                          {block.type === 'visual' && <div className="h-20 flex items-center justify-center bg-slate-900/50 rounded border border-dashed border-slate-600 text-xs text-slate-400"><BarChart2 size={16} className="mr-2" /> [Chart: {formData.visualType !== 'none' ? formData.visualType : 'Default (Bar)'}]</div>}
                          {block.type === 'heading' && <input value={block.content} onChange={(e) => updateBlock(block.id, { content: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-lg font-bold text-blue-300 focus:outline-none" style={{ textAlign: block.style?.align || 'left' }} placeholder="Heading Text..." />}
                          {block.type === 'paragraph' && <textarea value={block.content} onChange={(e) => updateBlock(block.id, { content: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 h-20 focus:outline-none resize-y" style={{ textAlign: block.style?.align || 'left' }} placeholder="Paragraph text..." />}
                          {block.type === 'list' && (
                            <div className="space-y-2">
                              {(block.content as string[]).map((item, i) => (<div key={i} className="flex gap-2 items-center"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div><input value={item} onChange={(e) => { const newList = [...block.content]; newList[i] = e.target.value; updateBlock(block.id, { content: newList }); }} className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none" /><button onClick={() => { const newList = block.content.filter((_: any, idx: number) => idx !== i); updateBlock(block.id, { content: newList }); }}><X size={12} className="text-slate-500 hover:text-red-400" /></button></div>))}
                              <button onClick={() => updateBlock(block.id, { content: [...block.content, "New Item"] })} className="text-xs text-emerald-400 flex items-center gap-1 font-bold hover:text-emerald-300"><Plus size={12} /> Add Item</button>
                            </div>
                          )}
                          {block.type === 'image' && (
                            <div className="relative">
                              {block.content ? <div className="relative h-32 bg-black rounded flex justify-center"><img src={block.content} className="h-full object-contain" /><button onClick={() => updateBlock(block.id, { content: null })} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><X size={12} /></button></div> : <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-600 rounded cursor-pointer hover:border-emerald-500 hover:bg-slate-800"><Upload size={20} className="text-slate-400 mb-1" /><span className="text-xs text-slate-500">Upload Image</span><input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageBlockUpload(block.id, e)} /></label>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {/* ... (Style Tab) ... */}
          {activeTab === 'style' && (
            <div className="space-y-8">
              {/* Background */}
              <div className="space-y-4 border-b border-slate-700 pb-6">
                <label className="text-sm font-bold text-white flex items-center gap-2"><Palette size={16} /> Background Style</label>
                <div className="grid grid-cols-2 gap-3">
                  {BG_PALETTE.map((bg) => (
                    <button key={bg.name} onClick={() => setFormData({ ...formData, backgroundStyle: bg.value })} className="h-12 rounded-lg border border-slate-600 hover:border-white transition-all relative overflow-hidden" style={{ background: bg.value }}>
                      <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${bg.name === 'Clean White' ? 'text-black' : 'text-white'} bg-black/10 opacity-0 hover:opacity-100 transition-opacity`}>{bg.name}</span>
                    </button>
                  ))}
                  <button onClick={() => setFormData({ ...formData, backgroundStyle: undefined })} className="h-12 rounded-lg border border-slate-600 bg-transparent text-slate-400 hover:text-white text-xs">Default Theme</button>
                </div>
              </div>

              {/* Font Family */}
              <div className="space-y-4 border-b border-slate-700 pb-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-white">Slide Font Family</label>
                  <div className="flex gap-2">
                    <select value={formData.customStyle?.fontFamily || FONT_OPTIONS[0].value} onChange={(e) => setFormData({ ...formData, customStyle: { ...formData.customStyle, fontFamily: e.target.value } })} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none">
                      {FONT_OPTIONS.map((font, idx) => <option key={idx} value={font.value}>{font.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Title Styling */}
              <div className="space-y-4 border-b border-slate-700 pb-6">
                <label className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Title Styling</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Title Color</label>
                    <input type="color" value={formData.customStyle?.titleColor || (formData.backgroundStyle === '#ffffff' ? '#111827' : '#ffffff')} onChange={(e) => setFormData({ ...formData, customStyle: { ...formData.customStyle, titleColor: e.target.value } })} className="w-full bg-slate-800 h-10 p-1 rounded border border-slate-600" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Title Size</label>
                    <input type="range" min="0.5" max="2.0" step="0.1" value={formData.customStyle?.titleSizeScale || 1.0} onChange={(e) => setFormData({ ...formData, customStyle: { ...formData.customStyle, titleSizeScale: parseFloat(e.target.value) } })} className="w-full h-2 bg-slate-700 rounded appearance-none accent-emerald-500 mt-2" />
                  </div>
                </div>
              </div>

              {/* Subtitle Styling */}
              <div className="space-y-4 border-b border-slate-700 pb-6">
                <label className="text-sm font-bold text-blue-400 uppercase tracking-wider">Subtitle Styling</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Subtitle Color</label>
                    <input type="color" value={formData.customStyle?.subtitleColor || '#94a3b8'} onChange={(e) => setFormData({ ...formData, customStyle: { ...formData.customStyle, subtitleColor: e.target.value } })} className="w-full bg-slate-800 h-10 p-1 rounded border border-slate-600" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Subtitle Size</label>
                    <input type="range" min="0.5" max="2.0" step="0.1" value={formData.customStyle?.subtitleSizeScale || 1.0} onChange={(e) => setFormData({ ...formData, customStyle: { ...formData.customStyle, subtitleSizeScale: parseFloat(e.target.value) } })} className="w-full h-2 bg-slate-700 rounded appearance-none accent-blue-500 mt-2" />
                  </div>
                </div>
              </div>

              {/* Heading Styling */}
              <div className="space-y-4 border-b border-slate-700 pb-6">
                <label className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Sub-Heading Styling</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Heading Color</label>
                    <input type="color" value={formData.customStyle?.headingColor || '#60a5fa'} onChange={(e) => setFormData({ ...formData, customStyle: { ...formData.customStyle, headingColor: e.target.value } })} className="w-full bg-slate-800 h-10 p-1 rounded border border-slate-600" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Heading Size</label>
                    <input type="range" min="0.8" max="2.5" step="0.1" value={formData.customStyle?.headingSizeScale || 1.0} onChange={(e) => setFormData({ ...formData, customStyle: { ...formData.customStyle, headingSizeScale: parseFloat(e.target.value) } })} className="w-full h-2 bg-slate-700 rounded appearance-none accent-cyan-500 mt-2" />
                  </div>
                </div>
              </div>

              {/* General Text */}
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-200 uppercase tracking-wider">General Content</label>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400">Content Text Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={formData.customStyle?.textColor || '#e2e8f0'} onChange={(e) => setFormData({ ...formData, customStyle: { ...formData.customStyle, textColor: e.target.value } })} className="w-full bg-slate-800 border border-slate-600 rounded-lg h-10 p-1" />
                    <button onClick={() => onBulkApply('color', formData.customStyle?.textColor || '')} className="text-xs px-2 bg-slate-700 hover:bg-emerald-600 rounded text-white" title="Apply to All">All</button>
                  </div>
                </div>

                {/* Text Alignment & Vertical Alignment Controls */}
                <div className="flex gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400">Text Align (Default)</label>
                    <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700 w-max">
                      {['left', 'center', 'right'].map((align) => (<button key={align} onClick={() => setFormData({ ...formData, customStyle: { ...formData.customStyle, textAlign: align as any } })} className={`p-2 rounded ${formData.customStyle?.textAlign === align ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`} title={align}>{align === 'left' && <AlignLeft size={18} />}{align === 'center' && <AlignCenter size={18} />}{align === 'right' && <AlignRight size={18} />}</button>))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-slate-700/50 bg-slate-900 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-all font-medium">Cancel</button>
          <button onClick={() => { onSave(formData); onClose(); }} className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 font-bold transition-all flex items-center gap-2"><Save size={18} /> Save Changes</button>
        </div>
      </div>
    </div>
  );
};

// Reorder Modal
const ReorderSlidesModal = ({ slides, onClose, onSave, theme }: any) => {
  const [orderedSlides, setOrderedSlides] = useState(slides);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={`${theme.card} w-full max-w-md h-[70vh] flex flex-col rounded-xl overflow-hidden shadow-2xl`}>
        <div className={`p-4 border-b ${theme.header} flex justify-between items-center`}>
          <h3 className={`text-lg font-bold ${theme.text}`}>Reorder Slides</h3>
          <button onClick={onClose}><X size={20} className={theme.textMuted} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-slate-900/50">
          <Reorder.Group axis="y" values={orderedSlides} onReorder={setOrderedSlides} className="space-y-2">
            {orderedSlides.map((slide: SlideData) => (
              <Reorder.Item key={slide.id} value={slide} className="p-3 bg-slate-800 rounded border border-slate-700 flex items-center gap-3 cursor-grab active:cursor-grabbing">
                <GripVertical className="text-slate-500" size={16} />
                <div className="text-sm text-white truncate flex-1">{slide.title}</div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
        <div className={`p-4 border-t ${theme.header} flex justify-end space-x-3`}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600">Cancel</button>
          <button onClick={() => { onSave(orderedSlides); onClose(); }} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500">Save Order</button>
        </div>
      </div>
    </div>
  );
};


// --- Main Application ---
export default function App() {
  const [activeView, setActiveView] = useState<ViewMode>('dashboard');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedModel, setSelectedModel] = useState<'TSM' | 'FSB' | null>('TSM');
  const [lifecycleStep, setLifecycleStep] = useState<string | null>(null);
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);
  const toolbarTimeoutRef = useRef<any>(null); // Fixed type here
  const [isHideMode, setIsHideMode] = useState(false);

  // --- Editable State ---
  const [userInfo, setUserInfo] = useState({
    name: "W.K.A. Priyasad",
    regNum: "19MAM6386",
    degree: "B.Sc. EcoBusiness",
    photo: null as string | null
  });
  const [appSettings, setAppSettings] = useState({
    dashboardName: "EcoThesis Dashboard",
    footerText: ""
  });
  const [slides, setSlides] = useState<SlideData[]>(INITIAL_SLIDES);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // --- Persistence (Auto Save) ---
  useEffect(() => {
    const savedSlides = localStorage.getItem('presentationSlides');
    if (savedSlides) {
      try {
        setSlides(JSON.parse(savedSlides));
      } catch (e) { console.error("Failed to load saved slides"); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('presentationSlides', JSON.stringify(slides));
  }, [slides]);


  // --- Editor State ---
  const [editingSlide, setEditingSlide] = useState<SlideData | null>(null);
  const [rawEditingSlide, setRawEditingSlide] = useState<SlideData | null>(null);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // --- Presentation Tools State ---
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toolMode, setToolMode] = useState<'cursor' | 'laser' | 'pen'>('cursor');
  const [drawings, setDrawings] = useState<{ x: number, y: number, new: boolean }[][]>([]);
  const [currentDrawing, setCurrentDrawing] = useState<{ x: number, y: number, new: boolean }[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });


  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target?.result as string);
          if (Array.isArray(importedData) && importedData[0].id) {
            setSlides(importedData);
            setPdfUrl(null);
            setCurrentSlide(0);
            alert("Slides imported successfully!");
          }
        } catch (error) {
          alert("Invalid JSON file.");
        }
      };
      reader.readAsText(file);
    } else if (file.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      alert("PDF loaded! Switching to document view.");
    } else {
      alert("Please upload a .json (Slides) or .pdf (Document) file.");
    }
  };

  // --- NEW FEATURE: Reset Function ---
  const handleResetToDefault = () => {
    if (window.confirm("Are you sure you want to delete the imported/modified slides and return to the default presentation? This cannot be undone.")) {
      setSlides(INITIAL_SLIDES);
      setCurrentSlide(0);
      setPdfUrl(null);
      localStorage.removeItem('presentationSlides');
      alert("Restored to default presentation.");
    }
  };

  // --- Scaling State for Slides ---
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (slideContainerRef.current) {
        const { clientWidth, clientHeight } = slideContainerRef.current;
        const targetWidth = 1600;
        const targetHeight = 900;
        const scaleX = clientWidth / targetWidth;
        const scaleY = clientHeight / targetHeight;
        setScale(Math.min(scaleX, scaleY) * 0.95);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    setTimeout(handleResize, 100);

    return () => window.removeEventListener('resize', handleResize);
  }, [activeView, isFullscreen, currentSlide]);


  // --- Slide Management ---
  const addNewSlide = () => {
    const newId = Math.max(...slides.map(s => s.id)) + 1;
    const newSlide: SlideData = {
      id: newId,
      section: "New Section",
      title: "New Slide Title",
      bullets: [],
      blocks: [],
      layoutType: 'single',
      iconName: 'Globe',
      visualType: 'none'
    };
    const newSlides = [...slides];
    newSlides.splice(currentSlide + 1, 0, newSlide);
    setSlides(newSlides);
    setCurrentSlide(currentSlide + 1);
  };
  const deleteSlide = (id?: number) => {
    const targetId = id !== undefined ? id : slides[currentSlide].id;
    if (slides.length <= 1) return;
    const newSlides = slides.filter(s => s.id !== targetId);
    setSlides(newSlides);
    if (currentSlide >= newSlides.length) setCurrentSlide(newSlides.length - 1);
  };
  const updateSlide = (updatedSlide: SlideData) => {
    const newSlides = slides.map(s => s.id === updatedSlide.id ? updatedSlide : s);
    setSlides(newSlides);
  };
  const handleDownloadPDF = () => {
    window.print();
  };

  const applyBulkStyle = (styleType: 'font' | 'bg' | 'color', value: string) => {
    const newSlides = slides.map(s => ({
      ...s,
      customStyle: {
        ...s.customStyle,
        fontFamily: styleType === 'font' ? value : s.customStyle?.fontFamily,
        textColor: styleType === 'color' ? value : s.customStyle?.textColor
      },
      backgroundStyle: styleType === 'bg' ? value : s.backgroundStyle
    }));
    setSlides(newSlides);
  };

  // --- Theme Configuration ---
  const theme = useMemo(() => ({
    bg: isDarkMode ? 'bg-[#0f172a]' : 'bg-gray-100',
    text: isDarkMode ? 'text-slate-200' : 'text-slate-800',
    textMuted: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    card: isDarkMode
      ? 'bg-[#1e293b]/60 border-slate-700/50'
      : 'bg-white/80 border-gray-200',
    sidebar: isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200',
    header: isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white/50 border-gray-200',
    input: isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-300 text-slate-900',
    slideBg: isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200',
    tooltip: isDarkMode ? { backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' } : { backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }
  }), [isDarkMode]);

  // --- Handlers ---
  const nextSlide = () => setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));
  const prevSlide = () => setCurrentSlide(prev => Math.max(prev - 1, 0));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeView === 'slides') {
        if (e.key === 'ArrowRight') nextSlide();
        if (e.key === 'ArrowLeft') prevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeView, slides.length]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
    if (toolMode === 'pen' && e.buttons === 1) setCurrentDrawing(prev => [...prev, { x, y, new: false }]);

    if (!isHideMode) {
      if (e.clientY < 100) {
        setIsToolbarVisible(true);
        if (toolbarTimeoutRef.current) clearTimeout(toolbarTimeoutRef.current);
      } else if (isToolbarVisible && !toolbarTimeoutRef.current) {
        toolbarTimeoutRef.current = setTimeout(() => setIsToolbarVisible(false), 3000);
      }
    }
  };
  const handleMouseUp = () => {
    if (currentDrawing.length > 0) { setDrawings(prev => [...prev, currentDrawing]); setCurrentDrawing([]); }
  };
  useEffect(() => {
    if (toolMode === 'pen' && isFullscreen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
        [...drawings, currentDrawing].forEach(stroke => {
          ctx.beginPath();
          stroke.forEach((point, i) => { if (i === 0) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y); });
          ctx.stroke();
        });
      }
    }
  }, [drawings, currentDrawing, toolMode, isFullscreen]);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      if (containerRef.current?.requestFullscreen) containerRef.current.requestFullscreen().catch(() => { });
    } else {
      setIsFullscreen(false);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUserInfo(prev => ({ ...prev, photo: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  // --- Renderers ---
  const renderDashboard = () => (<div className="grid grid-cols-12 gap-6 p-2 overflow-y-auto h-full pb-20 animate-in fade-in">
    <div className="col-span-12 bg-gradient-to-r from-emerald-900/60 to-slate-900 rounded-3xl border border-emerald-500/30 relative overflow-hidden group min-h-[350px] shadow-2xl transition-all duration-500 hover:shadow-emerald-900/20">
      <div className="relative z-10 flex flex-col justify-center h-full p-10 md:p-16 pr-32">
        <div className="inline-flex items-center space-x-2 mb-6">
          <div className="h-1 w-12 bg-emerald-400 rounded-full"></div>
          <span className="text-emerald-400 font-bold uppercase tracking-widest text-sm">Key Findings</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">Executive Summary</h2>
        <p className="text-slate-200 text-xl md:text-2xl leading-relaxed max-w-5xl font-light">
          The study concludes that the <span className="text-emerald-400 font-semibold">Food Subscription Box (FSB)</span> model is more sustainable than the <span className="text-red-400 font-semibold">Traditional Supermarket Model (TSM)</span> for urban Gampaha, primarily due to waste reduction.
        </p>
      </div>
      <Leaf className="absolute -right-10 -bottom-10 text-emerald-500/10 w-96 h-96 rotate-12 transition-transform duration-1000 group-hover:rotate-45 group-hover:scale-110" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
    </div>
    {/* ... Dashboard KPI & Charts ... */}
    <div className="col-span-12 md:col-span-4"><GlassCard className={`flex flex-col justify-between h-full border ${theme.card}`}><div className="flex justify-between items-start mb-4"><div className={`${theme.textMuted} text-sm font-medium`}>Carbon Efficiency</div><div className="p-2 rounded-lg bg-emerald-500/10"><TrendingDown size={16} className="text-emerald-400" /></div></div><div><div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} mb-1`}>+<CountUp end={18.5} />%</div><div className="text-xs text-emerald-500 font-bold">FSB vs TSM Improvement</div></div></GlassCard></div><div className="col-span-12 md:col-span-4"><GlassCard className={`flex flex-col justify-between h-full border bg-blue-500/5 border-blue-500/20 ${!isDarkMode && 'bg-blue-50 border-blue-200'}`}><div className="flex justify-between items-start mb-4"><div className="text-blue-400 text-sm font-medium">Waste Reduction</div><div className="p-2 rounded-lg bg-blue-500/10"><Trash2 size={16} className="text-blue-400" /></div></div><div><div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} mb-1`}>-<CountUp end={2.3} /> kg</div><div className={`${theme.textMuted} text-xs`}>CO2e Saved via Food Waste</div></div></GlassCard></div><div className="col-span-12 md:col-span-4"><GlassCard className={`flex flex-col justify-between h-full border bg-red-500/5 border-red-500/20 ${!isDarkMode && 'bg-red-50 border-red-200'}`}><div className="flex justify-between items-start mb-4"><div className="text-red-400 text-sm font-medium">Packaging Penalty</div><div className="p-2 rounded-lg bg-red-500/10"><AlertTriangle size={16} className="text-red-400" /></div></div><div><div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} mb-1`}>+<CountUp end={0.30} /> kg</div><div className={`${theme.textMuted} text-xs`}>FSB Higher Packaging Cost</div></div></GlassCard></div><div className="col-span-12 md:col-span-8 h-80"><GlassCard className={`h-full flex flex-col border ${theme.card}`}><div className="flex justify-between items-center mb-6"><h3 className={`font-bold ${theme.text}`}>Comparative Impact Analysis</h3><div className="flex space-x-4 text-xs"><div className="flex items-center"><span className="w-3 h-3 bg-red-500 rounded-full mr-2" /> TSM</div><div className="flex items-center"><span className="w-3 h-3 bg-emerald-500 rounded-full mr-2" /> FSB</div></div></div><div className="flex-1 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={DATA_COMPARISON} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#e2e8f0"} opacity={0.5} vertical={false} /><XAxis dataKey="name" stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={12} tickLine={false} axisLine={false} /><YAxis stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={12} tickLine={false} axisLine={false} /><Tooltip contentStyle={theme.tooltip} itemStyle={{ color: isDarkMode ? '#fff' : '#000' }} /><Bar dataKey="TSM" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} /><Bar dataKey="FSB" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} /></BarChart></ResponsiveContainer></div></GlassCard></div><div className="col-span-12 md:col-span-4 h-80"><GlassCard className={`h-full flex flex-col border ${theme.card}`}><h3 className={`font-bold ${theme.text} mb-4`}>TSM Hotspots</h3><div className="flex-1 relative"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={HOTSPOT_TSM} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">{HOTSPOT_TSM.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip contentStyle={theme.tooltip} /></PieChart></ResponsiveContainer><div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className={`text-2xl font-bold ${theme.text}`}>87%</span><span className={`text-xs ${theme.textMuted}`}>Raw Materials</span></div></div></GlassCard></div>
  </div>);

  const renderVisualContent = (slide: SlideData) => {
    // 2. Charts (Only if enabled)
    if (slide.showDefaultVisual !== false) {
      // Use real data OR default data to ensure chart is visible
      const chartData = (slide.visualData && slide.visualData.length > 0) ? slide.visualData : DEFAULT_CHART_DATA;

      // Robust Fallback: If visualType is missing/none but we are rendering this (meaning block exists), default to barChart
      const visualType = (!slide.visualType || slide.visualType === 'none') ? 'barChart' : slide.visualType;

      if (visualType === 'barChart') {
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke={isDarkMode ? "#334155" : "#e2e8f0"} opacity={0.3} />
              <XAxis type="number" stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={14} />
              <YAxis dataKey="name" type="category" stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={14} width={150} />
              <Tooltip cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} contentStyle={theme.tooltip} />
              {/* Dynamically render bars based on data keys */}
              {Object.keys(chartData[0] || {}).filter(k => k !== 'name' && k !== 'fill' && k !== 'label').map((key, index) => (
                <Bar key={key} dataKey={key} fill={CHART_COLORS[index % CHART_COLORS.length]} radius={[0, 4, 4, 0]}>
                  <LabelList dataKey={key} position="right" style={{ fill: isDarkMode ? 'white' : 'black', fontSize: 14, fontWeight: 'bold' }} />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      }

      if (visualType === 'pieChart') {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
            {/* Explicit Check for Slide 21 Comparison */}
            {slide.title.includes("Hotspot Analysis") || slide.id === 21 ? (
              <>
                <div className="relative flex flex-col h-full">
                  <h4 className="text-center text-red-400 font-bold mb-4 text-xl">TSM Model (16.21)</h4>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={HOTSPOT_TSM} innerRadius="40%" outerRadius="70%" paddingAngle={2} dataKey="value" label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {HOTSPOT_TSM.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={theme.tooltip} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="relative flex flex-col h-full">
                  <h4 className="text-center text-emerald-400 font-bold mb-4 text-xl">FSB Model (13.21)</h4>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={HOTSPOT_FSB} innerRadius="40%" outerRadius="70%" paddingAngle={2} dataKey="value" label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {HOTSPOT_FSB.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={theme.tooltip} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              // Default Single Pie Chart Layout (Logistics, Global waste etc)
              <div className="relative col-span-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, bottom: 20, left: 0, right: 0 }}>
                    <Pie data={chartData} innerRadius="40%" outerRadius="70%" paddingAngle={2} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                      {chartData?.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={theme.tooltip} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '14px' }} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Overlay Text for specific slides */}
                {slide.title.includes("Global") && <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className={`text-5xl font-bold ${theme.text}`}>10%</span><span className={`text-lg ${theme.textMuted}`}>Global Emissions</span></div>}
              </div>
            )}
          </div>
        )
      }

      if (visualType === 'tradeoffChart') {
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={DATA_TRADEOFF} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke={isDarkMode ? "#334155" : "#e2e8f0"} opacity={0.3} />
              <XAxis type="number" stroke={isDarkMode ? "#94a3b8" : "#64748b"} />
              <YAxis dataKey="name" type="category" stroke={isDarkMode ? "#94a3b8" : "#64748b"} width={180} fontSize={14} />
              <Tooltip cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} contentStyle={theme.tooltip} />
              <ReferenceLine x={0} stroke={isDarkMode ? "#64748b" : "#94a3b8"} />
              <Bar dataKey="value" name="Change (kg CO2e)">
                {DATA_TRADEOFF.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#ef4444' : '#10b981'} />
                ))}
                <LabelList dataKey="value" position="right" style={{ fill: isDarkMode ? 'white' : 'black', fontSize: 14, fontWeight: 'bold' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )
      }
      if ((visualType as string) !== 'none') {
        const Icon = IconMap[slide.iconName] || Globe;
        return (
          <div className={`w-full h-full flex flex-col items-center justify-center opacity-50`}>
            <Icon className={`w-32 h-32 ${isDarkMode ? 'text-slate-700' : 'text-slate-300'}`} />
          </div>
        );
      }
    }
    return null;
  };

  const renderSlideContent = (slide: SlideData) => {
    // --- FIX: Using the correct property name from SlideData type ---
    const textScale = slide.customStyle?.textSizeScale || 1.2;

    const slideTextStyle = {
      fontFamily: slide.customStyle?.fontFamily || 'inherit',
      color: slide.customStyle?.textColor || 'inherit',
      textAlign: slide.customStyle?.textAlign || 'left',
      fontSize: `${16 * textScale}px`,
    } as React.CSSProperties;

    const textColorClass = slide.customStyle?.textColor ? '' : (isDarkMode ? 'text-slate-200' : 'text-slate-700');

    // Header Styles
    const titleStyle = {
      color: slide.customStyle?.titleColor || (slide.backgroundStyle === '#ffffff' ? '#111827' : '#ffffff'),
      fontSize: `${3.75 * (slide.customStyle?.titleSizeScale || 1.0)}rem`,
      lineHeight: 1.1
    }

    const subtitleStyle = {
      color: slide.customStyle?.subtitleColor || '#94a3b8',
      fontSize: `${1.875 * (slide.customStyle?.subtitleSizeScale || 1.0)}rem`,
    }

    const headingStyle = {
      color: slide.customStyle?.headingColor || '#60a5fa',
      fontSize: `${1.5 * (slide.customStyle?.headingSizeScale || 1.0)}rem`
    }


    const renderZone = (zoneId: string) => {
      const blocks = slide.blocks.filter(b => b.zone === zoneId);
      // if (blocks.length === 0) return null; // We might want to drop here later

      return (
        <div className="space-y-6 h-full border border-transparent hover:border-dashed hover:border-slate-500/30 rounded p-4 transition-all" style={slideTextStyle}>
          {blocks.map((block) => (
            <div key={block.id} className="w-full">
              {block.type === 'visual' && (
                <div className="h-[500px] w-full flex-1">
                  {renderVisualContent(slide)}
                </div>
              )}
              {block.type === 'heading' && (
                <h3 className="font-bold mb-2 mt-4" style={{ ...headingStyle, textAlign: block.style?.align || 'inherit' }}>
                  {block.content}
                </h3>
              )}
              {block.type === 'paragraph' && (
                <div
                  className={`${textColorClass} leading-relaxed mb-4`}
                  style={{ fontSize: `${1.1 * textScale}rem`, textAlign: block.style?.align || 'inherit' }}
                  dangerouslySetInnerHTML={{ __html: block.content }}
                />
              )}
              {block.type === 'list' && (
                <ul className={`list-disc pl-6 space-y-2 ${textColorClass} mb-4`} style={{ fontSize: `${1.1 * textScale}rem` }}>
                  {(block.content as string[]).map((item, idx) => (
                    <li key={idx} className="marker:text-emerald-500">
                      <span dangerouslySetInnerHTML={{ __html: item }} />
                    </li>
                  ))}
                </ul>
              )}
              {block.type === 'image' && block.content && (
                <div className={`flex justify-center ${slide.enable3DImages ? 'perspective-1000' : ''}`}>
                  <motion.img
                    src={block.content}
                    alt="Slide Visual"
                    className={`w-auto max-h-[500px] object-contain rounded-xl ${slide.enable3DImages ? 'shadow-2xl' : ''}`}
                    style={slide.enable3DImages ? { transform: 'rotateY(15deg) rotateX(5deg)' } : {}}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      );
    };

    const gridStyles: Record<SlideLayoutType, string> = {
      'single': 'grid-cols-1',
      'split': 'grid-cols-1 md:grid-cols-2',
      'top-bottom': 'grid-cols-1 grid-rows-2 gap-8',
      'tri': 'grid-cols-1 md:grid-cols-3',
      'quad': 'grid-cols-2 grid-rows-2',
      'six-grid': 'grid-cols-3 grid-rows-2',
      'header-split': 'grid-cols-2 grid-rows-[auto_1fr]',
      'left-sidebar': 'grid-cols-[1fr_2fr]',
      'right-sidebar': 'grid-cols-[2fr_1fr]',
    };

    // --- Vertical Alignment Class Logic ---
    const verticalAlignClass = slide.customStyle?.verticalAlign === 'center' ? 'items-center'
      : slide.customStyle?.verticalAlign === 'end' ? 'items-end'
        : 'items-start';

    return (
      <div className="w-[1600px] h-[900px] flex flex-col p-16 bg-inherit relative">
        {/* Header - CLEAN & NO ICON + YELLOW LINE */}
        <div className={`mb-10 border-b-4 border-yellow-500 pb-4 shrink-0`}>
          <div>
            <h2 className="font-bold tracking-tight" style={{ fontFamily: slide.customStyle?.fontFamily, ...titleStyle }}>{slide.title}</h2>
            {slide.subtitle && <p className="mt-2 font-light" style={{ fontFamily: slide.customStyle?.fontFamily, ...subtitleStyle }}>{slide.subtitle}</p>}
          </div>
        </div>
        {/* Grid Body with Vertical Alignment */}
        <div className={`flex-1 grid gap-12 ${gridStyles[slide.layoutType]} ${verticalAlignClass} min-h-0 pb-16`}>
          {/* Logic: if layout zones exist, render them. */}
          {slide.layoutType === 'single' && renderZone('main')}
          {slide.layoutType === 'split' && (
            <>
              <div>{renderZone('left')}</div>
              <div className="flex flex-col h-full w-full">
                {renderZone('right')}
              </div>
            </>
          )}
          {slide.layoutType === 'top-bottom' && (
            <>
              <div className="h-full border-b border-dashed border-slate-500/20">{renderZone('top')}</div>
              <div className="h-full">{renderZone('bottom')}</div>
            </>
          )}
          {slide.layoutType === 'tri' && (<><div>{renderZone('left')}</div><div>{renderZone('center')}</div><div>{renderZone('right')}</div></>)}
          {slide.layoutType === 'quad' && (<><div>{renderZone('top-left')}</div><div>{renderZone('top-right')}</div><div>{renderZone('bottom-left')}</div><div>{renderZone('bottom-right')}</div></>)}
          {slide.layoutType === 'six-grid' && (
            <>
              <div>{renderZone('p1')}</div><div>{renderZone('p2')}</div><div>{renderZone('p3')}</div>
              <div>{renderZone('p4')}</div><div>{renderZone('p5')}</div><div>{renderZone('p6')}</div>
            </>
          )}
          {slide.layoutType === 'header-split' && (<><div className="col-span-2">{renderZone('header')}</div><div>{renderZone('left')}</div><div>{renderZone('right')}</div></>)}
          {slide.layoutType === 'left-sidebar' && (<><div className={`border-r ${isDarkMode ? 'border-slate-800' : 'border-slate-200'} pr-8`}>{renderZone('sidebar')}</div><div>{renderZone('main')}</div></>)}
          {slide.layoutType === 'right-sidebar' && (<><div>{renderZone('main')}</div><div className={`border-l ${isDarkMode ? 'border-slate-800' : 'border-slate-200'} pl-8`}>{renderZone('sidebar')}</div></>)}
        </div>

        {/* Internal Footer (Part of Slide Layout) */}
        <div className={`absolute bottom-0 left-0 w-full h-16 border-t ${isDarkMode ? 'border-white/10' : 'border-slate-200'} flex items-center justify-between px-16 text-xl ${theme.textMuted} font-mono`}>
          <div className="flex items-center space-x-6"><span>{userInfo.name}</span><span className="w-px h-6 bg-current opacity-20"></span><span>{slide.footerText || appSettings.footerText || appSettings.dashboardName}</span></div>
          <div className="flex items-center space-x-6"><span>{slide.section}</span><span className="w-px h-6 bg-current opacity-20"></span><span>Slide {slide.id} / {INITIAL_SLIDES.length}</span></div>
        </div>
      </div>
    );
  };

  const renderSlides = () => (
    <div className="flex flex-col h-full overflow-hidden relative" ref={containerRef} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      {/* Presentation Overlay (Fullscreen) */}
      <AnimatePresence>
        {(isFullscreen && !isHideMode) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2 bg-slate-900/90 backdrop-blur border border-white/10 p-2 rounded-full shadow-2xl no-print"
          >
            <button onClick={() => setToolMode('cursor')} className={`p-2 rounded-full ${toolMode === 'cursor' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}><MousePointer2 size={20} /></button>
            <button onClick={() => setToolMode('laser')} className={`p-2 rounded-full ${toolMode === 'laser' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'}`}><Target size={20} /></button>
            <button onClick={() => setToolMode('pen')} className={`p-2 rounded-full ${toolMode === 'pen' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}><PenTool size={20} /></button>
            <button onClick={() => setDrawings([])} className="p-2 text-slate-400 hover:text-red-400"><Eraser size={20} /></button>
            <div className="w-px h-4 bg-white/20 mx-2" />
            <button onClick={prevSlide} className="p-2 text-white hover:bg-white/10 rounded-full"><ChevronLeft size={20} /></button>
            <span className="text-white font-mono text-xs">{currentSlide + 1}/{slides.length}</span>
            <button onClick={nextSlide} className="p-2 text-white hover:bg-white/10 rounded-full"><ChevronRight size={20} /></button>
            <div className="w-px h-4 bg-white/20 mx-2" />
            <button onClick={handleDownloadPDF} className="p-2 text-slate-400 hover:text-white" title="Save as PDF"><Printer size={20} /></button>
            <button onClick={toggleFullscreen} className="p-2 text-slate-400 hover:text-white"><Minimize2 size={20} /></button>
            <button onClick={() => setIsHideMode(true)} className="p-2 text-slate-400 hover:text-white" title="Hide Toolbar"><EyeOff size={20} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unhide Trigger */}
      <AnimatePresence>
        {(isFullscreen && isHideMode) && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={() => setIsHideMode(false)}
            className="absolute bottom-4 left-4 z-50 p-3 bg-slate-900/50 backdrop-blur rounded-full text-slate-400 hover:text-white border border-white/10 hover:bg-slate-800 no-print"
            title="Show Toolbar"
          >
            <Eye size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Tool Layer */}
      {isFullscreen && (
        <>
          <canvas ref={canvasRef} width={window.screen.width} height={window.screen.height} className="absolute inset-0 z-40 pointer-events-none no-print" style={{ pointerEvents: toolMode === 'pen' ? 'auto' : 'none' }} />
          {toolMode === 'laser' && <motion.div className="fixed w-4 h-4 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.8)] z-50 pointer-events-none no-print" animate={{ x: mousePos.x - 8, y: mousePos.y - 8 }} transition={{ duration: 0 }} />}
        </>
      )}

      {/* Standard Toolbar */}
      {!isFullscreen && (
        <div className="flex justify-between items-center mb-4 px-2 shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded">{slides[currentSlide].section}</span>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={addNewSlide} className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold transition-all"><Plus size={14} /> New</button>
            <button onClick={() => deleteSlide()} className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-red-900/50 text-white hover:text-red-400 rounded text-xs font-bold transition-all"><Trash size={14} /> Del</button>
            <button onClick={() => setIsReorderModalOpen(true)} className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold transition-all"><List size={14} /> Order</button>

            <label className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold transition-all cursor-pointer">
              <Upload size={14} /> Import
              <input type="file" accept=".json,.pdf" onChange={handleImport} className="hidden" />
            </label>

            {/* --- NEW RESET BUTTON --- */}
            <button
              onClick={handleResetToDefault}
              className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-red-900/50 text-white hover:text-red-400 rounded text-xs font-bold transition-all"
              title="Reset to Default"
            >
              <RotateCcw size={14} /> Reset
            </button>

            <button onClick={() => setEditingSlide(slides[currentSlide])} className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-bold transition-all border ${isDarkMode ? 'border-slate-600 hover:bg-slate-700 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-600'}`}><Edit3 size={16} /><span>Edit</span></button>
            <button onClick={handleDownloadPDF} className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-bold transition-all border ${isDarkMode ? 'border-slate-600 hover:bg-slate-700 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-600'}`} title="Print to PDF"><Printer size={16} /></button>
            <button onClick={toggleFullscreen} className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-emerald-900/20"><Play size={16} fill="currentColor" /><span>Start</span></button>

            <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'} rounded-lg p-1 flex`}>
              <button onClick={prevSlide} disabled={currentSlide === 0} className={`p-2 rounded-md ${isDarkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-white text-slate-700'} disabled:opacity-30`}><ChevronLeft size={20} /></button>
              <button onClick={nextSlide} disabled={currentSlide === slides.length - 1} className={`p-2 rounded-md ${isDarkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-white text-slate-700'} disabled:opacity-30`}><ChevronRight size={20} /></button>
            </div>
          </div>
        </div>
      )}

      {/* Slide Viewport with Scaling OR PDF Viewer */}

      {pdfUrl ? (
        <div className="flex-1 w-full h-full bg-slate-900 flex flex-col relative z-0">
          <iframe
            src={pdfUrl}
            className="w-full h-full border-none"
            title="Imported PDF"
          />
          <button
            onClick={() => setPdfUrl(null)}
            className="absolute top-4 right-6 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50 font-bold flex items-center gap-2"
          >
            <X size={16} /> Close PDF
          </button>
        </div>
      ) : (
        <div id="printable-slide"
          className={`flex-1 relative ${theme.slideBg} rounded-2xl border overflow-hidden shadow-2xl group flex flex-col items-center justify-center transition-colors duration-500`}
          style={{ background: slides[currentSlide].backgroundStyle }}
          ref={slideContainerRef}
        >
          {!slides[currentSlide].backgroundStyle && <div className="absolute top-[-50%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px]" />}

          {/* Scaled Content Wrapper */}
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center', width: '1600px', height: '900px' }} className="shrink-0 relative z-10 shadow-2xl">
            <AnimatePresence mode='wait'>
              <motion.div key={currentSlide} className="w-full h-full" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.4 }}>
                {renderSlideContent(slides[currentSlide])}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Inject Print Styles */}
      <style>{`
            @media print {
                body * { visibility: hidden; }
                #printable-slide, #printable-slide * { visibility: visible; }
                #printable-slide { position: fixed; left: 0; top: 0; width: 100vw; height: 100vh; margin: 0; border: none; border-radius: 0; background-color: ${slides[currentSlide].backgroundStyle || (isDarkMode ? '#0f172a' : '#ffffff')} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; transform: none !important; }
                .no-print { display: none !important; }
            }
         `}</style>
    </div>
  );

  const renderAnalyze = () => (<div className="h-full flex flex-col md:flex-row gap-6 p-2 animate-in fade-in"><div className="w-full md:w-1/3 space-y-4"><div className={`p-6 rounded-xl border ${theme.card}`}><h3 className={`${theme.text} font-bold mb-4`}>Select Model</h3><div className="space-y-3"><button onClick={() => setSelectedModel('TSM')} className={`w-full p-4 rounded-lg border text-left transition-all ${selectedModel === 'TSM' ? 'bg-red-500/10 border-red-500/50' : `${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} hover:border-slate-600`}`}><div className="flex justify-between mb-1"><span className={`font-bold ${selectedModel === 'TSM' ? 'text-red-400' : 'text-slate-400'}`}>TSM Model</span><span className={`${theme.text} font-mono`}>16.21</span></div><div className={`w-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'} h-1.5 rounded-full overflow-hidden`}><div className="bg-red-500 h-full w-full" /></div></button><button onClick={() => setSelectedModel('FSB')} className={`w-full p-4 rounded-lg border text-left transition-all ${selectedModel === 'FSB' ? 'bg-emerald-500/10 border-emerald-500/50' : `${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} hover:border-slate-600`}`}><div className="flex justify-between mb-1"><span className={`font-bold ${selectedModel === 'FSB' ? 'text-emerald-400' : 'text-slate-400'}`}>FSB Model</span><span className={`${theme.text} font-mono`}>13.21</span></div><div className={`w-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'} h-1.5 rounded-full overflow-hidden`}><div className="bg-emerald-500 h-full w-[81.5%]" /></div></button></div></div><div className={`p-6 rounded-xl border ${theme.card} flex-1`}><h3 className={`${theme.text} font-bold mb-4`}>Quick Insight</h3><p className={`${theme.textMuted} text-sm leading-relaxed`}>{selectedModel === 'TSM' ? "TSM encourages bulk buying, leading to a 22.7% household waste rate. This 'Embodied Carbon' in wasted food is the single largest contributor (14.1 kg)." : "FSB has a higher packaging footprint (0.61 kg vs 0.31 kg), but this is offset 10x over by the savings in food waste (2.3 kg saved) and efficient logistics."}</p></div></div><div className="w-full md:w-2/3 space-y-6 flex flex-col h-full"><div className={`p-6 rounded-xl border ${theme.card} h-1/2 flex flex-col`}><h3 className={`${theme.text} font-bold mb-6`}>Emission Category Breakdown (kg CO2e)</h3><div className="flex-1"><ResponsiveContainer width="100%" height="100%"><BarChart layout="vertical" data={DATA_COMPARISON} margin={{ top: 5, right: 30, left: 40, bottom: 5 }} barGap={8}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDarkMode ? "#334155" : "#e2e8f0"} opacity={0.5} /><XAxis type="number" stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={12} /><YAxis dataKey="name" type="category" width={80} stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={11} /><Tooltip cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} contentStyle={theme.tooltip} /><Bar dataKey={selectedModel || 'TSM'} fill={selectedModel === 'TSM' ? '#ef4444' : '#10b981'} radius={[0, 4, 4, 0]} barSize={24} animationDuration={800} /></BarChart></ResponsiveContainer></div></div><div className={`p-6 rounded-xl border ${theme.card} h-1/2 flex flex-col`}><h3 className={`${theme.text} font-bold mb-4`}>Hotspot Analysis</h3><div className="flex-1 grid grid-cols-2 gap-4 min-h-0"><div className="relative flex flex-col h-full"><div className="text-center text-red-400 font-bold mb-2">TSM Model</div><div className="flex-1 min-h-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={HOTSPOT_TSM} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">{HOTSPOT_TSM.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip contentStyle={theme.tooltip} /></PieChart></ResponsiveContainer><div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className={`text-2xl font-bold ${theme.text}`}>87%</span><span className={`text-xs ${theme.textMuted}`}>Raw Materials</span></div></div></div><div className="relative flex flex-col h-full"><div className="text-center text-emerald-400 font-bold mb-2">FSB Model</div><div className="flex-1 min-h-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={HOTSPOT_FSB} innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">{HOTSPOT_FSB.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip contentStyle={theme.tooltip} /></PieChart></ResponsiveContainer></div></div></div></div></div></div>);

  const renderLifecycle = () => (
    <div className="h-full flex flex-col p-2 animate-in fade-in">
      <div className="mb-8"><h2 className={`text-2xl font-bold ${theme.text} mb-2`}>Supply Chain Lifecycle</h2><p className={theme.textMuted}>Explore the environmental impact at each stage of the journey.</p></div>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {LIFECYCLE_STEPS.map((step, idx) => (<button key={step.id} onClick={() => setLifecycleStep(step.id)} className={`relative p-6 rounded-xl border text-left transition-all ${lifecycleStep === step.id ? 'bg-emerald-500/10 border-emerald-500' : `${theme.card} hover:border-emerald-500/50`}`}><div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${lifecycleStep === step.id ? 'bg-emerald-500 text-white' : `${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'} ${theme.textMuted}`}`}><step.icon size={24} /></div><h3 className={`font-bold text-lg mb-1 ${lifecycleStep === step.id ? (isDarkMode ? 'text-white' : 'text-slate-900') : theme.textMuted}`}>{step.title}</h3><p className={`text-xs ${theme.textMuted}`}>{step.desc}</p>{idx !== LIFECYCLE_STEPS.length - 1 && (<div className={`absolute top-12 right-[-20px] w-8 h-0.5 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'} z-0 hidden md:block`} />)}</button>))}
      </div>
      <AnimatePresence mode="wait">
        {lifecycleStep ? (<motion.div key={lifecycleStep} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`flex-1 ${theme.card} rounded-xl p-8 grid grid-cols-2 gap-12`}><div className="flex flex-col justify-center"><h3 className={`text-2xl font-bold ${theme.text} mb-6 flex items-center`}>{LIFECYCLE_STEPS.find(s => s.id === lifecycleStep)?.title} Analysis</h3><div className="space-y-6">{(() => { const stepData = LIFECYCLE_STEPS.find(s => s.id === lifecycleStep)!; const maxVal = Math.max(stepData.tsm, stepData.fsb); const tsmWidth = maxVal > 0 ? (stepData.tsm / maxVal) * 100 : 0; const fsbWidth = maxVal > 0 ? (stepData.fsb / maxVal) * 100 : 0; return (<><div><div className="flex justify-between text-sm mb-2"><span className="text-red-400 font-bold">TSM Model</span><span className={theme.text}>{stepData.tsm} {stepData.unit}</span></div><div className={`w-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'} h-2 rounded-full relative group`}><motion.div className="bg-red-500 h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${tsmWidth}%` }} /></div></div><div><div className="flex justify-between text-sm mb-2"><span className="text-emerald-400 font-bold">FSB Model</span><span className={theme.text}>{stepData.fsb} {stepData.unit}</span></div><div className={`w-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'} h-2 rounded-full relative group`}><motion.div className="bg-emerald-500 h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${fsbWidth}%` }} /></div><p className="text-xs text-slate-500 mt-1 italic text-right">* Longer bar = Higher Impact (Lower is better)</p></div></>); })()}</div></div><div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'} flex items-center justify-center text-center`}><div><Info size={48} className="text-blue-400 mx-auto mb-4" /><p className={`${theme.text} text-lg italic`}>{lifecycleStep === 'raw' && "FSB saves 2.3 kg CO2e here by preventing food waste."}{lifecycleStep === 'pack' && "FSB creates more waste here (+0.3 kg) due to cardboard boxes."}{lifecycleStep === 'log' && "FSB is 2x more efficient due to consolidated delivery routes."}{lifecycleStep === 'eol' && "Less organic waste in FSB means less methane in landfills."}</p></div></div></motion.div>) : (<motion.div key="empty-lifecycle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`flex-1 flex items-center justify-center ${theme.textMuted} border border-dashed ${isDarkMode ? 'border-slate-700' : 'border-slate-300'} rounded-xl`}>Select a stage above to view details</motion.div>)}
      </AnimatePresence>
    </div>
  );

  const renderSettings = () => (
    <div className="h-full overflow-y-auto p-4 animate-in fade-in">
      <h2 className={`text-2xl font-bold ${theme.text} mb-6 flex items-center`}><Settings className="mr-3" /> Application Settings</h2>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className={`p-6 rounded-xl border ${theme.card}`}>
            <h3 className={`text-lg font-bold ${theme.text} mb-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'} pb-2`}>User Profile & Config</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 mb-4">
                <div className={`w-20 h-20 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'} flex items-center justify-center overflow-hidden border-2 ${isDarkMode ? 'border-slate-600' : 'border-slate-300'}`}>{userInfo.photo ? <img src={userInfo.photo} alt="Profile" className="w-full h-full object-cover" /> : <User size={32} className={theme.textMuted} />}</div>
                <div><label className="block text-sm text-blue-400 font-bold mb-1 cursor-pointer hover:underline">Upload Photo<input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} /></label><p className={`text-xs ${theme.textMuted}`}>JPG, PNG max 2MB</p></div>
              </div>
              <div><label className={`block text-xs font-bold ${theme.textMuted} uppercase mb-1`}>Full Name</label><input type="text" value={userInfo.name} onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })} className={`w-full ${theme.input} rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none`} /></div>
              <div><label className={`block text-xs font-bold ${theme.textMuted} uppercase mb-1`}>Registration Number</label><input type="text" value={userInfo.regNum} onChange={(e) => setUserInfo({ ...userInfo, regNum: e.target.value })} className={`w-full ${theme.input} rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none`} /></div>
              <div><label className={`block text-xs font-bold ${theme.textMuted} uppercase mb-1`}>Dashboard Title</label><input type="text" value={appSettings.dashboardName} onChange={(e) => setAppSettings({ ...appSettings, dashboardName: e.target.value })} className={`w-full ${theme.input} rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none`} /></div>
              <div><label className={`block text-xs font-bold ${theme.textMuted} uppercase mb-1`}>Footer Text</label><input type="text" value={appSettings.footerText} onChange={(e) => setAppSettings({ ...appSettings, footerText: e.target.value })} className={`w-full ${theme.input} rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none`} placeholder="Optional custom footer text..." /></div>

              <div className="pt-4 border-t border-slate-700">
                <label className={`block text-xs font-bold ${theme.textMuted} uppercase mb-2`}>Bulk Edit (All Slides)</label>
                <div className="flex gap-2">
                  <button onClick={() => applyBulkStyle('font', FONT_OPTIONS[1].value)} className="px-3 py-1.5 bg-slate-700 hover:bg-emerald-600 rounded text-xs text-white">Apply Serif Font</button>
                  <button onClick={() => applyBulkStyle('font', FONT_OPTIONS[0].value)} className="px-3 py-1.5 bg-slate-700 hover:bg-emerald-600 rounded text-xs text-white">Apply Sans Font</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={`p-6 rounded-xl border ${theme.card} h-[600px] flex flex-col`}>
          <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
            <h3 className={`text-lg font-bold ${theme.text}`}>Manage Slides</h3>
            <button onClick={addNewSlide} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded shadow-lg transition-colors"><Plus size={14} /> Add New Slide</button>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {slides.map((slide, index) => (
              <div key={slide.id} className={`p-4 rounded-lg border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'} group hover:border-slate-400 transition-colors`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-emerald-500">Slide {index + 1}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setRawEditingSlide(slide)} className={`p-1.5 rounded bg-slate-800 border border-slate-600 hover:border-emerald-500 ${theme.textMuted} hover:text-emerald-400 flex items-center gap-1 text-xs`}><Code size={12} /> Edit Code</button>
                    <button onClick={() => deleteSlide(slide.id)} className={`p-1.5 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-500`} title="Delete Slide"><Trash size={14} /></button>
                  </div>
                </div>
                <input type="text" value={slide.title} onChange={(e) => { const newSlides = [...slides]; newSlides[index].title = e.target.value; setSlides(newSlides); }} className={`w-full ${theme.input} rounded px-2 py-1 text-sm mb-2 focus:border-blue-500 focus:outline-none`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`flex h-screen ${theme.bg} ${theme.text} font-sans selection:bg-emerald-500/30 overflow-hidden ${isFullscreen ? 'fixed inset-0 z-[100]' : ''}`}>
      <AnimatePresence>{editingSlide && (<SlideEditorModal slide={editingSlide} onClose={() => setEditingSlide(null)} onSave={updateSlide} onBulkApply={applyBulkStyle} theme={theme} />)}{rawEditingSlide && (<RawEditorModal slide={rawEditingSlide} onClose={() => setRawEditingSlide(null)} onSave={updateSlide} theme={theme} />)}{isReorderModalOpen && (<ReorderSlidesModal slides={slides} onClose={() => setIsReorderModalOpen(false)} onSave={(ordered: SlideData[]) => setSlides(ordered)} theme={theme} />)}</AnimatePresence>
      {!isFullscreen && (<aside className={`w-64 ${theme.sidebar} border-r flex flex-col shrink-0 transition-colors duration-300`}><div className={`p-6 border-b ${isDarkMode ? 'border-slate-800' : 'border-gray-200'}`}><div className="flex items-center space-x-3"><div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center"><Leaf className="text-white w-5 h-5" /></div><span className={`font-bold text-lg ${theme.text} tracking-tight`}>{appSettings.dashboardName.split(' ')[0]}</span></div></div><div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto"><div className={`px-3 mb-2 text-xs font-bold ${theme.textMuted} uppercase tracking-wider`}>Overview</div><NavItem active={activeView === 'dashboard'} icon={LayoutDashboard} label="Dashboard" onClick={() => setActiveView('dashboard')} /><NavItem active={activeView === 'slides'} icon={Layers} label="Presentation Deck" onClick={() => setActiveView('slides')} /><div className={`px-3 mt-8 mb-2 text-xs font-bold ${theme.textMuted} uppercase tracking-wider`}>Tools</div><NavItem active={activeView === 'analyze'} icon={BarChart2} label="Data Analyzer" onClick={() => setActiveView('analyze')} /><NavItem active={activeView === 'calculator'} icon={PenTool} label="Scenario Builder" onClick={() => setActiveView('calculator')} /><NavItem active={activeView === 'lifecycle'} icon={GitMerge} label="Supply Chain" onClick={() => setActiveView('lifecycle')} /><div className={`px-3 mt-8 mb-2 text-xs font-bold ${theme.textMuted} uppercase tracking-wider`}>Config</div><NavItem active={activeView === 'settings'} icon={Settings} label="Settings" onClick={() => setActiveView('settings')} /></div><div className={`p-4 border-t ${isDarkMode ? 'border-slate-800' : 'border-gray-200'}`}><div className={`flex items-center space-x-3 p-2 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100 border-slate-200'}`}><div className={`w-8 h-8 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-white'} flex items-center justify-center text-xs font-bold ${theme.text} overflow-hidden shadow-sm`}>{userInfo.photo ? <img src={userInfo.photo} alt="User" className="w-full h-full object-cover" /> : "WP"}</div><div className="overflow-hidden"><p className={`text-sm font-bold ${theme.text} truncate`}>{userInfo.name}</p><p className={`text-xs ${theme.textMuted} truncate`}>{userInfo.regNum}</p></div></div></div></aside>)}
      <main className={`flex-1 flex flex-col h-full overflow-hidden ${theme.bg} relative transition-colors duration-300`}>
        {!isFullscreen && (<header className={`h-16 border-b ${theme.header} backdrop-blur-sm flex items-center justify-between px-8 z-10 shrink-0`}><div className={`flex items-center text-sm ${theme.textMuted}`}><span className={`hover:${theme.text} cursor-pointer`}>Home</span><ChevronRight size={14} className="mx-2" /><span className={`${theme.text} font-medium capitalize`}>{activeView}</span></div><div className="flex items-center space-x-4"><button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-slate-400 hover:text-yellow-400 hover:bg-slate-800' : 'text-slate-500 hover:text-orange-500 hover:bg-slate-100'}`} title="Toggle Theme">{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button><button onClick={toggleFullscreen} className={`p-2 ${theme.textMuted} hover:${theme.text} transition-colors`} title="Enter Fullscreen"><Maximize2 size={20} /></button></div></header>)}
        <div className={`flex-1 overflow-hidden relative ${isFullscreen ? 'p-0' : 'p-6'}`}><div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] ${isDarkMode ? 'from-emerald-900/10 via-[#0f172a] to-[#0f172a]' : 'from-emerald-100/40 via-gray-100 to-gray-100'} pointer-events-none transition-colors duration-300`} /><div className="h-full relative z-0">{activeView === 'dashboard' && renderDashboard()}{activeView === 'slides' && renderSlides()}{activeView === 'analyze' && renderAnalyze()}{activeView === 'calculator' && <ImpactCalculator isDarkMode={isDarkMode} />}{activeView === 'lifecycle' && renderLifecycle()}{activeView === 'settings' && renderSettings()}</div></div>
      </main>
    </div>
  );
}