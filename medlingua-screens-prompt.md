# Task: make the MedLingua app screens match the mockup exactly

Work in the existing React Native app under `mobile/`. **Do not create an HTML
file or a prototype.** Every change lands in `mobile/src/**` and shows up when
the app runs.

`medlingua-paper.html` at the repo root is the reference. Open it. The app must
match it. Where the app and the reference disagree, **the reference wins** —
colours, type sizes, spacing, layout, all of it. Do not substitute your own
judgement for a value in the reference.

## Read these first — most of this is already built

Do not rebuild components that exist. Read, then change only what differs:

- `mobile/src/components/editorial/Editorial.tsx` — `Masthead`, `ModeControl`,
  `ActionIndex`, `SpeakBar`, `PrivacyLine`, `Caption`, `Rule`
- `mobile/src/components/conversation/Transcript.tsx` — `ConversationBlock`
  (home history block), `TranscriptScreen` (pushed ledger), `Exchange`
- `mobile/src/components/ui/Button.tsx`, `Label.tsx` — bilingual label
  primitives
- `mobile/src/screens/ConversationScreen.tsx` — the home screen
- `mobile/src/components/SummaryModal.tsx` — the summary
- `mobile/src/theme.ts` — the design system all of the above read from

## Step 1: put the exact values into the theme

The components already read colours and sizes from `theme.ts`. Set the tokens to
the reference's values and most of the app moves on its own.

In `lightColors`, set exactly:

| Token | Value |
|---|---|
| `bg` | `#EFECE5` |
| `surface` | `rgba(255,255,255,0.5)` |
| `ink` | `#1D1C1A` |
| `ink2` | `#77726A` |
| `accent` | `#A9C3CB` |
| `ctaFill` | `#2B3A45` |
| `onCta` | `#FFFDF8` |
| `hairline` | `rgba(29,28,26,0.18)` |
| `rule` | `rgba(29,28,26,0.10)` |

The summary screen's ground is `#FDFCFA`, lighter than every other screen.

Speaker rules are 2px: `rgba(29,28,26,0.22)` for the patient, `#A9C3CB` for the
clinician. The CTA spine is `#A9C3CB`.

No gradients. No shadows inside a screen. No coloured bubbles.

Set the `text` scale to the reference's sizes:

| Role | Font | Size |
|---|---|---|
| status clock | Manrope 600 | 12.5 |
| section labels | Manrope 600, letter-spacing 0.14–0.16em, uppercase | 9–9.5 |
| language name | Instrument Serif 400 | 18 |
| "cambiar" link | Manrope 500, 1px bottom border | 11 |
| index row name | Instrument Serif 400 | 18 |
| index row English | Manrope 600, 0.12em, uppercase | 9.5 |
| index numeral | mono 500 | 10 |
| transcript source | Instrument Serif 400, line-height 1.4 | 16–17 |
| transcript gloss | Manrope 500, line-height 1.45 | 12–12.5 |
| timestamps | mono 500 | 10–10.5 |
| CTA word | Instrument Serif 400 | 17 |
| CTA subline | Manrope 500, 0.13em | 9 |

Nothing exceeds 18. Nothing goes below 8.5. **Nothing is font-weight 700 or
above on any screen** — Instrument Serif is always 400, never letter-spaced;
Manrope is 500 or 600 only. Hierarchy comes from serif-versus-sans and
letter-spacing, not from size or weight.

Uppercase belongs in the string, not in a `textTransform`, so screen readers
read words rather than letters.

Timestamps and numerals use the `mono` export already in `theme.ts`.

## Step 2: the screens

**Home**, top to bottom, filling the screen with nothing overflowing:

1. Masthead: `IDIOMA` label, 3px gap, then a baseline row of the language name
   in 18px serif and `cambiar` with a 1px underline, 8px apart. On the right,
   an `AJUSTES` caption beside a 3-bar icon — transparent, no circle, no fill,
   no shadow. Closed by a section rule. No wordmark, chip, or logo anywhere in
   the header; the IDIOMA / language block is the identity.
2. Conversation block: full-width button, `flex: 1`, `minHeight: 0`,
   `overflow: 'hidden'`, `surface` background, padding 5/22/12. Inside: a label
   row (`flex: none`, 10px below) with `CONVERSACIÓN` and the exchange count in
   `ctaFill`; an exchange column at `flex: 1` + `minHeight: 0` +
   `overflow: 'hidden'` + `justifyContent: 'flex-end'`, 12px gap, holding the
   last two exchanges so new speech grows upward; the older of the two at 58%
   opacity. Each exchange is a 34px mono timestamp column, then text on the 2px
   speaker rule with 12px padding, serif source over muted gloss. Footer row on
   a 1px divider: `VER TRANSCRIPCIÓN COMPLETA` and a chevron, right-aligned.
   Never a fixed-height scroller here.
3. `MODO DE ENTRADA` label, then two halves in one 1px-bordered rectangle, 4px
   radius, hairline between. Selected half fills `ctaFill` with `onCta` text.
4. Index on a section rule: ruled rows of
   `[numeral][serif name][uppercase English][chevron]`, padding 12/2, 1px
   divider each. No fills, no cards, radius 0. Rows: Resumen/SUMMARY,
   Frases/PHRASES, Escribir/TYPE, Escanear/SCAN.
