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

## Current Version: 1.5.0 ✅ Released & Notarized

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
| Distribution | Signed + notarized DMG (Apple Developer ID) + Homebrew cask |

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
│       └── stadiumService.ts # HSP JSON generator (.hsp) for Helix Stadium
├── scripts/
│   ├── afterPack.js         # electron-builder hook — signs asar.unpacked + bin/ BEFORE codesign
│   └── afterSign.js         # (kept for reference, not active — afterPack is used instead)
├── build/
│   └── entitlements.mac.plist # allow-jit, allow-unsigned-executable-memory, network.client
├── build-signed.sh          # ← GITIGNORED: full build + sign + notarize + staple script
├── install.sh               # One-command installer (handles Gatekeeper quarantine)
├── MEMORY.md                # ← this file
└── package.json             # version, build config, afterPack hook, asarUnpack
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

## HLX Format — Key Structural Facts (from 27 real HX Stomp exports)

**All files**: `device: 2162694`, `device_version: 58720256`, `appversion: 58851328`
**Block storage vs. active limit**: HX Stomp JSON can store up to 8 block slots (block0–block7) but DSP limits how many can be *simultaneously enabled* to ~6. Generator should cap active blocks at 6.
**Amp position**: varies — block1, block2, block3, or block4 are all valid.

### Dual-Mic Cab Setup (common pattern)
- `block4` (or whichever position) has `@cab: "cab0"` — this is mic B
- A `cab0` object at `dsp0` root is mic A
- The two entries CAN use different cab models (not just different mic positions)
- Single-mic: just a plain cab block with no `@cab` reference

### Two Cab Format Variants (BOTH appear in the wild)
- **New**: `HD2_CabMicIr_*` — params: `Mic`, `Angle`, `Position`, `Distance`, `LowCut`, `HighCut`, `Level`, `Pan` (if WithPan), `Delay`
- **Legacy**: `HD2_Cab4x12*` — params: `@mic` (integer, not `Mic`), `EarlyReflections`, `Distance`, `LowCut`, `HighCut`, `Level`

### Topology
- `"A"` = single signal path (most presets)
- `"SABJ"` = split A-B-join (parallel paths, used for wet/dry, dual reverbs, etc.)

---

## Confirmed HLX Amp Models (77 — cross-referenced 1,060 real presets + official HX_ModelCatalog.json)

