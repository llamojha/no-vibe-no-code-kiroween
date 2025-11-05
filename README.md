<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1oC2K72G4jrgFUQiuL_s0gfVa-07buTm7

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Feature Flags

- Define flags centrally and control them via environment variables.
- Server-only flags: use `FF_<FLAG_NAME>`.
- Client-exposed flags: use `NEXT_PUBLIC_FF_<FLAG_NAME>`.

Usage:

1) Define flags in `lib/featureFlags.config.ts` (example is commented):

`registerFlags({
  NEW_CHECKOUT: defineBooleanFlag({
    key: 'NEW_CHECKOUT',
    description: 'Enable the new checkout flow',
    default: false,
    exposeToClient: true,
  }),
})`

2) Read flags from code:

`import { isEnabled, getValue } from '@/lib/featureFlags'

if (isEnabled('NEW_CHECKOUT')) {
  // new flow
} else {
  // old flow
}

// Non-boolean values (if defined):
const maxItems = getValue<number>('MAX_ITEMS')`

3) Set env vars locally in `.env.local`:

- `FF_NEW_CHECKOUT=true` (server-only)
- `NEXT_PUBLIC_FF_NEW_CHECKOUT=true` (exposed to client)

Notes:

- Client-exposed flags are read from `NEXT_PUBLIC_FF_<FLAG>` and become part of the client bundle at build time.
- Defaults apply when env vars are absent.
