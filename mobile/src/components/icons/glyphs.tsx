import { Circle, Path, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import { IconBase, type IconProps } from './Icon';

/**
 * MedLingua's bespoke glyph set. One language for every icon in the app:
 * capsules, circles, and arcs — the same grammar as the body-map figure.
 *
 * Two recurring brand marks live here:
 *  - the SPEECH BUBBLE + CROSS (the app logo, echoed in ChatIcon)
 *  - the SOUND ARC (a dot speaking two concentric arcs — SpeakIcon), with
 *    SlowIcon as its dotted twin: the same voice, spaced out word by word.
 */

/* ---------- Core actions ---------- */

/** Microphone: capsule element + holder arc + stem — the app's first verb. */
export function MicIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Rect x={9.4} y={3} width={5.2} height={10.6} rx={2.6} />
      <Path d="M5.6 11.4v.6a6.4 6.4 0 0 0 12.8 0v-.6" />
      <Path d="M12 18.4V21" />
    </IconBase>
  );
}

export function CheckIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M4.8 12.8l4.9 4.9L19.2 7" />
    </IconBase>
  );
}

/** The sound arc: a dot speaking two concentric arcs. Used everywhere audio plays. */
export function SpeakIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Circle cx={6.2} cy={12} r={2.1} fill={p.color} strokeWidth={0} />
      <Path d="M11.6 8.6a4.9 4.9 0 0 1 0 6.8" />
      <Path d="M15.2 5.8a9 9 0 0 1 0 12.4" />
    </IconBase>
  );
}

/** SpeakIcon's dotted twin: the same voice, spaced out — replay slowly. */
export function SlowIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Circle cx={6.2} cy={12} r={2.1} fill={p.color} strokeWidth={0} />
      <Path d="M11.6 8.6a4.9 4.9 0 0 1 0 6.8" strokeDasharray="0.1 4.2" />
      <Path d="M15.2 5.8a9 9 0 0 1 0 12.4" strokeDasharray="0.1 4.4" />
    </IconBase>
  );
}

export function CloseIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M6.6 6.6l10.8 10.8M17.4 6.6L6.6 17.4" />
    </IconBase>
  );
}

export function RefreshIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M19.2 12a7.2 7.2 0 1 1-2.1-5.1" />
      <Path d="M19.4 3.6v3.6h-3.6" />
    </IconBase>
  );
}

/* ---------- Communication ---------- */

/** The brand bubble with the medical cross — the app logo as a glyph. */
export function ChatIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M12 3.8c-4.8 0-8.6 2.9-8.6 6.5 0 2.1 1.2 3.9 3 5.1l-.5 4 4-1.8c.7.1 1.4.2 2.1.2 4.8 0 8.6-2.9 8.6-6.5S16.8 3.8 12 3.8Z" />
      <Path d="M12 7.7v4.4M9.8 9.9h4.4" />
    </IconBase>
  );
}

/** Two speech bubbles answering each other — two languages, one conversation. */
export function LanguageIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M14.6 9.6c0-2.8-2.5-5-5.6-5S3.4 6.8 3.4 9.6c0 1.6.8 3 2.1 3.9l-.3 2.7 2.7-1.3c.4.1.8.1 1.1.1" />
      <Path d="M9.4 14.2c0 2.8 2.5 5 5.6 5 .4 0 .8 0 1.1-.1l2.7 1.3-.3-2.7c1.3-.9 2.1-2.3 2.1-3.9 0-2.8-2.5-5-5.6-5" />
    </IconBase>
  );
}

export function PencilIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M5 19l.8-3.4L16.9 4.5a2.26 2.26 0 0 1 3.2 3.2L9 18.8 5 19Z" />
      <Path d="M14.7 6.7l3.2 3.2" />
    </IconBase>
  );
}

export function SwapIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M7.5 4.8v13.4M4.4 15.1l3.1 3.1 3.1-3.1" />
      <Path d="M16.5 19.2V5.8M13.4 8.9l3.1-3.1 3.1 3.1" />
    </IconBase>
  );
}

export function MegaphoneIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M4 10.6v2.8a1.7 1.7 0 0 0 1.7 1.7h1.5l6.3 3.9V5L7.2 8.9H5.7A1.7 1.7 0 0 0 4 10.6Z" />
      <Path d="M17 9.2a4.6 4.6 0 0 1 0 5.6" />
    </IconBase>
  );
}

