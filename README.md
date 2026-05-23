# TONE ARCHITECT

> **AI-powered guitar preset generator for Line 6 HX devices.**

You spent $700 on the pedal. You shouldn't have to spend 3 hours dialing in a tone.

Tone Architect listens to what you want — an artist, a song, a vibe — and generates a complete, ready-to-import `.hlx` preset file optimized for your specific Line 6 device. Every block, every parameter, every signal chain order. Done in seconds.

No subscriptions. No cloud. No API keys. Just your Mac, your pedal, and the tone you've been chasing.

---

## What It Does

Type something like:

> *"Edge of U2, Sunday Bloody Sunday, with a Fender Strat"*

And Tone Architect:

1. Selects the right amp model, cab, drive, and effects from your device's exact block library
2. Orders them correctly in the DSP signal chain
3. Sets every parameter to a musically sensible value
4. Generates a `.hlx` file you can drag directly into HX Edit
5. Gives you a step-by-step manual guide in case you want to dial it in by hand

The AI runs entirely on your Mac using Apple Silicon — no internet required after the one-time model download.

---

## Features

- **Natural language input** — describe any artist, song, or tone in plain English
- **Multi-device support** — HX Stomp (6 blocks) and HX Effects (9 blocks, effects-only)
- **200+ verified block IDs** — every model ID confirmed from real `.hlx` files, no guessing
- **Clean HLX output** — imports into HX Edit without errors or "unrecognized model" warnings
- **Correct signal chain ordering** — dynamics → wah → pitch → drive → amp → cab → EQ → mod → delay → reverb
- **Parameter guardrails** — all values clamped to valid ranges, no silent or blown-out presets
- **Manual configuration guide** — knob-by-knob instructions on the 0–10 scale matching your device UI
- **100% offline after setup** — your tone stays on your machine

---

## Compatible Devices

| Device | Blocks | Amp + Cab | Status |
|---|---|---|---|
| Line 6 HX Stomp | 6 | Yes | Available |
| Line 6 HX Effects | 9 | No (effects only) | Available |
| Line 6 HX Stomp XL | 8 | Yes | Coming soon |
| Line 6 HX One | 1 | No | Coming soon |

---

## System Requirements

| | |
|---|---|
| **Mac** | Apple Silicon (M1 or later) |
| **macOS** | 12.0 Ventura or later |
| **RAM** | 8 GB minimum (16 GB recommended) |
| **Disk** | ~6 GB free for the AI model |
| **HX Edit** | v3.7 or later installed on your computer |
| **Device firmware** | 3.7 or later |

---

## How It Works