```
HD2_AmpA30FawnBrt         — Vox AC30 Fawn Bright
HD2_AmpA30FawnNrm         — Vox AC30 Fawn Normal
HD2_AmpANGLMeteor         — ANGL Meteor
HD2_AmpArchetypeClean     — Line 6 Archetype Clean
HD2_AmpArchetypeLead      — Line 6 Archetype Lead
HD2_AmpBrit2203           — Marshall JCM800 2203
HD2_AmpBrit2204           — Marshall JCM800 2204
HD2_AmpBritJ45Brt         — Marshall JTM45 Bright
HD2_AmpBritJ45Nrm         — Marshall JTM45 Normal
HD2_AmpBritP75Brt         — Park 75 Bright
HD2_AmpBritP75Nrm         — Park 75 Normal
HD2_AmpBritPlexiBrt       — Marshall Plexi Bright
HD2_AmpBritPlexiJump      — Marshall Plexi Jumped (BrtDrive + NrmDrive params)
HD2_AmpBritPlexiNrm       — Marshall Plexi Normal
HD2_AmpBritTremBrt        — Marshall Tremolo Bright (BrtDrive param)
HD2_AmpBritTremJump       — Marshall Tremolo Jumped (BrtDrive + NrmDrive params)
HD2_AmpBritTremNrm        — Marshall Tremolo Normal (NrmDrive param)
HD2_AmpBusyOneJump        — Busy One Jumped
HD2_AmpCaliIVLead         — Mesa Mark IV Lead (LeadGain + LeadDrive params)
HD2_AmpCaliIVR1           — Mesa Mark IV R1
HD2_AmpCaliIVR2           — Mesa Mark IV R2
HD2_AmpCaliRectifire      — Mesa Boogie Dual Rectifier
HD2_AmpCaliTexasCh1       — Mesa Boogie Lonestar Ch1
HD2_AmpCaliTexasCh2       — Mesa Boogie Lonestar Ch2
HD2_AmpCartographer       — Line 6 Cartographer
HD2_AmpDasBenzinMega      — Bogner Ecstasy Red
HD2_AmpDerailedIngrid     — Fuchs Train 45
HD2_AmpDividedDuo         — Divided by 13 JRT 9/15
HD2_AmpEssexA15           — Vox AC15 Essex
HD2_AmpEssexA30           — Vox AC30 Essex
HD2_AmpFullertonBrt       — Fender Fullerton Bright
HD2_AmpFullertonNrm       — Fender Fullerton Normal
HD2_AmpGSG100             — GSG100
HD2_AmpGermanMahadeva     — Diezel Mahadeva
HD2_AmpGermanUbersonic    — Diezel Ubersonic
HD2_AmpInterstateZed      — Dr. Z Route 66
HD2_AmpJazzRivet120       — Roland Jazz Chorus 120
HD2_AmpLine62204Mod       — Line 6 2204 Mod
HD2_AmpLine6Badonk        — Line 6 Badonk
HD2_AmpLine6Clarity       — Line 6 Clarity
HD2_AmpLine6Doom          — Line 6 Doom
HD2_AmpLine6Elektrik      — Line 6 Elektrik
HD2_AmpLine6Elmsley       — Line 6 Elmsley
HD2_AmpLine6Epic          — Line 6 Epic
HD2_AmpLine6Fatality      — Line 6 Fatality
HD2_AmpLine6Kinetic       — Line 6 Kinetic
HD2_AmpLine6Litigator     — Line 6 Litigator
HD2_AmpLine6Oblivion      — Line 6 Oblivion
HD2_AmpMailOrderTwin      — Fender Vibroverb
HD2_AmpMandarin80         — Orange OR80
HD2_AmpMandarinRocker     — Orange Rockerverb
HD2_AmpMatchstickCh1      — Matchless DC30 Ch1 (Ch1Drive param)
HD2_AmpMatchstickCh2      — Matchless DC30 Ch2 (Ch2Drive param)
HD2_AmpMatchstickJump     — Matchless DC30 Jumped (Ch1Drive + Ch2Drive params)
HD2_AmpMoonJump           — Moon Jump
HD2_AmpPVPanama           — Peavey 5150 Panama
HD2_AmpPVVitriolLead      — Peavey XXX Vitriol Lead
HD2_AmpPlacaterClean      — Friedman BE-100 Clean
HD2_AmpPlacaterDirty      — Friedman BE-100 Dirty
HD2_AmpRevvGenPurple      — Revv Generator Purple
HD2_AmpSVBeastBrt         — Supro Black Magick Bright
HD2_AmpSoloLeadClean      — Soldano SLO Clean
HD2_AmpSoloLeadCrunch     — Soldano SLO Crunch
HD2_AmpSoloLeadOD         — Soldano SLO OD
HD2_AmpSoupPro            — Supro 1695T
HD2_AmpStoneAge185        — Gibson EH-185
HD2_AmpTweedBluesBrt      — Fender Blues Junior Bright
HD2_AmpTweedBluesNrm      — Fender Blues Junior Normal
HD2_AmpUSDeluxeNrm        — Fender Deluxe Reverb Normal
HD2_AmpUSSmallTweed       — Fender Champ
HD2_AmpUSDeluxeVib        — Fender Deluxe Reverb Vibrato
HD2_AmpUSDoubleNrm        — Fender Twin Reverb Normal
HD2_AmpUSDoubleVib        — Fender Twin Reverb Vibrato
HD2_AmpUSDripmanNorm      — Dumble OD Normal
HD2_AmpUSPrincess         — Carr Princess
HD2_AmpVoltageQueen       — Victoria Vintage
HD2_AmpWhoWatt100         — Hiwatt DR-103
```

---

## Confirmed HLX Cab Models (46 — from full export corpus)

