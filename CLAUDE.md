# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this uni-app frontend project.

## Target Platform (Hard Constraint)

**本项目仅面向微信小程序端。**

- 开发、联调、验收与编译均以 **微信小程序原生**（`mp-weixin`）为准。
- **不要**为 H5 做兼容、适配、分支或验收；`dev:h5` / `build:h5` 若仍存在于脚本中，不作为日常开发与验证路径。
- 实现时优先使用小程序可用的 uni-app / 微信能力；避免 `window`、`document`、DOM、浏览器-only API。
- 验证构建以 `npm run build:mp-weixin`（及 `npm run dev:mp-weixin`）为主，不以 H5 构建结果判断功能是否完成。

## Build / Dev Commands

```bash
npm run dev:mp-weixin
npm run build:mp-weixin
npm run lint
npm run format
```

产物目录：开发 `dist/dev/mp-weixin`，生产 `dist/build/mp-weixin`。用微信开发者工具打开对应目录进行预览与真机调试。

## Project Overview

- Product: Tracci / 趣溪
- Platform: **WeChat Mini Program only**（微信小程序；不交付 H5）
- Stack: uni-app 3.x, Vue 3 Composition API, TypeScript, Pinia, UnoCSS
- API prefix: `/api/v1`
- UI language: Simplified Chinese

Implemented product surface includes home/trip list, profile, login, account security, help feedback, legal pages, trip create/detail/members, co-editor, itinerary node editing, expense, journal, weather, POI search, image upload, trip share card rendering, and itinerary export canvas rendering.

## Source Of Truth

Use this priority order:

1. Code in `src/`
2. Backend API implementation and Swagger contract (`tracci-backend`)
3. Existing service/composable patterns in this repo

When docs conflict with code, the code is authoritative.

## Architecture

- `src/pages.json` defines page routes, subpackages, and the two-tab navigation: 首页 / 我的（自定义 `TracciTabBar` 中央 FAB 创建旅行）。
- `src/main.ts` creates the Vue app, installs Pinia, and loads UnoCSS/global styles.
- `src/utils/http.ts` is the only HTTP transport wrapper. It adds `/api/v1`, attaches Bearer token, handles refresh/retry, and normalizes backend `ApiResponse<T>`.
- `src/services/` contains domain API modules. Pages and components should not call `uni.request` directly.
- `src/stores/user.ts` owns auth/user state and storage sync.
- `src/composables/` owns reusable workflows such as POI search, image upload, export canvas, and WeChat share.
- `src/export/` contains canvas rendering primitives used by trip share / itinerary export utilities.

## Current Pages

- Tab pages: `pages/index/index`, `pages/profile/index`
- Account/compliance: `pages/login/*`, `pages/profile/account-security`, `pages/help-feedback/index`, `pages/legal/terms`, `pages/legal/privacy`
- Trip subpackage: `pages/trip/create`, `pages/trip/detail`, `pages/trip/members`, `pages/trip/activity-log`
- Itinerary subpackage: `pages/itinerary/node-edit`
- Co-editor subpackage: `pages/co-editor/index`

## API Rules

- All API calls go through `src/services/`.
- Request/response fields must match the backend implementation; do not invent fields or paths.
- Phone SMS login is **not** exposed in the frontend client; phone bind (after login) uses `/auth/phone/bind/*`. Do not re-add reserved SMS login stubs unless backend opens them.
- Help feedback uses `/feedbacks`; account deletion uses `/users/me/delete-account`.
- File upload uses COS credentials from `/files/upload-credentials`, direct upload, then `/files/{fileId}/confirm`.

## UI / Platform Rules

- Use `<script setup lang="ts">` and Composition API.
- **Target is WeChat Mini Program only**: no direct DOM, `window`, or browser-only APIs; do not spend effort on H5-only paths or dual-platform guards for H5.
- Prefer existing components and tokens: `BrandLogo`, `TracciButton`, `TracciBottomSheet`, `TracciLoading` / `TracciError`, layout headers, and `src/constants/designTokens.ts`.
- Use UnoCSS utilities and existing shortcuts before adding one-off CSS.
- Guest browsing is supported for selected flows (e.g. shared trip detail with `visitor=guest`); protected writes must go through `guestAuth.ts`.

## Copy / 文案原则（Hard Constraint）

产品本质是**旅行工具**（规划、记录、协作、记账/AA、导出等）。涉及用户可见文案时（标题、副文案、空态、按钮、Toast、弹窗、引导、问候语等）必须遵守：

1. **工具优先**：先说清能做什么、下一步是什么；不要用口号或意象替代功能说明。
2. **温暖陪伴感**：语气友好、克制、像靠谱的同伴；可轻量情绪安抚，但不煽情。
3. **禁止「太 AI 化」**：避免模板感、万能鸡汤、过度热情、假拟人、空泛励志（如「开启奇妙之旅吧」「每一刻都值得被铭记」类堆砌）。
4. **禁止「太文艺化」**：避免诗词腔、过度修辞、造句炫技、与操作无关的氛围散文。
5. **优先短句、可扫读**：按钮/状态用直白动词；说明文一句话说清；能用「创建旅程 / 加入 / 重试」就不要绕弯子。

写新文案或改文案时，自检：用户 2 秒内能否知道**这是什么、我该点什么**；读起来是否像人话而非营销稿或 AI 生成腔。

## Before Editing

1. Read the target page/component/service.
2. Check the backend implementation for endpoint fields.
3. Reuse existing service/composable patterns.
4. Design and implement for **WeChat Mini Program** only; do not plan or implement H5 behavior.

## After Editing

Run the relevant check when feasible:

```bash
npm run lint
npm run build:mp-weixin
```

Do **not** treat `build:h5` / H5 预览 as the acceptance path for feature completion.