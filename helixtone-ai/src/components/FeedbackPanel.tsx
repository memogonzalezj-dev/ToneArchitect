import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, Send, CheckCircle2, X, ShieldCheck } from "lucide-react";
import { TonePreset } from "../types";
import { DeviceConfig } from "../config/devices";

interface Props {
  preset:  TonePreset;
  device:  DeviceConfig;
  query:   string;
  onClose: () => void;
}

export default function FeedbackPanel({ preset, device, query, onClose }: Props) {
  const [rating,    setRating]    = useState(0);
  const [hover,     setHover]     = useState(0);
  const [feedback,  setFeedback]  = useState("");
  const [status,    setStatus]    = useState<"idle" | "sending" | "done" | "error">("idle");
  const [consent,   setConsent]   = useState<boolean | null>(null);

  useEffect(() => {
    window.electronAPI.getConsent().then(setConsent);
  }, []);

  const submit = async () => {
    if (rating === 0) return;
    setStatus("sending");

    const payload = {
      timestamp:       new Date().toISOString(),
      device:          device.label,
      query,
      preset_name:     preset.name,
      blocks:          preset.blocks.length,
      rating,
      feedback:        feedback.trim(),
      app_version:     "1.0.1-beta",
      trainingConsent: consent === true,
    };

    try {
      await window.electronAPI.submitFeedback(payload);
      setStatus("done");
      setTimeout(onClose, 1800);
    } catch {
      setStatus("error");
    }
  };

  const stars = [1, 2, 3, 4, 5];
  const labels = ["", "Didn't work", "Needs work", "Pretty close", "Good tone", "Nailed it"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      className="fixed bottom-6 right-6 z-50 w-80 bg-[#0D0E12] border border-white/10 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-blue-400 font-bold">Beta Feedback</p>
          <p className="text-xs text-white/50 mt-0.5 font-mono truncate">{preset.name}</p>
        </div>
        <button onClick={onClose} className="text-white/20 hover:text-white/60 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence mode="wait">

        {status === "done" ? (
          <motion.div
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-8 gap-3"
          >
            <CheckCircle2 className="w-8 h-8 text-green-400" />
            <p className="text-sm text-white/70">Thanks for the feedback!</p>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 space-y-5">

            {/* Star rating */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/30 block">
                How close was the tone?
              </label>
              <div className="flex gap-1">
                {stars.map((s) => (
                  <button
                    key={s}
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHover(s)}
                    onMouseLeave={() => setHover(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        s <= (hover || rating)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-white/10"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {(hover || rating) > 0 && (
                <p className="text-[10px] text-white/40 font-mono">
                  {labels[hover || rating]}
                </p>
              )}
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/30 block">
                What was off? (optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Too much gain, wrong cab, missing chorus…"
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-sm p-3 text-xs text-white/70 placeholder:text-white/20 outline-none focus:border-blue-500 transition-colors resize-none font-mono"
              />
            </div>

            {/* Submit */}
            {status === "error" && (
              <p className="text-[10px] text-red-400 font-mono">
                Could not send — check your connection.
              </p>
            )}
            <button
              onClick={submit}
              disabled={rating === 0 || status === "sending"}
              className="w-full h-10 bg-blue-500 hover:bg-blue-400 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-[10px] tracking-[0.3em] transition-colors flex items-center justify-center gap-2"
            >
              {status === "sending" ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  SUBMIT FEEDBACK
                </>
              )}
            </button>

            <button
              onClick={async () => {
                const next = !(consent === true);
                await window.electronAPI.setConsent(next);
                setConsent(next);
              }}
              className="w-full flex items-center gap-2 text-[9px] text-white/20 hover:text-white/40 transition-colors group"
            >
              <ShieldCheck className={`w-3 h-3 flex-shrink-0 ${consent === true ? "text-blue-400" : "text-white/20"}`} />
              <span className="text-left leading-relaxed">
                {consent === true
                  ? "Sharing query & rating to improve the AI — tap to opt out"
                  : "Not sharing training data — tap to opt in"}
              </span>
            </button>

          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}