/* ---------- People (the capsule figures, miniature) ---------- */

export function BodyIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Circle cx={12} cy={5.2} r={2.7} />
      <Rect x={8.7} y={9.8} width={6.6} height={10.8} rx={3.3} />
      <Path d="M5.6 11.4v4.2M18.4 11.4v4.2" />
    </IconBase>
  );
}

export function PersonIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Circle cx={12} cy={7.6} r={3.2} />
      <Path d="M5.4 20a6.6 6.6 0 0 1 13.2 0" />
    </IconBase>
  );
}

export function PeopleIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Circle cx={8.8} cy={7.6} r={2.8} />
      <Path d="M3.6 19.4a5.2 5.2 0 0 1 10.4 0" />
      <Circle cx={16.6} cy={8.6} r={2.3} />
      <Path d="M16.4 19.4a4.5 4.5 0 0 1 4-4.4" />
    </IconBase>
  );
}

/* ---------- Documents & records ---------- */

export function DocumentIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Rect x={5.4} y={3.4} width={13.2} height={17.2} rx={3} />
      <Path d="M9 9.4h6M9 12.9h6M9 16.4h3.6" />
    </IconBase>
  );
}

export function CopyIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Rect x={9} y={9} width={10.6} height={10.6} rx={3} />
      <Path d="M6 15h-.4A2.6 2.6 0 0 1 3 12.4V6.1A3.1 3.1 0 0 1 6.1 3h6.3A2.6 2.6 0 0 1 15 5.6V6" />
    </IconBase>
  );
}

export function ShareIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M12 3.6v10M8.4 7L12 3.4 15.6 7" />
      <Path d="M8.2 10.4H7a2.8 2.8 0 0 0-2.8 2.8v4.1A2.8 2.8 0 0 0 7 20.1h10a2.8 2.8 0 0 0 2.8-2.8v-4.1a2.8 2.8 0 0 0-2.8-2.8h-1.2" />
    </IconBase>
  );
}

export function LinkIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M9.4 5.6H6.6a3.1 3.1 0 0 0-3.1 3.1v8.7a3.1 3.1 0 0 0 3.1 3.1h8.7a3.1 3.1 0 0 0 3.1-3.1v-2.8" />
      <Path d="M14.4 3.6h6v6M19.9 4.1l-7.7 7.7" />
    </IconBase>
  );
}

/* ---------- Trust & safety ---------- */

export function ShieldIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M12 3.3l6.6 2.6v5.2c0 4.4-2.7 7.4-6.6 9.4-3.9-2-6.6-5-6.6-9.4V5.9L12 3.3Z" />
      <Path d="M9.1 11.7l2.1 2.1 3.7-3.8" />
    </IconBase>
  );
}

export function LockIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Rect x={5.8} y={10.6} width={12.4} height={9.4} rx={3} />
      <Path d="M8.8 10.6V8.2a3.2 3.2 0 0 1 6.4 0v2.4" />
    </IconBase>
  );
}

export function InfoIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Circle cx={12} cy={12} r={8.6} />
      <Circle cx={12} cy={8.2} r={1.3} fill={p.color} strokeWidth={0} />
      <Path d="M12 11.6v4.8" />
    </IconBase>
  );
}

export function AlertIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M10.4 5.3a1.85 1.85 0 0 1 3.2 0l7 12.1a1.85 1.85 0 0 1-1.6 2.8H5a1.85 1.85 0 0 1-1.6-2.8l7-12.1Z" />
      <Path d="M12 10v4.3" />
      <Circle cx={12} cy={17.2} r={1.2} fill={p.color} strokeWidth={0} />
    </IconBase>
  );
}

export function AlertCircleIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Circle cx={12} cy={12} r={8.6} />
      <Path d="M12 7.6v5" />
      <Circle cx={12} cy={16.2} r={1.2} fill={p.color} strokeWidth={0} />
    </IconBase>
  );
}

/** Comprehension: a kindly lightbulb — "did that land?" */
export function UnderstandIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M12 3.8a5.6 5.6 0 0 1 3.4 10.1c-.6.4-.9 1-.9 1.6v.5h-5v-.5c0-.6-.3-1.2-.9-1.6A5.6 5.6 0 0 1 12 3.8Z" />
      <Path d="M9.9 19.6h4.2" />
    </IconBase>
  );
}

