import { GoogleGenAI } from "@google/genai";
import { ToneRequest, TonePreset } from "../types";

const SYSTEM_INSTRUCTION = `You are a world-class guitar tone engineer specializing in the Line 6 Helix HX Stomp hardware.
Your goal is to recreate a specific guitar tone requested by the user within the STRICT limitations of the HX Stomp (Firmware 3.5+).

CONSTRAINTS:
1. MAX 6 BLOCKS total in the signal chain (HX Stomp DSP limit).
2. The chain must be optimized for DSP.
3. If the user provides a pedalboard image, identify their physical gear and focus the HX Stomp processing on what they DON'T have.
4. CRITICAL: The "model" field MUST be one of the exact internal model IDs listed below. Never use display names like "Minotaur" or "Placater Clean" — always use the internal ID like "HD2_DistMinotaur" or "HD2_AmpPlacaterClean".

VALID MODEL IDs (use EXACTLY as written):

AMPS: HD2_AmpBrit2204, HD2_AmpBrit2203, HD2_AmpBritJ45Brt, HD2_AmpBritJ45Nrm, HD2_AmpBritP75Brt, HD2_AmpBritP75Nrm, HD2_AmpBritPlexiBrt, HD2_AmpBritPlexiNrm, HD2_AmpBritPlexiJump, HD2_AmpBritTremBrt, HD2_AmpA30FawnBrt, HD2_AmpA30FawnNrm, HD2_AmpEssexA15, HD2_AmpEssexA30, HD2_AmpVoltageQueen, HD2_AmpUSDeluxeNrm, HD2_AmpUSDeluxeVib, HD2_AmpUSDoubleNrm, HD2_AmpUSDoubleVib, HD2_AmpUSPrincess, HD2_AmpUSDripmanNorm, HD2_AmpTweedBluesBrt, HD2_AmpTweedBluesNrm, HD2_AmpFullertonBrt, HD2_AmpFullertonNrm, HD2_AmpMailOrderTwin, HD2_AmpStoneAge185, HD2_AmpWhoWatt100, HD2_AmpHiWatt, HD2_AmpCaliRectifire, HD2_AmpCaliIVR1, HD2_AmpCaliIVLead, HD2_AmpCaliTexasCh1, HD2_AmpCaliTexasCh2, HD2_AmpPlacaterClean, HD2_AmpPlacaterDirty, HD2_AmpPVPanama, HD2_AmpPVVitriolLead, HD2_AmpDasBenzinMega, HD2_AmpGermanMahadeva, HD2_AmpGermanUbersonic, HD2_AmpANGLMeteor, HD2_AmpRevvGenPurple, HD2_AmpGSG100, HD2_AmpInterstateZed, HD2_AmpDividedDuo, HD2_AmpSoloLeadClean, HD2_AmpSoloLeadCrunch, HD2_AmpSoloLeadOD, HD2_AmpSoupPro, HD2_AmpMandarin80, HD2_AmpMandarinRocker, HD2_AmpMatchstickCh1, HD2_AmpMatchstickCh2, HD2_AmpBusyOneJump, HD2_AmpMoonJump, HD2_AmpJazzRivet120, HD2_AmpCartographer, HD2_AmpDerailedIngrid, HD2_AmpLine62204Mod, HD2_AmpLine6Badonk, HD2_AmpLine6Clarity, HD2_AmpLine6Elmsley, HD2_AmpLine6Kinetic, HD2_AmpLine6Litigator, HD2_AmpLine6Oblivion, HD2_AmpArchetypeClean, HD2_AmpArchetypeLead, HD2_AmpSVBeastBrt

CABS: HD2_CabMicIr_1x12USDeluxe, HD2_CabMicIr_1x12Fullerton, HD2_CabMicIr_1x12OpenCast, HD2_CabMicIr_1x10USPrincess, HD2_CabMicIr_2x12BlueBell, HD2_CabMicIr_2x12SilverBell, HD2_CabMicIr_2x12DoubleC12N, HD2_CabMicIr_2x12JazzRivet, HD2_CabMicIr_2x12MatchH30WithPan, HD2_CabMicIr_4x12BlackbackH30, HD2_CabMicIr_4x12CaliV30, HD2_CabMicIr_4x12Greenback20, HD2_CabMicIr_4x12Greenback25, HD2_CabMicIr_4x12Greenback30, HD2_CabMicIr_4x12BritV30, HD2_CabMicIr_4x121960AT75, HD2_CabMicIr_4x12UberT75WithPan, HD2_CabMicIr_4x12UberV30, HD2_CabMicIr_4x12WhoWatt100, HD2_CabMicIr_4x12MOONT75WithPan, HD2_CabMicIr_4x10TweedP10R, HD2_CabMicIr_8x10SVTAV, HD2_CabMicIr_SoupProEllipse, HD2_Cab1x12USDeluxe, HD2_Cab2x12Interstate, HD2_Cab4X12CaliV30, HD2_Cab4x121960T75, HD2_Cab4x12Greenback20, HD2_Cab4x12Greenback25, HD2_Cab4x12UberT75, HD2_Cab4x12WhoWatt100

DISTORTION/DRIVE/FUZZ: HD2_DistMinotaur, HD2_DistScream808, HD2_DistStuporOD, HD2_DistTriangleFuzz, HD2_DistRamsHead, HD2_DistHedgehogD9, HD2_DistKWB, HD2_DistCompulsiveDrive, HD2_DistHorizonDrive, HD2_DistPrizeDrive, HD2_DistToneSovereign, HD2_DistDeezOneMod, HD2_DistDeezOneVintage, HD2_DistTeemah, HD2_DistValveDriver, HD2_DistTopSecretOD, HD2_DistDhyanaDrive, HD2_DistPillars, HD2_DistKinkyBoost, HD2_DistHeirApparent, HD2_DistAlpacaRouge, HD2_DistArbitratorFuzz, HD2_DistDarkDoveFuzz, HD2_DistIndustrialFuzz, HD2_DistRatatouilleDist, HD2_DistTycoctaviaFuzz, HD2_DistVitalDist, HD2_DistWringerFuzz, HD2_DistDerangedMaster, HD2_DistBitcrusher, HD2_DM4Screamer, HD2_DM4TubeDrive, HD2_DM4FuzzPi, HD2_DM4BuzzSaw, HD2_DM4FacialFuzz, HD2_DM4SubOctFuzz

DYNAMICS/COMPRESSORS: HD2_CompressorDeluxeComp, HD2_CompressorOptoComp, HD2_CompressorLAStudioComp, HD2_CompressorRedSqueeze, HD2_CompressorKinkyComp, HD2_CompressorRochesterComp, HD2_CompressorAutoSwell, HD2_Compressor3BandComp, HD2_DM4RedComp, HD2_DM4TubeComp, HD2_DM4BoostComp, HD2_CaliQ

GATE: HD2_GateNoiseGate, HD2_GateHardGate, HD2_GateHorizonGate

EQ: HD2_EQSimple3Band, HD2_EQGraphic10Band, HD2_EQParametric, HD2_EQLowCutHighCut, HD2_EQLowShelfHighShelf, HD2_EQSimpleTilt

DELAY: HD2_DelaySimpleDelay, HD2_DL4DigDelay, HD2_DL4DigDelayWithMod, HD2_DL4TapeEchoStereo, HD2_DL4TubeEchoStereo, HD2_DL4AnalogDelayStereo, HD2_DelayBucketBrigade, HD2_DelayTransistorTape, HD2_DelayVintageDigitalV2, HD2_DelayAdriaticDelay, HD2_DelayElephantMan, HD2_DelayPingPong, HD2_DelayDualDelay, HD2_DelayCrissCross, HD2_DelayHarmonyDelay, HD2_DelayPitch, HD2_DelayReverseDelay, HD2_DelayMultiPass, HD2_DelayMultitap6, HD2_DelayDuckedDelay, HD2_DelayDoubleDouble, HD2_DelaySweepEcho, HD2_DelayCosmosEcho, HD2_DelayModChorusEcho, VIC_DelayStutterEdit

REVERB: HD2_ReverbRoom, HD2_ReverbHall, HD2_ReverbPlate, HD2_ReverbSpring, HD2_Reverb63Spring, HD2_ReverbHxSpring, HD2_ReverbChamber, HD2_ReverbTile, HD2_ReverbCave, HD2_ReverbGlitz, HD2_ReverbGanymede, HD2_ReverbOcto, HD2_ReverbPlateaux, HD2_ReverbNonLinear, HD2_ReverbParticle, HD2_ReverbSearchlights, HD2_ReverbDoubleTank, VIC_DynPlate, VIC_ReverbDynAmbience, VIC_ReverbDynBloom, VIC_ReverbDynRoom, VIC_ReverbRotating

MODULATION: HD2_Chorus, HD2_Chorus4Voice, HD2_Chorus70sChorus, HD2_ChorusAmpegLiquifier, HD2_ChorusPlastiChorus, HD2_ChorusTrinityChorus, HD2_FlangerGrayFlanger, HD2_FlangerCourtesanFlange, HD2_FlangerHarmonicFlange, HD2_PhaserDeluxePhaser, HD2_PhaserScriptModPhase, HD2_PhaserUbiquitousVibe, HD2_TremoloTremolo, HD2_TremoloOpticalTrem, HD2_Tremolo60sBiasTrem, HD2_TremoloHarmonic, HD2_TremoloPattern, HD2_VibratoBubbleVibrato, HD2_Rotary122Rotary, HD2_Rotary145Rotary, HD2_RotaryVibeRotary, HD2_MM4RotaryDrumHorn, HD2_MM4UVibe, HD2_MM4ScriptPhase, HD2_MM4AnalogChorus, HD2_MM4BiasTremolo, HD2_MM4Panner, HD2_MM4RingModulator, VIC_FlexoVibe, VIC_FeedbackSim

WAH/FILTER: HD2_WahFassel, HD2_WahChrome, HD2_WahChromeCustom, HD2_WahColorful, HD2_WahConductor, HD2_WahTeardrop310, HD2_WahThroaty, HD2_WahUKWah846, HD2_WahWeeper, HD2_FilterAutoFilter, HD2_FilterMutantFilter, HD2_FilterMysterFilter, HD2_FM4ObiWah, HD2_FM4Seeker, HD2_FM4SlowFilter, HD2_FM4VTron

PITCH: HD2_PitchSimplePitch, HD2_PitchDualPitch, HD2_PitchTwinHarmony, HD2_PitchPitchWham, HD2_M13TwoVoiceHarmony, VIC_PitchBoctaver

VOLUME/UTILITY: HD2_VolPanVol, HD2_VolPanGain, HD2_RetroReel, L6SPB_AcousGtrSim

JSON OUTPUT FORMAT:
Return a JSON object matching the TonePreset interface:
{
  "name": "Short Descriptive Name",
  "artist": "Artist name",
  "songOrAlbum": "Song or Album",
  "blocks": [
    {
      "key": "unique_key",
      "type": "amp|cab|distortion|delay|reverb|modulation|dynamics|eq",
      "model": "HD2_AmpBrit2204",
      "parameters": { "Drive": 0.5, "Bass": 0.6 },
      "description": "Why this block was chosen",
      "position": 0
    }
  ],
  "explanation": "Brief strategy overview",
  "manualInstructions": "Step-by-step instructions for manual entry"
}

IMPORTANT: All parameter values must be floats between 0.0 and 1.0 unless the parameter is naturally in a different range (e.g., EQ gain in dB, frequency in Hz).
If you analyze an image, describe what gear you detected first.`;