5. Two CTAs side by side, never stacked: padding 14/22/12, 9px gap, 4px radius,
   no shadow, a 16px stroked mic at the right of each.
6. Footer: the privacy line, centred.

**Transcript** (pushed): back row with chevron and `ATRÁS`, the title centred in
17px serif, exchange count at the right. Then a `flex: 1` + `minHeight: 0`
scrolling ledger: 62px margin column holding the timestamp over a speaker tag
(patient in `ink`, clinician in `ctaFill`), text on the 2px speaker rule, serif
source over muted gloss, 1px divider per row, newest row tinted
`rgba(255,255,255,0.45)`. Footer: two outlined buttons, RESUMEN and BORRAR.

**Summary** (pushed, ground `#FDFCFA`): same back row, title centred, `SUMMARY`
at the right. A meta strip on a rule: CITA / HORA / TURNOS. Then scrolling
sections, each a mono numeral plus serif title plus uppercase English label —
01 Motivo (one 18px serif sentence), 02 Síntomas and 03 Próximos pasos (bullet
lists: a 4px `ctaFill` dot, 13px Manrope over muted 11.5px English). Close with
a muted disclaimer that it was generated from the transcript. Footer: outlined
TRANSCRIPCIÓN and filled `ctaFill` COMPARTIR.

`SummaryModal.tsx` is currently a bottom sheet with a visible 2:00 countdown.
Convert it to a pushed screen in the shape above. The countdown is a privacy
feature — the summary expires so the app keeps its "nothing is saved" promise —
so keep it on the new screen. If it genuinely cannot fit the layout, ask the
user before removing it.

## Step 3: mechanics this app requires

**Strings.** The reference is hardcoded Spanish because Spanish is the selected
language. The app supports en, es, zh, vi, hi, pa, ru. Never write a Spanish
literal into a component — read every visible string with `t(languageCode)` from
`src/i18n/strings.ts`. A new key goes in the `Strings` interface and all seven
language objects.

Bilingual labels stack: patient's language as the primary line, English beneath
in the caption size and `ink2`. Never joined inline with `·` or `—`. Use
`bilingual()` and the `Label` component.

**Faces.** Use `serifFor(code)` and `fontFor(code, weight)`. Instrument Serif is
Latin-only, so those helpers pick the right serif per script; a hardcoded
`'InstrumentSerif_400Regular'` drops Hindi and Punjabi to a system fallback.
Fonts already load in `App.tsx` — do not add font loading.

**Colours** come from `const { colors } = useTheme()`, with styles built as
`const s = useMemo(() => makeStyles(colors), [colors])`. Set the values once in
`theme.ts` (step 1) rather than writing hexes into components, or dark mode
renders dark text on dark fills.

**Navigation** is a conditional render, not a router — that is deliberate, and
`App.tsx` explains why. The transcript already works this way; match it for the
summary. The push is `Animated`: the incoming screen slides from `translateX`
100% to 0 over 320ms with `Easing.bezier(.32,.72,0,1)` while the outgoing screen
moves to −16% and fades to 0. Nothing unmounts. Respect `useReducedMotion`.

**Layout rules that have already broken this screen:**

- Every scrolling region needs both `flex: 1` and `minHeight: 0`.
- Exactly one element in the home column takes the slack: the conversation block
  when turns exist, the thread before that. If neither stretches, the column
  collapses to the top and leaves dead space under the footer.
- No scrollable area inside another scrollable area.
- No live-line control panel on home. Turn actions (replay, slow replay, show,
  check, delete) open from a transcript row.
- No tab bar, no FAB, no pill-shaped buttons. Chrome radii are 0 or 4;
  `radius.pill` is only for circular icon targets.
- Icons are stroked 1.6px SVG. No emoji.

## Repo constraints

- `mobile/AGENTS.md`: this is **Expo SDK 57**. Read
  `https://docs.expo.dev/versions/v57.0.0/` before using any Expo API.
- Hooks require you to state facts (importers, affected API, the user's verbatim
  instruction) before the first Bash call and before the first edit to each
  file. The first attempt gets refused; state the facts and retry.
- `eslint.config.js` is protected and cannot be edited. Fix source instead.
- `no-restricted-imports` blocks the retired theme aliases (`colors`, `fonts`,
  `type`, `shadows`, `displayFontFor`, `MIN_TARGET`, `palette`). Use
  `useTheme()`, `fontFor`, `serifFor`, `text`, `tapTarget`, `elevation`.

## Definition of done

1. `npm run typecheck` clean, `npm test` 33/33, `npx eslint .` zero errors.
2. Verified on screen, not asserted. `preview_start` with the `medlingua-web`
   config in `.claude/launch.json`, viewport 375×812, screenshot every screen
   you changed and compare it against `medlingua-paper.html` open beside it.
3. **The mic is blocked in the preview**, so you cannot record a turn there. For
   any state that needs turns, say plainly that you could not see it and ask the
   user to check on device. Do not claim you verified something you did not.
4. Check dark mode. Every token flips; a hardcoded colour shows up there as dark
   text on a dark fill.
5. Report what you changed, what you saw, and what you could not see.

Do not push. Commit on the current branch and leave pushing to the user.
