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

## Current Version: 1.1.0

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

### Completed — v1.1.0 Audio Analysis Feature
- **arm64-only confirmed** — Intel Macs explicitly unsupported (LLM CPU fallback = unusable)
- Startup arch guard: shows friendly error dialog and quits on non-arm64
- Bundled `yt-dlp` universal macOS binary in `resources/bin/yt-dlp` (committed to repo)
- Added `ffmpeg-static` npm dep + `asarUnpack` for packaging
- `package.json`: `extraResources` for bin/, explicit `target: arm64` DMG build
- IPC `download-youtube-audio`: shells yt-dlp, grabs first 30s as mono WAV, returns Buffer to renderer
- NEW `audioAnalysis.ts`: radix-2 FFT, ZCR, spectral centroid, band energy, envelope decay, autocorrelation, dynamic range → `AudioAnalysis` interface + text description
- `llamaService.ts`: `analyzeTone()` accepts optional `AudioAnalysis`, injects measurements into Llama prompt
- `App.tsx`: Audio Reference panel — FILE / YOUTUBE toggle, analysing spinner, result badge showing description, clear button
- All changes on branch `session/v1.1.0-audio-analysis` — awaiting user push + merge

### Known Issues
- HX Stomp XL and HX One still `available: false` — need real `.hlx` files to confirm device IDs
- Apple Developer ID not purchased yet ($99) — app is unsigned, install.sh handles quarantine
- v1.1.0 not yet merged to `main` or released as DMG

---

## Next Session Ideas

- **Merge + release v1.1.0**: merge branch to main, bump version in package.json / main.js / FeedbackPanel.tsx, build new DMG, create GitHub release
- **HX Stomp XL / HX One support**: need a real `.hlx` export from each device to confirm `device_id`
- **Audio analysis tuning**: collect beta feedback on whether audio reference improves preset quality

### Start command for next session
```bash
cd /Users/memo/ToneAI && git checkout main && git pull origin main
```

---

## How to Start a New Session

Paste this as your first message:
> "Read MEMORY.md at /Users/memo/ToneAI/MEMORY.md and continue from where we left off."

Claude will read this file and have full context instantly.
