# Technology Stack

## Framework & Runtime

- **Next.js 14.2+** with App Router
- **React 18** with TypeScript
- **Node.js** runtime with ES modules

## Styling & UI

- **Tailwind CSS** for styling with custom theme
- **Rajdhani** font family (Google Fonts)
- Custom animations and Halloween-themed colors
- Responsive design with mobile-first approach

## Backend & Database

- **Supabase** for authentication and database
- **Google Gemini AI** (@google/genai) for AI analysis
- **Three.js** for 3D animations and effects

## Key Libraries

- `@supabase/auth-helpers-nextjs` for authentication
- `@supabase/supabase-js` for database operations
- Custom feature flag system

## Development Tools

- **TypeScript** with strict mode enabled
- **ESLint** with Next.js configuration
- **PostCSS** with Autoprefixer
- Path aliases configured (`@/*` maps to root)

## Common Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Setup
npm install          # Install dependencies
```

## Environment Configuration

- Use `.env.local` for local environment variables
- `GEMINI_API_KEY` required for AI functionality
- Feature flags: `FF_<FLAG_NAME>` (server) or `NEXT_PUBLIC_FF_<FLAG_NAME>` (client)

## Build Configuration

- Server actions enabled with 2MB body size limit
- Experimental features configured in `next.config.js`
- TypeScript with ES2022 target and bundler module resolution
