// client/engine/session/buildSessionPlan.ts
import {
  AgeGroup,
  Site,
  SessionDurationSec,
  SessionPlan,
  HapticCommand,
  AudioCommand,
} from "../types";

type BuildOpts = {
  peakStyle: "max" | "snap";
  snapDensity01: number; // only used if peakStyle === "snap"
  hapticsIntensity01: number;
  audioVolume01: number;
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export function buildSessionPlan(
  site: Site,
  ageGroup: AgeGroup,
  durationSec: SessionDurationSec,
  opts: BuildOpts,
): SessionPlan {
  const totalMs = durationSec * 1000;

  // Default phase split for 24 sec: 12/6/6
  // For 18 sec: 9/4/5 (keeps peak short)
  // For 30 sec: 15/7/8
  const phases =
    durationSec === 18
      ? [
          { name: "settle" as const, startMs: 0, endMs: 9000 },
          { name: "peak" as const, startMs: 9000, endMs: 13000 },
          { name: "cooldown" as const, startMs: 13000, endMs: 18000 },
        ]
      : durationSec === 30
        ? [
            { name: "settle" as const, startMs: 0, endMs: 15000 },
            { name: "peak" as const, startMs: 15000, endMs: 22000 },
            { name: "cooldown" as const, startMs: 22000, endMs: 30000 },
          ]
        : [
            { name: "settle" as const, startMs: 0, endMs: 12000 },
            { name: "peak" as const, startMs: 12000, endMs: 18000 },
            { name: "cooldown" as const, startMs: 18000, endMs: 24000 },
          ];

  const haptics: HapticCommand[] = [];
  const audio: AudioCommand[] = [];

  // Start lofi during session (optional)
  audio.push({
    tMs: 0,
    type: "track",
    id: "lofi",
    action: "start",
    gain01: clamp01(opts.audioVolume01),
  });
  audio.push({
    tMs: totalMs - 300,
    type: "track",
    id: "lofi",
    action: "stop",
    gain01: 0.0,
  });

  // Carrier density (perceived buzz) and “depth” envelope depend on site
  const siteProfile = getSiteProfile(site, ageGroup);

  // Build settle: moderate density, ramping
  addCarrierBurst(haptics, phases[0].startMs, phases[0].endMs, {
    baseIntervalMs: siteProfile.settleIntervalMs,
    jitterMs: siteProfile.jitterMs,
    intensityStart: 0.35,
    intensityEnd: 0.75,
    globalIntensity: opts.hapticsIntensity01,
  });

  // Peak: very high density + frequency swings proxy via interval jitter + alternating heavies
  if (opts.peakStyle === "max") {
    addPeakMax(
      haptics,
      phases[1].startMs,
      phases[1].endMs,
      siteProfile,
      opts.hapticsIntensity01,
    );
  } else {
    addPeakSnap(
      haptics,
      phases[1].startMs,
      phases[1].endMs,
      siteProfile,
      opts.hapticsIntensity01,
      opts.snapDensity01,
    );
  }

  // Cooldown: taper down density and intensity
  addCarrierBurst(haptics, phases[2].startMs, phases[2].endMs, {
    baseIntervalMs: siteProfile.coolIntervalMs,
    jitterMs: Math.max(1, Math.round(siteProfile.jitterMs * 0.6)),
    intensityStart: 0.65,
    intensityEnd: 0.2,
    globalIntensity: opts.hapticsIntensity01,
  });

  return {
    site,
    ageGroup,
    durationSec,
    phases,
    haptics,
    audio,
  };
}

function getSiteProfile(site: Site, ageGroup: AgeGroup) {
  // These are perceptual “defaults” for Expo haptics: smaller interval = denser = buzzier.
  // Fingerstick wants densest.
  // Thigh/abdomen use slightly slower, with stronger reliance on audio layer.
  switch (site) {
    case "fingerstick":
      return {
        settleIntervalMs: 38,
        peakIntervalMs: 22,
        coolIntervalMs: 55,
        jitterMs: 6,
      };
    case "subq_abdomen":
    case "subq_thigh":
      return {
        settleIntervalMs: 55,
        peakIntervalMs: 32,
        coolIntervalMs: 70,
        jitterMs: 8,
      };
    case "im_deltoid":
    case "subq_deltoid":
      return {
        settleIntervalMs: 48,
        peakIntervalMs: 28,
        coolIntervalMs: 65,
        jitterMs: 7,
      };
    default:
      return {
        settleIntervalMs: 52,
        peakIntervalMs: 30,
        coolIntervalMs: 68,
        jitterMs: 8,
      };
  }
}

function addCarrierBurst(
  out: HapticCommand[],
  startMs: number,
  endMs: number,
  cfg: {
    baseIntervalMs: number;
    jitterMs: number;
    intensityStart: number;
    intensityEnd: number;
    globalIntensity: number;
  },
) {
  const dur = endMs - startMs;
  let t = startMs;
  let i = 0;

  while (t < endMs) {
    const p = dur <= 0 ? 1 : (t - startMs) / dur; // 0..1
    const intensity =
      lerp(cfg.intensityStart, cfg.intensityEnd, p) * cfg.globalIntensity;

    const jitter = randInt(-cfg.jitterMs, cfg.jitterMs);
    const interval = Math.max(18, cfg.baseIntervalMs + jitter); // keep above ~18ms to avoid timer collapse
    const style =
      intensity > 0.8 ? "heavy" : intensity > 0.45 ? "medium" : "light";

    out.push({ tMs: t, type: "impact", style, intensity01: intensity });
    t += interval;
    i++;
  }
}

function addPeakMax(
  out: HapticCommand[],
  startMs: number,
  endMs: number,
  profile: { peakIntervalMs: number; jitterMs: number },
  globalIntensity: number,
) {
  // High density; add occasional “urgent spikes” (heavy clusters)
  let t = startMs;
  while (t < endMs) {
    const jitter = randInt(-profile.jitterMs, profile.jitterMs);
    const interval = Math.max(16, profile.peakIntervalMs + jitter);

    // every ~250ms add a 3-hit cluster
    const phase = (t - startMs) % 260;
    if (phase < interval) {
      out.push({
        tMs: t,
        type: "impact",
        style: "heavy",
        intensity01: 1.0 * globalIntensity,
      });
      out.push({
        tMs: t + 28,
        type: "impact",
        style: "heavy",
        intensity01: 0.95 * globalIntensity,
      });
      out.push({
        tMs: t + 56,
        type: "impact",
        style: "medium",
        intensity01: 0.85 * globalIntensity,
      });
      t += 120;
      continue;
    }

    out.push({
      tMs: t,
      type: "impact",
      style: "heavy",
      intensity01: 0.9 * globalIntensity,
    });
    t += interval;
  }
}

function addPeakSnap(
  out: HapticCommand[],
  startMs: number,
  endMs: number,
  profile: { peakIntervalMs: number; jitterMs: number },
  globalIntensity: number,
  snapDensity01: number,
) {
  // Snap mode: baseline buzz + “snaps” occur periodically; slider controls snap rate.
  // snapDensity01 maps to snapPeriod (lower = fewer snaps, higher = more).
  const snapPeriodMs = Math.round(650 - 450 * clamp01(snapDensity01)); // 650ms .. 200ms

  let t = startMs;
  while (t < endMs) {
    const jitter = randInt(-profile.jitterMs, profile.jitterMs);
    const interval = Math.max(18, profile.peakIntervalMs + jitter);

    const sinceStart = t - startMs;
    const isSnap = sinceStart % snapPeriodMs < interval;

    if (isSnap) {
      // a pronounced “snap”
      out.push({
        tMs: t,
        type: "impact",
        style: "heavy",
        intensity01: 1.0 * globalIntensity,
      });
      out.push({
        tMs: t + 36,
        type: "impact",
        style: "medium",
        intensity01: 0.85 * globalIntensity,
      });
      t += 110;
      continue;
    }

    // baseline buzz
    out.push({
      tMs: t,
      type: "impact",
      style: "medium",
      intensity01: 0.75 * globalIntensity,
    });
    t += interval;
  }
}

function lerp(a: number, b: number, p: number) {
  return a + (b - a) * Math.max(0, Math.min(1, p));
}
function randInt(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}
