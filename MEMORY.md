# Tone Architect — Session Memory

> Update this file at the end of every session before compacting.

---

## Project Overview

**Tone Architect** — AI-powered guitar preset generator for Line 6 HX devices.
Generates `.hlx` preset files from natural language tone descriptions.
Runs 100% locally via local Llama 3.1 8B + Apple Metal. No cloud. No subscriptions.

**Root:** `/Users/memo/ToneAI`
**Repo:** `https://github.com/memogonzalezj-dev/ToneArchitect` (public)
**Author:** Memo Gonzalez (`memogonzalezj@gmail.com`)

---

## Current Version: 1.0.2

### Version bump checklist (every release):
- [ ] `package.json` → `"version"`
- [ ] `electron/main.js` → About dialog + USER_GUIDE string
- [ ] `helixtone-ai/src/components/FeedbackPanel.tsx` → `app_version` field
- Patch = bug fix / small feature (`1.0.2` → `1.0.3`)
- Minor = significant feature (`1.0.2` → `1.1.0`)
- Major = public launch / rewrite (`1.1.0` → `2.0.0`)

---

## Tech Stack

| Layer | Tech |
|---|---|
| Desktop shell | Electron 42 |
| Renderer | React 19 + Vite + Tailwind |
| AI inference | node-llama-cpp v3 (Apple Metal) |
| Model | Meta Llama 3.1 8B Q4_K_M (bartowski mirror) |
| Model path | `~/Library/Application Support/tone-architect/models/llama3.1-8b.gguf` |
| IPC bridge | `electron/preload.js` contextBridge |
| Feedback | Google Sheets via Apps Script POST |
| Distribution | Unsigned DMG + `install.sh` one-liner |

---

## Key Files

```
ToneAI/
├── electron/
│   ├── main.js              # Main process — IPC handlers, Llama init, feedback, consent
│   └── preload.js           # contextBridge — all window.electronAPI methods
├── helixtone-ai/src/
│   ├── App.tsx              # Main UI — device selector, form, results, feedback panel
│   ├── types.ts             # All TypeScript interfaces incl. ElectronAPI
│   ├── config/
│   │   └── devices.ts       # Device registry (HX Stomp, HX Effects, coming soon: XL, One)
│   ├── components/
│   │   ├── LlamaSetup.tsx   # First-launch: model download + consent screen
│   │   └── FeedbackPanel.tsx # Star rating + feedback submission
│   └── services/
│       ├── llamaService.ts  # Prompt builder, analyzeTone(), block hard cap
│       └── helixService.ts  # HLX JSON generator, downloadPreset()
├── install.sh               # One-command installer (handles Gatekeeper quarantine)
├── MEMORY.md                # ← this file
└── package.json             # version, build config, scripts
```

---

## Git Workflow (ALWAYS follow this)

```bash
# Start every session:
git checkout main && git pull origin main
git checkout -b session/vX.X.X-feature-name

# Before creating PR:
git fetch origin main && git merge origin/main --no-edit

# Push (SSH only works in user's terminal, not Claude's bash):
git push origin <branch>

# Merge to main directly for small fixes (skip PR):
git checkout main && git pull origin main
git checkout <feature-branch> -- <file>
git add <file> && git commit -m "..." && git push origin main
git checkout <feature-branch>
```

**Note:** SSH key only works in the user's terminal. Claude cannot push/pull.

---

## Devices

| Device | ID | Blocks | Amp+Cab | Status |
|---|---|---|---|---|
| HX Stomp | 2162694 | 6 | Yes | ✅ Available |
| HX Effects | 2162693 | 9 | No | ✅ Available |
| HX Stomp XL | UNVERIFIED | 8 | Yes | 🔜 Coming soon |
| HX One | UNKNOWN | 1 | No | 🔜 Coming soon |

To unlock XL/One: need actual `.hlx` file exported from that device to confirm `device_id`.

---

## Beta Program

- **15 beta users**, distributed via `install.sh` one-liner
- **Expiry:** Sept 1 2026 (`IS_BETA_BUILD = true` in `electron/main.js`)
- **Feedback:** Google Sheets via Apps Script
  - Endpoint in `electron/main.js` → `FEEDBACK_ENDPOINT`
  - Columns: Timestamp, Device, Query, Preset Name, Blocks, Rating, Feedback, App Version, Consent, Preset JSON
- **Consent:** stored in `~/Library/Application Support/tone-architect/consent.json`
- **Training data:** `preset_json` field captures full preset for future fine-tuning

---

## Latest Release

- **DMG:** `dist_desktop/Tone Architect-1.0.2-arm64.dmg`
- **GitHub Release:** `https://github.com/memogonzalezj-dev/ToneArchitect/releases/tag/v1.0.2.1`
- **Install command:**
  ```bash
  curl -fsSL https://raw.githubusercontent.com/memogonzalezj-dev/ToneArchitect/main/install.sh | bash
  ```

---

## Last Session Work (2026-05-23)

### Completed
- Fixed node-llama-cpp v2 → v3 API (dynamic import, LlamaChatSession, context disposal)
- Fixed model download (built-in HuggingFace downloader, bartowski public mirror)
- Fixed feedback POST (redirect-following, Google Apps Script 302 handling)
- Added beta feedback panel (star rating + optional comment)
- Added training-data consent screen (first launch, stored locally)
- Added `preset_json` to feedback payload for future fine-tuning
- DSP block hard cap enforced in code (model output always sliced to `device.maxBlocks`)
- Fixed Vite dev port (3000 → 5173)
- Added `install.sh` one-command installer (Gatekeeper quarantine fix)
- Merged everything to `main`, repo made public

### Known Issues
- HX Stomp XL and HX One still `available: false` — need real `.hlx` files to confirm device IDs
- Apple Developer ID not purchased yet ($99) — app is unsigned, install.sh handles quarantine

---

## Next Session: Audio Analysis Feature (v1.1.0)

### Feature spec
User uploads an audio file of a tone they want to replicate.
App analyzes it locally (no cloud) and generates a matching preset.

### Architecture (100% local — no Gemini needed)
1. **Web Audio API** (built into Electron/browser) analyzes the audio file
2. Extracts: distortion level, brightness, low/mid/high balance, reverb tail, delay presence, compression, clean vs saturated
3. Converts measurements to a text description
4. Passes text description to local Llama → generates preset

### Signal processing → preset mapping
| Measurement | API method | Maps to |
|---|---|---|
| Distortion | Zero-crossing rate | Drive/Gain values |
| Brightness | Spectral centroid | Treble/Tone/Presence |
| Low end | Low-freq energy ratio | Bass knob |
| Reverb | RT60 decay estimation | Reverb mix + size |
| Delay | Autocorrelation | Delay time + mix |
| Compression | Dynamic range ratio | Compressor threshold |
| Saturation | Harmonic distortion | Amp type selection |

### Files to create/modify
- `helixtone-ai/src/services/audioAnalysis.ts` ← NEW
- `helixtone-ai/src/App.tsx` — wire upload audio → analysis → inject into prompt
- `helixtone-ai/src/services/llamaService.ts` — accept audio descriptor in prompt
- `helixtone-ai/src/types.ts` — add `AudioAnalysis` interface

### Start command for next session
```bash
cd /Users/memo/ToneAI && git checkout main && git pull origin main && git checkout -b session/v1.1.0-audio-analysis
```

---

## How to Start a New Session

Paste this as your first message:
> "Read MEMORY.md at /Users/memo/ToneAI/MEMORY.md and continue from where we left off."

Claude will read this file and have full context instantly.
