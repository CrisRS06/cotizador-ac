# Building an AI-powered mobile quotation tool in 2025-2026

**Your optimal stack for this commercial AC quotation tool centers on SvelteKit (or Next.js 15 with React expertise), Vercel AI SDK with OpenRouter for VLM integration, @react-pdf/renderer for client-side PDF generation, and Vercel with Cloudflare R2 for deployment.** This combination delivers the best balance of developer experience, mobile performance, AI-assistant coding compatibility, and cost efficiency for a polished lead magnet tool. The total infrastructure cost projects to approximately **$30-35/month** for 500-2000 quotes monthly.

The key insight driving these recommendations is that mobile-first AI tools require careful attention to bundle size, streaming responses for perceived performance, and robust error handling for unreliable network conditions. Since you're already using Voyage, OpenRouter, and Supabase for VLM-RAG, this stack integrates seamlessly while adding the wizard flow, chat interface, and PDF generation capabilities you need.

---

## Frontend framework: SvelteKit leads for AI-assisted development

**SvelteKit emerges as the strongest recommendation** for your use case, primarily because of its official MCP (Model Context Protocol) server that provides real-time documentation access to AI coding assistants like Claude Code and Cursor. Without this integration, AI tools frequently hallucinate outdated Svelte syntax, but with MCP, they retrieve exact docs and validate generated code before suggesting it.

The framework comparison reveals significant differences in AI coding compatibility. Next.js 14/15's server/client component boundaries cause persistent issues—Cursor forum reports show AI-generated code frequently triggers hydration errors and NEXT_REDIRECT mismatches. The "use client" versus "use server" distinction creates a mental model that AI assistants struggle to maintain consistently across large codebases. SvelteKit's simpler architecture—no React Server Components complexity—means fewer opportunities for AI-generated errors.

| Framework | AI Coding Compatibility | Bundle Size | PWA Support | Mobile-First Rating |
|-----------|------------------------|-------------|-------------|---------------------|
| **SvelteKit 2 + Svelte 5** | Excellent (MCP server) | ~28KB | Native service worker | ⭐⭐⭐⭐⭐ |
| **Next.js 15** | Good (with .cursorrules) | ~133KB | Plugin-based | ⭐⭐⭐⭐ |
| **Remix + React Router 7** | Good | ~28KB | Template available | ⭐⭐⭐⭐ |
| **Astro 5** | N/A | Smallest | Good | ❌ Not for interactive apps |

SvelteKit's smaller bundle translates directly to faster Time-to-Interactive on mobile networks—critical for field technicians accessing your quotation tool on 3G/4G. The **@vite-pwa/sveltekit** plugin provides zero-config PWA capabilities with full Workbox integration, making add-to-homescreen and offline functionality straightforward to implement.

If your team has deep React expertise, **Next.js 15 remains a strong alternative**. Configure Turbopack (now stable for development) and create a detailed `.cursorrules` file documenting your server/client component boundaries, API route patterns, and state management approach. The Vercel AI SDK integrates more naturally with Next.js, and the larger ecosystem provides more ready-made components.

For your mobile-first PWA configuration with SvelteKit:

```javascript
// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default {
  plugins: [
    sveltekit(),
    SvelteKitPWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'AC Quote Tool',
        short_name: 'AC Quote',
        display: 'standalone',
        start_url: '/',
        theme_color: '#ffffff'
      },
      workbox: {
        runtimeCaching: [{
          urlPattern: /^https:\/\/api\./,
          handler: 'NetworkFirst',
          options: { cacheName: 'api-cache' }
        }]
      }
    })
  ]
};
```

---

## VLM integration delivers real-time analysis with cost control

For integrating vision models via OpenRouter, the **Vercel AI SDK combined with OpenRouter's OpenAI-compatible endpoint** provides the cleanest architecture. This combination gives you unified streaming support, automatic abort signal handling, and the `useChat` hook that manages client state automatically—significantly reducing boilerplate for your chat interface.

The model selection strategy should use **Grok 4.1 Fast as your primary model** for its superior instruction-following and structured output capabilities—essential for extracting specific AC unit details like brand, model, BTU rating, and condition assessment. For budget fallback, **Gemini 2.5 Flash** provides good vision capabilities at a fraction of the cost. Route simpler classification tasks to **GPT-4o-mini** for maximum efficiency.

