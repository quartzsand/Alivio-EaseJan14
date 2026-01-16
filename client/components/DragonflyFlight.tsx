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
  intensity: number; // 0..1
  carrierDensity: number; // arbitrary “density proxy”
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
  const rotate = useRef(new Animated.Value(0)).current;

  const [dir, setDir] = useState<1 | -1>(1);
  const [pose, setPose] = useState<Pose>("hover");

  const startMsRef = useRef<number>(Date.now());
  const beatBpm = 80;
  const beatPeriodMs = 60000 / beatBpm;

  const visualBeatHz = useMemo(() => {
    // carrierDensity -> a human-visible beat rate (clamped)
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

  // Cross-screen travel. Flip direction when finished; effect re-runs on dir change.
  useEffect(() => {
    let cancelled = false;

    const travel = W + 260;
    const startX = dir === 1 ? -140 : travel - 140;
    const endX = dir === 1 ? travel - 140 : -140;

    x.setValue(startX);

    const baseMs = phase === "peak" ? 2600 : phase === "settle" ? 4200 : 5200;
    const ms = clamp(baseMs - intensity * 1400, 1800, 6500);

    const anim = Animated.timing(x, {
      toValue: endX,
      duration: ms,
      useNativeDriver: true,
    });

    anim.start(({ finished }) => {
      if (!finished || cancelled) return;
      setDir((d) => (d === 1 ? -1 : 1));
    });

    return () => {
      cancelled = true;
      x.stopAnimation();
    };
  }, [W, dir, phase, intensity, x]);

  // Pose selection locked to beat index
  useEffect(() => {
    const id = setInterval(() => {
      const nowMs = Date.now();
      const posMs = musicPositionMs ?? nowMs - startMsRef.current;
      const beatIndex = Math.floor(posMs / beatPeriodMs);

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
  }, [phase, musicPositionMs, beatPeriodMs]);

  // Beat-locked bobbing + density jitter (rAF loop, correctly cancellable)
  useEffect(() => {
    let mounted = true;
    const rafRef = { id: 0 };

    const tick = () => {
      if (!mounted) return;

      const nowMs = Date.now();
      const posMs = musicPositionMs ?? nowMs - startMsRef.current;
      const posS = posMs / 1000;
      const beatPhase = (posMs % beatPeriodMs) / beatPeriodMs;

      const twoPi = Math.PI * 2;

      const bobAmp = 10 + 26 * clamp(intensity, 0, 1);
      const bob = Math.sin(twoPi * beatPhase) * bobAmp;

      const jitterAmp = phase === "peak" ? 6 : 3.5;
      const jitter = Math.sin(twoPi * posS * jitterHz) * jitterAmp;

      const drift =
        Math.sin(twoPi * posS * visualBeatHz * 0.25) * (6 + 10 * intensity);

      y.setValue(H * 0.22 + bob + jitter + drift);

      const s =
        baseScale *
        (1 +
          0.06 * Math.sin(twoPi * beatPhase) +
          0.03 * Math.sin(twoPi * posS * 1.7));
      scale.setValue(s);

      const tilt =
        (phase === "peak" ? 10 : 6) * Math.sin(twoPi * beatPhase + Math.PI / 4);
      rotate.setValue(tilt);

      rafRef.id = requestAnimationFrame(tick);
    };

    rafRef.id = requestAnimationFrame(tick);

    return () => {
      mounted = false;
      cancelAnimationFrame(rafRef.id);
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
    rotate,
  ]);

  const spriteSource = (SPRITES[variant][pose] ??
    SPRITES[variant].hover) as any;

  const transform = [
    { translateX: x },
    { translateY: y },
    { scale },
    {
      rotate: rotate.interpolate({
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
