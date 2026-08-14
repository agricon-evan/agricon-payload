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
# 前置：Node.js >= 20（推荐 22 LTS）

npm install
npm run dev
# → 网站 http://localhost:3000
# → 后台 http://localhost:3000/admin
```

### 导入公司产品画册

产品、子分类、产品描述、优势列表和产品主图可以从画册 Markdown 自动导入。首次初始化数据库时，先运行分类/案例/方案导入，再运行产品导入：

```bash
python scripts/seed-from-catalog.py
pnpm catalog:import
```

优先读取 `C:\Users\Evan\WorkBuddy\2026-08-10-15-00-06\output\catalog`；其他环境会使用仓库内的 `docs/catalog/catalog.md`。如需指定其他目录：

```bash
CATALOG_DIR=/path/to/catalog pnpm catalog:import
```

画册导入会更新英文 CMS 内容，并将产品主图复制到 `public/catalog/products`。

### 多语言内容翻译

六语言（en/ru/fr/es/sw/ar）的 CMS 内容（分类、产品、方案、案例）由 LLM 翻译并存入本地化表。翻译文件位于 `scripts/translations/*.json`：

- `{lang}.json` — 分类/子分类/产品特性/方案/案例的短文本
- `{lang}-products.json` — 产品描述

修改翻译后重新入库（幂等，会更新已有行）：

```bash
node scripts/import-translations.mjs
```

> 产品名保留英文技术术语；`seo_title` 按 `{产品名} | Agricon {语言后缀}` 自动生成；`seo_description` 复用翻译后的描述。

### 设计系统

前端严格遵循 `D:\system-design.md`（AGRICON 印刷级设计标准）：

- **色彩**：AGRICON 绿 `#0C5D3F`（结构）+ Harvest 橙 `#EE9230`（唯一强调），无装饰渐变/发光
- **字体**：Outfit（显示标题）+ Noto Sans（正文，MiSans 网页替代）
- **组件**：split-color-title、orange-underline、section-ribbon、metric-stat、info-card、advantages-list、technical-spec-table 等（见 `globals.css` 与 `src/components/ui/`）
- **原则**：扁平优先、阴影克制（仅大型项目卡）、照片遮罩为功能性深绿/近黑 overlay

### 首次创建管理员

打开 `http://localhost:3000/admin`，通过 "Create first user" 表单创建管理员账号。

### 数据库说明

- **开发**：自动使用 SQLite（`agricon-dev.db`，零依赖），无需配置
- **生产**：设置 `POSTGRES_URL` 环境变量后自动切换到 Postgres

> ⚠️ **SQLite schema 同步（重要）**：本机 `PAYLOAD_PUSH_SCHEMA=false` 已写入 `.env`。
> `@payloadcms/db-sqlite` 的 push 模式在 Windows/libsql 上会反复尝试创建已存在的索引并崩溃
> （`index xxx already exists`）。修改 collection 字段后需手动同步开发库，例如：
>
> ```bash
> # 添加缺失列（videos 表曾缺 platform/published）
> node -e "const {createClient}=require('@libsql/client');const db=createClient({url:'file:agricon-dev.db'});(async()=>{await db.execute(\"ALTER TABLE videos ADD COLUMN platform TEXT DEFAULT 'youtube'\");await db.execute(\"ALTER TABLE videos ADD COLUMN published INTEGER DEFAULT 1\");})()"
> ```
>
> ### 种子内容（后台与前台对齐）
>
> 前台曾用硬编码 fallback 展示博客/FAQ，导致后台管理无效。内容已导入 CMS：
>
> ```bash
> pnpm tsx scripts/seed-fallback-content.ts   # 3 篇博客 + 8 条 FAQ（幂等）
> ```
>
> 前台仍有 fallback 作为空库兑底（数据库为空时展示），后台添加/编辑内容后会优先使用数据库数据。

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

### 多语言内容维护(博客/FAQ)

博客与 FAQ 的翻译使用免费的 MyMemory API(免费版每日有配额):

```bash
PYTHONIOENCODING=utf-8 python scripts/translate-blog-faq.py
```

- 幂等:已存在的语言行会跳过,配额耗尽后**次日重跑**即可续完
- 支持 `--langs ru,fr,es,sw,ar` 与 `--limit N`
- richText(content/answer)以 lexical JSON 结构递归翻译文本节点,不破坏结构
