# Agricon — Poultry & Livestock Equipment Website

现代全栈企业展示官网，基于 **Payload CMS + Next.js 16**，为农用设备制造商 Agricon 打造。支持 6 种语言（English / Русский / Français / Español / Kiswahili / العربية），移动端优先设计。

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | **Payload CMS 3.82**（TypeScript 全栈，43k+ ⭐） |
| 前端 | **Next.js 16**（App Router，Turbopack） |
| 样式 | Tailwind CSS 4 + 自建设计系统（设计令牌 + 动画系统） |
| 数据库 | 开发：SQLite（零配置）；生产：Vercel Postgres / Neon |
| 媒体 | Vercel Blob（R2 兼容替代） |
| 部署 | Vercel（Hobby 免费层） |

## 功能特性

- **完整 CMS 后台**（`/admin`）——17 个 Collections 自动生成 CRUD：
  Products / Categories / Subcategories / Solutions / Case Studies / Blog / FAQ / Downloads / Videos / Countries / Inquiries / Newsletter Subscribers / Site Settings 等
- **六语言本地化**（Payload 原生 i18n），含 RTL（阿拉伯语）支持
- **移动端优先设计**：44px+ 触控目标、渐进增强、动画系统（滚动显示/过渡/悬浮微交互）
- **完整 SEO**：六语言 sitemap（72+ URL）、robots.txt、hreflang、JSON-LD、OG/Twitter 卡片
- **询盘系统**：需求诊断表单（应用场景/现状/采购意图）→ 后台 inquiry 管理
- **新闻订阅**：全站 Newsletter 组件 → 后台订阅者管理

## 目录结构

```
src/
├── app/
│   ├── (frontend)/          # 前端路由组
│   │   ├── [locale]/        # 六语言动态段（en/ru/fr/es/sw/ar）
│   │   │   ├── products/    # 三级产品目录 + 详情
│   │   │   ├── solutions/   # 解决方案列表 + 详情
│   │   │   ├── case-studies/ # 案例研究列表 + 详情
│   │   │   ├── blog/        # 博客列表 + 详情
│   │   │   └── ...          # about/contact/faq/search/legal 等
│   │   ├── robots.ts        # SEO
│   │   ├── sitemap.ts
│   │   └── manifest.ts
│   └── (payload)/           # Payload admin + API 路由组
├── collections/             # 17 个内容模型（schema-as-code）
├── components/
│   ├── home/                # 首页 11 个区块组件
│   ├── ui/                  # 设计系统原语（Button/Card/Icon/Reveal...）
│   └── Header.tsx / Footer.tsx / ContactForm.tsx ...
├── i18n/                    # 翻译（config.ts 全量 + ui.ts 轻量客户端版）
├── lib/payload.ts           # 数据层（React cache 去重）
└── proxy.ts                 # 语言路由重定向（Next 16 proxy 约定）
```

## 本地开发

```bash
# 前置：Node.js >= 22（.nvmrc = 22）

npm install
npm run dev
# → 网站 http://localhost:3000
# → 后台 http://localhost:3000/admin
```

### 首次创建管理员

打开 `http://localhost:3000/admin`，通过 "Create first user" 表单创建管理员账号。

### 数据库说明

- **开发**：自动使用 SQLite（`agricon-dev.db`，零依赖），无需配置
- **生产**：设置 `POSTGRES_URL` 环境变量后自动切换到 Postgres

## 环境变量

| 变量 | 用途 | 开发 | 生产 |
|---|---|---|---|
| `PAYLOAD_SECRET` | CMS 加密密钥 | 任意值 | 强随机值（必填） |
| `DATABASE_URI` | SQLite 路径 | `file:./agricon-dev.db` | — |
| `POSTGRES_URL` | Postgres 连接串 | — | 必填 |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 令牌 | — | 图片上传需要 |

> ⚠️ `.env` 已被 git 忽略，密钥永不入库。

## 生产部署（Vercel）

1. 创建 Vercel 项目并导入本仓库
2. 添加环境变量（见上表）
3. 添加 Vercel Postgres（或 Neon）数据库，复制 `POSTGRES_URL`
4. 添加 Vercel Blob 存储，复制 `BLOB_READ_WRITE_TOKEN`
5. 部署——首次部署后运行数据库迁移：
   ```bash
   npx payload migrate    # 本地跑完提交 migration，或
   # Vercel CI 会自动执行 package.json 的 "ci": "payload migrate && next build"
   ```
6. 通过 `https://<project>.vercel.app/admin` 创建首个管理员

## 质量门禁

```bash
npm run lint        # ESLint
npx tsc --noEmit    # TypeScript
npm run build       # 生产构建（85 静态页 × 6 语言）
npm test            # Vitest + Playwright（可选）
```

## 业务设计来源

网站文案与内容框架参考公司内部《外贸经营与销售作战指导手册》：
- **价值计算**（首页 ValueCalculated 区块）——"我们不喊质量，我们展示数字"
- **信任证据链**（TrustEvidence 区块）——QC 报告/检测/溯源文档
- **需求诊断表单**（Contact）——应用场景/现状/采购意图
- **合作流程**（HowWeWork）——从询盘诊断到风险递减交付

## 旧项目

原 Astro + Cloudflare Workers 版本保留在 `D:\Agricon_Website`（迁移前的历史版本）。
