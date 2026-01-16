// client/components/DragonflyFlight.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, StyleSheet, ViewStyle } from "react-native";

type Variant = "blue" | "white";
type Phase = "idle" | "settle" | "peak" | "cool";
type Pose = "hover" | "glide" | "dart" | "fly_up" | "fly_down" | "top_down";

const SPRITES: Record<Variant, Partial<Record<Pose, any>>> = {
  blue: {
    hover: require("../../assets/images/dragonfly-blue-hover.png"),
    glide: require("../../assets/images/dragonfly-blue-glide.png"),
    dart: require("../../assets/images/dragonfly-blue-dart.png"),
    fly_down: require("../../assets/images/dragonfly-blue-fly_down.png"),
    top_down: require("../../assets/images/dragonfly-blue-top_down.png"),
  },
  white: {
    hover: require("../../assets/images/dragonfly-white-hover.png"),
    glide: require("../../assets/images/dragonfly-white-glide.png"),
    dart: require("../../assets/images/dragonfly-white-dart.png"),
    fly_up: require("../../assets/images/dragonfly-white-fly_up.png"),
    fly_down: require("../../assets/images/dragonfly-white-fly_down.png"),
    top_down: require("../../assets/images/dragonfly-white-top_down.png"),
  },
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export type DragonflyFlightProps = {
  variant: Variant;
  phase: Phase;

  /** 0..1 envelope intensity (maps to scale + motion amplitude) */
  intensity: number;

  /** proxy for carrier density; higher => livelier jitter */
  carrierDensity: number;

  /** music clock position in ms; optional */
  musicPositionMs?: number;

  style?: ViewStyle;
};

export function DragonflyFlight({
  variant,
  phase,
  intensity,
  carrierDensity,
  musicPositionMs,
  style,
}: DragonflyFlightProps) {
  const { width: W, height: H } = Dimensions.get("window");

  const x = useRef(new Animated.Value(-140)).current;
  const y = useRef(new Animated.Value(H * 0.22)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotateDeg = useRef(new Animated.Value(0)).current;

  const [dir, setDir] = useState<1 | -1>(1);
  const dirRef = useRef<1 | -1>(1);

  const [pose, setPose] = useState<Pose>("hover");

  const localStartRef = useRef<number>(Date.now());
  const localStart = localStartRef.current;

  // “lofi-ish” default BPM. You can later make this configurable per track.
  const beatBpm = 80;
  const beatPeriodMs = 60000 / beatBpm;

  const visualBeatHz = useMemo(() => {
    // Map density to a human-visible “liveliness” rate (avoid flicker)
    return clamp(carrierDensity * 0.08, 0.8, 3.2);
  }, [carrierDensity]);

  const jitterHz = useMemo(
    () => clamp(carrierDensity * 0.25, 2, 10),
    [carrierDensity],
  );

  const baseScale = useMemo(
    () => 0.95 + 0.25 * clamp(intensity, 0, 1),
    [intensity],
  );

  const nowMs = () => musicPositionMs ?? Date.now() - localStart;

  // Cross-screen travel loop
  useEffect(() => {
    let cancelled = false;

    const run = () => {
      if (cancelled) return;

      const travel = W + 300;
      const d = dirRef.current;

      const startX = d === 1 ? -160 : travel - 160;
      const endX = d === 1 ? travel - 160 : -160;

      x.setValue(startX);

      const baseMs = phase === "peak" ? 2400 : phase === "settle" ? 3900 : 5200;
      const ms = clamp(baseMs - intensity * 1400, 1800, 6500);

      Animated.timing(x, {
        toValue: endX,
        duration: ms,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished || cancelled) return;

        // Flip direction for the next run
        dirRef.current = dirRef.current === 1 ? -1 : 1;
        setDir(dirRef.current);

        setTimeout(run, 30);
      });
    };

    run();

    return () => {
      cancelled = true;
      x.stopAnimation();
    };
  }, [W, phase, intensity, x]);

  // Pose selection loop synced to beat index
  useEffect(() => {
    const id = setInterval(() => {
      const pos = nowMs();
      const beatIndex = Math.floor(pos / beatPeriodMs);

      if (phase === "peak") {
        if (beatIndex % 5 === 0) setPose("top_down");
        else if (beatIndex % 2 === 0) setPose("dart");
        else setPose("fly_down");
      } else if (phase === "settle") {
        setPose(beatIndex % 3 === 0 ? "glide" : "hover");
      } else {
        setPose("hover");
      }
    }, 220);

    return () => clearInterval(id);
  }, [phase, beatPeriodMs, musicPositionMs]);

  // Continuous bob/scale/tilt loop (beat-locked)
  useEffect(() => {
    let mounted = true;
    let rafId = 0;

    const tick = () => {
      if (!mounted) return;

      const posMs = nowMs();
      const posS = posMs / 1000;
      const beatPhase01 = (posMs % beatPeriodMs) / beatPeriodMs;
      const twoPi = Math.PI * 2;

      // Primary bobbing: beat-locked
      const bobAmp = 10 + 26 * clamp(intensity, 0, 1);
      const bob = Math.sin(twoPi * beatPhase01) * bobAmp;

      // Small jitter: density-locked
      const jitterAmp = phase === "peak" ? 6 : 3.5;
      const jitter = Math.sin(twoPi * posS * jitterHz) * jitterAmp;

      // Drift: slow variation
      const drift =
        Math.sin(twoPi * posS * visualBeatHz * 0.25) * (6 + 10 * intensity);

      y.setValue(H * 0.22 + bob + jitter + drift);

      // Scale “breath”: envelope + beat
      const s =
        baseScale *
        (1 +
          0.06 * Math.sin(twoPi * beatPhase01) +
          0.03 * Math.sin(twoPi * posS * 1.7));
      scale.setValue(s);

      // Tilt increases slightly in peak
      const tilt =
        (phase === "peak" ? 10 : 6) *
        Math.sin(twoPi * beatPhase01 + Math.PI / 4);
      rotateDeg.setValue(tilt);

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      cancelAnimationFrame(rafId);
    };
  }, [
    H,
    intensity,
    phase,
    musicPositionMs,
    beatPeriodMs,
    baseScale,
    jitterHz,
    visualBeatHz,
    y,
    scale,
    rotateDeg,
  ]);

  const spriteSource = (SPRITES[variant][pose] ??
    SPRITES[variant].hover) as any;

  const transform = [
    { translateX: x },
    { translateY: y },
    { scale },
    {
      rotate: rotateDeg.interpolate({
        inputRange: [-20, 20],
        outputRange: ["-20deg", "20deg"],
      }),
    },
    { scaleX: dir === 1 ? 1 : -1 },
  ];

  return (
    <Animated.Image
      source={spriteSource}
      style={[styles.img, style, { transform }]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  img: {
    position: "absolute",
    width: 220,
    height: 220,
    opacity: 0.95,
  },
});