export function CloudOffIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M17.4 18H6.6a4 4 0 0 1-.5-8A6 6 0 0 1 17.8 8.7 4.2 4.2 0 0 1 17.4 18Z" />
      <Path d="M4.6 4.6l14.8 14.8" />
    </IconBase>
  );
}

/* ---------- Navigation ---------- */

export function ChevronForwardIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M9.6 5.6L16 12l-6.4 6.4" />
    </IconBase>
  );
}

export function ChevronBackIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M14.4 5.6L8 12l6.4 6.4" />
    </IconBase>
  );
}

export function ArrowDownIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M12 4.6v14.2M6.2 13.4l5.8 5.8 5.8-5.8" />
    </IconBase>
  );
}

export function ArrowForwardIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M4.6 12h14.2M13.4 6.2l5.8 5.8-5.8 5.8" />
    </IconBase>
  );
}

export function ExpandIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M14.4 4.6h5v5M19.2 4.8l-5.6 5.6" />
      <Path d="M9.6 19.4h-5v-5M4.8 19.2l5.6-5.6" />
    </IconBase>
  );
}

export function EyeIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M3.5 12c2.5-4.1 5.3-6.1 8.5-6.1s6 2 8.5 6.1c-2.5 4.1-5.3 6.1-8.5 6.1S6 16.1 3.5 12Z" />
      <Circle cx={12} cy={12} r={2.5} />
    </IconBase>
  );
}

/* ---------- Tools ---------- */

export function CameraIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M8.4 7.4l1-2h5.2l1 2" />
      <Rect x={3.4} y={7.4} width={17.2} height={12.6} rx={3.4} />
      <Circle cx={12} cy={13.4} r={3.5} />
    </IconBase>
  );
}

export function SparkleIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M11 4.8c.5 3.2 1.8 4.6 5.1 5.1-3.3.5-4.6 1.9-5.1 5.1-.5-3.2-1.8-4.6-5.1-5.1 3.3-.5 4.6-1.9 5.1-5.1Z" />
      <Path d="M17.6 14.4c.25 1.6.9 2.3 2.5 2.5-1.6.25-2.25.9-2.5 2.5-.25-1.6-.9-2.25-2.5-2.5 1.6-.2 2.25-.9 2.5-2.5Z" />
    </IconBase>
  );
}

export function TimeIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Circle cx={12} cy={12} r={8.4} />
      <Path d="M12 7.6V12l3 2.2" />
    </IconBase>
  );
}

export function PinIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M12 3.6a6 6 0 0 1 6 6c0 4.1-6 10.8-6 10.8S6 13.7 6 9.6a6 6 0 0 1 6-6Z" />
      <Circle cx={12} cy={9.6} r={2.2} />
    </IconBase>
  );
}

export function MedkitIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M9.2 7.2V5.8A1.8 1.8 0 0 1 11 4h2a1.8 1.8 0 0 1 1.8 1.8v1.4" />
      <Rect x={3.4} y={7.2} width={17.2} height={13} rx={3.2} />
      <Path d="M12 10.6v6.2M8.9 13.7h6.2" />
    </IconBase>
  );
}

/* ---------- Quick-phrase glyphs (config-driven) ---------- */

export function HeartIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M12 19.6S4 14.7 4 9.5A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 8 2.1c0 5.2-8 10.1-8 10.1Z" />
    </IconBase>
  );
}

export function CallIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M6.8 4h2.1a1.2 1.2 0 0 1 1.2 1l.5 2.6a1.2 1.2 0 0 1-.6 1.3l-1.5.9a12.6 12.6 0 0 0 5.7 5.7l.9-1.5a1.2 1.2 0 0 1 1.3-.6l2.6.5a1.2 1.2 0 0 1 1 1.2v2.1a1.9 1.9 0 0 1-2 1.9A15.7 15.7 0 0 1 4.9 6a1.9 1.9 0 0 1 1.9-2Z" />
    </IconBase>
  );
}

export function PulseIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M3.4 12.6h3.5l2.1-5.7 3.9 9.6 2.3-5.5 1 1.6h4.4" />
    </IconBase>
  );
}