Image preprocessing dramatically impacts both cost and quality. VLMs process images in **512x512 pixel tiles**, so sending a 4000x3000 pixel photo wastes tokens and slows analysis. The optimal preprocessing pipeline resizes images to **768-1024 pixels on the shortest side**, converts to JPEG at 80-85% quality, and achieves ~90% cost reduction compared to unoptimized uploads. For high-detail mode (reading small text on AC unit labels), a 1024x1024 image costs approximately **765 tokens** (85 base + 170 per tile × 4 tiles).

```typescript
// Server route with streaming VLM response
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const maxDuration = 60; // Allow 60s for complex analysis

export async function POST(req: Request) {
  const { imageBase64, acType } = await req.json();
  
  const result = streamText({
    model: openrouter('x-ai/grok-4.1-fast'),
    system: `Analyze the AC unit image and provide:
      1. Brand and model identification
      2. Estimated BTU/tonnage
      3. Condition assessment (1-10)
      4. Recommended service type
      5. Price estimate range`,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: `Analyze this ${acType} AC unit.` },
        { type: 'image_url', imageUrl: { url: `data:image/jpeg;base64,${imageBase64}` } }
      ]
    }],
    temperature: 0.3,
    maxTokens: 1500,
    abortSignal: req.signal,
  });
  
  return result.toDataStreamResponse();
}
```

For cost optimization, implement **response caching by image hash**—if a user uploads the same photo twice, return the cached analysis. Use perceptual hashing (pHash) for fuzzy matching or SHA-256 for exact matches. Set a 24-48 hour TTL since AC pricing and availability can change.

---

## PDF generation works best client-side with @react-pdf/renderer

For generating professional quotation PDFs, **@react-pdf/renderer delivers the optimal balance** of output quality, mobile compatibility, and development experience. With **860,000+ weekly downloads** and active maintenance (updated January 2025), it's battle-tested and provides React-native JSX syntax that integrates naturally with your component architecture.

The server-side versus client-side decision favors client-side generation for your use case. Client-side generation provides instant feedback after calculation completes, works offline (important for field access), keeps user data on-device for privacy, and scales infinitely since each user's device handles its own PDF creation. Server-side generation via Puppeteer/Playwright offers pixel-perfect HTML/CSS fidelity but introduces latency, requires scaling infrastructure, and increases costs.

Mobile download handling requires platform-specific logic. **iOS Safari doesn't trigger downloads from Blob URLs**—it opens PDFs in a new tab where users must manually tap the share icon to save. Android Chrome properly handles the download attribute. Implement this detection:

```typescript
const downloadPDF = async (pdfBlob: Blob, filename: string) => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  if (isIOS) {
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');
    // Show instruction toast: "Tap share icon (⬆️) to save"
  } else {
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
};
```

For including AC unit photos in PDFs, **use base64 encoding** rather than URLs to avoid CORS issues and ensure offline capability. Pre-compress images to 400x300 pixels at JPEG quality 80% before embedding—target **20-50KB per image** to keep final PDF size under 500KB for fast mobile downloads.

---

## Deployment architecture prioritizes streaming and zero egress fees

The recommended deployment architecture pairs **Vercel for hosting** (best Next.js/SvelteKit integration, excellent DX) with **Cloudflare R2 for image storage** (zero egress fees). This combination minimizes costs while providing robust infrastructure for your AI-powered features.

Vercel's **Fluid Compute** extends function timeouts to **800 seconds** on Pro plans—essential for VLM API calls that may take 10-30 seconds. Configure your API routes with `maxDuration: 60` (or higher) to prevent premature timeouts. For streaming responses, Vercel Edge runtime supports up to **300 seconds of streaming**, which works perfectly with the Vercel AI SDK's `toDataStreamResponse()` method.

| Platform | Function Timeout | Monthly Cost (Low Traffic) | Image Storage Cost |
|----------|------------------|---------------------------|-------------------|
| **Vercel Pro** | 300s (800s Fluid) | $20/seat | $0.023/GB + $0.05/GB egress |
| **Cloudflare Workers** | 5min CPU time | $5/month | R2: $0.015/GB + **$0 egress** |
| **Fly.io** | Unlimited (VMs) | ~$5-10/month | Requires separate storage |

