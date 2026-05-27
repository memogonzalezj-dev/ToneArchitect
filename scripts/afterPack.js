/**
 * afterPack.js — electron-builder hook, called AFTER packing but BEFORE signing.
 *
 * Why afterPack and not afterSign:
 *   electron-builder's codesign pass creates _CodeSignature/CodeResources, a
 *   manifest of every file's hash in the bundle. Signing .dylib/.node files
 *   AFTER that manifest is computed (afterSign) changes their content, so the
 *   hashes no longer match → "signature of the binary is invalid" on the main
 *   executable. Signing here means electron-builder computes CodeResources from
 *   the already-signed file content, so everything matches.
 *
 * Scope: only files that codesign --deep cannot reach on its own:
 *   - native binaries in app.asar.unpacked/ (not a bundle structure)
 *   - stand-alone executables in Contents/Resources/bin/ (yt-dlp, etc.)
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

exports.default = async function afterPack(context) {
  const { appOutDir, packager } = context;
  const appName = packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  const identity =
    "Developer ID Application: Guillermo Gonzalez Jimenez (7H65YB49C7)";
  const entitlements = path.resolve(__dirname, "../build/entitlements.mac.plist");

  console.log(`\n[afterPack] Pre-signing native binaries in:\n  ${appPath}\n`);

  function sign(filePath) {
    const cmd = `codesign --force --options runtime --timestamp --entitlements "${entitlements}" --sign "${identity}" "${filePath}"`;
    console.log(`  [sign] ${path.relative(appPath, filePath)}`);
    execSync(cmd, { stdio: "pipe" });
  }

  // ── 1. Sign all native binaries in app.asar.unpacked ──────────────────────
  // codesign --deep does not recurse into app.asar.unpacked (not a bundle),
  // so these would remain unsigned without this hook.
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
  // yt-dlp and similar binaries live here outside any bundle structure.
  const binDir = path.join(appPath, "Contents", "Resources", "bin");
  if (fs.existsSync(binDir)) {
    for (const entry of fs.readdirSync(binDir, { withFileTypes: true })) {
      if (entry.isFile()) {
        sign(path.join(binDir, entry.name));
      }
    }
  }

  console.log("\n[afterPack] Pre-signing complete.\n");
};
