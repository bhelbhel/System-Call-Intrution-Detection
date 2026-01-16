
import React, { useState, useMemo, useRef, useEffect } from 'react';
import Layout from './components/Layout';
import { 
  RiskLevel, 
  AnalysisResult, 
  ViewState,
  SecurityAlert
} from './types';
import { generateTimelineData } from './constants';
import { getAnalysisExplanation } from './services/geminiService';
import { parseSyscallFile, analyzeDeviations, getSampleCSV, ParsedData } from './services/dataProcessor';
import RiskMeter from './components/RiskMeter';
import SyscallChart from './components/SyscallChart';
import TrendChart from './components/TrendChart';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap, 
  ShieldAlert,
  Info,
  Download,
  Share2,
  Filter,
  RefreshCw,
  FileText,
  UploadCloud,
  ChevronDown,
  Activity,
  Terminal,
  History,
  Settings,
  Loader2,
  Trash2,
  ExternalLink,
  Search,
  Lock,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  Fingerprint,
  Target,
  ShieldQuestion,
  Gauge,
  Bell,
  AlertOctagon,
  Clock,
  ShieldX
} from 'lucide-react';

const App: React.FC = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('sysguard_auth') === 'true';
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [credentials, setCredentials] = useState({ id: 'ADMIN-01', key: '••••••••' });

  const [activeView, setActiveView] = useState<ViewState>('UPLOAD');
  const [threshold, setThreshold] = useState(30);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isParsing, setIsParsing] = useState<{type: string, active: boolean}>({type: '', active: false});
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [activeAlert, setActiveAlert] = useState<SecurityAlert | null>(null);
  
  // Real Data State
  const [baselineParsed, setBaselineParsed] = useState<ParsedData | null>(null);
  const [testParsed, setTestParsed] = useState<ParsedData | null>(null);
  const [baselineFileName, setBaselineFileName] = useState<string | null>(null);
  const [testFileName, setTestFileName] = useState<string | null>(null);

  const baselineInputRef = useRef<HTMLInputElement>(null);
  const testInputRef = useRef<HTMLInputElement>(null);
  
  const [syscallFilter, setSyscallFilter] = useState('ALL');

  // Persist history and alerts to localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('sysguard_history');
    const savedAlerts = localStorage.getItem('sysguard_alerts');
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); }
    }
    if (savedAlerts) {
      try { setAlerts(JSON.parse(savedAlerts)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sysguard_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('sysguard_alerts', JSON.stringify(alerts));
  }, [alerts]);

  // Sensitivity Metrics Calculation
  const sensitivityMetrics = useMemo(() => {
    const detectionRate = Math.max(65, 100 - (threshold / 3)).toFixed(1);
    const fpr = (25 / (threshold / 4 + 1)).toFixed(1);
    const filteringDepth = threshold;
    return { detectionRate, fpr, filteringDepth };
  }, [threshold]);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginLoading(true);
    setTimeout(() => {
      setIsAuthenticated(true);
      sessionStorage.setItem('sysguard_auth', 'true');
      setLoginLoading(false);
    }, 1500);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('sysguard_auth');
  };

  const filteredSyscalls = useMemo(() => {
    if (!result) return [];
    let list = result.syscalls;
    if (syscallFilter === 'ALL') list = result.syscalls;
    else if (syscallFilter === 'ANOMALOUS') list = result.syscalls.filter(s => s.deviation > threshold);
    else list = result.syscalls.filter(s => s.name === syscallFilter);
    return list.slice(0, 40);
  }, [result, syscallFilter, threshold]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'baseline' | 'test') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsing({ type, active: true });
    if (type === 'baseline') setBaselineFileName(file.name);
    else setTestFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseSyscallFile(content);
      if (type === 'baseline') setBaselineParsed(parsed);
      else setTestParsed(parsed);
      setIsParsing({ type: '', active: false });
    };
    reader.readAsText(file);
  };

  const loadSample = (type: 'baseline' | 'test', scenario: 'normal' | 'intrusion') => {
    setIsParsing({ type, active: true });
    setTimeout(() => {
      const content = getSampleCSV(scenario);
      const parsed = parseSyscallFile(content);
      if (type === 'baseline') {
        setBaselineParsed(parsed);
        setBaselineFileName(`sample_${scenario}_baseline.csv`);
      } else {
        setTestParsed(parsed);
        setTestFileName(`sample_${scenario}_capture.csv`);
      }
      setIsParsing({ type: '', active: false });
    }, 600);
  };

  const handleRunAnalysis = async () => {
    if (!baselineParsed || !testParsed) return;
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { syscalls, avgDeviation } = analyzeDeviations(baselineParsed, testParsed);
    const isIntrusion = avgDeviation > threshold;
    const timeline = generateTimelineData(isIntrusion);
    const status = isIntrusion ? 'INTRUSION' : 'NORMAL';
    let riskLevel = RiskLevel.LOW;
    if (avgDeviation > threshold * 3) riskLevel = RiskLevel.CRITICAL;
    else if (avgDeviation > threshold * 2) riskLevel = RiskLevel.HIGH;
    else if (avgDeviation > threshold) riskLevel = RiskLevel.MEDIUM;

    const timestamp = new Date().toLocaleString();
    const explanation = await getAnalysisExplanation(status, riskLevel, avgDeviation, syscalls);

    const newResult: AnalysisResult = {
      id: Math.random().toString(36).substr(2, 9),
      status,
      deviationScore: avgDeviation,
      riskLevel,
      syscalls,
      timeline,
      timestamp,
      explanation,
      metadata: {
        baselineFile: baselineFileName || 'unknown_baseline',
        testFile: testFileName || 'unknown_test'
      }
    };

    setResult(newResult);
    setHistory(prev => [newResult, ...prev].slice(0, 50));
    
    // Alert Generation Logic
    if (status === 'INTRUSION' && (riskLevel === RiskLevel.HIGH || riskLevel === RiskLevel.CRITICAL)) {
      const newAlert: SecurityAlert = {
        id: Math.random().toString(36).substr(2, 6),
        severity: riskLevel,
        title: riskLevel === RiskLevel.CRITICAL ? 'Critical Integrity Breach' : 'Suspicious Activity Detected',
        message: explanation || "A significant behavioral anomaly was detected.",
        timestamp: new Date().toLocaleTimeString(),
        analysisId: newResult.id,
        read: false
      };
      setAlerts(prev => [newAlert, ...prev]);
      setActiveAlert(newAlert);
    }

    setIsAnalyzing(false);
    setActiveView('DASHBOARD');
  };

  const markAlertRead = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const viewAlertAnalysis = (alert: SecurityAlert) => {
    const historicalResult = history.find(h => h.id === alert.analysisId);
    if (historicalResult) {
      setResult(historicalResult);
      markAlertRead(alert.id);
      setActiveView('DASHBOARD');
    }
  };

  /**
   * Clears the current analysis state and returns to the upload view.
   * Fixes the "Cannot find name 'resetAnalysis'" error on line 441.
   */
  const resetAnalysis = () => {
    setResult(null);
    setBaselineParsed(null);
    setTestParsed(null);
    setBaselineFileName(null);
    setTestFileName(null);
    setActiveView('UPLOAD');
  };

  const renderLoginView = () => (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-500 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px]"></div>
      </div>
      <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-500 relative z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent animate-scan"></div>
          <div className="flex flex-col items-center mb-8">
            <div className="bg-sky-500/20 p-4 rounded-2xl border border-sky-500/30 mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-10 h-10 text-sky-400" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase flex items-center gap-2">
              SysGuard <span className="text-sky-500">IDS</span>
            </h1>
            <p className="text-slate-500 text-[10px] font-bold tracking-[0.3em] uppercase mt-2">Operator Authentication</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Operator ID</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" value={credentials.id} readOnly className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm text-white font-mono" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Key</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="password" value={credentials.key} readOnly className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm text-white font-mono" />
              </div>
            </div>
            <div className="pt-2">
              <button type="submit" disabled={loginLoading} className="w-full bg-sky-600 hover:bg-sky-500 text-white font-black uppercase text-xs tracking-[0.2em] py-4 rounded-xl shadow-xl transition-all flex items-center justify-center gap-2">
                {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
                Authorize Access
              </button>
            </div>
          </form>
        </div>
      </div>
      <style>{`@keyframes scan { from { left: -100%; } to { left: 100%; } } .animate-scan { position: absolute; width: 200%; animation: scan 3s linear infinite; }`}</style>
    </div>
  );

  const renderAlertCenter = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">Alert Center</h2>
          <p className="text-slate-500 text-sm">Real-time critical security events and behavioral anomalies</p>
        </div>
        <button 
          onClick={() => { if(confirm('Clear all alerts?')) setAlerts([]); }}
          className="px-4 py-2 text-xs font-black uppercase text-slate-500 hover:text-white border border-slate-800 rounded-xl transition-all"
        >
          Clear Archive
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-500">
          <div className="bg-slate-900 p-8 rounded-full mb-6 border border-slate-800 opacity-20">
            <ShieldCheck className="w-16 h-16" />
          </div>
          <h2 className="text-2xl font-black text-slate-400 uppercase tracking-widest mb-2">Network Clean</h2>
          <p className="max-w-xs text-center text-slate-600 text-sm">No critical security events recorded in the current session.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {alerts.map((alert) => (
            <div 
              key={alert.id}
              onClick={() => viewAlertAnalysis(alert)}
              className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 transition-all cursor-pointer hover:border-slate-600 group relative overflow-hidden ${!alert.read ? 'ring-1 ring-sky-500/30' : 'opacity-70'}`}
            >
              {!alert.read && <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500/10 blur-xl"></div>}
              <div className="flex items-start gap-5 relative z-10">
                <div className={`p-3 rounded-xl ${alert.severity === RiskLevel.CRITICAL ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-400'}`}>
                  <AlertOctagon className="w-6 h-6" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-sky-400 transition-colors">
                      {alert.title}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {alert.timestamp}
                      </span>
                      {!alert.read && <span className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_8px_#0ea5e9]"></span>}
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed pr-8 line-clamp-2">
                    {alert.message}
                  </p>
                  <div className="pt-2 flex items-center gap-4">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${alert.severity === RiskLevel.CRITICAL ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-400'}`}>
                      {alert.severity} Risk
                    </span>
                    <button className="text-[10px] font-black uppercase text-sky-500 group-hover:underline">View Forensic Data</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderUploadView = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><ShieldAlert className="w-32 h-32 text-sky-500" /></div>
        <h1 className="text-3xl font-bold text-white mb-2">Ingest System Call Data</h1>
        <p className="text-slate-400 mb-8 max-w-2xl text-lg">Upload your system call frequency CSV files to begin behavioral analysis.</p>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Baseline Profile</label>
            <div onClick={() => baselineInputRef.current?.click()} className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer group ${baselineParsed ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-800 hover:border-sky-500 bg-slate-950/50'}`}>
              <input type="file" ref={baselineInputRef} className="hidden" accept=".csv,.txt" onChange={(e) => handleFileUpload(e, 'baseline')} />
              {isParsing.type === 'baseline' ? <Loader2 className="w-12 h-12 mb-4 text-sky-500 animate-spin" /> : <UploadCloud className={`w-12 h-12 mb-4 ${baselineParsed ? 'text-emerald-400' : 'text-slate-600'}`} />}
              <p className="text-base font-bold text-white mb-1">{baselineFileName || 'Upload Baseline CSV'}</p>
              {baselineParsed && <span className="mt-3 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded uppercase">Data Loaded</span>}
            </div>
            <button onClick={() => loadSample('baseline', 'normal')} className="w-full text-[10px] font-bold uppercase tracking-widest bg-slate-800 hover:bg-slate-700 text-slate-400 py-2 rounded-lg border border-slate-700">Use Normal Template</button>
          </div>
          <div className="space-y-4">
            <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Target Capture</label>
            <div onClick={() => testInputRef.current?.click()} className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer group ${testParsed ? 'border-sky-500/50 bg-sky-500/5' : 'border-slate-800 hover:border-sky-500 bg-slate-950/50'}`}>
              <input type="file" ref={testInputRef} className="hidden" accept=".csv,.txt" onChange={(e) => handleFileUpload(e, 'test')} />
              {isParsing.type === 'test' ? <Loader2 className="w-12 h-12 mb-4 text-sky-500 animate-spin" /> : <FileText className={`w-12 h-12 mb-4 ${testParsed ? 'text-sky-400' : 'text-slate-600'}`} />}
              <p className="text-base font-bold text-white mb-1">{testFileName || 'Upload Capture Trace'}</p>
              {testParsed && <span className="mt-3 px-2 py-1 bg-sky-500/20 text-sky-400 text-[10px] font-bold rounded uppercase">Data Loaded</span>}
            </div>
            <button onClick={() => loadSample('test', 'intrusion')} className="w-full text-[10px] font-bold uppercase tracking-widest bg-slate-800 hover:bg-slate-700 text-slate-400 py-2 rounded-lg border border-slate-700">Use Intrusion Template</button>
          </div>
        </div>
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <div className="space-y-6">
            <div className="flex justify-between items-center"><label className="text-sm font-bold text-slate-300 flex items-center gap-2 uppercase tracking-widest">Sensitivity Threshold Analysis</label> <span className="text-sky-500 font-mono text-sm bg-sky-500/10 px-3 py-1 rounded-lg border border-sky-500/20">{threshold}%</span></div>
            <div className="relative pt-4"><input type="range" min="5" max="100" value={threshold} onChange={(e) => setThreshold(parseInt(e.target.value))} className="w-full h-3 bg-slate-800 rounded-full appearance-none cursor-pointer accent-sky-500 focus:outline-none" /></div>
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/50">
               <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800"><p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Detection Rate</p><p className="text-xl font-black text-white font-mono">{sensitivityMetrics.detectionRate}%</p></div>
               <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800"><p className="text-[10px] font-bold text-slate-500 uppercase mb-2">False Positive</p><p className="text-xl font-black text-white font-mono">{sensitivityMetrics.fpr}%</p></div>
               <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800"><p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Filtering Depth</p><p className="text-xl font-black text-white font-mono">{sensitivityMetrics.filteringDepth}%</p></div>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col justify-center gap-4">
          <button onClick={handleRunAnalysis} disabled={isAnalyzing || !baselineParsed || !testParsed} className={`w-full py-8 rounded-2xl font-black text-xl flex flex-col items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95 ${isAnalyzing || !baselineParsed || !testParsed ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700' : 'bg-sky-600 hover:bg-sky-500 text-white shadow-2xl shadow-sky-500/20 border border-sky-400/30'}`}>
            {isAnalyzing ? <><Loader2 className="w-8 h-8 animate-spin" /><span className="text-sm">Processing Nodes...</span></> : <><Zap className="w-8 h-8 fill-current" />RUN FORENSICS</>}
          </button>
        </div>
      </div>
    </div>
  );

  const renderDashboardView = () => {
    if (!result) return renderUploadView();
    const isIntrusion = result.status === 'INTRUSION';
    const statusColor = isIntrusion ? 'text-red-500' : 'text-emerald-500';
    const bgColor = isIntrusion ? 'bg-red-500/10' : 'bg-emerald-500/10';
    const borderColor = isIntrusion ? 'border-red-500/30' : 'border-emerald-500/30';
    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-700 pb-10">
        <div className={`flex flex-col md:flex-row items-stretch gap-6`}>
          <div className={`flex-[2] p-8 rounded-3xl border-2 ${borderColor} ${bgColor} relative overflow-hidden`}>
            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Analysis Verdict</p>
                <h2 className={`text-5xl font-black tracking-tight ${statusColor}`}>{result.status === 'INTRUSION' ? 'INTRUSION DETECTED' : 'SYSTEM SECURE'}</h2>
                <div className="flex items-center gap-4 text-slate-400 font-medium font-mono text-sm"><History className="w-4 h-4" />{result.timestamp}</div>
              </div>
              <div className={`p-6 rounded-3xl ${isIntrusion ? 'bg-red-500/20' : 'bg-emerald-500/20'} shadow-2xl`}>{isIntrusion ? <AlertTriangle className="w-12 h-12 text-red-500" /> : <CheckCircle2 className="w-12 h-12 text-emerald-500" />}</div>
            </div>
            <div className={`absolute top-0 right-0 w-64 h-64 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 opacity-30 ${isIntrusion ? 'bg-red-600' : 'bg-emerald-600'}`}></div>
          </div>
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between shadow-xl">
             <TrendChart data={result.timeline} />
             <div className="mt-4 flex justify-between items-end">
                <div><p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Deviation Score</p><p className="text-3xl font-black text-white font-mono leading-none">{result.deviationScore.toFixed(1)}%</p></div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-black uppercase ${result.deviationScore > threshold ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{result.deviationScore > threshold ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{Math.abs(result.deviationScore - threshold).toFixed(1)}% DEV</div>
             </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden group">
           <div className="flex items-center gap-3 mb-4 relative z-10"><Zap className="w-5 h-5 text-sky-400" /><h3 className="text-base font-black uppercase tracking-widest text-slate-200">AI Forensic Evaluation</h3></div>
           <p className="text-slate-300 text-xl leading-relaxed font-semibold italic relative z-10">"{result.explanation || "Behavioral heuristics indicate a significant deviation from expected execution flow."}"</p>
        </div>
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-8"><SyscallChart data={filteredSyscalls} /></div>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-8 flex flex-col shadow-xl">
            <RiskMeter level={result.riskLevel} />
            <div className="flex-1 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Top Anomalies</h3>
              <div className="space-y-3 overflow-y-auto max-h-[340px] pr-2 scrollbar-thin">
                {result.syscalls.filter(s => s.deviation > 5).slice(0, 10).map((s, idx) => (
                  <div key={idx} className="bg-slate-950/50 border border-slate-800/50 p-4 rounded-2xl"><div className="flex justify-between items-center mb-1"><code className="text-sky-400 font-bold">{s.name}()</code><span className={`text-[10px] font-black ${s.deviation > threshold ? 'text-red-500' : 'text-orange-500'}`}>+{s.deviation.toFixed(0)}%</span></div></div>
                ))}
              </div>
            </div>
            <button onClick={resetAnalysis} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black text-xs uppercase transition-all">New Session</button>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentView = () => {
    switch (activeView) {
      case 'UPLOAD': return renderUploadView();
      case 'DASHBOARD': return renderDashboardView();
      case 'HISTORY': return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-8">Archived Logs</h2>
           <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-slate-950/50 border-b border-slate-800"><th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Verdict</th><th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Timestamp</th><th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-800">{history.map(item => (
                  <tr key={item.id} onClick={() => {setResult(item); setActiveView('DASHBOARD');}} className="hover:bg-slate-800/50 cursor-pointer transition-colors"><td className="px-6 py-4"><span className={`text-sm font-black uppercase ${item.status === 'INTRUSION' ? 'text-red-500' : 'text-emerald-500'}`}>{item.status}</span></td><td className="px-6 py-4 text-xs font-mono text-slate-400">{item.timestamp}</td><td className="px-6 py-4 text-right"><button className="p-2 bg-slate-800 hover:bg-sky-500/20 text-slate-400 hover:text-sky-400 rounded-lg"><ExternalLink className="w-4 h-4" /></button></td></tr>
                ))}</tbody>
              </table>
           </div>
        </div>
      );
      case 'ALERTS': return renderAlertCenter();
      case 'SETTINGS': return <div className="p-8"><h2 className="text-3xl font-black text-white uppercase mb-8">Configuration</h2><div className="bg-slate-900 p-8 rounded-3xl border border-slate-800"><p className="text-slate-400">Node Configuration and System Settings</p></div></div>;
      default: return renderUploadView();
    }
  };

  if (!isAuthenticated) return renderLoginView();

  return (
    <Layout activeView={activeView} setView={setActiveView} onLogout={handleLogout} alerts={alerts}>
      {renderCurrentView()}
      
      {/* Real-time Critical Alert Modal */}
      {activeAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-slate-950/60 animate-in fade-in duration-300">
          <div className="bg-slate-900 border-2 border-red-500/50 rounded-[40px] p-10 max-w-xl w-full shadow-[0_0_100px_rgba(239,68,68,0.2)] relative overflow-hidden ring-1 ring-red-500/20">
            <div className="absolute top-0 left-0 w-full h-2 bg-red-500 animate-pulse"></div>
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="bg-red-500/20 p-6 rounded-full border border-red-500/40 relative">
                <ShieldX className="w-16 h-16 text-red-500" />
                <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full -z-10 animate-pulse"></div>
              </div>
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Security Breach Detected</h2>
                <div className="flex justify-center gap-4 mb-4">
                  <span className="bg-red-500/10 text-red-500 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-red-500/20">Critical Alert</span>
                  <span className="bg-slate-800 text-slate-400 text-[10px] font-mono px-3 py-1 rounded-full border border-slate-700">NODE_LOCKDOWN: ACTIVE</span>
                </div>
                <p className="text-slate-300 italic text-lg leading-relaxed font-semibold">
                  "{activeAlert.message}"
                </p>
              </div>
              <div className="w-full grid grid-cols-2 gap-4">
                <button 
                  onClick={() => { markAlertRead(activeAlert.id); setActiveAlert(null); }}
                  className="py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black uppercase text-xs rounded-2xl transition-all"
                >
                  Dismiss Warning
                </button>
                <button 
                  onClick={() => { markAlertRead(activeAlert.id); viewAlertAnalysis(activeAlert); setActiveAlert(null); }}
                  className="py-4 bg-red-600 hover:bg-red-500 text-white font-black uppercase text-xs rounded-2xl transition-all shadow-xl shadow-red-500/20"
                >
                  Enter Forensic Mode
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
