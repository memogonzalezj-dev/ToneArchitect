#!/usr/bin/env bash
set -e

VERSION="1.0.2"
TAG="v1.0.2.1"
REPO="memogonzalezj-dev/ToneArchitect"
DMG_NAME="Tone.Architect-${VERSION}-arm64.dmg"
DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${TAG}/${DMG_NAME}"
TMP_DMG="/tmp/ToneArchitect.dmg"
APP_NAME="Tone Architect.app"
INSTALL_DIR="/Applications"

echo ""
echo "  TONE ARCHITECT — Installer v${VERSION}"
echo "  ─────────────────────────────────────"
echo ""

if [[ $(uname -m) != "arm64" ]]; then
  echo "  ✗ This build requires Apple Silicon (M1 or later)."
  exit 1
fi

echo "  → Downloading Tone Architect v${VERSION}..."
curl -L --progress-bar "$DOWNLOAD_URL" -o "$TMP_DMG"

echo "  → Mounting disk image..."
hdiutil attach "$TMP_DMG" -nobrowse -quiet

echo "  → Finding app..."
APP_PATH=$(find /Volumes -name "Tone Architect.app" -maxdepth 3 2>/dev/null | head -1)

if [[ -z "$APP_PATH" ]]; then
  echo "  ✗ Could not find Tone Architect.app in mounted DMG."
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

echo ""
echo "  ✓ Tone Architect v${VERSION} installed successfully."
echo "  ✓ Open it from your Applications folder or Launchpad."
echo ""
echo "  On first launch, macOS may still ask to confirm — click Open."
echo ""