Cloudflare R2's **zero egress pricing** is the key differentiator for your image-heavy quotation tool. A projection of 1000 quotes/month with 5MB images each and 50GB of downloads costs approximately **$0.08/month on R2** versus $2.62/month on Vercel Blob or $2.36/month on Supabase Storage. Since users will frequently view and download quotations with embedded images, egress costs compound quickly on other platforms.

For CORS configuration supporting mobile file uploads, configure your Next.js middleware to handle preflight requests:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }
  return NextResponse.next();
}
```

---

## UI components enable polished wizard and chat experiences

For your dual wizard-plus-chat interface, the component stack should center on **React Hook Form with Zod** for form state, **Shadcn/ui** for accessible primitives, **assistant-ui** for chat functionality, and **Framer Motion** for animations.

React Hook Form outperforms alternatives for multi-step wizards with its **12KB gzipped bundle** (versus Formik's 44KB), minimal re-renders via uncontrolled components, and native support for step persistence through `FormProvider` + `useFormContext`. The pattern wraps your entire wizard in a FormProvider, allowing each step component to access and validate its portion of the form state without prop drilling.

For the chat interface, **assistant-ui** (8,100+ GitHub stars, Y Combinator backed) provides Radix-style composable primitives with built-in streaming, auto-scrolling, and accessibility. It integrates directly with Vercel AI SDK and includes Shadcn/ui theming out of the box. The alternative **Vercel AI Elements** (released 2025) offers 25+ React components specifically designed for AI interfaces, including `Conversation`, `Message`, `PromptInput`, and `Reasoning` components.

The "scanning" effect and calculation reveals work best with **Framer Motion for orchestration** and **Lottie for complex animations**. Framer Motion's ~32KB bundle provides declarative React animations with gesture support, while Lottie renders pre-made vector animations from LottieFiles at 80% smaller file sizes than GIFs. For number counting reveals, **react-countup** provides scroll-triggered counting with decimal/currency formatting.

```jsx
// Scanning effect with Framer Motion
import { motion } from 'framer-motion';

<motion.div
  className="scanning-line"
  initial={{ scaleX: 0 }}
  animate={{ scaleX: 1 }}
  transition={{ duration: 2, ease: "easeInOut" }}
/>

// Number reveal with react-countup
<CountUp 
  end={1250.99} 
  prefix="$" 
  decimals={2}
  duration={2.5}
  enableScrollSpy
/>
```

For image annotation/overlay showing AI-detected regions on uploaded photos, use simple absolutely-positioned overlay divs rather than heavy canvas libraries. Animate these regions appearing with Framer Motion's `AnimatePresence` for smooth reveals as the VLM streams its analysis.

---

## Architecture patterns that minimize AI coding errors

The folder structure that works best with Claude Code and Cursor emphasizes **clear separation, explicit naming, and shallow nesting**. Feature-based organization allows AI assistants to predict file locations and maintain context across related files:

```
src/
├── app/                    # App Router routes
│   ├── api/
│   │   ├── analyze/route.ts
│   │   ├── chat/route.ts
│   │   └── quote/route.ts
│   ├── wizard/page.tsx
│   └── chat/page.tsx
├── components/
│   ├── ui/                 # Shadcn primitives
│   └── features/
│       ├── wizard/
│       ├── chat/
│       └── analysis/
├── stores/                 # Zustand stores
│   ├── wizard-store.ts
│   └── chat-store.ts
├── lib/
│   ├── hooks/
│   └── utils/
└── types/
```

For state management across wizard and chat modes, **Zustand provides the clearest mental model** for interconnected state. Unlike Jotai's atomic approach (better for fine-grained independent updates), Zustand's single-store pattern makes it obvious where wizard progress, form data, and chat history live. The `persist` middleware automatically saves state to localStorage, enabling session recovery if users navigate away.

Create a **CLAUDE.md file at project root** documenting your architecture decisions, file locations, and code patterns. AI assistants read this file to understand project context:

```markdown
# Project Context