export function HelpCircleIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Circle cx={12} cy={12} r={8.6} />
      <Path d="M9.7 9.4a2.5 2.5 0 0 1 4.8.9c0 1.6-2.5 2-2.5 3.4" />
      <Circle cx={12} cy={16.6} r={1.2} fill={p.color} strokeWidth={0} />
    </IconBase>
  );
}

export function CheckCircleIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Circle cx={12} cy={12} r={8.6} />
      <Path d="M8.5 12.3l2.3 2.3 4.7-4.7" />
    </IconBase>
  );
}

export function CloseCircleIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Circle cx={12} cy={12} r={8.6} />
      <Path d="M9.2 9.2l5.6 5.6M14.8 9.2l-5.6 5.6" />
    </IconBase>
  );
}

export function RepeatIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M17 3.8l3 3-3 3" />
      <Path d="M20 6.8H8.5A4.5 4.5 0 0 0 4 11.3v.7" />
      <Path d="M7 20.2l-3-3 3-3" />
      <Path d="M4 17.2h11.5A4.5 4.5 0 0 0 20 12.7V12" />
    </IconBase>
  );
}

export function MealIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M7.2 3.6v5.2M4.6 3.6v3.2a2.6 2.6 0 0 0 5.2 0V3.6M7.2 11.4v9" />
      <Path d="M16.8 3.6c-1.6 1.9-2.4 4.3-1.4 8.2h2.8v8.6M18.2 3.9v7.9" />
    </IconBase>
  );
}

export function GaugeIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M4.2 15.8a8 8 0 1 1 15.6 0" />
      <Path d="M12 15.4l3.4-4.4" />
      <Circle cx={12} cy={15.6} r={1.4} fill={p.color} strokeWidth={0} />
    </IconBase>
  );
}

export function HandIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M8.2 11.2V5.6a1.3 1.3 0 0 1 2.6 0v4.6" />
      <Path d="M10.8 10.2V4.4a1.3 1.3 0 0 1 2.6 0v5.8" />
      <Path d="M13.4 10.2V5.6a1.3 1.3 0 0 1 2.6 0v6.8" />
      <Path d="M8.2 11.2v3c0 3.8 2.4 6.6 5.8 6.6 2.8 0 4.4-1.5 5.2-4.2l.7-2.6a1.3 1.3 0 0 0-2.5-.7l-.4 1.3" />
    </IconBase>
  );
}

export function WaterIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <Path d="M12 3.8s5.8 6.3 5.8 10a5.8 5.8 0 0 1-11.6 0c0-3.7 5.8-10 5.8-10Z" />
    </IconBase>
  );
}

/* ---------- Config-name registry ---------- */

type Glyph = (p: IconProps) => React.JSX.Element;

/**
 * Maps the Ionicons names stored in config files (quick phrases, scan
 * sections) to bespoke glyphs, so config never has to change shape.
 */
const REGISTRY: Record<string, Glyph> = {
  'body-outline': BodyIcon,
  'call-outline': CallIcon,
  'heart-outline': HeartIcon,
  'alert-circle-outline': AlertCircleIcon,
  'alert-circle': AlertCircleIcon,
  'hand-right-outline': HandIcon,
  'help-circle-outline': HelpCircleIcon,
  'medkit-outline': MedkitIcon,
  'pulse-outline': PulseIcon,
  'checkmark-circle-outline': CheckCircleIcon,
  'checkmark': CheckIcon,
  'close-circle-outline': CloseCircleIcon,
  'repeat-outline': RepeatIcon,
  'restaurant-outline': MealIcon,
  'speedometer-outline': GaugeIcon,
  'time-outline': TimeIcon,
  'water-outline': WaterIcon,
  'warning-outline': AlertIcon,
  'camera-outline': CameraIcon,
  'copy-outline': CopyIcon,
};

/**
 * Renders a bespoke glyph for a config-stored icon name. Falls back to the
 * stock Ionicon only for names the registry doesn't know — by design that
 * path never fires for shipped config.
 */
export function BrandGlyph({ name, size = 24, color, ...rest }: { name: string } & IconProps) {
  const Glyph = REGISTRY[name];
  if (Glyph) return <Glyph size={size} color={color} {...rest} />;
  return <Ionicons name={name as keyof typeof Ionicons.glyphMap} size={size} color={color} />;
}