```
--- New format (HD2_CabMicIr_*) — params: Mic, Angle, Position, Distance, LowCut, HighCut, Level, [Pan], [Delay] ---
HD2_CabMicIr_1x10USPrincess
HD2_CabMicIr_1x10USPrincessWithPan
HD2_CabMicIr_1x12Fullerton
HD2_CabMicIr_1x12OpenCast
HD2_CabMicIr_1x12OpenCastWithPan
HD2_CabMicIr_1x12USDeluxe
HD2_CabMicIr_1x12USDeluxeWithPan
HD2_CabMicIr_2x12BlueBell
HD2_CabMicIr_2x12BlueBellWithPan
HD2_CabMicIr_2x12DoubleC12N
HD2_CabMicIr_2x12DoubleC12NWithPan
HD2_CabMicIr_2x12JazzRivet
HD2_CabMicIr_2x12JazzRivetWithPan
HD2_CabMicIr_2x12MandarinWithPan
HD2_CabMicIr_2x12MatchH30WithPan
HD2_CabMicIr_2x12SilverBell
HD2_CabMicIr_2x12SilverBellWithPan
HD2_CabMicIr_2x15USDripmanWithPan
HD2_CabMicIr_4x10TweedP10R
HD2_CabMicIr_4x10USSuperWithPan
HD2_CabMicIr_4x121960AT75
HD2_CabMicIr_4x121960AT75WithPan
HD2_CabMicIr_4x12BlackbackH30
HD2_CabMicIr_4x12BlackbackH30WithPan
HD2_CabMicIr_4x12BritV30
HD2_CabMicIr_4x12CaliV30
HD2_CabMicIr_4x12CaliV30WithPan
HD2_CabMicIr_4x12Greenback20
HD2_CabMicIr_4x12Greenback25
HD2_CabMicIr_4x12Greenback25WithPan
HD2_CabMicIr_4x12Greenback30
HD2_CabMicIr_4x12Greenback30WithPan
HD2_CabMicIr_4x12MOONT75WithPan
HD2_CabMicIr_4x12MandarinWithPan
HD2_CabMicIr_4x12UberT75WithPan
HD2_CabMicIr_4x12UberV30
HD2_CabMicIr_4x12UberV30WithPan
HD2_CabMicIr_4x12WhoWatt100
HD2_CabMicIr_8x10SVTAV
HD2_CabMicIr_SoupProEllipse

--- Legacy format — params: @mic (integer), EarlyReflections, Distance, LowCut, HighCut, Level ---
HD2_Cab112_RsGtr
HD2_Cab2x12Interstate
HD2_Cab4X12CaliV30
HD2_Cab4x121960T75
HD2_Cab4x12Greenback20
HD2_Cab4x12Greenback25
HD2_Cab4x12UberT75
HD2_Cab4x12WhoWatt100
```

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

- Old app-specific password `qgbq-uhiw-sokv-aczk` was EXPOSED — already rotated ✅
- Current app-specific password stored in `~/ToneAI/app password` (gitignored) — `build-signed.sh` reads it from there
- `build-signed.sh` — contains cert password, in `.gitignore`, NEVER commit
- `tone-architect-cert.p12` — developer cert, NEVER commit
- `app password` (untracked file in repo root) — DO NOT commit, now in .gitignore

---

## Build & Release Process (FULLY AUTOMATED as of v1.5.0)

```bash
cd ~/ToneAI && bash build-signed.sh
```

That single command:
1. Runs `afterPack.js` hook — pre-signs `app.asar.unpacked` native binaries + `bin/` executables
2. electron-builder signs the full bundle (computes CodeResources over pre-signed files) ✓
3. Assembles the DMG
4. Submits DMG to Apple notarytool — waits for Accepted
5. Staples the ticket to the DMG
6. Prints new SHA256

After build completes:
1. Upload DMG to GitHub release: `gh release upload vX.X.X "dist_desktop/Tone Architect-X.X.X-arm64.dmg" --repo memogonzalezj-dev/ToneArchitect --clobber`
2. Update Homebrew cask SHA: update `sha256` in `memogonzalezj-dev/homebrew-tap/Casks/tone-architect.rb` via GitHub API

### ⚠️ Critical signing lesson (resolved 2026-05-25)
- `afterPack` (before signing) is required — NOT `afterSign` (after signing)
- Signing `.dylib`/`.node` after CodeResources is computed breaks the bundle seal → "invalid signature" on main exe
- `@node-llama-cpp` must be in `asarUnpack` so electron-builder can find and sign those binaries via `--deep`
- Do NOT export `APPLE_APP_SPECIFIC_PASSWORD` during the electron-builder step — it triggers auto-notarization that crashes when the `notarize` config key is absent

