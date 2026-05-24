# Tone Architect — Session Memory

> Update this file at the end of every session before compacting.

---

## Project Overview

**Tone Architect** — AI-powered guitar preset generator for Line 6 HX devices.
Generates `.hlx` (Helix/HX) and `.hsp` (Helix Stadium) preset files from natural language tone descriptions.
Runs 100% locally via Llama 3.1 8B + Apple Metal. No cloud. No subscriptions.

**Root:** `/Users/memo/ToneAI`
**Repo:** `https://github.com/memogonzalezj-dev/ToneArchitect` (public)
**Author:** Memo Gonzalez (`memogonzalezj@gmail.com`, iCloud: `memogonzj@icloud.com`)
**Apple Team ID:** `7H65YB49C7`

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
| Distribution | Signed DMG (Apple Developer ID) + `install.sh` one-liner |

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
│   │   └── devices.ts       # Device registry (5 devices: Stadium, Floor, LT, Stomp, Stomp XL)
│   ├── components/
│   │   ├── LlamaSetup.tsx   # First-launch: model download + consent screen
│   │   └── FeedbackPanel.tsx # Star rating + feedback submission
│   └── services/
│       ├── llamaService.ts  # Prompt builder, analyzeTone(), block hard cap, Stadium catalog
│       ├── helixService.ts  # HLX JSON generator (.hlx), routes Stadium to stadiumService
│       └── stadiumService.ts # HSP JSON generator (.hsp) for Helix Stadium (NEW)
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
TOKEN=$(gh auth token) && git push "https://memogonzalezj-dev:${TOKEN}@github.com/memogonzalezj-dev/ToneArchitect.git" <branch>
```

---

## Devices (ALL VERIFIED FROM REAL EXPORTS)

| Device | ID | Format | Blocks | Dual DSP | Status |
|---|---|---|---|---|---|
| Helix Stadium | 2490368 | `.hsp` | 9 | No | ✅ Available |
| Helix Floor | 2162689 | `.hlx` | 8 | Yes | ✅ Available |
| Helix LT | 2162692 | `.hlx` | 8 | Yes | ✅ Available |
| HX Stomp | 2162694 | `.hlx` | 6 | No | ✅ Available |
| HX Stomp XL | 2162699 | `.hlx` | 8 | No | ✅ Available |

**Removed:** HX One (unknown device ID, 1 block), HX Effects (no amp/cab, deferred)

### device_version for all `.hlx` devices: `58720256`
### HX Stomp appVersion: `58851328` (others: `58720256`)
### Stadium: `device_id: 2490368`, `device_version: 302056738`

---

## Helix Stadium (.hsp) Format — Key Facts

**File format**: `rpshnosj` magic prefix + JSON (NOT valid standalone JSON)
**Block structure**: `flow[0].b00`–`b13` (NOT `dsp0.block0`)
**Param wrapping**: `{"Drive": {"value": 0.5}}` (NOT flat)
**Snapshot arrays**: inline per-param `snapshots: [true,true,...]` (8 elements)
**Model prefixes**: `Agoura_` (amps), `HX2_` (EQ + gates), `HD2_*Mono/Stereo` (effects), `P35_` (I/O)
**Cab slots**: always TWO identical slots (stereo mic pair)
**Amp–cab link**: `amp.linkedblock = {block:"b06",flow:0}`, `cab.linkedblock = {block:"b05",flow:0}`
**Sources section**: completely fixed — identical in all verified .hsp exports
**flow[1]**: always fixed (no-input → looper → matrix output)
**flow[0] slot layout**:
- b00: input (P35_InputInst1) — fixed
- b01–b04: pre-amp FX (dynamics, wah, filter, pitch, distortion)
- b05: amp (Agoura_*)
- b06: cab (HD2_CabMicIr_*WithPan)
- b07–b11: post-amp FX (eq, mod, delay, reverb)
- b13: output (P35_OutputPath2A, gain:6) — fixed

### ⚠️ CRITICAL: Stadium display names ≠ internal IDs
Website says "German Xtra Red" — internal ID is `Agoura_AmpGermanLead`
Website says "US Luxury Black" — internal ID is `Agoura_AmpUSLuxeBlack`
NEVER derive model IDs from display names. Only add confirmed IDs from actual .hsp exports.

### Confirmed Stadium Amp Models (from 3 real .hsp files)
- `Agoura_AmpUSLuxeBlack`
- `Agoura_AmpWhoWatt103`
- `Agoura_AmpGermanLead`

### Confirmed Stadium Cab Models
- `HD2_CabMicIr_1x12USDeluxeWithPan`
- `HD2_CabMicIr_2x12SilverBellWithPan`
- `HD2_CabMicIr_4x12UberV30WithPan`

### Confirmed Stadium FX Models
- EQ: `HX2_EQParametricMono`, `HX2_EQGraphicMono`, `HX2_EQSimple3BandMono`
- Gates: `HD2_GateNoiseGateMono`, `HD2_GateHardGateMono`, `HX2_GateHorizonGateMono`
- Compressors: `HD2_CompressorLAStudioCompMono`, `HD2_CompressorDeluxeCompMono`, etc.
- Distortion: `HD2_Dist*Mono` variants
- Modulation: `HD2_*Stereo` variants
- Delay: `HD2_*Stereo` variants
- Reverb: `HD2_*Stereo` variants

---

## Security

- **Old app-specific password `qgbq-uhiw-sokv-aczk` EXPOSED — must rotate at appleid.apple.com**
- `build-signed.sh` — contains credentials, in `.gitignore`, NEVER commit
- `tone-architect-cert.p12` — developer cert, NEVER commit
- `app password` (untracked file in repo root) — DO NOT commit

---

## Notarization

- **Submission ID**: `77a614bc-8212-4fa1-bbdb-dfbfeeb8ce0b` (submitted 2026-05-24T16:04Z)
- **Status**: UNKNOWN — cannot check because app-specific password was rotated
- To check: `xcrun notarytool info 77a614bc-... --apple-id memogonzj@icloud.com --team-id 7H65YB49C7 --password <new-app-specific-password>`
- After notarization passes: `xcrun stapler staple "dist_desktop/Tone Architect-1.1.0-arm64.dmg"`

---

## Beta Program

- **15 beta users**, distributed via `install.sh` one-liner
- **Expiry:** Sept 1 2026 (`IS_BETA_BUILD = true` in `electron/main.js`)
- **Feedback:** Google Sheets via Apps Script
  - Endpoint in `electron/main.js` → `FEEDBACK_ENDPOINT`
  - Columns: Timestamp, Device, Query, Preset Name, Blocks, Rating, Feedback, App Version, Consent, Preset JSON
- **Consent:** stored in `~/Library/Application Support/tone-architect/consent.json`

---

## Open PRs

- **PR #9** — `chore/gitignore-signing-files`: adds `build-signed.sh` + `tone-architect-cert.p12` to .gitignore
- **PR #10** — `feat/new-device-support`: all 5 devices (Stadium, Floor, LT, Stomp, Stomp XL) + .hsp generator + expanded Stadium catalog

---

## Latest Release

- **DMG:** `dist_desktop/Tone Architect-1.1.0-arm64.dmg`
- **GitHub Release:** `https://github.com/memogonzalezj-dev/ToneArchitect/releases/tag/v1.1.0`
- **Install command:**
  ```bash
  curl -fsSL https://raw.githubusercontent.com/memogonzalezj-dev/ToneArchitect/main/install.sh | bash
  ```

---

## Next Steps

1. **Rotate app-specific password** at appleid.apple.com (old one exposed)
2. **Check notarization status** once new password is created (submission `77a614bc`)
3. **Merge PR #9** (gitignore) and **PR #10** (device support)
4. **Expand Stadium amp catalog** — each new .hsp file dropped by a user adds more confirmed model IDs
5. **Update MEMORY.md devices table** in `devices.ts` comment header (currently shows old status)
6. **v1.2.0 ideas**: preset history/favorites, tone-matching score, custom IR cab support

---

## How to Start a New Session

Paste this as your first message:
> "Read MEMORY.md at /Users/memo/ToneAI/MEMORY.md and continue from where we left off."

Claude will read this file and have full context instantly.
