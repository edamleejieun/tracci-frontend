# 趣溪 Tracci · 前端

面向 **微信小程序** 的 uni-app 前端工程（不交付 H5），覆盖旅行列表、旅行创建/详情、行程、开支、日志、统计、导出、个人中心、账号安全、帮助反馈与法律文档页。

## 技术栈

| 类别 | 选型 |
|---|---|
| 框架 | uni-app 3.x、Vue 3 Composition API |
| 构建 | Vite、`@dcloudio/vite-plugin-uni` |
| 状态 | Pinia |
| 样式 | UnoCSS、`@uni-helper/unocss-preset-uni` |
| 规范 | TypeScript、ESLint、Prettier |

## 快速开始

```bash
npm install
npm run dev:mp-weixin
```

用微信开发者工具打开 `dist/dev/mp-weixin` 进行预览与调试。

构建：

```bash
npm run build:mp-weixin
```

生产产物在 `dist/build/mp-weixin`。

## 目标平台

**仅微信小程序。** 开发、联调、验收与编译均以 `mp-weixin` 为准，无需考虑 H5 实现或兼容。

## npm 脚本

| 命令 | 说明 |
|---|---|
| `npm run dev:mp-weixin` | 微信小程序开发，产物在 `dist/dev/mp-weixin`（**主路径**） |
| `npm run build:mp-weixin` | 微信小程序生产构建（**主路径**） |
| `npm run lint` | ESLint 检查并自动修复 |
| `npm run format` | 格式化 `src` 下常见源码类型 |
| `npm run dev:h5` / `build:h5` | 历史脚本，**非交付与验收路径** |

## 当前页面

页面路由以 [src/pages.json](src/pages.json) 为准：

- Tab：`pages/index/index`、`pages/profile/index`（小程序端仅首页 + 我的，作为 App 的轻量承接入口）
- 账号与合规：`pages/login/index`、`pages/profile/account-security`、`pages/help-feedback/index`、`pages/legal/terms`、`pages/legal/privacy`
- 旅行分包：`pages/trip/create`、`pages/trip/detail`
- 行程分包：`pages/itinerary/node-edit`

## 项目结构

```txt
tracci-frontend/
├── src/
│   ├── components/         # 通用、品牌、业务组件
│   ├── composables/        # 导出、上传、POI、分享等组合逻辑
│   ├── constants/          # 设计 token、枚举、导出配置、法律文本
│   ├── export/             # Canvas 导出渲染管线
│   ├── pages/              # uni-app 页面
│   ├── services/           # 后端 API 调用
│   ├── stores/             # Pinia 状态
│   ├── types/              # API 与业务类型
│   └── utils/              # HTTP、鉴权、格式化、图片等工具
├── src/pages.json          # 路由与 Tab 配置
├── src/manifest.json       # uni-app 应用配置
├── uno.config.ts
└── package.json
```

## 环境配置

后端地址通过环境变量配置（见 `.env.development` / `.env.production`）：

| 变量 | 说明 |
|---|---|
| `VITE_API_BASE_URL` | 后端 API 基础地址，开发默认 `http://localhost:8080` |

本地私有覆盖可写入 `.env.local` / `.env.*.local`（已被 gitignore）。

## 开发约定

接口调用必须集中在 `src/services/`，请求封装在 `src/utils/http.ts`。当前后端 API 已接入，请勿再引入本地 mock 作为主数据源。

## 许可证

[MIT](LICENSE)
