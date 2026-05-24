# TONE ARCHITECT

> **AI-powered guitar preset generator for Line 6 Helix and HX devices.**

You spent $700 on the pedal. You shouldn't have to spend 3 hours dialing in a tone.

Tone Architect listens to what you want — an artist, a song, a vibe — and generates a complete, ready-to-import preset file for your Line 6 device. Every block, every parameter, every signal chain order. Done in seconds.

No subscriptions. No cloud. No API keys. Just your Mac, your pedal, and the tone you've been chasing.

---

## Install

```bash
brew install --cask memogonzalezj-dev/tap/tone-architect
```

Requires Apple Silicon (M1 or later) and macOS Monterey or later.

---

## What It Does

Type something like:

> *"Edge of U2, Sunday Bloody Sunday, with a Fender Strat"*

And Tone Architect:

1. Selects the right amp model, cab, drive, and effects from your device's exact block library
2. Orders them correctly in the DSP signal chain
3. Sets every parameter to a musically sensible value
4. Generates a preset file you can drag directly into HX Edit

The AI runs entirely on your Mac using Apple Silicon — no internet required after the one-time model download.

---

## Features

- **Natural language input** — describe any artist, song, or tone in plain English
- **Multi-device support** — Helix Floor, Helix LT, HX Stomp XL, HX Stomp
- **200+ verified block IDs** — every model ID confirmed from real device exports, no guessing
- **Clean output** — imports into HX Edit without errors or "unrecognized model" warnings
- **Correct signal chain ordering** — dynamics → wah → pitch → drive → amp → cab → EQ → mod → delay → reverb
- **Parameter guardrails** — all values clamped to valid ranges, no silent or blown-out presets
- **100% offline after setup** — your tone stays on your machine

---

## Compatible Devices

| Device | Blocks | Format | Status |
|---|---|---|---|
| Helix Floor | 8 | `.hlx` | ✅ Available |
| Helix LT | 8 | `.hlx` | ✅ Available |
| HX Stomp XL | 8 | `.hlx` | ✅ Available |
| HX Stomp | 6 | `.hlx` | ✅ Available |
| Helix Stadium | 9 | `.hsp` | 🔜 Coming Soon |

---

## System Requirements

| | |
|---|---|
| **Mac** | Apple Silicon (M1 or later) |
| **macOS** | 12.0 Monterey or later |
| **RAM** | 8 GB minimum (16 GB recommended) |
| **Disk** | ~6 GB free for the AI model |
| **HX Edit** | v3.7 or later |
| **Firmware** | 3.7 or later |

---

## How It Works

Tone Architect runs [Meta Llama 3.1 8B](https://llama.meta.com/) locally via [node-llama-cpp](https://github.com/withcatai/node-llama-cpp), accelerated by Apple Metal. The model is guided by a system prompt that constrains output to valid Line 6 internal block IDs, correct parameter ranges, and proper signal chain structure.

The generated JSON is built into a fully compliant `.hlx` file — including device ID, snapshot configuration, DSP routing, and all required metadata — that HX Edit accepts without modification.

**Nothing ever leaves your Mac.**

---

## Development Setup

```bash
git clone https://github.com/memogonzalezj-dev/ToneArchitect.git
cd ToneArchitect
npm install
npm --prefix helixtone-ai install

# Run in development mode (Electron + Vite hot reload)
npm run electron:dev
```

### Build a distributable DMG

```bash
npm run dist:mac
```

The DMG will appear in `dist_desktop/`.

---

## Project Structure

```
ToneArchitect/
├── electron/
│   ├── main.js              # Main process, IPC handlers, native menus
│   └── preload.js           # Context bridge (renderer ↔ main)
├── helixtone-ai/src/
│   ├── App.tsx              # Main UI
│   ├── config/
│   │   └── devices.ts       # Device registry (block limits, IDs, formats)
│   ├── components/
│   │   ├── LlamaSetup.tsx   # First-launch model download + consent
│   │   └── FeedbackPanel.tsx # Star rating + feedback submission
│   └── services/
│       ├── llamaService.ts  # Device-aware AI prompt builder
│       ├── helixService.ts  # .hlx file generator
│       └── stadiumService.ts # .hsp file generator (Helix Stadium)
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

## Changelog

### v1.5.0 — Beta (2026-05-24)

- **New devices:** Helix Floor, Helix LT, HX Stomp XL — all verified from real device exports
- **Helix Stadium** — generator built, marked Coming Soon pending more verified model IDs
- Feedback panel stars always clickable (z-index fix above sticky header)
- Feedback panel no longer jumps when hovering stars
- Block parameter list uses clean model names (no HD2_/HX2_ prefixes)
- Pedalboard optimization and gear photo upload marked Coming Soon
- App opens on first available device by default

### v1.1.0 — Beta (2026-05-24)

- **Audio Reference** — upload an audio file or paste a YouTube URL; Tone Architect analyses the tone and injects measurements into the AI prompt
- **Make the Tone** — button activates as soon as audio analysis is ready, no text required
- Bundled `yt-dlp` + `ffmpeg` — nothing extra to install
- `install.sh` auto-detects the latest release

### v1.0.2 — Beta (2026-05-23)

- JSON preset collection for AI training data

### v1.0.1 — Beta (2026-05-23)

- Star rating feedback panel
- Privacy consent screen
- DSP block limit enforced in code

### v1.0.0 — Beta (2026-05-01)

- Initial beta release
- HX Stomp support
- Local Llama 3.1 8B inference via Apple Metal

---

## Licenses

| Package | License |
|---|---|
| [Electron](https://github.com/electron/electron) | MIT |
| [React](https://github.com/facebook/react) | MIT |
| [node-llama-cpp](https://github.com/withcatai/node-llama-cpp) | MIT |
| [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) | MIT |
| [Meta Llama 3.1](https://llama.meta.com/) | [Llama Community License](https://llama.meta.com/llama3/license/) |

---

## Disclaimer

**Not affiliated with, endorsed by, or connected to Line 6, Inc. or Yamaha Corporation.**

"Line 6," "Helix," "HX Stomp," "HX Stomp XL," "HX Edit" are registered trademarks of Line 6, Inc. Use of these names is for identification and compatibility purposes only.

Always review generated presets and test at low volume before use.

**© 2026 Memo Gonzalez.**
