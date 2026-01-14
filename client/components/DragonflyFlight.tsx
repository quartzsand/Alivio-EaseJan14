
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
  /**
   * Phase controls urgency: "peak" triggers rapid dart-like transitions.
   * You can feed this from a session phase engine later.
   */
  phase: Phase;
  /**
   * 0..1 envelope intensity (maps to scale + motion amplitude)
   */
  intensity: number;
  /**
   * A proxy for "carrier density" (e.g., haptic pulse density). Higher values => livelier jitter.
   */
  carrierDensity: number;
  /**
   * If you have a synced music clock, provide the loop position (ms). Used to lock animation to beat.
   * If omitted, animation runs off its own clock.
   */
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

  const x = useRef(new Animated.Value(-120)).current;
  const y = useRef(new Animated.Value(H * 0.22)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current; // degrees

  const [dir, setDir] = useState<1 | -1>(1);
  const [pose, setPose] = useState<Pose>("hover");

  const localStart = useRef<number>(Date.now()).current;

  const beatBpm = 80; // aligns well with typical lofi. Can be made configurable later.
  const beatPeriodMs = 60000 / beatBpm;

  const visualBeatHz = useMemo(() => {
    // Map carrier density to a human-visible beat rate. Clamp to avoid flicker.
    // We keep this separate from music BPM; music drives primary bobbing, density drives micro-jitter.
    return clamp(carrierDensity * 0.08, 0.8, 3.2);
  }, [carrierDensity]);

  const jitterHz = useMemo(() => clamp(carrierDensity * 0.25, 2, 10), [carrierDensity]);

  const baseScale = useMemo(() => 0.95 + 0.25 * clamp(intensity, 0, 1), [intensity]);

  useEffect(() => {
    // Cross-screen loop: duration shortens as intensity rises, and becomes more "urgent" in peak.
    let isCancelled = false;

    const run = () => {
      const travel = W + 260; // offscreen padding
      const startX = dir === 1 ? -140 : travel - 140;
      const endX = dir === 1 ? travel - 140 : -140;

      x.setValue(startX);

      const baseMs = phase === "peak" ? 2600 : phase === "settle" ? 4200 : 5200;
      const ms = clamp(baseMs - intensity * 1400, 1800, 6500);

      Animated.timing(x, {
        toValue: endX,
        duration: ms,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished || isCancelled) return;
        setDir((d) => (d === 1 ? -1 : 1));
        // re-run with new direction
        setTimeout(run, 30);
      });
    };

    run();

    return () => {
      isCancelled = true;
      x.stopAnimation();
    };
  }, [W, dir, phase, intensity, x]);

  useEffect(() => {
    // Pose selection loop based on phase + beat index.
    const id = setInterval(() => {
      const pos = musicPositionMs ?? Date.now() - localStart;
      const beatIndex = Math.floor(pos / beatPeriodMs);

      if (phase === "peak") {
        // More urgent: dart + down and occasional top-down.
        if (beatIndex % 5 === 0) setPose("top_down");
        else if (beatIndex % 2 === 0) setPose("dart");
        else setPose("fly_down");
      } else if (phase === "settle") {
        setPose(beatIndex % 3 === 0 ? "glide" : "hover");
      } else if (phase === "cool") {
        setPose("hover");
      } else {
        setPose("hover");
      }
    }, 220);

    return () => clearInterval(id);
  }, [phase, musicPositionMs, localStart, beatPeriodMs]);

  useEffect(() => {
    // Continuous motion (bobbing, scale breathing, subtle rotation).
    let mounted = true;

    const tick = () => {
      if (!mounted) return;

      const pos = (musicPositionMs ?? Date.now() - localStart) / 1000;
      const beatPhase = ((musicPositionMs ?? Date.now() - localStart) % beatPeriodMs) / beatPeriodMs; // 0..1
      const twoPi = Math.PI * 2;

      // Primary bobbing locked to the music beat (slow + visible).
      const bobAmp = 10 + 26 * clamp(intensity, 0, 1);
      const bob = Math.sin(twoPi * beatPhase) * bobAmp;

      // Secondary "alive" jitter driven by carrier density (small amplitude).
      const jitterAmp = phase === "peak" ? 6 : 3.5;
      const jitter = Math.sin(twoPi * pos * jitterHz) * jitterAmp;

      // Up/down drift to keep motion varied.
      const drift = Math.sin(twoPi * pos * visualBeatHz * 0.25) * (6 + 10 * intensity);

      y.setValue(H * 0.22 + bob + jitter + drift);

      // Scale breath: envelope + beat
      const s = baseScale * (1 + 0.06 * Math.sin(twoPi * beatPhase) + 0.03 * Math.sin(twoPi * pos * 1.7));
      scale.setValue(s);

      // Rotation (tilt) slightly increases in peak.
      const tilt = (phase === "peak" ? 10 : 6) * Math.sin(twoPi * beatPhase + Math.PI / 4);
      rotate.setValue(tilt);

      requestAnimationFrame(tick);
    };

    const raf = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
    };
  }, [H, intensity, phase, musicPositionMs, localStart, beatPeriodMs, baseScale, jitterHz, visualBeatHz, y, scale, rotate]);

  const spriteSource = (SPRITES[variant][pose] ?? SPRITES[variant].hover) as any;

  const transform = [
    { translateX: x },
    { translateY: y },
    { scale },
    { rotate: rotate.interpolate({ inputRange: [-20, 20], outputRange: ["-20deg", "20deg"] }) },
    // Face direction of travel by flipping horizontally.
    { scaleX: dir === 1 ? 1 : -1 },
  ];

  return <Animated.Image source={spriteSource} style={[styles.img, style, { transform }]} resizeMode="contain" />;
}

const styles = StyleSheet.create({
  img: {
    position: "absolute",
    width: 220,
    height: 220,
    opacity: 0.95,
  },
});
