import { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CloseIcon, PinIcon, SpeakIcon } from './icons';
import Svg, { Circle, Ellipse, G, Rect } from 'react-native-svg';

import { BODY_REGIONS, type BodyRegionId } from '../config/bodyRegions';
import type { Language } from '../config/languages';
import { t } from '../i18n/strings';
import { bilingual, fontFor, radius, serifFor, spacing, tapTarget, useTheme, type ColorTokens } from '../theme';
import { Appear } from './Appear';
import { PressableScale } from './PressableScale';
import { Pulse } from './Pulse';
import { Label } from './ui/Label';

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
  colors,
  view,
  selected,
  onSelect,
  labelFor,
}: {
  colors: ColorTokens;
  view: BodyView;
  selected: BodyRegionId | null;
  onSelect: (id: BodyRegionId) => void;
  /** Bilingual screen-reader label for a region. */
  labelFor: (id: BodyRegionId) => string;
}) {
  const anchor = selected != null ? FIGURE[view].find((r) => r.id === selected)?.anchor : undefined;

  return (
    <View style={{ width: RENDER_W, height: RENDER_H }}>
      <Svg width={RENDER_W} height={RENDER_H} viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}>
        {FIGURE[view].map((region) => {
          const isSelected = region.id === selected;
          const fill = isSelected ? colors.surface : colors.surface;
          const stroke = colors.ink;
          const strokeWidth = isSelected ? 4 : 2.5;
          // Native: each region is a focusable element with a bilingual label
          // (the region-name live region below announces the selection).
          // Web is a dev preview only — RN a11y props leak into the SVG DOM
          // there and break rendering, so pass nothing.
          const a11y: Partial<React.ComponentProps<typeof G>> =
            Platform.OS === 'web'
              ? {}
              : { accessible: true, accessibilityLabel: labelFor(region.id) };
          return (
            <G key={region.id} onPress={() => onSelect(region.id)} {...a11y}>
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

  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
            <Text style={[styles.title, serifFor(otherLanguage.code)]} allowFontScaling maxFontSizeMultiplier={1.3} accessibilityRole="header" accessibilityLanguage={otherLanguage.speechTag}>
              {other.whereHurts}
            </Text>
            <Text style={styles.titleEn} allowFontScaling maxFontSizeMultiplier={1.3}>{en.whereHurts}</Text>
          </View>
          {/* Chrome: the label rule forbids the inline join, and a close is
             the one control whose glyph beats either language. Both names
             live in the accessibility label. */}
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={`${other.close}. ${en.close}`}
            style={({ pressed }) => [styles.close, pressed && styles.pressedFill]}
          >
            <CloseIcon size={24} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Front / back segmented toggle. */}
          <View style={styles.segment}>
            {(['front', 'back'] as const).map((v) => {
              const active = view === v;
              const label = bilingual(
                v === 'front' ? other.frontLabel : other.backLabel,
                v === 'front' ? en.frontLabel : en.backLabel,
              );
              return (
                <PressableScale
                  key={v}
                  onPress={() => pickView(v)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={label.secondary ? `${label.primary}. ${label.secondary}` : label.primary}
                  flexFill
                  style={[styles.segmentButton, active && styles.segmentButtonActive]}
                >
                  <Label
                    primary={label.primary}
                    secondary={label.secondary}
                    lang={otherLanguage.code}
                    speechTag={otherLanguage.speechTag}
                    size="caption"
                    weight="semibold"
                    align="center"
                    tone={active ? 'onInk' : 'ink2'}
                  />
                </PressableScale>
              );
            })}
          </View>

          {selected == null ? (
            <Text style={styles.hint} allowFontScaling maxFontSizeMultiplier={2} accessibilityLiveRegion="polite" accessibilityLanguage={otherLanguage.speechTag}>
              {other.bodyMapHint}
            </Text>
          ) : null}

          <View style={styles.figureWrap}>
            <Figure
              colors={colors}
              view={view}
              selected={selected}
              onSelect={pickRegion}
              labelFor={(id) => `${BODY_REGIONS[id].name[otherLanguage.code]} — ${BODY_REGIONS[id].name.en}`}
            />
          </View>

          {region ? (
            <Appear style={styles.panel}>
              <View style={styles.regionRow}>
                <PinIcon  size={22} color={colors.accent} importantForAccessibility="no" />
                <View style={styles.regionLabels}>
                  <Text style={[styles.regionName, serifFor(otherLanguage.code)]} allowFontScaling maxFontSizeMultiplier={2} accessibilityLanguage={otherLanguage.speechTag} accessibilityLiveRegion="polite">
                    {region.name[otherLanguage.code]}
                  </Text>
                  <Text style={styles.regionNameEn} allowFontScaling maxFontSizeMultiplier={2}>{region.name.en}</Text>
                </View>
              </View>

              <Text style={styles.panelQuestion} allowFontScaling maxFontSizeMultiplier={2} accessibilityLanguage={otherLanguage.speechTag}>
                {other.howMuchHurt}
              </Text>
              <Text style={styles.panelQuestionEn} allowFontScaling maxFontSizeMultiplier={2}>{en.howMuchHurt}</Text>
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
                      accessibilityLabel={other.painIs.replace('{n}', String(n))}
                      accessibilityLanguage={otherLanguage.speechTag}
                      style={[styles.painChip, n >= 7 && styles.painChipHigh, active && styles.painChipActive]}
                    >
                      <Text
                        style={[styles.painChipText, n >= 7 && styles.painChipTextHigh, active && styles.painChipTextActive]}
                        allowFontScaling
                        maxFontSizeMultiplier={1.4}
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
                <SpeakIcon  size={26} color={colors.bg} />
                <View style={styles.sayLabels}>
                  <Text style={styles.sayText} allowFontScaling maxFontSizeMultiplier={1.3} accessibilityLanguage={otherLanguage.speechTag}>
                    {other.sayIt}
                  </Text>
                  {other.sayIt !== en.sayIt ? <Text style={styles.sayTextEn} allowFontScaling maxFontSizeMultiplier={1.3}>{en.sayIt}</Text> : null}
                </View>
              </PressableScale>
            </Appear>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.bg,
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
    ...serifFor('en'),
    fontSize: 22,
    color: c.ink,
  },
  titleEn: {
    ...fontFor('en'),
    fontSize: 15,
    color: c.ink2,
  },
  close: {
    width: tapTarget.min,
    height: tapTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  pressedFill: {
    backgroundColor: c.surfacePressed,
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
    backgroundColor: c.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: c.rule,
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
    backgroundColor: c.ink,
  },
  hint: {
    ...fontFor('en', 'semibold'),
    fontSize: 17,
    color: c.ink2,
    textAlign: 'center',
  },
  figureWrap: {
    padding: spacing.xs,
  },
  panel: {
    alignSelf: 'stretch',
    backgroundColor: c.surface,
    borderRadius: radius.sheet,
    padding: spacing.md,
    gap: spacing.xs,
    
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
    ...fontFor('en', 'bold'),
    fontSize: 26,
    color: c.ink,
  },
  regionNameEn: {
    ...fontFor('en'),
    fontSize: 17,
    color: c.ink2,
  },
  panelQuestion: {
    ...fontFor('en', 'semibold'),
    fontSize: 17,
    color: c.ink,
    marginTop: spacing.xxs,
  },
  panelQuestionEn: {
    ...fontFor('en'),
    fontSize: 15,
    color: c.ink2,
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
    borderColor: c.rule,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  painChipHigh: {
    borderColor: c.danger,
  },
  painChipActive: {
    backgroundColor: c.ink,
    borderColor: c.ink,
  },
  painChipText: {
    ...fontFor('en', 'bold'),
    fontSize: 17,
    color: c.ink,
  },
  painChipTextHigh: {
    color: c.danger,
  },
  painChipTextActive: {
    color: c.bg,
  },
  sayButton: {
    minHeight: tapTarget.primary + 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.sheet,
    backgroundColor: c.ink,
    marginTop: spacing.xs,
  },
  sayLabels: {
    alignItems: 'center',
  },
  sayText: {
    ...fontFor('en', 'bold'),
    fontSize: 22,
    color: c.bg,
  },
  sayTextEn: {
    ...fontFor('en'),
    fontSize: 15,
    color: c.bg,
    opacity: 0.9,
  },
});
