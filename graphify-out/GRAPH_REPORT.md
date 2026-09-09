# Graph Report - /Users/aravparikh/Documents/Claude/medlingua  (2026-07-14)

## Corpus Check
- Corpus is ~38,738 words - fits in a single context window. You may not need a graph.

## Summary
- 400 nodes · 652 edges · 30 communities (21 shown, 9 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Mobile UI Components
- Conversation Screen & Phrases
- Expo SDK Dependencies
- Expo App Config
- TypeScript Config Refs
- Landing Site Components
- Landing Site Dependencies
- Body Map & Motion
- Docs & Launch Checklist
- Mobile Package Manifest
- App Entry & Prefs Storage
- Privacy Policy Page
- Terms Page
- Landing Site Layout
- Mobile TS Config
- API Key Proxy Worker
- Humanizer Skill Docs
- Brand Color & Icons
- Vercel Template Assets
- Globe Template Asset
- Android Icon Art
- Favicon
- App Icon
- Splash Icon
- Next.js Config
- PostCSS Config
- Next.js Logo Assets
- Monochrome Icon
- File Icon Asset

## God Nodes (most connected - your core abstractions)
1. `Language` - 21 edges
2. `ConversationScreen()` - 17 edges
3. `t()` - 16 edges
4. `compilerOptions` - 16 edges
5. `expo` - 12 edges
6. `colors` - 12 edges
7. `spacing` - 11 edges
8. `radius` - 11 edges
9. `fonts` - 10 edges
10. `type` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Next.js Breaking-Changes Agent Rule` --semantically_similar_to--> `Expo Versioned-Docs Agent Rule`  [INFERRED] [semantically similar]
  AGENTS.md → mobile/AGENTS.md
- `MedLingua App Store Launch Checklist` --references--> `Next.js Landing Site (root project)`  [INFERRED]
  LAUNCH.md → README.md
- `Next.js Breaking-Changes Agent Rule` --conceptually_related_to--> `Next.js Landing Site (root project)`  [INFERRED]
  AGENTS.md → README.md
- `MedLingua App Store Launch Checklist` --references--> `MedLingua iOS App`  [INFERRED]
  LAUNCH.md → mobile/README.md
- `MedLingua App Store Launch Checklist` --references--> `Whisper to GPT-4o to TTS Translation Pipeline`  [INFERRED]
  LAUNCH.md → mobile/README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **API Key Protection Flow** — launch_api_key_proxy, proxy_readme_cloudflare_worker_proxy, proxy_readme_per_device_rate_limiting, proxy_readme_api_proxy_url_env [EXTRACTED 1.00]
- **Privacy and Compliance Posture** — mobile_readme_no_storage_privacy, launch_privacy_manifest, launch_privacy_nutrition_label, launch_medical_disclaimer [INFERRED 0.85]
- **Conversation Screen Feature Set** — mobile_readme_quick_phrases, mobile_readme_auto_detect_mode, mobile_readme_face_the_patient_mode, mobile_readme_translation_pipeline [EXTRACTED 1.00]

## Communities (30 total, 9 thin omitted)

### Community 0 - "Mobile UI Components"
Cohesion: 0.10
Nodes (42): fitFontSize(), FullscreenTranslation(), Props, styles, BAR_SENSITIVITY, styles, PressableScale(), Props (+34 more)

### Community 1 - "Conversation Screen & Phrases"
Cohesion: 0.08
Nodes (44): LevelMeter(), SummaryState, ENGLISH, CLINICIAN_PHRASES, EMERGENCY_PHRASES, PATIENT_PHRASES, Phrase, ConversationScreen() (+36 more)

### Community 2 - "Expo SDK Dependencies"
Cohesion: 0.05
Nodes (39): expo, expo-asset, expo-audio, expo-clipboard, expo-file-system, expo-font, @expo-google-fonts/lexend, @expo-google-fonts/noto-sans (+31 more)

### Community 3 - "Expo App Config"
Cohesion: 0.06
Nodes (32): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, predictiveBackGestureEnabled, expo (+24 more)

### Community 4 - "TypeScript Config Refs"
Cohesion: 0.06
Nodes (30): ./*, dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts (+22 more)

### Community 5 - "Landing Site Components"
Cohesion: 0.08
Nodes (9): CrackedM(), CrackedMProps, HeroProps, steps, Nav(), NavProps, TODO: FORMSPREE_ENDPOINT — to upgrade from mailto to a real form backend:, SignUp (+1 more)

### Community 6 - "Landing Site Dependencies"
Cohesion: 0.07
Nodes (27): next, dependencies, next, react, react-dom, devDependencies, tailwindcss, @tailwindcss/postcss (+19 more)

### Community 7 - "Body Map & Motion"
Cohesion: 0.12
Nodes (21): Appear(), BodyMapModal(), BodyView, FIGURE, FigureRegion, Props, Shape, SHARED_EXTREMITIES (+13 more)

### Community 8 - "Docs & Launch Checklist"
Cohesion: 0.15
Nodes (20): Next.js Breaking-Changes Agent Rule, Project CLAUDE.md (delegates to AGENTS.md), API Key Proxy (launch requirement), MedLingua App Store Launch Checklist, Prominent Medical Disclaimer, iOS Privacy Manifest, App Store Privacy Nutrition Label, Expo Versioned-Docs Agent Rule (+12 more)

### Community 9 - "Mobile Package Manifest"
Cohesion: 0.11
Nodes (18): devDependencies, react-dom, react-native-web, @types/react, typescript, react-dom, @types/react, typescript (+10 more)

### Community 10 - "App Entry & Prefs Storage"
Cohesion: 0.36
Nodes (9): App(), Screen, styles, getLanguage(), getDeviceId(), loadPrefs(), Prefs, prefsFile() (+1 more)

### Community 11 - "Privacy Policy Page"
Cohesion: 0.25
Nodes (6): a, h2, li, metadata, p, ul

### Community 12 - "Terms Page"
Cohesion: 0.33
Nodes (4): a, h2, metadata, p

### Community 13 - "Landing Site Layout"
Cohesion: 0.40
Nodes (3): inter, metadata, plusJakarta

### Community 14 - "Mobile TS Config"
Cohesion: 0.40
Nodes (4): compilerOptions, strict, extends, expo/tsconfig.base

### Community 15 - "API Key Proxy Worker"
Cohesion: 0.70
Nodes (4): ALLOWED_MODELS, ALLOWED_PATHS, fetch(), json()

### Community 16 - "Humanizer Skill Docs"
Cohesion: 0.67
Nodes (4): Signs of AI Writing Patterns, Humanizer Skill, Voice Calibration from Writing Sample, Wikipedia: Signs of AI Writing (WikiProject AI Cleanup)

### Community 17 - "Brand Color & Icons"
Cohesion: 0.67
Nodes (3): MedLingua Brand Teal Color, Expo app.json Android adaptiveIcon config, Android Adaptive Icon Background (solid dark teal)

### Community 18 - "Vercel Template Assets"
Cohesion: 0.67
Nodes (3): Next.js Framework, Vercel Logo (Triangle SVG), Vercel (Deployment Platform)

### Community 19 - "Globe Template Asset"
Cohesion: 0.67
Nodes (3): Globe Icon (globe.svg), Globe / Internationalization Symbol, Next.js Default Template Asset

## Ambiguous Edges - Review These
- `Expo Versioned-Docs Agent Rule` → `MedLingua iOS App`  [AMBIGUOUS]
  mobile/AGENTS.md · relation: conceptually_related_to

## Knowledge Gaps
- **177 isolated node(s):** `plusJakarta`, `inter`, `metadata`, `metadata`, `h2` (+172 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Expo Versioned-Docs Agent Rule` and `MedLingua iOS App`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `expo-font` connect `Expo App Config` to `App Entry & Prefs Storage`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **What connects `plusJakarta`, `inter`, `metadata` to the rest of the system?**
  _177 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Mobile UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.09993011879804332 - nodes in this community are weakly interconnected._
- **Should `Conversation Screen & Phrases` be split into smaller, more focused modules?**
  _Cohesion score 0.07918367346938776 - nodes in this community are weakly interconnected._
- **Should `Expo SDK Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Expo App Config` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._