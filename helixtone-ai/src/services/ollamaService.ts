import { ToneRequest, TonePreset } from "../types";

export const OLLAMA_BASE  = "http://localhost:11434";
export const REQUIRED_MODEL = "llama3.1:8b";

const SYSTEM_INSTRUCTION = `You are a world-class guitar tone engineer specializing in the Line 6 HX Stomp hardware.
Your goal is to recreate a specific guitar tone requested by the user within the STRICT limitations of the device (Firmware 3.5+).

CONSTRAINTS:
1. MAX 6 BLOCKS total in the signal chain (device DSP limit).
2. The chain must be optimized for DSP.
3. If the user mentions external pedals, focus the chain on what they DON'T have physically.
4. CRITICAL: The "model" field MUST be one of the exact internal model IDs listed below. Never use display names — always use the exact internal ID string.

VALID MODEL IDs (use EXACTLY as written):

AMPS: HD2_AmpBrit2204, HD2_AmpBrit2203, HD2_AmpBritJ45Brt, HD2_AmpBritJ45Nrm, HD2_AmpBritP75Brt, HD2_AmpBritP75Nrm, HD2_AmpBritPlexiBrt, HD2_AmpBritPlexiNrm, HD2_AmpBritPlexiJump, HD2_AmpBritTremBrt, HD2_AmpA30FawnBrt, HD2_AmpA30FawnNrm, HD2_AmpEssexA15, HD2_AmpEssexA30, HD2_AmpVoltageQueen, HD2_AmpUSDeluxeNrm, HD2_AmpUSDeluxeVib, HD2_AmpUSDoubleNrm, HD2_AmpUSDoubleVib, HD2_AmpUSPrincess, HD2_AmpUSDripmanNorm, HD2_AmpTweedBluesBrt, HD2_AmpTweedBluesNrm, HD2_AmpFullertonBrt, HD2_AmpFullertonNrm, HD2_AmpMailOrderTwin, HD2_AmpStoneAge185, HD2_AmpWhoWatt100, HD2_AmpCaliRectifire, HD2_AmpCaliIVR1, HD2_AmpCaliIVLead, HD2_AmpCaliTexasCh1, HD2_AmpCaliTexasCh2, HD2_AmpPlacaterClean, HD2_AmpPlacaterDirty, HD2_AmpPVPanama, HD2_AmpPVVitriolLead, HD2_AmpDasBenzinMega, HD2_AmpGermanMahadeva, HD2_AmpGermanUbersonic, HD2_AmpANGLMeteor, HD2_AmpRevvGenPurple, HD2_AmpGSG100, HD2_AmpInterstateZed, HD2_AmpDividedDuo, HD2_AmpSoloLeadClean, HD2_AmpSoloLeadCrunch, HD2_AmpSoloLeadOD, HD2_AmpSoupPro, HD2_AmpMandarin80, HD2_AmpMandarinRocker, HD2_AmpMatchstickCh1, HD2_AmpMatchstickCh2, HD2_AmpBusyOneJump, HD2_AmpMoonJump, HD2_AmpJazzRivet120, HD2_AmpCartographer, HD2_AmpDerailedIngrid, HD2_AmpLine62204Mod, HD2_AmpLine6Badonk, HD2_AmpLine6Clarity, HD2_AmpLine6Elmsley, HD2_AmpLine6Kinetic, HD2_AmpLine6Litigator, HD2_AmpLine6Oblivion, HD2_AmpArchetypeClean, HD2_AmpArchetypeLead, HD2_AmpSVBeastBrt

CABS: HD2_CabMicIr_1x12USDeluxe, HD2_CabMicIr_1x12Fullerton, HD2_CabMicIr_1x12OpenCast, HD2_CabMicIr_1x10USPrincess, HD2_CabMicIr_2x12BlueBell, HD2_CabMicIr_2x12SilverBell, HD2_CabMicIr_2x12DoubleC12N, HD2_CabMicIr_2x12JazzRivet, HD2_CabMicIr_4x12BlackbackH30, HD2_CabMicIr_4x12CaliV30, HD2_CabMicIr_4x12Greenback20, HD2_CabMicIr_4x12Greenback25, HD2_CabMicIr_4x12Greenback30, HD2_CabMicIr_4x12BritV30, HD2_CabMicIr_4x121960AT75, HD2_CabMicIr_4x12UberV30, HD2_CabMicIr_4x12WhoWatt100, HD2_CabMicIr_4x10TweedP10R, HD2_CabMicIr_8x10SVTAV, HD2_Cab1x12USDeluxe, HD2_Cab2x12Interstate, HD2_Cab4X12CaliV30, HD2_Cab4x121960T75, HD2_Cab4x12Greenback25, HD2_Cab4x12WhoWatt100

DISTORTION/DRIVE/FUZZ: HD2_DistMinotaur, HD2_DistScream808, HD2_DistStuporOD, HD2_DistTriangleFuzz, HD2_DistRamsHead, HD2_DistHedgehogD9, HD2_DistKWB, HD2_DistCompulsiveDrive, HD2_DistHorizonDrive, HD2_DistPrizeDrive, HD2_DistToneSovereign, HD2_DistDeezOneMod, HD2_DistDeezOneVintage, HD2_DistTeemah, HD2_DistValveDriver, HD2_DistTopSecretOD, HD2_DistDhyanaDrive, HD2_DistPillars, HD2_DistKinkyBoost, HD2_DistHeirApparent, HD2_DistAlpacaRouge, HD2_DistArbitratorFuzz, HD2_DistDarkDoveFuzz, HD2_DistIndustrialFuzz, HD2_DistRatatouilleDist, HD2_DistTycoctaviaFuzz, HD2_DistVitalDist, HD2_DistWringerFuzz, HD2_DistDerangedMaster, HD2_DistBitcrusher, HD2_DM4Screamer, HD2_DM4TubeDrive, HD2_DM4FuzzPi, HD2_DM4BuzzSaw, HD2_DM4FacialFuzz, HD2_DM4SubOctFuzz

DYNAMICS/COMPRESSORS: HD2_CompressorDeluxeComp, HD2_CompressorOptoComp, HD2_CompressorLAStudioComp, HD2_CompressorRedSqueeze, HD2_CompressorKinkyComp, HD2_CompressorRochesterComp, HD2_CompressorAutoSwell, HD2_Compressor3BandComp, HD2_DM4RedComp, HD2_DM4TubeComp, HD2_DM4BoostComp

GATE: HD2_GateNoiseGate, HD2_GateHardGate, HD2_GateHorizonGate

EQ: HD2_EQSimple3Band, HD2_EQGraphic10Band, HD2_EQParametric, HD2_EQLowCutHighCut, HD2_EQLowShelfHighShelf, HD2_EQSimpleTilt

DELAY: HD2_DelaySimpleDelay, HD2_DL4DigDelay, HD2_DL4DigDelayWithMod, HD2_DL4TapeEchoStereo, HD2_DL4TubeEchoStereo, HD2_DL4AnalogDelayStereo, HD2_DelayBucketBrigade, HD2_DelayTransistorTape, HD2_DelayVintageDigitalV2, HD2_DelayAdriaticDelay, HD2_DelayElephantMan, HD2_DelayPingPong, HD2_DelayDualDelay, HD2_DelayCrissCross, HD2_DelayHarmonyDelay, HD2_DelayPitch, HD2_DelayReverseDelay, HD2_DelayMultiPass, HD2_DelayDuckedDelay, HD2_DelayCosmosEcho, VIC_DelayStutterEdit

REVERB: HD2_ReverbRoom, HD2_ReverbHall, HD2_ReverbPlate, HD2_ReverbSpring, HD2_Reverb63Spring, HD2_ReverbHxSpring, HD2_ReverbChamber, HD2_ReverbTile, HD2_ReverbCave, HD2_ReverbGlitz, HD2_ReverbGanymede, HD2_ReverbOcto, HD2_ReverbPlateaux, HD2_ReverbNonLinear, HD2_ReverbParticle, HD2_ReverbSearchlights, HD2_ReverbDoubleTank, VIC_DynPlate, VIC_ReverbDynAmbience, VIC_ReverbDynBloom, VIC_ReverbDynRoom, VIC_ReverbRotating

MODULATION: HD2_Chorus, HD2_Chorus4Voice, HD2_Chorus70sChorus, HD2_ChorusAmpegLiquifier, HD2_ChorusPlastiChorus, HD2_ChorusTrinityChorus, HD2_FlangerGrayFlanger, HD2_FlangerCourtesanFlange, HD2_FlangerHarmonicFlanger, HD2_PhaserDeluxePhaser, HD2_PhaserScriptModPhase, HD2_PhaserUbiquitousVibe, HD2_TremoloTremolo, HD2_TremoloOpticalTrem, HD2_Tremolo60sBiasTrem, HD2_TremoloHarmonic, HD2_TremoloPattern, HD2_VibratoBubbleVibrato, HD2_Rotary122Rotary, HD2_Rotary145Rotary, HD2_RotaryVibeRotary, HD2_MM4RotaryDrumHorn, HD2_MM4UVibe, HD2_MM4ScriptPhase, HD2_MM4AnalogChorus, HD2_MM4BiasTremolo, HD2_MM4RingModulator, VIC_FlexoVibe

WAH/FILTER: HD2_WahFassel, HD2_WahChrome, HD2_WahChromeCustom, HD2_WahColorful, HD2_WahConductor, HD2_WahTeardrop310, HD2_WahThroaty, HD2_WahUKWah846, HD2_WahWeeper, HD2_FilterAutoFilter, HD2_FilterMutantFilter, HD2_FilterMysterFilter, HD2_FM4ObiWah, HD2_FM4Seeker, HD2_FM4SlowFilter, HD2_FM4VTron

PITCH: HD2_PitchSimplePitch, HD2_PitchDualPitch, HD2_PitchTwinHarmony, HD2_PitchPitchWham, HD2_M13TwoVoiceHarmony, VIC_PitchBoctaver

VOLUME/UTILITY: HD2_VolPanVol, HD2_VolPanGain, HD2_RetroReel, L6SPB_AcousGtrSim

You MUST respond with ONLY a valid JSON object — no markdown, no commentary, no code fences. The JSON must match this exact structure:
{
  "name": "Short preset name (max 24 chars)",
  "artist": "Artist name",
  "songOrAlbum": "Song or album title",
  "explanation": "Brief strategy: why these blocks for this tone",
  "manualInstructions": "Step-by-step guide to enter this manually on the device",
  "blocks": [
    {
      "key": "unique_snake_case_key",
      "type": "amp|cab|distortion|delay|reverb|modulation|dynamics|eq",
      "model": "HD2_AmpBrit2204",
      "parameters": { "Drive": 0.5, "Bass": 0.6, "Mid": 0.5, "Treble": 0.65 },
      "description": "Why this block",
      "position": 0
    }
  ]
}

SIGNAL CHAIN ORDER (strictly follow this left-to-right order):
  dynamics → wah → pitch → distortion/drive → AMP → CAB → eq → modulation → delay → reverb

PARAMETER SCALES — CRITICAL:
  • Drive, Gain, Bass, Mid, Treble, Presence, Master, ChVol, Level, Mix, Tone, Sustain,
    Attack, Release, Balance, Sag, Hum, Bias, Depth, Rate, Speed, Feedback, Sensitivity,
    Volume, Pan, Amount, Clarity, Warmth, Wet, Dry:
    → ALWAYS 0.0 to 1.0 (NEVER negative, NEVER above 1.0)
    → Example: Level at 60% = 0.6  |  Gain at 70% = 0.7  |  Level is NEVER -10

  • EQ frequency parameters (LowCut, HighCut, Freq, BassFreq, individual Hz bands):
    → In Hz, e.g. 100, 800, 4000

  • EQ gain/boost/cut (Tilt, LowGain, MidGain, HighGain, individual band values in dB):
    → In dB, e.g. -3.0, 0, +2.5

  • Threshold: in dB, e.g. -48, -30
  • Tempo/time: in ms or BPM as appropriate`;

