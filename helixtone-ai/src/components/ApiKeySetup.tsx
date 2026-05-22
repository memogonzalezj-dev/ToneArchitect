import { useState } from "react";
import { motion } from "motion/react";
import { Key, ExternalLink, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  onKeySet: () => void;
}

export default function ApiKeySetup({ onKeySet }: Props) {
  const [key, setKey]         = useState("");
  const [visible, setVisible] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleSave = async () => {
    const trimmed = key.trim();
    if (!trimmed.startsWith("AIza")) {
      setError("That doesn't look like a valid Gemini API key. Keys start with AIza…");
      return;
    }
    setSaving(true);
    setError(null);
    const ok = await window.electronAPI.setApiKey(trimmed);
    setSaving(false);
    if (ok) {
      onKeySet();
    } else {
      setError("Failed to save key to keychain. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-[#E0E0E0] flex items-center justify-center px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        {/* Logo */}
        <div className="mb-12">
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">Audio Intelligence Platform</span>
          <h1 className="text-2xl font-light tracking-tighter text-white mt-1">
            TONE<span className="font-bold text-blue-500">ARCHITECT</span>.hx
          </h1>
        </div>

        <div className="bg-white/5 border border-white/10 p-1 rounded-sm">
          <div className="bg-[#0D0E12] p-8 space-y-8">

            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-sm bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Key className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white">Connect Gemini AI</h2>
                <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
                  ToneArchitect uses Google Gemini to analyze guitar tones. Your key is stored
                  encrypted in your Mac's Keychain — never sent anywhere except Google's API.
                </p>
              </div>
            </div>

            {/* Key input */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 block">
                Gemini API Key
              </label>
              <div className="relative">
                <input
                  type={visible ? "text" : "password"}
                  value={key}
                  onChange={(e) => { setKey(e.target.value); setError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  placeholder="AIza…"
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 pr-12 text-sm font-mono focus:border-blue-500 outline-none transition-all placeholder:text-white/10"
                  spellCheck={false}
                  autoComplete="off"
                />
                <button
                  onClick={() => setVisible(!visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                >
                  {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-red-400">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="text-[11px]">{error}</span>
                </div>
              )}
            </div>

            {/* Where to get a key */}
            <div className="bg-white/[0.03] border border-white/5 rounded-sm p-4 space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-white/30">How to get a free key</p>
              <ol className="space-y-1.5">
                {[
                  "Go to aistudio.google.com",
                  'Click "Get API key" → "Create API key"',
                  "Copy the key and paste it above",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-white/50">
                    <span className="text-blue-500 font-mono font-bold flex-shrink-0">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 transition-colors mt-2"
              >
                <ExternalLink className="w-3 h-3" />
                Open AI Studio
              </a>
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={!key.trim() || saving}
              className="w-full h-12 bg-blue-500 hover:bg-blue-400 text-white font-bold tracking-[0.3em] text-[10px] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  SAVING…
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  SAVE KEY & CONTINUE
                </>
              )}
            </button>

          </div>
        </div>

        <p className="text-center text-[10px] text-white/20 mt-6 font-mono tracking-wider">
          KEY IS ENCRYPTED AND STORED LOCALLY IN MACOS KEYCHAIN
        </p>
      </motion.div>
    </div>
  );
}
