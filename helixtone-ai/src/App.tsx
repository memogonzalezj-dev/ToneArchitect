import { useState, useEffect, ChangeEvent, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Music,
  Settings2,
  Download,
  Zap,
  Info,
  Loader2,
  Plus,
  FileAudio,
  Cpu,
  ChevronDown,
  Star,
  Youtube,
  X,
  CheckCircle2,
} from "lucide-react";
import { analyzeTone } from "./services/llamaService";
import { analyzeAudio, analyzeYoutubeAudio } from "./services/audioAnalysis";
import { downloadPreset } from "./services/helixService";
import { TonePreset, ToneRequest, AudioAnalysis } from "./types";
import { DEVICES, DeviceConfig, DEFAULT_DEVICE } from "./config/devices";
import LlamaSetup from "./components/LlamaSetup";
import FeedbackPanel from "./components/FeedbackPanel";

type AppView = "checking" | "setup" | "main";

export default function App() {
  const [view, setView]         = useState<AppView>("checking");
  const [loading, setLoading]   = useState(false);
  const [preset, setPreset]     = useState<TonePreset | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [device, setDevice]         = useState<DeviceConfig>(DEFAULT_DEVICE);
  const [deviceOpen, setDeviceOpen] = useState(false);
  const deviceRef                   = useRef<HTMLDivElement>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const [query, setQuery]         = useState("");
  const [guitar, setGuitar]       = useState("");
  const [hasPedals, setHasPedals] = useState(false);
  const [gearImage, setGearImage] = useState<string | null>(null);

  // Audio reference state
  const [audioAnalysis, setAudioAnalysis]     = useState<AudioAnalysis | null>(null);
  const [audioLabel, setAudioLabel]           = useState<string | null>(null);
  const [audioMode, setAudioMode]             = useState<"file" | "youtube">("file");
  const [youtubeUrl, setYoutubeUrl]           = useState("");
  const [audioAnalysing, setAudioAnalysing]   = useState(false);
  const [audioError, setAudioError]           = useState<string | null>(null);

  // Close device dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (deviceRef.current && !deviceRef.current.contains(e.target as Node)) {
        setDeviceOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    // Llama model check is done inside LlamaSetup — just go straight to setup screen
    setView("setup");
  }, []);

  const handleGearUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setGearImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAudioFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioAnalysing(true);
    setAudioError(null);
    setAudioAnalysis(null);
    try {
      const result = await analyzeAudio(file);
      setAudioAnalysis(result);
      setAudioLabel(file.name);
    } catch (err) {
      setAudioError(err instanceof Error ? err.message : "Audio analysis failed.");
    } finally {
      setAudioAnalysing(false);
    }
  };

  const handleYoutubeAnalyse = async () => {
    const url = youtubeUrl.trim();
    if (!url) return;
    setAudioAnalysing(true);
    setAudioError(null);
    setAudioAnalysis(null);
    try {
      const result = await analyzeYoutubeAudio(url);
      setAudioAnalysis(result);
      setAudioLabel("YouTube reference");
    } catch (err) {
      setAudioError(err instanceof Error ? err.message : "YouTube download failed.");
    } finally {
      setAudioAnalysing(false);
    }
  };

  const clearAudio = () => {
    setAudioAnalysis(null);
    setAudioLabel(null);
    setYoutubeUrl("");
    setAudioError(null);
  };

  const handleSubmit = async () => {
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      const request: ToneRequest = {
        query,
        guitarType: guitar,
        hasExtraPedals: hasPedals,
        pedalboardImage: gearImage || undefined,
      };
      const result = await analyzeTone(request, device, audioAnalysis ?? undefined);
      setPreset(result);
      setShowFeedback(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze tone. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPreset(null);
    setQuery("");
    setGuitar("");
    setHasPedals(false);
    setGearImage(null);
    clearAudio();
    setError(null);
  };

  const handleChangeModel = () => {
    reset();
    setView("setup");
  };

  if (view === "checking") {
    return (
      <div className="min-h-screen bg-[#0A0B0E] flex items-center justify-center">
        <div className="w-8 h-0.5 bg-blue-500/40 overflow-hidden relative">
          <motion.div
            className="absolute inset-0 bg-blue-500"
            animate={{ x: [-32, 32] }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          />
        </div>
      </div>
    );
  }

  if (view === "setup") {
    return <LlamaSetup onReady={() => setView("main")} />;
  }

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-[#E0E0E0] font-sans">
      <header className="border-b border-white/10 px-8 py-6 flex items-center justify-between sticky top-0 bg-[#0A0B0E]/80 backdrop-blur-md z-50">
        <div className="flex flex-col cursor-pointer" onClick={reset}>
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-1">AI Guitar Preset Generator</span>
          <h1 className="text-2xl font-light tracking-tighter text-white">
            TONE<span className="font-bold text-blue-500">ARCHITECT</span>
          </h1>
        </div>
        <div className="flex gap-6 items-center">
          {/* Device selector */}
          <div className="relative" ref={deviceRef}>
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Device Target</span>
              <button
                onClick={() => setDeviceOpen((o) => !o)}
                className="flex items-center gap-2 text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span>{device.label}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${deviceOpen ? "rotate-180" : ""}`} />
              </button>
            </div>

            <AnimatePresence>
              {deviceOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-52 bg-[#0D0E12] border border-white/10 shadow-2xl z-50 overflow-hidden"
                >
                  {DEVICES.map((d) => (
                    <button
                      key={d.id}
                      disabled={!d.available}
                      onClick={() => {
                        if (d.available) {
                          setDevice(d);
                          setPreset(null);
                          setDeviceOpen(false);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors
                        ${d.id === device.id ? "bg-blue-500/10 text-blue-400" : ""}
                        ${d.available && d.id !== device.id ? "text-white/70 hover:bg-white/5" : ""}
                        ${!d.available ? "text-white/20 cursor-not-allowed" : ""}
                      `}
                    >
                      <div className="flex flex-col">
                        <span className="text-[11px] font-mono font-bold">{d.label}</span>
                        <span className="text-[9px] text-white/30 mt-0.5">
                          {d.available
                            ? `${d.maxBlocks} blocks${d.hasAmpCab ? " · amp+cab" : " · effects only"}`
                            : "Coming soon"}
                        </span>
                      </div>
                      {d.id === device.id && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={handleChangeModel}
            title="Model settings"
            className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Cpu className="w-4 h-4 text-white/40" />
          </button>
          <button
            onClick={reset}
            className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto">
        <AnimatePresence mode="wait">
          {!preset && !loading ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
            >
              <div className="space-y-8">
                <div className="space-y-4">
                  <span className="text-[10px] uppercase tracking-[0.4em] text-blue-500 font-bold">Neural Tone Engine</span>
                  <h2 className="text-6xl sm:text-8xl font-black tracking-tighter text-white leading-[0.85]">
                    PERFECT <br />
                    <span className="text-white/20">TONE.</span>
                  </h2>
                </div>
                <p className="text-white/40 font-serif italic text-xl max-w-md leading-relaxed">
                  Extract the soul of any record. Map digital signals to hardware limitations with surgical precision.
                </p>
                <div className="flex gap-4">
                  <div className="h-0.5 w-12 bg-blue-500" />
                  <div className="h-0.5 w-12 bg-white/10" />
                  <div className="h-0.5 w-12 bg-white/10" />
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-1 rounded-sm shadow-2xl">
                <div className="bg-[#0D0E12] p-8 space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 block">Sonic Reference</label>
                    <textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="e.g. Pink Floyd - Comfortably Numb (Solo 2)"
                      className="w-full bg-white/5 border border-white/10 rounded-sm p-5 text-lg focus:border-blue-500 outline-none transition-all placeholder:text-white/10 min-h-[120px] font-serif italic resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 block">Hardware Profile</label>
                      <input
                        type="text"
                        value={guitar}
                        onChange={(e) => setGuitar(e.target.value)}
                        placeholder="e.g. Fender Strat SSS"
                        className="w-full bg-white/5 border border-white/10 rounded-sm p-4 text-xs font-mono focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 block">Gear Photo</label>
                      <label className="cursor-pointer block">
                        <input type="file" accept="image/*" onChange={handleGearUpload} className="hidden" />
                        <div className={`h-11 border rounded-sm flex items-center justify-center gap-2 transition-all ${gearImage ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-white/10 bg-white/5 text-white/30 hover:border-white/20"}`}>
                          {gearImage
                            ? <img src={gearImage} className="w-5 h-5 object-cover rounded-sm grayscale" />
                            : <Music className="w-4 h-4" />}
                          <span className="text-[9px] font-mono tracking-widest uppercase">{gearImage ? "GEAR LOADED" : "UPLOAD GEAR"}</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Audio Reference Panel */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-white/30">Audio Reference</label>
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setAudioMode("file"); clearAudio(); }}
                          className={`px-2 py-1 text-[9px] font-mono tracking-widest transition-colors rounded-sm ${audioMode === "file" ? "bg-blue-500/20 text-blue-400" : "text-white/20 hover:text-white/40"}`}
                        >FILE</button>
                        <button
                          onClick={() => { setAudioMode("youtube"); clearAudio(); }}
                          className={`px-2 py-1 text-[9px] font-mono tracking-widest transition-colors rounded-sm ${audioMode === "youtube" ? "bg-blue-500/20 text-blue-400" : "text-white/20 hover:text-white/40"}`}
                        >YOUTUBE</button>
                      </div>
                    </div>

                    {audioAnalysis ? (
                      <div className="border border-blue-500/40 bg-blue-500/5 rounded-sm p-3 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 min-w-0">
                          <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-[9px] font-mono text-blue-400 uppercase tracking-widest truncate">{audioLabel}</p>
                            <p className="text-[9px] text-white/30 mt-1 leading-relaxed">{audioAnalysis.description}</p>
                          </div>
                        </div>
                        <button onClick={clearAudio} className="text-white/20 hover:text-white/60 flex-shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : audioAnalysing ? (
                      <div className="h-11 border border-white/10 rounded-sm flex items-center justify-center gap-2 text-white/30">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-[9px] font-mono tracking-widest uppercase">
                          {audioMode === "youtube" ? "Downloading + Analysing…" : "Analysing…"}
                        </span>
                      </div>
                    ) : audioMode === "file" ? (
                      <label className="cursor-pointer block">
                        <input type="file" accept="audio/*" onChange={handleAudioFileUpload} className="hidden" />
                        <div className="h-11 border border-white/10 bg-white/5 rounded-sm flex items-center justify-center gap-2 text-white/30 hover:border-white/20 transition-all">
                          <FileAudio className="w-4 h-4" />
                          <span className="text-[9px] font-mono tracking-widest uppercase">Upload Audio File</span>
                        </div>
                      </label>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={youtubeUrl}
                          onChange={(e) => setYoutubeUrl(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleYoutubeAnalyse()}
                          placeholder="https://youtube.com/watch?v=..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-sm px-3 h-11 text-[11px] font-mono focus:border-blue-500 outline-none transition-all placeholder:text-white/10"
                        />
                        <button
                          onClick={handleYoutubeAnalyse}
                          disabled={!youtubeUrl.trim()}
                          className="h-11 px-4 bg-white/5 border border-white/10 hover:border-blue-500 hover:text-blue-400 text-white/30 transition-all disabled:opacity-30 rounded-sm"
                        >
                          <Youtube className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {audioError && (
                      <p className="text-[9px] text-red-400 font-mono">{audioError}</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={() => setHasPedals(!hasPedals)}
                      className={`w-full px-4 h-11 rounded-sm border text-[10px] font-mono tracking-widest transition-all flex items-center justify-between ${hasPedals ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-white/10 bg-white/5 text-white/30 hover:border-white/20"}`}
                    >
                      <span>USE EXTERNAL PEDALBOARD OPTIMIZATION</span>
                      <div className={`w-2 h-2 rounded-full ${hasPedals ? "bg-blue-500" : "bg-white/10"}`} />
                    </button>

                    <button
                      onClick={handleSubmit}
                      disabled={!query || loading}
                      className="w-full h-14 bg-blue-500 hover:bg-blue-400 text-white font-bold tracking-[0.3em] text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      INITIALIZE SYNTHESIS
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

          ) : loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-48 space-y-6"
            >
              <div className="w-16 h-1 bg-white/10 overflow-hidden relative">
                <motion.div
                  className="absolute inset-0 bg-blue-500"
                  animate={{ x: [-64, 64] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                />
              </div>
              <div className="text-center">
                <span className="text-[10px] uppercase tracking-[0.5em] text-blue-400 block mb-1">Processing Neural Data</span>
                <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Optimizing DSP for Analog Consistency</span>
              </div>
            </motion.div>

          ) : preset ? (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]"
            >
              {/* Sidebar */}
              <aside className="lg:w-1/3 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col justify-between space-y-12 bg-[#0A0B0E]">
                <section>
                  <div className="mb-10">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 block mb-4">Sonic Reference</label>
                    <div className="bg-white/5 border border-white/10 p-6 rounded-sm mb-4">
                      <h2 className="text-4xl font-serif italic text-white mb-1 leading-none">{preset.artist}</h2>
                      <p className="text-blue-400 font-mono text-xs uppercase tracking-tight mt-2">{preset.songOrAlbum}</p>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-sm">
                      <Info className="w-4 h-4 text-white/20 mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] text-white/40 leading-relaxed uppercase tracking-wider">{preset.explanation}</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 block mb-3">Hardware Mapping</label>
                      <div className="border-l-2 border-blue-500 bg-white/5 p-4 flex justify-between items-center">
                        <span className="text-xs uppercase tracking-widest font-mono">Input Device</span>
                        <span className="text-xs text-white/40">{guitar || "Standard Coil"}</span>
                      </div>
                    </div>
                    {hasPedals && (
                      <div>
                        <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 block mb-3">DSP Offloading</label>
                        <div className="border border-green-500/20 bg-green-500/5 p-4 flex justify-between items-center">
                          <span className="text-xs text-green-500 font-mono">External Gear Used</span>
                          <Zap className="w-3 h-3 text-green-500" />
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <section className="space-y-3">
                  <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-sm text-center">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-blue-400 block mb-4">Ready for Export</span>
                    <button
                      onClick={() => downloadPreset(preset, device)}
                      className="w-full bg-blue-500 hover:bg-blue-400 text-white py-4 font-bold tracking-[0.3em] text-[10px] transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      SAVE .HLX PRESET
                    </button>
                  </div>
                  <button
                    onClick={() => setShowFeedback(true)}
                    className="w-full h-9 border border-white/10 text-white/30 hover:text-white/60 hover:border-white/20 text-[10px] font-mono tracking-widest transition-colors flex items-center justify-center gap-2"
                  >
                    <Star className="w-3 h-3" />
                    RATE THIS PRESET
                  </button>
                </section>
              </aside>

              {/* Main content */}
              <section className="flex-1 p-8 lg:p-12 bg-[#0D0E12] flex flex-col space-y-12">
                <div className="flex flex-col md:flex-row justify-between md:items-end gap-8 pb-8 border-b border-white/5">
                  <h3 className="text-6xl sm:text-8xl font-black tracking-tighter text-white/10 leading-none select-none uppercase">SIGNAL CHAIN</h3>
                  <div className="flex gap-10">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-white/30 uppercase tracking-widest">DSP Efficiency</span>
                      <div className="w-32 h-1 bg-white/10 mt-2 relative">
                        <div
                          className="absolute top-0 left-0 h-full bg-blue-500 transition-all"
                          style={{ width: `${Math.min(100, (preset.blocks.length / device.maxBlocks) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono mt-2 text-blue-400">
                        {Math.round((preset.blocks.length / device.maxBlocks) * 100)}%
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-white/30 uppercase tracking-widest">Blocks</span>
                      <span className="text-2xl font-mono text-white leading-none">{preset.blocks.length} / {device.maxBlocks}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-4">
                  {preset.blocks.map((block, i) => (
                    <div
                      key={i}
                      className={`aspect-square bg-white/5 border border-white/10 flex flex-col items-center justify-center p-4 hover:bg-white/10 transition-all ${block.type === "amp" ? "border-l-4 border-l-orange-500" : ""}`}
                    >
                      <span className={`text-[10px] font-mono mb-3 ${block.type === "amp" ? "text-orange-400" : "text-blue-400"}`}>
                        BLOCK 0{i + 1}
                      </span>
                      <div className={`w-10 h-10 rounded-sm mb-3 flex items-center justify-center ${getBlockColor(block.type)}`}>
                        {getBlockIcon(block.type)}
                      </div>
                      <span className="text-[10px] font-bold text-center tracking-tighter truncate w-full text-center">
                        {block.model.split("_").pop()}
                      </span>
                      <span className="text-[8px] text-white/30 mt-1 uppercase tracking-widest">{block.type}</span>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, device.maxBlocks - preset.blocks.length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square bg-white/[0.01] border border-white/[0.03] flex items-center justify-center">
                      <Plus className="w-4 h-4 text-white/5" />
                    </div>
                  ))}
                </div>

                <div className="flex-1 bg-white/[0.02] border border-white/5 p-8 rounded-sm">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-white/60">Manual Configuration Guide</h4>
                    <span className="px-2 py-1 bg-white/5 text-[9px] font-mono border border-white/10 uppercase tracking-tighter">
                      REF: {preset.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-1">
                    {preset.blocks.flatMap((block) =>
                      Object.entries(block.parameters).map(([k, v]) => {
                        const num = typeof v === "number" ? v : parseFloat(String(v));
                        const display = !isNaN(num) && num >= 0 && num <= 1
                          ? (num * 10).toFixed(1)
                          : String(v);
                        return (
                          <div key={`${block.key}-${k}`} className="flex justify-between items-center py-2.5 border-b border-white/[0.03] group">
                            <span className="text-xs text-white/30 font-serif italic group-hover:text-white/60 transition-colors">
                              {block.model} <span className="opacity-40">•</span> {k}
                            </span>
                            <span className="text-xs font-mono text-blue-400">{display}</span>
                          </div>
                        );
                      })
                    ).slice(0, 24)}
                  </div>

                  <div className="mt-8 p-4 bg-white/5 rounded-sm">
                    <p className="text-[10px] text-white/30 font-mono leading-relaxed whitespace-pre-wrap">
                      {preset.manualInstructions}
                    </p>
                  </div>
                </div>
              </section>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      <footer className="border-t border-white/10 px-8 py-5 flex items-center justify-between bg-black text-[9px] uppercase tracking-[0.25em] text-white/20">
        <div>Tone Architect v1.0.0 • Not affiliated with Line 6, Inc.</div>
        <div>© 2026 MEMO GONZALEZ • Compatible with Line 6 {device.label}</div>
      </footer>

      <AnimatePresence>
        {showFeedback && preset && (
          <FeedbackPanel
            preset={preset}
            device={device}
            query={query}
            onClose={() => setShowFeedback(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 right-8 z-[60] bg-red-950 border border-red-500/50 text-red-500 px-6 py-4 rounded-sm flex items-center gap-4 shadow-2xl max-w-md"
          >
            <Info className="w-5 h-5 flex-shrink-0" />
            <p className="text-[10px] font-bold uppercase tracking-widest">{error}</p>
            <button onClick={() => setError(null)} className="ml-4 hover:text-white flex-shrink-0">
              <Plus className="w-4 h-4 rotate-45" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getBlockIcon(type: string) {
  switch (type.toLowerCase()) {
    case "amp":        return <Zap className="w-4 h-4" />;
    case "distortion": return <Zap className="w-4 h-4" />;
    case "delay":      return <Loader2 className="w-4 h-4" />;
    case "reverb":     return <Loader2 className="w-4 h-4 opacity-50" />;
    case "modulation": return <Settings2 className="w-4 h-4" />;
    case "cab":        return <Music className="w-4 h-4" />;
    default:           return <Plus className="w-4 h-4 opacity-20" />;
  }
}

function getBlockColor(type: string) {
  switch (type.toLowerCase()) {
    case "amp":        return "bg-orange-500/10 text-orange-500 border border-orange-500/20";
    case "distortion": return "bg-red-500/10 text-red-500";
    case "delay":      return "bg-green-500/10 text-green-500";
    case "reverb":     return "bg-blue-500/10 text-blue-500";
    case "modulation": return "bg-purple-500/10 text-purple-500";
    case "cab":        return "bg-white/5 text-white/40";
    default:           return "bg-blue-500/10 text-blue-500";
  }
}