// ── Status checks ─────────────────────────────────────────────────────────────

export async function checkOllamaRunning(): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: ctrl.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

export async function checkModelAvailable(): Promise<boolean> {
  try {
    const res  = await fetch(`${OLLAMA_BASE}/api/tags`);
    const data = await res.json();
    return (data.models ?? []).some((m: { name: string }) =>
      m.name.startsWith(REQUIRED_MODEL.split(":")[0])
    );
  } catch {
    return false;
  }
}

// ── Model pull with streaming progress ────────────────────────────────────────

export type PullProgress = {
  status:    string;
  percent:   number;   // 0–100
  done:      boolean;
};

export async function pullModel(
  onProgress: (p: PullProgress) => void
): Promise<void> {
  const res = await fetch(`${OLLAMA_BASE}/api/pull`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ name: REQUIRED_MODEL, stream: true }),
  });

  if (!res.ok || !res.body) throw new Error("Failed to start model download.");

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let   buf     = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line);
        const total     = obj.total     ?? 0;
        const completed = obj.completed ?? 0;
        const percent   = total > 0 ? Math.round((completed / total) * 100) : 0;
        const isDone    = obj.status === "success";
        onProgress({ status: obj.status ?? "", percent, done: isDone });
        if (isDone) return;
      } catch {
        // skip malformed line
      }
    }
  }
}

// ── Tone analysis ─────────────────────────────────────────────────────────────

export async function analyzeTone(request: ToneRequest): Promise<TonePreset> {
  let prompt = `RECREATE THIS TONE: "${request.query}"\n`;
  if (request.guitarType)    prompt += `GUITAR: ${request.guitarType}\n`;
  if (request.hasExtraPedals) prompt += `EXTERNAL PEDALS: Yes — optimize the HX chain around them.\n`;

  // Local models are text-only — images/audio are silently skipped.
  // (multimodal support can be added later with llava or llama3.2-vision)

  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model:  REQUIRED_MODEL,
      system: SYSTEM_INSTRUCTION,
      prompt,
      stream: false,
      format: "json",       // Ollama enforces valid JSON output — no parse errors
      options: {
        temperature: 0.3,   // Low temp for consistent structured output
        num_predict: 4096,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(`Ollama error ${res.status}: ${err}`);
  }

  const data = await res.json();

  try {
    return JSON.parse(data.response) as TonePreset;
  } catch {
    throw new Error("Model returned malformed JSON. Try again.");
  }
}