### Latest Release: v1.5.0
- **DMG SHA256:** `e8576a43acca4da39a76d21fe5bbabe9bfc6cf484649bb6294839b24dc4849f7`
- **GitHub Release:** `https://github.com/memogonzalezj-dev/ToneArchitect/releases/tag/v1.5.0`
- **Homebrew:** `brew install --cask tone-architect` (tap: `memogonzalezj-dev/tap`)
- **Notarization:** ✅ Accepted, ticket stapled

---

## Beta Program

- **15 beta users**, distributed via `install.sh` one-liner
- **Expiry:** Sept 1 2026 (`IS_BETA_BUILD = true` in `electron/main.js`)
- **Feedback:** Google Sheets via Apps Script
  - Endpoint in `electron/main.js` → `FEEDBACK_ENDPOINT`
  - Columns: Timestamp, Device, Query, Preset Name, Blocks, Rating, Feedback, App Version, Consent, Preset JSON
- **Consent:** stored in `~/Library/Application Support/tone-architect/consent.json`
- First launch shows macOS Keychain prompt ("tone-architect Safe Storage") — normal, click Always Allow

---

## AI Prompt Quality Notes (from 1,060 real preset analysis + HX_ModelCatalog.json)

- Official model catalog: `/Volumes/Extended MAC/Helix/HX_ModelCatalog.json` — authoritative source for all param names
- Real preset corpus: `/Volumes/Extended MAC/Guitar Stuff/Effects/` (242 files) + Metallica Megapack
- Key special-case amp params to always reference: Ch1Drive (Matchstick Ch1), Ch2Drive (Matchstick Ch2), BrtDrive/NrmDrive (BritTrem), LeadGain/LeadDrive (CaliIV Lead)
- JazzRivet120 has NO Sag/Hum/Bias/BiasX params
- EssexA30 has NO Mid param — uses Cut instead

---

## In-Progress: Preset History (v1.6.0)

**Branch:** `session/v1.6.0-preset-history`
**Status:** Feature complete, one cosmetic bug remaining.

### What was built (2026-05-24)

All 5 files touched:

| File | Change |
|---|---|
| `electron/main.js` | Added `getPresetsDir()` + 3 IPC handlers: `save-preset-history`, `list-preset-history`, `delete-preset-history` |
| `electron/preload.js` | Exposed `savePresetHistory`, `listPresetHistory`, `deletePresetHistory` |
| `helixtone-ai/src/types.ts` | Added `PresetHistoryEntry` interface + 3 methods to `ElectronAPI` |
| `helixtone-ai/src/components/HistorySidebar.tsx` | New collapsible left sidebar (48px collapsed / 260px expanded, clock icon, count badge, list with re-download + trash) |
| `helixtone-ai/src/App.tsx` | Auto-save on generation, load history on mount, re-download + delete handlers, root layout changed to `flex` row with sidebar |

Storage path: `~/Library/Application Support/tone-architect/presets/<timestamp>_<name>.json`

### ⚠️ Remaining bug: traffic light overlap

The macOS minimize/maximize/close buttons (`titleBarStyle: 'hiddenInset'` in `electron/main.js`) overlap the top of the `HistorySidebar` toggle button.

**Fix needed (pick one):**
- Add a `h-[38px] flex-shrink-0` spacer `<div>` at the very top of `motion.aside` in `HistorySidebar.tsx` (before the toggle button), OR
- Add `trafficLightPosition: { x: 10, y: 50 }` to the `BrowserWindow` config in `electron/main.js` to push the buttons below the toggle zone

Spacer approach is simpler — just push the toggle button down past y≈38.

---

## Next Steps

1. **Fix traffic light overlap** — one-liner in `HistorySidebar.tsx`, then ship v1.6.0
2. **Tone pane on the left** — UI improvement (sidebar showing tone controls/results)
3. **Expand Stadium amp catalog** — each new .hsp file from beta users adds confirmed model IDs
4. **Post in beta chat** asking for Pod Go + HX One preset files

---

## Devices on Waitlist (need real preset files before adding)

| Device | Status | Action |
|---|---|---|
| Pod Go | Waitlisted | Post in beta chat — one factory or personal `.hlx` is all we need |
| HX One | Waitlisted | Post in beta chat — same ask, one file |

---

## How to Start a New Session

Paste this as your first message:
> "Read MEMORY.md at /Users/memo/ToneAI/MEMORY.md and continue from where we left off."

Claude will read this file and have full context instantly.
