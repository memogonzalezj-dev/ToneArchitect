#!/usr/bin/env bash
set -e

VERSION="1.0.2"
REPO="memogonzalezj-dev/ToneArchitect"
DMG_NAME="Tone Architect-${VERSION}-arm64.dmg"
DOWNLOAD_URL="https://github.com/${REPO}/releases/download/v${VERSION}/${DMG_NAME// /.}"
TMP_DMG="/tmp/ToneArchitect.dmg"
APP_NAME="Tone Architect.app"
INSTALL_DIR="/Applications"

echo ""
echo "  TONE ARCHITECT — Installer v${VERSION}"
echo "  ─────────────────────────────────────"
echo ""

# Check Apple Silicon
if [[ $(uname -m) != "arm64" ]]; then
  echo "  ✗ This build requires Apple Silicon (M1 or later)."
  exit 1
fi

echo "  → Downloading Tone Architect v${VERSION}..."
curl -L --progress-bar "$DOWNLOAD_URL" -o "$TMP_DMG"

echo "  → Mounting disk image..."
MOUNT_POINT=$(hdiutil attach "$TMP_DMG" -nobrowse -quiet | awk 'END{print $NF}')

echo "  → Installing to ${INSTALL_DIR}..."
if [[ -d "${INSTALL_DIR}/${APP_NAME}" ]]; then
  rm -rf "${INSTALL_DIR}/${APP_NAME}"
fi
cp -R "${MOUNT_POINT}/${APP_NAME}" "${INSTALL_DIR}/"

echo "  → Removing macOS quarantine flag..."
xattr -cr "${INSTALL_DIR}/${APP_NAME}"

echo "  → Cleaning up..."
hdiutil detach "$MOUNT_POINT" -quiet
rm -f "$TMP_DMG"

echo ""
echo "  ✓ Tone Architect v${VERSION} installed successfully."
echo "  ✓ Open it from your Applications folder or Launchpad."
echo ""
echo "  On first launch, macOS may still ask to confirm — click Open."
echo ""