## Architecture
- Next.js 15 App Router (or SvelteKit 2)
- TypeScript strict mode
- Zustand for state management
- Tailwind CSS + Shadcn/ui for styling

## Code Patterns
- Server Components by default, 'use client' only when needed
- Named exports over default exports
- Collocate tests with components

## File Locations
- API routes: src/app/api/
- Feature components: src/components/features/[feature]/
- Hooks: src/lib/hooks/
```

---

## Mobile technical implementation requires careful image handling

Mobile camera access works most reliably with the **HTML capture attribute as primary method**, enhanced with `getUserMedia` for live preview on supported devices. The capture attribute (`<input type="file" accept="image/*" capture="environment">`) works universally across iOS and Android, using the native file picker with direct camera access. getUserMedia offers live preview but requires more complex permission handling and memory management.

For image compression before VLM API calls, **browser-image-compression** provides the best balance of features and size (~7KB gzipped). It supports Web Workers for non-blocking compression, configurable max dimensions and file size, and abort controller support for cancellation. The compression hook should target **1MB max file size** and **1920px max dimension**:

```typescript
import imageCompression from 'browser-image-compression';

const compressForVLM = async (file: File) => {
  if (file.size < 1024 * 1024) return file; // Skip if already <1MB
  
  return imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/jpeg',
  });
};
```

Memory management on mobile requires explicit cleanup. **Always revoke object URLs** created with `URL.createObjectURL()` after use—mobile browsers have limited memory, and leaked URLs cause performance degradation. When capturing from camera, stop all media tracks when the component unmounts.

For progressive disclosure of calculations, reveal results step-by-step with staged animations. Parse the streaming VLM response for section markers (brand identification, condition assessment, pricing) and trigger visual progress indicators as each section completes. Use Framer Motion's `AnimatePresence` with staggered delays for professional reveal effects.

---

## Accessibility ensures professional, inclusive experience

WCAG 2.2 compliance (released October 2023) introduces specific requirements relevant to your wizard and chat interfaces. **Section 3.3.7 (Redundant Entry)** requires auto-populating previously entered data when users navigate back—your Zustand store with persistence middleware handles this automatically. **Section 3.2.6 (Consistent Help)** mandates keeping help/chat functionality in the same location across all wizard steps.

For the wizard flow, use semantic HTML with proper ARIA attributes. Include step progress in the page `<title>` element ("Step 2 of 4: AC Details | Quote Tool") and main heading. Use ordered lists (`<ol>`) for step indicators with `aria-current="step"` on the active item. Provide hidden text for screen readers: `<span class="sr-only">Completed: </span>`.

The chat interface requires `role="log"` on the message container with `aria-live="polite"` to announce new messages without interrupting. Add `role="status"` to loading indicators. Ensure keyboard operability: Tab navigation through messages, Enter to send, Shift+Enter for newlines.

Touch targets must meet the **44x44 pixel minimum** (WCAG 2.5.8) with at least 8px spacing between adjacent targets. This is especially critical for the wizard navigation buttons and chat input controls that users will tap frequently on mobile.

---

## Conclusion

The technology choices for your AI-powered AC quotation tool should prioritize **mobile performance, AI coding assistant compatibility, and streaming user experiences**. SvelteKit offers the smoothest AI-assisted development through its MCP server, though Next.js 15 remains viable with proper configuration. The Vercel AI SDK with OpenRouter provides unified VLM access with built-in streaming, while @react-pdf/renderer handles professional PDF generation entirely client-side.

Deploy on Vercel with Fluid Compute enabled for extended function timeouts, use Cloudflare R2 for image storage to eliminate egress costs, and implement Zustand for state management across your wizard and chat modes. The component stack of React Hook Form, Shadcn/ui, assistant-ui, and Framer Motion delivers a polished experience while maintaining reasonable bundle sizes for mobile users.

Most critically, invest time in **preprocessing images before VLM calls** (768-1024px, JPEG 80-85%), **implementing response caching by image hash**, and **using streaming for all AI responses** to create the perception of instant analysis. These optimizations reduce costs by approximately 90% while dramatically improving perceived performance—essential for converting leads through your quotation tool.