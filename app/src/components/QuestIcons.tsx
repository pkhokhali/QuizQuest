import React from "react";
import Svg, { Circle, Line, Path, Polygon, Rect } from "react-native-svg";

type IconProps = {
  size?: number;
  color?: string;
  secondary?: string;
};

export function IconHome({ size = 22, color = "#1E3A5F" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 11.5L12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconBattle({ size = 22, color = "#1E3A5F" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 19L14.5 9.5M9.5 4.5l2 2M14.5 9.5l2 2M16.5 7.5l3-3M4.5 14.5l2 2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M19 5l-9.5 9.5M14.5 19.5l-2-2M9.5 14.5l-2-2M7.5 16.5l-3 3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.85}
      />
    </Svg>
  );
}

export function IconRanks({ size = 22, color = "#1E3A5F" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 18l5-7 4 3 4-8 5 12H3z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path d="M14 6l1.5-2L17 6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function IconAwards({ size = 22, color = "#1E3A5F" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={9} r={5} stroke={color} strokeWidth={2} />
      <Path
        d="M9 13.5L7.5 20l4.5-2.5L16.5 20 15 13.5"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconProfile({ size = 22, color = "#1E3A5F" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={9} r={3.5} stroke={color} strokeWidth={2} />
      <Path
        d="M5.5 19c1.2-3 3.4-4.5 6.5-4.5s5.3 1.5 6.5 4.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function IconMap({
  size = 40,
  color = "#1E3A5F",
  secondary = "#E8A317",
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Path
        d="M8 12l12-4 12 4 8-3v28l-8 3-12-4-12 4V12z"
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <Circle cx={28} cy={20} r={3} fill={secondary} />
      <Path
        d="M28 23v8"
        stroke={secondary}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function IconFlame({
  size = 28,
  color = "#E8A317",
  secondary = "#F97316",
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3c1 3-1 4.5 0 7 2-1 4 1 4 4a4 4 0 1 1-8 0c0-2.5 1.5-4 2.5-5.5C9.5 7 11 5.5 12 3z"
        fill={secondary}
      />
      <Path
        d="M12 14c.4 1.2-.2 2 .2 3.2.8-.4 1.6.3 1.6 1.3a1.8 1.8 0 1 1-3.6 0c0-1 .6-1.6 1-2.2.3-.5.7-1.2.8-2.3z"
        fill={color}
      />
    </Svg>
  );
}

export function IconCompass({
  size = 56,
  color = "#FFFFFF",
  secondary = "#E8A317",
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Circle cx={32} cy={32} r={26} stroke={color} strokeWidth={3} opacity={0.9} />
      <Circle cx={32} cy={32} r={4} fill={secondary} />
      <Polygon points="32,12 36,30 32,28 28,30" fill={secondary} />
      <Polygon points="32,52 28,34 32,36 36,34" fill={color} opacity={0.7} />
      <Rect x={30.5} y={8} width={3} height={6} rx={1} fill={color} />
    </Svg>
  );
}

export function IconLogout({ size = 18, color = "#B91C1C" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M14 16l4-4-4-4M8 12h10"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * QuizQuest signature mark: a folded trail map with a single saffron quest pin.
 * Reserved for the brand lockup (login hero + app icon) — not a functional icon.
 */
export function IconQuestPin({
  size = 64,
  color = "#FFFFFF",
  secondary = "#E8A317",
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Folded map panels */}
      <Path
        d="M8 16l16-6 16 6 16-6v38l-16 6-16-6-16 6V16z"
        stroke={color}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      {/* Fold creases */}
      <Path d="M24 10v38M40 16v38" stroke={color} strokeWidth={2} opacity={0.55} />
      {/* Dashed quest trail */}
      <Path
        d="M18 40c6-2 6-10 12-11s8-8 15-9"
        stroke={secondary}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray="1 5"
      />
      {/* Trail pin */}
      <Path
        d="M45 12c4 0 7 3 7 7 0 5-7 11-7 11s-7-6-7-11c0-4 3-7 7-7z"
        fill={secondary}
      />
      <Circle cx={45} cy={19} r={2.6} fill={color} />
      <Line
        x1={18}
        y1={40}
        x2={18}
        y2={40}
        stroke={secondary}
        strokeWidth={4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function IconShield({
  size = 40,
  color = "#FFFFFF",
  secondary = "#E8A317",
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Path
        d="M24 6l14 6v12c0 9-6.5 14.5-14 18-7.5-3.5-14-9-14-18V12l14-6z"
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <Path
        d="M18 24l4 4 8-9"
        stroke={secondary}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
