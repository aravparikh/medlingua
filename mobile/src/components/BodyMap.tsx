import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Ellipse, G, Rect } from 'react-native-svg';

import { BODY_REGIONS, type BodyRegionId } from '../config/bodyRegions';
import type { Language } from '../config/languages';
import { t } from '../i18n/strings';
import { colors, fonts, MIN_TARGET, radius, shadows, spacing, type } from '../theme';
import { Appear } from './Appear';
import { PressableScale } from './PressableScale';
import { Pulse } from './Pulse';

type BodyView = 'front' | 'back';

type Shape =
  | { kind: 'circle'; cx: number; cy: number; r: number }
  | { kind: 'rect'; x: number; y: number; w: number; h: number; rx: number }
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number };

interface FigureRegion {
  id: BodyRegionId;
  shapes: Shape[];
  /** Where the pulse dot sits, in viewBox coordinates. */
  anchor: { x: number; y: number };
  /** Extra invisible hit circle for small regions (WCAG target size). */
  hitR?: number;
}

/**
 * A friendly, rounded, gender-neutral figure drawn from capsules and circles
 * on a 200×380 viewBox. The figure is a MIRROR: the patient faces the screen,
 * so their left side is the screen's left — the picked region's name is shown
 * before speaking, so a mix-up is visible and re-tappable.
 *
 * Draw order matters for hit-testing: later shapes win, so knees/hands/feet
 * are listed after the limbs they sit on.
 */
const SHARED_LIMBS: FigureRegion[] = [
  { id: 'leftArm', shapes: [{ kind: 'rect', x: 30, y: 82, w: 24, h: 92, rx: 12 }], anchor: { x: 42, y: 122 } },
  { id: 'rightArm', shapes: [{ kind: 'rect', x: 146, y: 82, w: 24, h: 92, rx: 12 }], anchor: { x: 158, y: 122 } },
  { id: 'leftLeg', shapes: [{ kind: 'rect', x: 66, y: 208, w: 30, h: 110, rx: 15 }], anchor: { x: 81, y: 238 } },
  { id: 'rightLeg', shapes: [{ kind: 'rect', x: 104, y: 208, w: 30, h: 110, rx: 15 }], anchor: { x: 119, y: 238 } },
];

const SHARED_EXTREMITIES: FigureRegion[] = [
  { id: 'leftHand', shapes: [{ kind: 'circle', cx: 42, cy: 190, r: 14 }], anchor: { x: 42, y: 190 }, hitR: 22 },
  { id: 'rightHand', shapes: [{ kind: 'circle', cx: 158, cy: 190, r: 14 }], anchor: { x: 158, y: 190 }, hitR: 22 },
  {
    id: 'feet',
    shapes: [
      { kind: 'ellipse', cx: 76, cy: 336, rx: 22, ry: 13 },
      { kind: 'ellipse', cx: 124, cy: 336, rx: 22, ry: 13 },
    ],
    anchor: { x: 100, y: 336 },
    hitR: 24,
  },
];

const SHARED_HEAD: FigureRegion[] = [
  { id: 'neck', shapes: [{ kind: 'rect', x: 88, y: 60, w: 24, h: 16, rx: 7 }], anchor: { x: 100, y: 68 }, hitR: 20 },
  { id: 'head', shapes: [{ kind: 'circle', cx: 100, cy: 36, r: 26 }], anchor: { x: 100, y: 36 } },
];

const FIGURE: Record<BodyView, FigureRegion[]> = {
  front: [
    { id: 'chest', shapes: [{ kind: 'rect', x: 62, y: 74, w: 76, h: 54, rx: 22 }], anchor: { x: 100, y: 101 } },
    { id: 'stomach', shapes: [{ kind: 'rect', x: 66, y: 128, w: 68, h: 46, rx: 18 }], anchor: { x: 100, y: 151 } },
    { id: 'hips', shapes: [{ kind: 'rect', x: 64, y: 174, w: 72, h: 34, rx: 17 }], anchor: { x: 100, y: 191 } },
    ...SHARED_LIMBS,
    {
      id: 'knees',
      shapes: [
        { kind: 'circle', cx: 81, cy: 272, r: 15 },
        { kind: 'circle', cx: 119, cy: 272, r: 15 },
      ],
      anchor: { x: 100, y: 272 },
      hitR: 24,
    },
    ...SHARED_EXTREMITIES,
    ...SHARED_HEAD,
  ],
  back: [
    { id: 'upperBack', shapes: [{ kind: 'rect', x: 62, y: 74, w: 76, h: 62, rx: 22 }], anchor: { x: 100, y: 105 } },
    { id: 'lowerBack', shapes: [{ kind: 'rect', x: 66, y: 136, w: 68, h: 72, rx: 18 }], anchor: { x: 100, y: 172 } },
    ...SHARED_LIMBS,
    ...SHARED_EXTREMITIES,
    ...SHARED_HEAD,
  ],
};