Tone Architect runs [Meta Llama 3.1 8B](https://llama.meta.com/) locally via [node-llama-cpp](https://github.com/withcatai/node-llama-cpp), accelerated by Apple Metal. The model is guided by a detailed system prompt that constrains output to valid Line 6 internal block IDs, correct parameter ranges, and proper signal chain structure.

The generated JSON is then built into a fully compliant `.hlx` file — including device ID, snapshot configuration, DSP routing, and all required metadata — that HX Edit accepts without modification.

**Nothing ever leaves your Mac.**

---

## Development Setup

```bash
# Install dependencies
npm install
npm --prefix helixtone-ai install

# Run in development mode (Electron + Vite hot reload)
npm run electron:dev
```

### Build a distributable DMG

```bash
npm run dist:mac
```

The signed DMG will appear in `dist_desktop/`.

> **Note:** Code signing requires an Apple Developer ID certificate.
> Set `CSC_LINK` and `CSC_KEY_PASSWORD` environment variables, or use
> `CSC_IDENTITY_AUTO_DISCOVERY=false` for unsigned local builds.

---

## Versioning

Tone Architect uses a three-part version number: `MAJOR.MINOR.PATCH`

| Increment | Example | When |
|---|---|---|
| **Patch** | `1.0.1` → `1.0.2` | Bug fixes, small features, each dev session |
| **Minor** | `1.0.2` → `1.1.0` | Significant features, major review, new device support |
| **Major** | `1.1.0` → `2.0.0` | Public launch, breaking changes, architecture rewrite |

Files that must be updated on every version bump:

| File | Field |
|---|---|
| `package.json` | `"version"` |
| `electron/main.js` | About dialog string + `USER_GUIDE` header |
| `helixtone-ai/src/components/FeedbackPanel.tsx` | `app_version` field in feedback payload |

---

## Changelog

### v1.0.1 — Beta (2026-05-23)
- ⭐ Beta feedback panel — star rating + optional comment after each generation
- 🔒 Training-data consent screen on first launch (opt-in, stored locally)
- 🛠 DSP block hard cap — presets are now enforced at the device block limit in code, not just the prompt
- 🤖 Fixed node-llama-cpp v3 API (dynamic import, `LlamaChatSession`, context disposal)
- 📥 Fixed model download — now uses the built-in HuggingFace downloader (no more corrupt files or 401 errors)
- 📡 Fixed feedback submission — POST now follows Google Apps Script redirects correctly

### v1.0.0 — Beta (2026-05-01)
- Initial beta release
- HX Stomp and HX Effects support
- Local Llama 3.1 8B inference via Apple Metal
- `.hlx` preset export compatible with HX Edit 3.7+

---

## Project Structure

```
ToneArchitect/
├── electron/
│   ├── main.js            # Main process, IPC handlers, native menus
│   └── preload.js         # Context bridge (renderer ↔ main)
├── helixtone-ai/
│   └── src/
│       ├── App.tsx                    # Main UI
│       ├── config/
│       │   └── devices.ts             # Device registry (block limits, IDs, I/O models)
│       ├── components/
│       │   ├── LlamaSetup.tsx         # First-launch model download + consent screen
│       │   └── FeedbackPanel.tsx      # Star rating + feedback submission panel
│       └── services/
│           ├── llamaService.ts        # Device-aware AI prompt builder + IPC
│           └── helixService.ts        # HLX file generator + parameter sanitizer
├── build/
│   ├── icon.icns                      # App icon (all sizes)
│   ├── entitlements.mac.plist         # macOS hardened runtime entitlements
│   └── entitlements.mas.plist         # Mac App Store entitlements
└── package.json
```

---

## Adding a New Device

1. Export any preset from the target device via HX Edit (File → Export → Preset)
2. Run:
   ```bash
   python3 -c "import json; d=json.load(open('preset.hlx')); print(d['data']['device'], d['data']['device_version'])"
   ```
3. Add an entry to `helixtone-ai/src/config/devices.ts` with the confirmed values
4. Set `available: true`

---

## Licenses

This project depends on the following open-source software:

| Package | License |
|---|---|
| [Electron](https://github.com/electron/electron) | MIT |
| [React](https://github.com/facebook/react) | MIT |
| [Vite](https://github.com/vitejs/vite) | MIT |
| [node-llama-cpp](https://github.com/withcatai/node-llama-cpp) | MIT |
| [Framer Motion](https://github.com/framer/motion) | MIT |
| [Lucide React](https://github.com/lucide-icons/lucide) | ISC |
| [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) | MIT |
| [Meta Llama 3.1](https://llama.meta.com/) | [Llama Community License](https://llama.meta.com/llama3/license/) |

The Llama model is used under Meta's Llama Community License Agreement. If Tone Architect ever reaches 700 million monthly active users, a separate commercial license from Meta will be required. We remain cautiously optimistic.

---

## Disclaimer & Legal Notice

**Tone Architect is an independent, community-built application.**

This software is **not affiliated with, endorsed by, sponsored by, or connected in any way to Line 6, Inc., Yamaha Corporation, or any of their subsidiaries or affiliated companies.**

"Line 6," "Helix," "HX Stomp," "HX Effects," "HX Stomp XL," "HX One," and "HX Edit" are registered trademarks of Line 6, Inc. All product names, trademarks, and registered trademarks mentioned in this software are the property of their respective owners. Use of these names is for identification and compatibility purposes only and does not imply any affiliation or endorsement.

Presets are generated by a local AI model and may be inaccurate, incomplete, or unsuitable for your specific hardware configuration. **Always review generated presets and test at low volume before use.** The author accepts no liability for damage to equipment, hearing loss, or data loss arising from the use of this software or any presets it generates.

**© 2026 Memo Gonzalez. All rights reserved.**

---

*Built by a guitarist, for guitarists. Not affiliated with Line 6, Inc.*