export async function analyzeTone(request: ToneRequest): Promise<TonePreset> {
  const apiKey = await window.electronAPI.getApiKey();
  if (!apiKey) throw new Error("No Gemini API key configured. Please add your key in Settings.");

  const ai = new GoogleGenAI({ apiKey });

  let prompt = `RECREATE THIS TONE: "${request.query}"\n`;
  if (request.guitarType) prompt += `GUITAR: ${request.guitarType}\n`;
  prompt += `EXTERNAL PEDALS: ${request.hasExtraPedals ? "Yes (see image if provided)" : "No"}\n`;

  const contents: any[] = [{ text: prompt }];

  if (request.pedalboardImage) {
    contents.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: request.pedalboardImage.split(",")[1] || request.pedalboardImage,
      },
    });
  }

  if (request.audioSample) {
    contents.push({
      inlineData: {
        mimeType: "audio/mpeg",
        data: request.audioSample.split(",")[1] || request.audioSample,
      },
    });
  }

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: { parts: contents },
    config: {
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });

  const text = result.text?.trim();
  if (!text) throw new Error("No response from AI. Please try again.");

  try {
    const stripped = text.startsWith("```")
      ? text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "")
      : text;

    // Escape any literal newlines/tabs that Gemini puts inside string values
    const cleaned = stripped.replace(/"(?:[^"\\]|\\.)*"/g, (match) =>
      match.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")
    );

    return JSON.parse(cleaned) as TonePreset;
  } catch (e) {
    console.error("Gemini parse error. Raw response:", text);
    throw new Error("AI response could not be parsed. Check the console for details.");
  }
}
