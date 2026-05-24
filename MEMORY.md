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
| Distribution | Signed DMG (Developer ID) + Homebrew cask + `install.sh` |

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
├── build/
│   ├── entitlements.mac.plist   # Developer ID entitlements (NO sandbox — that's MAS only)
│   └── entitlements.mas.plist   # Mac App Store entitlements
├── build-signed.sh          # Local signing script — in .gitignore, never commit
├── install.sh               # One-command installer
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
TOKEN=$(gh auth token) && git push https://memogonzalezj-dev:${TOKEN}@github.com/memogonzalezj-dev/ToneArchitect.git <branch>
```

**Note:** SSH key only works in the user's terminal. Use HTTPS + gh auth token in Claude's bash.

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

## Apple Developer ID Signing

- **Certificate:** `Developer ID Application: Guillermo Gonzalez Jimenez (7H65YB49C7)`
- **Team ID:** `7H65YB49C7`
- **Build script:** `build-signed.sh` (in .gitignore — contains credentials)
- **Entitlements:** `build/entitlements.mac.plist` — JIT + unsigned memory + network. NO app-sandbox (that's MAS only — having it caused notarization to hang for hours)

### Notarization Status (2026-05-24) — PENDING
All 4 submissions are stuck "In Progress" on Apple's servers. Likely queue throttling from multiple concurrent submissions. The latest clean build is:
- **Submission ID:** `77a614bc-8212-4fa1-bbdb-dfbfeeb8ce0b`
- **Created:** `2026-05-24T16:04:11Z`
- **What's in it:** signed app WITHOUT yt-dlp (moved to runtime download), correct entitlements

### First thing next session:
```bash
xcrun notarytool history \
  --apple-id memogonzj@icloud.com \
  --password <new-app-specific-password> \
  --team-id 7H65YB49C7
```

If `77a614bc` shows `Accepted`:
```bash
xcrun stapler staple "/Users/memo/ToneAI/dist_desktop/mac-arm64/Tone Architect.app"
# Then rebuild DMG from stapled app:
bash /Users/memo/ToneAI/build-signed.sh
```

If `Invalid` → fetch the log and fix what Apple flagged:
```bash
xcrun notarytool log 77a614bc-8212-4fa1-bbdb-dfbfeeb8ce0b \
  --apple-id memogonzj@icloud.com \
  --password <new-app-specific-password> \
  --team-id 7H65YB49C7
```

### ⚠️ Rotate app-specific password
The old password `qgbq-uhiw-sokv-aczk` was exposed in this session. Revoke it at appleid.apple.com → App-Specific Passwords and update `build-signed.sh`.

---

## yt-dlp — Runtime Download (changed this session)

yt-dlp was removed from the app bundle to avoid Apple notarization policy issues. It now downloads at runtime on first YouTube use:
- **Download URL:** `https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos`
- **Install path:** `~/Library/Application Support/tone-architect/bin/yt-dlp`
- **Code:** `ensureYtdlp()` function in `electron/main.js`
- `package.json` `extraResources` is now empty `[]`

---

## Homebrew Tap

- **Tap repo:** `https://github.com/memogonzalezj-dev/homebrew-tap`
- **Cask:** `Casks/tone-architect.rb`
- **Install command:**
  ```bash
  brew install --cask memogonzalezj-dev/tap/tone-architect
  ```
- **Status:** Live — but cask has `postflight` quarantine xattr hack. Once notarization is done, remove the `postflight` block (signed app won't need it)
- **On each new release:** update `version` and `sha256` in `Casks/tone-architect.rb`
  - Get SHA256: `shasum -a 256 "dist_desktop/Tone Architect-X.X.X-arm64.dmg"`

---

## Latest Release

- **DMG:** `dist_desktop/Tone Architect-1.1.0-arm64.dmg` (unsigned — pending notarization)
- **GitHub Release:** `https://github.com/memogonzalezj-dev/ToneArchitect/releases/tag/v1.1.0`
- **Install command:**
  ```bash
  curl -fsSL https://raw.githubusercontent.com/memogonzalezj-dev/ToneArchitect/main/install.sh | bash
  ```

---

## Next Session — Do This First

1. Rotate app-specific password at appleid.apple.com
2. Check notarization status (see Apple Developer ID section above)
3. If accepted: staple + rebuild DMG + update GitHub Release + update Homebrew cask
4. Remove `postflight` xattr block from Homebrew cask once signed DMG is live

---

## Next Session Ideas

- **Finish signing + notarization** — see above
- **Update Homebrew cask** with signed DMG (remove postflight quarantine hack)
- **Test yt-dlp runtime download** — verify YouTube feature still works after moving to runtime download
- **HX Stomp XL / HX One support**: need a real `.hlx` export from each device
- **v1.2.0 ideas**: preset history/favorites, tone-matching score display, custom IR cab support

---

## How to Start a New Session

Paste this as your first message:
> "Read MEMORY.md at /Users/memo/ToneAI/MEMORY.md and continue from where we left off."

Claude will read this file and have full context instantly.