const VIEWBOX_W = 200;
const VIEWBOX_H = 380;
const RENDER_W = 216;
const RENDER_H = (RENDER_W * VIEWBOX_H) / VIEWBOX_W;

interface Props {
  visible: boolean;
  otherLanguage: Language;
  onClose: () => void;
  /** Called with the chosen region + 0–10 intensity; parent speaks and logs the turn. */
  onConfirm: (regionId: BodyRegionId, intensity: number) => void;
}

/** The tappable figure itself. */
function Figure({
  view,
  selected,
  onSelect,
}: {
  view: BodyView;
  selected: BodyRegionId | null;
  onSelect: (id: BodyRegionId) => void;
}) {
  const anchor = selected != null ? FIGURE[view].find((r) => r.id === selected)?.anchor : undefined;

  return (
    <View style={{ width: RENDER_W, height: RENDER_H }}>
      <Svg width={RENDER_W} height={RENDER_H} viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}>
        {FIGURE[view].map((region) => {
          const isSelected = region.id === selected;
          const fill = isSelected ? colors.primaryTint : colors.surface;
          const stroke = colors.primary;
          const strokeWidth = isSelected ? 4 : 2.5;
          return (
            <G key={region.id} onPress={() => onSelect(region.id)}>
              {region.shapes.map((shape, i) => {
                const common = { fill, stroke, strokeWidth, strokeLinejoin: 'round' as const };
                if (shape.kind === 'circle') {
                  return <Circle key={i} cx={shape.cx} cy={shape.cy} r={shape.r} {...common} />;
                }
                if (shape.kind === 'ellipse') {
                  return <Ellipse key={i} cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...common} />;
                }
                return (
                  <Rect key={i} x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.rx} {...common} />
                );
              })}
              {region.hitR ? (
                <Circle cx={region.anchor.x} cy={region.anchor.y} r={region.hitR} fill="transparent" />
              ) : null}
            </G>
          );
        })}
      </Svg>
      {anchor ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: (anchor.x / VIEWBOX_W) * RENDER_W - 22,
            top: (anchor.y / VIEWBOX_H) * RENDER_H - 22,
          }}
        >
          <Pulse color={colors.accent} size={44} />
        </View>
      ) : null}
    </View>
  );
}

/**
 * "Where does it hurt?" — the patient taps the body, picks how much it hurts,
 * and the app says it in English. Works with zero literacy and zero network
 * (region names are pre-translated; device TTS covers audio offline).
 */
