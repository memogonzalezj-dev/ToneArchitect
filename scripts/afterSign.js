/**
 * afterSign.js — electron-builder hook, called after the app is signed
 * but BEFORE the DMG is assembled.
 *
 * Scope: electron-builder's codesign --deep pass handles all frameworks and
 * helper apps. This hook ONLY supplements it for files that --deep cannot
 * reach reliably: native binaries in app.asar.unpacked/ and stand-alone
 * executables in Contents/Resources/bin/.
 *
 * Do NOT re-sign anything electron-builder already handled — doing so after
 * the fact breaks the outer bundle's CodeResources digest.
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

exports.default = async function afterSign(context) {
  const { appOutDir, packager } = context;
  const appName = packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  const identity =
    "Developer ID Application: Guillermo Gonzalez Jimenez (7H65YB49C7)";
  const entitlements = path.resolve(__dirname, "../build/entitlements.mac.plist");

  console.log(`\n[afterSign] Signing supplemental native binaries in:\n  ${appPath}\n`);

  function sign(filePath) {
    const cmd = `codesign --force --options runtime --timestamp --entitlements "${entitlements}" --sign "${identity}" "${filePath}"`;
    console.log(`  [sign] ${path.relative(appPath, filePath)}`);
    execSync(cmd, { stdio: "pipe" });
  }

  // ── 1. Sign all native binaries in app.asar.unpacked ──────────────────────
  // electron-builder's --deep pass does not reliably recurse into
  // app.asar.unpacked, so we sign these explicitly.
  const unpackedDir = path.join(
    appPath,
    "Contents",
    "Resources",
    "app.asar.unpacked"
  );

  if (fs.existsSync(unpackedDir)) {
    const nativeExts = new Set([".dylib", ".so", ".node"]);

    function walkAndSign(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkAndSign(full);
        } else if (entry.isFile() && nativeExts.has(path.extname(entry.name))) {
          sign(full);
        }
      }
    }

    walkAndSign(unpackedDir);

    // ffmpeg executable (no extension)
    const ffmpegBin = path.join(
      unpackedDir,
      "node_modules",
      "ffmpeg-static",
      "ffmpeg"
    );
    if (fs.existsSync(ffmpegBin)) sign(ffmpegBin);
  }

  // ── 2. Sign stand-alone executables in Contents/Resources/bin/ ────────────
  // yt-dlp lives here and is not part of the bundle structure that
  // electron-builder walks.
  const binDir = path.join(appPath, "Contents", "Resources", "bin");
  if (fs.existsSync(binDir)) {
    for (const entry of fs.readdirSync(binDir, { withFileTypes: true })) {
      if (entry.isFile()) {
        sign(path.join(binDir, entry.name));
      }
    }
  }

  console.log("\n[afterSign] Supplemental signing complete.\n");
};
