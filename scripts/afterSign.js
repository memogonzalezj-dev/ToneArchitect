/**
 * afterSign.js — electron-builder hook, called after the app is code-signed
 * but BEFORE the DMG is assembled.
 *
 * Purpose: electron-builder's --deep pass misses native binaries inside
 * app.asar.unpacked and bundled third-party executables. This hook re-signs
 * every native binary individually (inside-out order) with:
 *   --options runtime  (hardened runtime — required for notarization)
 *   --timestamp        (secure timestamp — required for notarization)
 *   --force            (overwrite any prior signature)
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

  console.log(`\n[afterSign] Re-signing native binaries in:\n  ${appPath}\n`);

  function sign(filePath, useEntitlements = false) {
    const entFlag = useEntitlements
      ? `--entitlements "${entitlements}"`
      : "";
    const cmd = `codesign --force --options runtime --timestamp ${entFlag} --sign "${identity}" "${filePath}"`;
    console.log(`  [sign] ${path.relative(appPath, filePath)}`);
    execSync(cmd, { stdio: "pipe" });
  }

  // ── 1. Sign all native binaries in app.asar.unpacked ──────────────────────
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
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (nativeExts.has(ext)) {
            sign(full);
          }
        }
      }
    }

    walkAndSign(unpackedDir);

    // Sign executables in ffmpeg-static and yt-dlp area (no extension)
    const execBins = [
      path.join(
        unpackedDir,
        "node_modules",
        "ffmpeg-static",
        "ffmpeg"
      ),
    ];
    for (const bin of execBins) {
      if (fs.existsSync(bin)) sign(bin);
    }
  }

  // ── 2. Sign yt-dlp in Contents/Resources/bin/ ─────────────────────────────
  const binDir = path.join(appPath, "Contents", "Resources", "bin");
  if (fs.existsSync(binDir)) {
    for (const entry of fs.readdirSync(binDir, { withFileTypes: true })) {
      if (entry.isFile()) {
        sign(path.join(binDir, entry.name));
      }
    }
  }

  // ── 3. Re-sign Electron Framework libraries ────────────────────────────────
  const frameworkLibDir = path.join(
    appPath,
    "Contents",
    "Frameworks",
    "Electron Framework.framework",
    "Versions",
    "A",
    "Libraries"
  );
  if (fs.existsSync(frameworkLibDir)) {
    for (const entry of fs.readdirSync(frameworkLibDir, { withFileTypes: true })) {
      if (entry.isFile()) sign(path.join(frameworkLibDir, entry.name));
    }
  }

  const crashpad = path.join(
    appPath,
    "Contents",
    "Frameworks",
    "Electron Framework.framework",
    "Versions",
    "A",
    "Helpers",
    "chrome_crashpad_handler"
  );
  if (fs.existsSync(crashpad)) sign(crashpad);

  // ── 4. Re-sign helper app executables ─────────────────────────────────────
  const helperNames = [
    "Tone Architect Helper",
    "Tone Architect Helper (GPU)",
    "Tone Architect Helper (Plugin)",
    "Tone Architect Helper (Renderer)",
  ];

  for (const h of helperNames) {
    const helperExe = path.join(
      appPath,
      "Contents",
      "Frameworks",
      `${h}.app`,
      "Contents",
      "MacOS",
      h
    );
    if (fs.existsSync(helperExe)) sign(helperExe, true);
  }

  // ── 5. Re-sign Electron Framework bundle ──────────────────────────────────
  const electronFramework = path.join(
    appPath,
    "Contents",
    "Frameworks",
    "Electron Framework.framework"
  );
  if (fs.existsSync(electronFramework)) sign(electronFramework);

  // ── 6. Re-sign Squirrel + other Obj-C frameworks ──────────────────────────
  const frameworks = ["ReactiveObjC", "Squirrel", "Mantle"];
  for (const fw of frameworks) {
    const fwPath = path.join(
      appPath,
      "Contents",
      "Frameworks",
      `${fw}.framework`
    );
    if (fs.existsSync(fwPath)) sign(fwPath);
  }

  // ShipIt inside Squirrel
  const shipit = path.join(
    appPath,
    "Contents",
    "Frameworks",
    "Squirrel.framework",
    "Versions",
    "A",
    "Resources",
    "ShipIt"
  );
  if (fs.existsSync(shipit)) sign(shipit, true);

  // ── 7. Re-sign helper app bundles ─────────────────────────────────────────
  for (const h of helperNames) {
    const helperBundle = path.join(
      appPath,
      "Contents",
      "Frameworks",
      `${h}.app`
    );
    if (fs.existsSync(helperBundle)) sign(helperBundle, true);
  }

  // ── 8. Re-sign the main executable + app bundle ───────────────────────────
  const mainExe = path.join(appPath, "Contents", "MacOS", appName);
  if (fs.existsSync(mainExe)) sign(mainExe, true);

  sign(appPath, true);

  console.log("\n[afterSign] All native binaries re-signed successfully.\n");
};
