# Tracci Frontend Agent Instructions

Use this file together with `CLAUDE.md`.

## Must Read

1. `CLAUDE.md`
2. Existing code in the target `src/pages`, `src/components`, `src/services`, or `src/composables` area

## Hard Rules

- **Target platform is WeChat Mini Program only.** Do not implement, adapt, branch for, or verify against H5. Compilation and local verification must use `mp-weixin` (`npm run dev:mp-weixin` / `npm run build:mp-weixin`).
- Do not call `uni.request` from pages/components; add or reuse a function in `src/services/`.
- Do not invent backend fields, enum values, or paths.
- Prefer Mini Program–safe uni-app APIs; avoid browser-only APIs (`window`, `document`, direct DOM).
- Do not reintroduce `src/mock/` or treat mock data as the main data source. Real API services are already wired.
- Preserve existing guest/login guard behavior through `src/utils/guestAuth.ts`.
- Use existing design tokens and components before creating new visual primitives.
- **Copy is tool-first with warm companion tone.** User-facing text must stay practical (what / next action), mildly warm—not “too AI”, not literary/poetic marketing prose. See `CLAUDE.md` § Copy / 文案原则.

## Current Scope

The frontend currently includes home (trip list), profile, login, account security, help feedback, legal pages, trip create/detail/members, co-editor, itinerary node editing, expense, journal, weather, POI search, image upload, trip share card rendering, and itinerary export canvas rendering.

Tab bar is **首页 / 我的** only (plus center FAB for create). Stats and export are **not** top-level tabs; trip-level stats overview and share/export canvas live inside trip detail / share flows.

## Verification

Prefer:

```bash
npm run lint
npm run build:mp-weixin
```

Use WeChat DevTools against `dist/dev/mp-weixin` or `dist/build/mp-weixin`. Do not use H5 build/preview as the primary verification path.