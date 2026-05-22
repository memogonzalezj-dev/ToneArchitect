import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cpu, Download, CheckCircle2, AlertCircle, RefreshCw, HardDrive, MemoryStick, Zap } from "lucide-react";
import {
  checkLlamaRunning,
  checkModelAvailable,
  pullModel,
  PullProgress,
} from "../services/llamaService";

type Step = "checking" | "need_model" | "pulling" | "ready";

interface Props {
  onReady: () => void;
}

export default function LlamaSetup({ onReady }: Props) {
  const [step, setStep]         = useState<Step>("checking");
  const [pull, setPull]         = useState<PullProgress | null>(null);
  const [pullError, setPullError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    setChecking(true);
    const hasModel = await checkModelAvailable();
    if (!hasModel) { setStep("need_model"); setChecking(false); return; }
    const ready = await checkLlamaRunning();
    if (ready) {
      setStep("ready");
      setChecking(false);
      setTimeout(onReady, 600);
    } else {
      setStep("need_model");
      setChecking(false);
    }
  }, [onReady]);

  useEffect(() => { check(); }, [check]);

  const startPull = async () => {
    setStep("pulling");
    setPullError(null);
    setPull({ status: "Starting download…", percent: 0, done: false });
    try {
      await pullModel((p) => {
        setPull(p);
        if (p.done) {
          setTimeout(onReady, 800);
        }
      });
    } catch (e) {
      setPullError(e instanceof Error ? e.message : "Download failed. Check your internet connection.");
      setStep("need_model");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-[#E0E0E0] flex items-center justify-center px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg space-y-8"
      >
        {/* Logo */}
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">AI Guitar Preset Generator</span>
          <h1 className="text-2xl font-light tracking-tighter text-white mt-1">
            TONE<span className="font-bold text-blue-500">ARCHITECT</span>
          </h1>
        </div>

        {/* Requirements badge */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <Cpu className="w-4 h-4" />,        label: "Apple Silicon", sub: "M2 or later" },
            { icon: <MemoryStick className="w-4 h-4" />, label: "Memory",        sub: "8 GB RAM min" },
            { icon: <HardDrive className="w-4 h-4" />,   label: "Free Space",    sub: "6 GB needed" },
          ].map((r) => (
            <div key={r.label} className="bg-white/[0.03] border border-white/10 rounded-sm p-3 flex flex-col items-center text-center gap-1">
              <span className="text-blue-400">{r.icon}</span>
              <span className="text-[10px] uppercase tracking-widest text-white/50">{r.label}</span>
              <span className="text-[11px] font-mono text-white/80">{r.sub}</span>
            </div>
          ))}
        </div>

        {/* Main card */}
        <div className="bg-white/5 border border-white/10 p-1 rounded-sm">
          <div className="bg-[#0D0E12] p-8 space-y-6">

            <AnimatePresence mode="wait">

              {/* Checking */}
              {step === "checking" && (
                <motion.div key="checking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-4 py-4">
                  <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin flex-shrink-0" />
                  <span className="text-sm text-white/50">Checking AI model status…</span>
                </motion.div>
              )}

              {/* Need model downloaded */}
              {step === "need_model" && (
                <motion.div key="need_model" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="space-y-6">
                  <div className="flex items-start gap-3">
                    <Download className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-white">Download AI model</p>
                      <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
                        One-time download of Meta Llama 3.1 8B (~5 GB).
                        After this, everything runs locally — no internet needed.
                      </p>
                    </div>
                  </div>

                  {pullError && (
                    <div className="flex items-start gap-2 text-red-400 text-[11px]">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{pullError}</span>
                    </div>
                  )}

                  <button
                    onClick={startPull}
                    className="w-full h-12 bg-blue-500 hover:bg-blue-400 text-white font-bold tracking-[0.3em] text-[10px] transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    DOWNLOAD MODEL (5 GB)
                  </button>

                  <button
                    onClick={check}
                    disabled={checking}
                    className="w-full h-11 border border-white/20 text-white/50 hover:text-white hover:border-white/40 text-[10px] font-mono tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3 h-3 ${checking ? "animate-spin" : ""}`} />
                    CHECK AGAIN
                  </button>
                </motion.div>
              )}

              {/* Pulling model */}
              {step === "pulling" && pull && (
                <motion.div key="pulling" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">Downloading model…</span>
                    <span className="text-sm font-mono text-blue-400">{pull.percent}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-blue-500 rounded-full"
                      animate={{ width: `${pull.percent}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest truncate">
                    {pull.status}
                  </p>

                  <p className="text-[10px] text-white/20 leading-relaxed">
                    This is a one-time download. Close and reopen the app any time —
                    it will resume automatically.
                  </p>
                </motion.div>
              )}

              {/* Ready */}
              {step === "ready" && (
                <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-4 py-4">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">All set — launching…</p>
                    <p className="text-[11px] text-white/40 mt-0.5">Model ready on your Mac.</p>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-[10px] text-white/20 font-mono tracking-wider">
          RUNS 100% ON YOUR MAC · NO CLOUD · NO API FEES · WORKS OFFLINE
        </p>
        <p className="text-center text-[9px] text-white/10 font-mono tracking-wider mt-1">
          NOT AFFILIATED WITH LINE 6, INC. · © 2026 MEMO GONZALEZ
        </p>
      </motion.div>
    </div>
  );
}
