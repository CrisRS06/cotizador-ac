# Cotizador AC - Trybotix Labs

## Project Overview

An AI-powered commercial air conditioning quotation tool built with SvelteKit 2, Svelte 5, and Grok 4.1. Designed as a demo/lead magnet for INCAE Business School executives.

**Goal:** User completes quotation in <2 minutes and thinks "this could solve a process in my company".

## Tech Stack

- **Frontend:** SvelteKit 2 + Svelte 5 (runes: `$state`, `$derived`, `$effect`)
- **Styling:** Tailwind CSS v4 with custom theme
- **AI/VLM:** OpenRouter API → Grok 4.1 Fast
- **PDF:** @react-pdf/renderer (client-side generation)
- **PWA:** @vite-pwa/sveltekit
- **i18n:** Custom ES/EN bilingual system

## Project Structure

```
src/
├── routes/
│   ├── +page.svelte           # Landing page
│   ├── wizard/                # 5-step quotation wizard
│   │   ├── upload/            # Step 1: Photo upload
│   │   ├── analysis/          # Step 2: AI analysis
│   │   ├── questions/         # Step 3: User inputs
│   │   ├── calculation/       # Step 4: BTU calculation
│   │   └── quote/             # Step 5: Quote options + PDF
│   ├── chat/                  # Conversational mode
│   └── api/
│       ├── analyze-room/      # VLM room analysis
│       ├── calculate/         # Thermal calculation
│       └── chat/              # Chat completions
│
├── lib/
│   ├── components/
│   │   ├── ui/                # Button, etc.
│   │   ├── wizard/            # PhotoUploader, AnalysisOverlay
│   │   ├── pdf/               # PDF generation
│   │   └── common/            # LanguageSwitcher
│   ├── stores/
│   │   └── session.svelte.ts  # Main state store (Svelte 5 runes)
│   ├── services/
│   │   └── thermal-calc.ts    # BTU calculation logic
│   ├── prompts/
│   │   └── room-analysis.ts   # VLM prompts
│   ├── constants/
│   │   └── thermal.ts         # BTU factors, equipment catalog
│   ├── i18n/                  # es.json, en.json
│   └── types/                 # TypeScript types
```

## Key Files

- `src/lib/stores/session.svelte.ts` - Central state management with Svelte 5 runes
- `src/lib/services/thermal-calc.ts` - BTU calculation formulas
- `src/lib/prompts/room-analysis.ts` - VLM system prompts
- `src/lib/constants/thermal.ts` - AC equipment catalog and factors

## BTU Calculation Formula

```
BTU Total = (Area × 600) + (Persons × 500) + (Equipment) × Factors

Factors:
- West-facing windows: +20%
- No solar film: +20%
- High ceiling (>3m): +25%
- Exposed ceiling: +15%
- L-shaped room: +10%
- Safety margin: +10%

12,000 BTU = 1 Ton (TR)
```

## Commands

```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
npm run check    # TypeScript check
```

## Environment Variables

```env
OPENROUTER_API_KEY=sk-or-...
VITE_OPENROUTER_API_KEY=sk-or-...
```

## Svelte 5 Patterns Used

```typescript
// State
let count = $state(0);

// Derived
const doubled = $derived(count * 2);

// Effects
$effect(() => {
  console.log(count);
});

// Props with defaults
let { name = 'World' }: { name?: string } = $props();

// Snippets (replaces slots)
{@render children()}
```

## API Endpoints

### POST /api/analyze-room
Analyzes room photo with Grok 4.1 VLM.

**Request:**
```json
{
  "imageBase64": "...",
  "language": "es" | "en"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "dimensions": { "width": 5, "length": 6, "height": 2.7, "area": 30, "volume": 81 },
    "windows": { "count": 2, "orientation": "west", "hasSolarFilm": false },
    "roomType": "office",
    "ceilingType": "standard",
    "hasDirectSunlight": true,
    "estimatedOccupancy": 4,
    "insights": ["Ventanas grandes hacia el oeste aumentaran carga termica"]
  }
}
```

### POST /api/calculate
Calculates BTU requirements and generates quote options.

### POST /api/chat
Chat completions with AC expert persona.

## Design Decisions

1. **Zero auth/storage** - Frictionless demo experience
2. **Client-side PDF** - Offline-capable, no server scaling
3. **Spanish-first** - Latin American market focus
4. **Progressive reveal** - Animation enhances perceived intelligence
5. **3 options always** - Economic, Recommended, Premium tiers