export function BodyMapModal({ visible, otherLanguage, onClose, onConfirm }: Props) {
  const en = t('en');
  const other = t(otherLanguage.code);

  const [view, setView] = useState<BodyView>('front');
  const [selected, setSelected] = useState<BodyRegionId | null>(null);
  const [intensity, setIntensity] = useState<number | null>(null);

  // Every open starts fresh: front view, nothing picked.
  useEffect(() => {
    if (visible) {
      setView('front');
      setSelected(null);
      setIntensity(null);
    }
  }, [visible]);

  const pickRegion = (id: BodyRegionId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelected(id);
  };

  const pickView = (v: BodyView) => {
    if (v === view) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setView(v);
    setSelected(null);
    setIntensity(null);
  };

  const confirm = () => {
    if (selected == null || intensity == null) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm(selected, intensity);
  };

  const region = selected != null ? BODY_REGIONS[selected] : null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.titleWrap}>
            <Text style={styles.title} accessibilityRole="header" accessibilityLanguage={otherLanguage.speechTag}>
              {other.whereHurts}
            </Text>
            <Text style={styles.titleEn}>{en.whereHurts}</Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={`${other.close} — ${en.close}`}
            style={({ pressed }) => [styles.close, pressed && styles.pressedDim]}
          >
            <Ionicons name="close" size={24} color={colors.primary} />
            <Text style={styles.closeText}>
              {other.close} · {en.close}
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Front / back segmented toggle. */}
          <View style={styles.segment}>
            {(['front', 'back'] as const).map((v) => {
              const active = view === v;
              const label = v === 'front' ? other.frontLabel : other.backLabel;
              const labelEn = v === 'front' ? en.frontLabel : en.backLabel;
              return (
                <PressableScale
                  key={v}
                  onPress={() => pickView(v)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${label} — ${labelEn}`}
                  flexFill
                  style={[styles.segmentButton, active && styles.segmentButtonActive]}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]} allowFontScaling maxFontSizeMultiplier={2}>
                    {label === labelEn ? labelEn : `${label} · ${labelEn}`}
                  </Text>
                </PressableScale>
              );
            })}
          </View>

          {selected == null ? (
            <Text style={styles.hint} accessibilityLiveRegion="polite" accessibilityLanguage={otherLanguage.speechTag}>
              {other.bodyMapHint}
            </Text>
          ) : null}

          <View style={styles.figureWrap}>
            <Figure view={view} selected={selected} onSelect={pickRegion} />
          </View>

          {region ? (
            <Appear style={styles.panel}>
              <View style={styles.regionRow}>
                <Ionicons name="location" size={22} color={colors.accent} importantForAccessibility="no" />
                <View style={styles.regionLabels}>
                  <Text style={styles.regionName} accessibilityLanguage={otherLanguage.speechTag} accessibilityLiveRegion="polite">
                    {region.name[otherLanguage.code]}
                  </Text>
                  <Text style={styles.regionNameEn}>{region.name.en}</Text>
                </View>
              </View>

              <Text style={styles.panelQuestion} accessibilityLanguage={otherLanguage.speechTag}>
                {other.howMuchHurt}
              </Text>
              <Text style={styles.panelQuestionEn}>{en.howMuchHurt}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.painRow}>
                {Array.from({ length: 11 }, (_, n) => {
                  const active = intensity === n;
                  return (
                    <PressableScale
                      key={n}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setIntensity(n);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={String(n)}
                      style={[styles.painChip, n >= 7 && styles.painChipHigh, active && styles.painChipActive]}
                    >
                      <Text
                        style={[styles.painChipText, n >= 7 && styles.painChipTextHigh, active && styles.painChipTextActive]}
                      >
                        {n}
                      </Text>
                    </PressableScale>
                  );
                })}
              </ScrollView>

              <PressableScale
                onPress={confirm}
                disabled={intensity == null}
                accessibilityRole="button"
                accessibilityLabel={`${other.sayIt} — ${en.sayIt}`}
                style={[styles.sayButton, intensity == null && styles.dimmed]}
              >
                <Ionicons name="volume-high" size={26} color={colors.onPrimary} />
                <View style={styles.sayLabels}>
                  <Text style={styles.sayText} accessibilityLanguage={otherLanguage.speechTag}>
                    {other.sayIt}
                  </Text>
                  {other.sayIt !== en.sayIt ? <Text style={styles.sayTextEn}>{en.sayIt}</Text> : null}
                </View>
              </PressableScale>
            </Appear>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  titleWrap: {
    flexShrink: 1,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: type.button,
    color: colors.text,
  },
  titleEn: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textMuted,
  },
  close: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  closeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.small,
    color: colors.primary,
  },
  pressedDim: {
    opacity: 0.6,
  },
  dimmed: {
    opacity: 0.4,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  segment: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxs,
    gap: spacing.xxs,
  },
  segmentButton: {
    minHeight: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.small,
    color: colors.textMuted,
    textAlign: 'center',
  },
  segmentTextActive: {
    color: colors.onPrimary,
  },
  hint: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.small,
    color: colors.textMuted,
    textAlign: 'center',
  },
  figureWrap: {
    padding: spacing.xs,
  },
  panel: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.raised,
  },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  regionLabels: {
    flexShrink: 1,
  },
  regionName: {
    fontFamily: fonts.bodyBold,
    fontSize: type.title,
    color: colors.text,
  },
  regionNameEn: {
    fontFamily: fonts.body,
    fontSize: type.small,
    color: colors.textMuted,
  },
  panelQuestion: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.small,
    color: colors.text,
    marginTop: spacing.xxs,
  },
  panelQuestionEn: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textMuted,
  },
  painRow: {
    gap: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  painChip: {
    minWidth: 52,
    minHeight: 52,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  painChipHigh: {
    borderColor: colors.listening,
  },
  painChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  painChipText: {
    fontFamily: fonts.bodyBold,
    fontSize: type.body,
    color: colors.text,
  },
  painChipTextHigh: {
    color: colors.listening,
  },
  painChipTextActive: {
    color: colors.onPrimary,
  },
  sayButton: {
    minHeight: MIN_TARGET + 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    marginTop: spacing.xs,
  },
  sayLabels: {
    alignItems: 'center',
  },
  sayText: {
    fontFamily: fonts.bodyBold,
    fontSize: type.button,
    color: colors.onPrimary,
  },
  sayTextEn: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.onPrimary,
    opacity: 0.9,
  },
});
