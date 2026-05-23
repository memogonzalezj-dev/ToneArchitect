#!/usr/bin/env bash
set -e

REPO="memogonzalezj-dev/ToneArchitect"
TMP_DMG="/tmp/ToneArchitect.dmg"
APP_NAME="Tone Architect.app"
INSTALL_DIR="/Applications"

echo ""
echo "  TONE ARCHITECT — Installer"
echo "  ────────────────────────────────────────"
echo ""

# ── Architecture check ────────────────────────────────────────────────────────

if [[ $(uname -m) != "arm64" ]]; then
  echo "  ✗ Tone Architect requires Apple Silicon (M1 or later)."
  echo "    Intel Macs are not supported."
  exit 1
fi

# ── Fetch latest release from GitHub API ─────────────────────────────────────

echo "  → Checking for latest release..."
RELEASE_JSON=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest")

if command -v python3 &>/dev/null; then
  TAG=$(echo "$RELEASE_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['tag_name'])")
  DOWNLOAD_URL=$(echo "$RELEASE_JSON" | python3 -c "
import sys, json
r = json.load(sys.stdin)
dmg = [a['browser_download_url'] for a in r.get('assets', []) if a['name'].endswith('.dmg')]
print(dmg[0] if dmg else '')
")
else
  # Fallback: grep + sed (no python3)
  TAG=$(echo "$RELEASE_JSON" | grep -o '"tag_name" *: *"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"')
  DOWNLOAD_URL=$(echo "$RELEASE_JSON" | grep -o '"browser_download_url" *: *"[^"]*\.dmg"' | grep -o 'https://[^"]*' | head -1)
fi

if [[ -z "$TAG" ]]; then
  echo "  ✗ Could not determine latest version."
  echo "    Check your internet connection and try again."
  exit 1
fi

if [[ -z "$DOWNLOAD_URL" ]]; then
  echo "  ✗ No DMG found in release ${TAG}."
  echo "    Visit: https://github.com/${REPO}/releases"
  exit 1
fi

# ── Download ──────────────────────────────────────────────────────────────────

echo "  → Downloading Tone Architect ${TAG}..."
curl -L --progress-bar "$DOWNLOAD_URL" -o "$TMP_DMG"

# ── Install ───────────────────────────────────────────────────────────────────

echo "  → Mounting disk image..."
hdiutil attach "$TMP_DMG" -nobrowse -quiet

echo "  → Finding app..."
APP_PATH=$(find /Volumes -name "Tone Architect.app" -maxdepth 3 2>/dev/null | head -1)

if [[ -z "$APP_PATH" ]]; then
  echo "  ✗ Could not find Tone Architect.app in the mounted DMG."
  hdiutil detach /Volumes/Tone* -quiet 2>/dev/null || true
  exit 1
fi

echo "  → Installing to ${INSTALL_DIR}..."
rm -rf "${INSTALL_DIR}/${APP_NAME}"
cp -R "$APP_PATH" "${INSTALL_DIR}/"

echo "  → Removing macOS quarantine flag..."
xattr -cr "${INSTALL_DIR}/${APP_NAME}"

echo "  → Cleaning up..."
hdiutil detach "$(dirname "$APP_PATH")" -quiet 2>/dev/null || true
rm -f "$TMP_DMG"

# ── Done ──────────────────────────────────────────────────────────────────────

echo ""
echo "  ✓ Tone Architect ${TAG} installed successfully."
echo "  ✓ Open it from your Applications folder or Launchpad."
echo ""
echo "  On first launch, macOS may still ask to confirm — click Open."
echo ""
