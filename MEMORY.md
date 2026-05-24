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

## Devices on Waitlist (need real preset files before adding)

| Device | Status | Action |
|---|---|---|
| Pod Go | Waitlisted | Post in beta chat — one factory or personal `.hlx` is all we need |
| HX One | Waitlisted | Post in beta chat — same ask, one file |

---

## Preset History (v1.2.0 — Next Feature)

Highest-priority v1.2.0 feature. Pure upside — no format risk. Something helixtones literally cannot offer.

**Plan:**
- Save every generated preset to `~/Library/Application Support/tone-architect/presets/` as JSON
  - Fields: preset JSON, query, device, date, rating (if given)
- Sidebar in the app showing history
  - Click to re-download, re-view, or delete
- Persists across app launches, 100% offline

---

## Real File Collection Notes

More Stomp examples are valuable — the more real files we have, the more confident we are the amp/cab fix is correct.

**Priority edge cases to collect:**
- Presets with different amp/cab combinations
- Presets with **no amp** (effects-only chain) — most likely to expose generator bugs
- Presets with **multiple drives** in the chain

---

## Next Steps

1. **Rotate app-specific password** ✅ Done (2026-05-24)
2. **Check notarization status** — submission `77a614bc`, run `xcrun notarytool info` with new password when ready
3. **Merge PR #9** (gitignore) and **PR #10** (device support) — `feat/new-device-support` branch also has AI catalog improvements (commit `1a3bddd`)
4. **Expand Stadium amp catalog** — each new .hsp file dropped by a user adds more confirmed model IDs
5. **Build preset history** (see section above) — start here for v1.2.0
6. **Post in beta chat** asking for Pod Go + HX One preset files

## AI Prompt Quality Notes (from 1,060 real preset analysis + HX_ModelCatalog.json)

- Official model catalog: `/Volumes/Extended MAC/Helix/HX_ModelCatalog.json` — authoritative source for all param names
- Real preset corpus: `/Volumes/Extended MAC/Guitar Stuff/Effects/` (242 files) + Metallica Megapack
- Key special-case amp params to always reference: Ch1Drive (Matchstick Ch1), Ch2Drive (Matchstick Ch2), BrtDrive/NrmDrive (BritTrem), LeadGain/LeadDrive (CaliIV Lead)
- JazzRivet120 has NO Sag/Hum/Bias/BiasX params
- EssexA30 has NO Mid param — uses Cut instead

---

## How to Start a New Session

Paste this as your first message:
> "Read MEMORY.md at /Users/memo/ToneAI/MEMORY.md and continue from where we left off."

Claude will read this file and have full context instantly.
