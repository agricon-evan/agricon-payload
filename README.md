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
- **六语言本地化**（Payload 原生 i18n + 16 个命名空间的 JSON 文案），含 RTL（阿拉伯语）支持；
  产品/FAQ/博客内容与页面 `<title>`/描述均已本地化（产品型号保留英文）
- **移动端优先设计**：44px+ 触控目标、渐进增强、动画系统（滚动显示/过渡/悬浮微交互）
- **完整 SEO**：六语言 sitemap（468 URL）、robots.txt、canonical/hreflang（含 `x-default`）、
  JSON-LD（Organization/WebSite/Product/FAQPage/BlogPosting/BreadcrumbList）、OG/Twitter 卡片与默认分享图
- **询盘系统**：需求诊断表单（应用场景/现状/采购意图）→ 后台 inquiry 管理，含限流与反垃圾
- **新闻订阅**：全站 Newsletter 组件 → 后台订阅者管理
- **内容卫生工具**：抓取残留清洗、产品描述修复、翻译流水线（脚本 + 单元测试，见 `docs/MAINTENANCE.md`）

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
├── i18n/                    # 翻译（content 在 locales/*.json；config.ts 只做查找）
│   └── locales/             # 每语言每命名空间一个 JSON 文件（6 语言 × 16 命名空间）
├── lib/
│   ├── payload.ts           # 数据层（React cache + unstable_cache 双层缓存）
│   ├── seo.ts               # canonical/hreflang/metadata/OG 默认图
│   ├── structured-data.ts   # JSON-LD 构造器（Organization/Product/FAQPage/...）
│   ├── supplier-text.ts     # 抓取文案清洗（标签、字面量转义、摘要截断）
│   ├── public-write-guard.ts # 公开写接口的限流 + 反垃圾（beforeValidate hook）
│   └── rate-limit.ts / anti-spam.ts
└── proxy.ts                 # 语言路由重定向 + x-pathname（Next 16 proxy 约定）
```

> **接手维护先读 [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md)** — 架构地图、常见任务 runbook、
> 已知坑与排错清单都在那里；本 README 偏「是什么」，那份文档偏「怎么改」。

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

### 多语言内容翻译（CMS 内容）

CMS 内容的翻译走**三步流水线**，幂等，可对本地 SQLite 或生产 Postgres 执行：

```bash
pnpm tsx scripts/i18n-extract-todo.ts          # 1. 导出待翻译清单 → scripts/translations/_todo/
#    用 LLM/译者把 _todo/<lang>-{ui,content}.json 翻译为 <lang>-…-translated.json
pnpm tsx scripts/i18n-apply-todo.ts            # 2. 先 dry-run，看会改哪些字段
pnpm tsx scripts/i18n-apply-todo.ts --apply    # 3. 写回 JSON 文案 + CMS 内容
```

- 导出**只包含缺失或与英文逐字相同**的字符串，所以重复运行不会重复翻译，也不会覆盖已润色的译文。
- 应用时逐条回读断言，失败打印 `✗`，不会出现「报告成功但没写进去」。
- 翻译键：产品/子分类等按 **slug**；产品特性与规格标签按**英文原文**（同一句只翻一次，43 个产品共享词表）。
- `_todo/` 与 `*-translated.json` 都入库，可追溯每句话的来源与时间。`--round2` 只导出「产品描述 + FAQ 答案」，用于内容修复后的补翻。
- 支持 `--lang=ru`、`--round=1|2` 限定范围。

> **产品名保留英文**（`H-Type Layer Cage` 这类型号正是海外买家搜索的词），翻译的是描述、特性、
> 规格标签、SEO 文案与页面元数据。
>
> 产品 FAQ 答案是 richText：应用时以**英文文档为模板**只替换文本，避免手搓 Lexical 结构被
> Payload 校验拒绝（`The following field is invalid: Answer`）。
>
> 历史包袱：上一版 `import-translations.mjs` 按 `_parent_id` 写入，而 9 月的画册重导入换掉了
> 所有产品 ID，脚本指向的是一套已经不存在的 64 条记录 —— 它从未真正生效过，已删除。

### SEO 与结构化数据

| 项目 | 实现 | 说明 |
|---|---|---|
| canonical / hreflang | `src/lib/seo.ts` → `localizedAlternates()` | 6 语言 + `x-default`，逐页校验 0 例外 |
| 页面 metadata | `pageMetadata(locale, { path, namespace, key })` | 文案优先级：`t.meta.*` → `t.hero.*` → 调用方英文兜底，因此标题/描述随语言走 |
| Open Graph / Twitter | 同上 + `DEFAULT_OG_IMAGE` | 默认分享图 `public/images/og-default.jpg`（1200×630，约 130 KB，`node scripts/generate-og-image.mjs` 可重新生成） |
| JSON-LD | `src/lib/structured-data.ts` + `<JsonLd>` | 全站 `Organization` + `WebSite`（含 SearchAction）；产品页 `Product` + `BreadcrumbList`；FAQ 页 `FAQPage`；博客/案例详情 `BlogPosting` |

> 之前这四项里有两项是**声明了但不存在**的：README 写着「完整 SEO：JSON-LD」，实际全站 0 处
> `application/ld+json`；`og:image` 只在产品详情页有，其余页面分享出去没有缩略图
> （`payload.config.ts` 里那张图只作用于 Payload 后台）。
>
> 结构化数据只在**有真实数据时**输出字段：`offers` 仅在价格能解析出金额且带币种时写入 ——
> 一个没有价格的 `Offer` 会让 Google 整条 `Product` 失效。

### 抓取内容卫生

产品文案来自阿里国际站抓取，带有三样必须在入库前后清理的脏数据：

```bash
pnpm tsx scripts/cleanup-supplier-copy.ts --check   # CI：还有残留就退出 1
pnpm tsx scripts/cleanup-supplier-copy.ts --apply   # 清洗（幂等，所有语言）
pnpm tsx scripts/repair-product-copy.ts  --apply    # 重新派生被截断的产品描述
```

| 脏数据 | 例子 | 处理 |
|---|---|---|
| 供应商页面标签 | `Product descriptions from the supplier Report abuse Highlights at a glance` | `src/lib/supplier-text.ts` 的 `stripSupplierBoilerplate()`，导入时与存量数据都清 |
| 导航栏文字 | `Product Overview Complete Farm Solution Proof of Execution Project Cases` | 同上（标签表可扩展） |
| 字面量转义 | 特征值是 12 个字符的 `\uD83C\uDFED` 而不是 🏭 | `decodeLiteralUnicodeEscapes()`，文本/HTML/数组字段全覆盖 |
| 截断描述 | `"This 4."`、`"…by up to 80 perce"` | `repair-product-copy.ts` 用产品自身的 `overviewHtml` 重新派生，`summarizeCopy()` 按句子→词边界截断，绝不切半个词 |

导入脚本（`scripts/import-alibaba-catalogue.ts`）已改为调用同一套函数，因此**重新导入不会把脏数据带回来**。

### 分类归属与重复产品

```bash
pnpm tsx scripts/move-subcategory.ts --from=<旧子分类> --to=<新子分类>        # 预演，加 --apply 执行
pnpm tsx scripts/delete-product.ts   --slug=<要删的> --redirect-to=<要留的>   # 预演，加 --apply 执行
```

分类卡的顺序与名称由 `sortOrder` / `name` 决定，顺序不本地化、改一次 6 种语言同时生效：

```bash
pnpm tsx scripts/reorder-subcategories.ts --category=<分类 slug> --order=slug1,slug2,... --apply
pnpm tsx scripts/reorder-subcategories.ts --category=<分类 slug> --rename=<slug>:"New Name" --locale=en --apply
```

分类的顺序和英文名以 `docs/scrape/taxonomy-*.json`（用户指定的分类稿）为准。

改产品名称而不动 URL（`name` 与 `seoTitle` 按语言存储，脚本会把 6 种语言一起写并读回校验）：

```bash
pnpm tsx scripts/rename-products.ts --rename=<slug>:"New Name" --apply
```

按客户给的产品清单**增量补产品**（不清库；已存在的只改名/移动，缺的才新建）：

```bash
pnpm tsx scripts/import-links.ts           # 预演
pnpm tsx scripts/import-links.ts --apply    # 执行
```

读取 `docs/scrape/alibaba-links-*.jsonl`（BrowserSkill 抓的页面数据）+
`docs/scrape/import-names-*.json`（sku → 子分类 + 型号级名称）。细节见
[`docs/MAINTENANCE.md`](docs/MAINTENANCE.md) §3.12 与 §11。

两条都会改产品 URL（URL 里含分类/子分类），**必须**把脚本打印的 308 重定向贴进 `next.config.ts`。
分类归属以 `docs/scrape/taxonomy-*.json` 的 `groups` 为准，不要按子分类名字猜；细节见
[`docs/MAINTENANCE.md`](docs/MAINTENANCE.md) §3.9 与 §10。

> 目前有 49 个子分类暂时没有产品（未来会上），点进去的 "Products Coming Soon" 是**预期行为**，不要删。

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
> （`index xxx already exists`），因此**开发库的 schema 必须手动同步**。
>
> 修改 collection 字段后运行：
>
> ```bash
> pnpm tsx scripts/sync-dev-schema.ts --check   # 只报告差异，有差异时退出码 1
> pnpm tsx scripts/sync-dev-schema.ts           # 补齐缺失的表/列（幂等）
> ```
>
> 该脚本只增不减：只创建缺失的表/列/索引，绝不删除或改动已有数据。
>
> **为什么必须做**：`Products` 曾新增 `faqs` 与 `detailImages` 两个数组字段，但对应的
> `products_faqs` / `products_detail_images` 表从未创建。结果是**每一次**
> `payload.find({ collection: 'products' })` 都报
> `SQLITE_ERROR: no such table: products_faqs` —— 产品列表、全部产品详情页、
> 首页产品区块和 sitemap 全部失效，`src/payload-types.ts` 也随之漂移。
> 脚本已修复本机开发库（此前 11 个缺失对象）。
>
> 同步 schema 后记得重新生成类型：`pnpm generate:types`。

> ### 生成类型不入库（重要）
>
> `src/payload-types.ts` 被 `.gitignore` 忽略，**不存在于仓库中**。因此任何全新克隆都必须
> 先生成它，否则 `tsc` 会因 `Product.faqs` 等字段缺失而报错。已把生成步骤接入脚本：
> `pnpm test`、`pnpm ci`、`pnpm vercel-build` 都会先执行 `payload generate:types`。

> ### 种子内容（后台与前台对齐）
>
> 前台曾有硬编码 fallback 展示博客/FAQ，导致后台管理无效。内容已导入 CMS：
>
> ```bash
> pnpm tsx scripts/seed-fallback-content.ts   # 3 篇博客 + 8 条 FAQ（幂等）
> ```
>
> ### 方案 ↔ 产品双向关系同步
>
> `solutions.products` 与 `products.solutions` 是**两个各自独立的字段**，Payload 不会自动同步。
> 画册导入脚本只写了 `products.solutions`（56 行），`solutions.products` 全为空，
> 因此后台打开方案看不到任何产品。运行：
>
> ```bash
> pnpm tsx scripts/sync-solution-products.ts --check   # 只报告差异
> pnpm tsx scripts/sync-solution-products.ts           # 补齐（幂等，只增不删）
> ```

## 渲染与缓存策略

前台页面（`src/app/(frontend)/[locale]/**`）**使用 `force-dynamic` 按请求渲染**，而不是静态生成。
这是一个刻意的取舍，原因写在 `[locale]/layout.tsx`：数据库内容在请求时读取，
`next build` 因此不需要连接生产数据库，首次部署到 Vercel 时由 Payload push 建表，构建不会失败。

代价是每次请求都会查询数据库。为了把成本压下来，数据层（`src/lib/payload.ts`）套了两层缓存：

| 层 | 机制 | 作用 |
|---|---|---|
| 跨请求 | `unstable_cache`（TTL 300s，站点设置 60s） | 同一 collection 每 5 分钟才真正查一次库 |
| 单次渲染内 | React `cache()` | 首页 8+ 个区块各自请求同一 collection 时只查一次 |

两点实现细节：

- **查询深度是性能关键**。`getProducts` 使用 `depth: 1`。用 `depth: 2` 时 Payload 会额外展开
  `product.solutions`，而方案与产品是**双向关系**，每个被展开的方案会把自身的 `products`
  数组再带回来——结果从 503KB 膨胀到 8.1MB（每个语言、每次请求），并且超过 Next 数据缓存
  2MB 上限而根本无法缓存。需要分类 slug 时用 `resolveProductCategorySlug()` 从
  （同样被缓存的）子分类列表里查。
- 在没有 Next 请求上下文的环境（Vitest、`scripts/*.ts`）调用数据层时，
  `unstable_cache` 会抛 `incrementalCache missing`；缓存层会捕获该错误并降级为直连查询，
  同时打印一次提示。

后续若要改为静态生成，需要先把 `[locale]/layout.tsx` 中对 `headers()` 的依赖
（`x-pathname` → hreflang/canonical、`<html lang>`）改为由路由 `params` 推导。

## 公开写接口的防护

`/api/inquiries` 与 `/api/newsletterSubscribers` 必须允许匿名写入（联系表单不能要求登录）。
为避免被脚本刷库与邮件轰炸，加了两层防护：

- **限流**：`src/lib/rate-limit.ts`，每 IP 每 10 分钟 5 次，超限返回 `429`。
  计数器在进程内存中，因此在 Vercel 上是**按实例**生效（N 个热实例 ≈ 上限 ×N），
  而非全局硬上限。需要严格全局限制时把 `consume()` 换成共享存储（Redis/KV），调用点不用改。
- **反垃圾**：`src/lib/anti-spam.ts`，蜜罐字段（`companyWebsite`）+ 提交耗时校验
  （2.5 秒 ~ 12 小时）+ 关键词/链接数/拉丁字段西里尔字母启发式。被判定为垃圾时返回 `400`，
  且**不告诉提交者**是哪一项触发的。
- 已登录的后台用户跳过启发式校验（他们没有蜜罐/时间令牌）。

两个集合都通过 `virtual: true` 声明蜜罐字段，所以它永远不会被写入数据库，也不会出现在后台表单里。

## 环境变量

| 变量 | 用途 | 开发 | 生产 |
|---|---|---|---|
| `PAYLOAD_SECRET` | CMS 加密密钥 | 任意值 | 强随机值（必填，`openssl rand -base64 32`） |
| `DATABASE_URI` | SQLite 路径 | `file:./agricon-dev.db` | — |
| `POSTGRES_URL` | Postgres 连接串 | — | 必填（自动切换 SQLite→Postgres） |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 令牌 | — | 后台图片上传必需 |
| `NEXT_PUBLIC_SITE_URL` | 正式域名（sitemap/robots/canonical） | `http://localhost:3000` | **正式域名** |
| `PAYLOAD_PUSH_SCHEMA` | 关闭 schema 自动同步 | 开发已设 `false` | 默认开启（首次部署建全表） |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` | 邮件发送 | 不设（日志模式） | 询盘通知必需 |
| `EMAIL_FROM` / `EMAIL_FROM_NAME` | 发件人 | `noreply@agricon.com` | 配置 |
| `INQUIRY_NOTIFY_EMAIL` | 询盘通知收件人 | — | 销售邮箱（默认 EMAIL_FROM） |

> ⚠️ `.env` 已被 git 忽略，密钥永不入库。

## 生产部署（Vercel）

1. 创建 Vercel 项目并导入本仓库
2. 添加环境变量（见上表）
3. 添加 Vercel Postgres（或 Neon）数据库，复制 `POSTGRES_URL`
4. 添加 Vercel Blob 存储，复制 `BLOB_READ_WRITE_TOKEN`
5. 部署——`vercel-build` 自动执行 `payload migrate && next build`（`payload migrate` 当前无迁移文件时为安全空操作）；
   **首次运行时 Postgres `push` 会自动创建全部 17 个 collection 的 schema**
   （生产保留 `PAYLOAD_PUSH_SCHEMA` 不设为 `false` 即可启用 push；若改用显式迁移：先 `pnpm payload migrate:create` 再设 `PAYLOAD_PUSH_SCHEMA=false`）
6. 通过 `https://<project>.vercel.app/admin` 创建首个管理员
7. 配置 SMTP 环境变量，否则询盘通知只写入日志不发邮件

### 管理员

本地开发管理员：`admin@agricon.com`（密码见本地 scripts 或首次创建）。

## 上线检查清单（2026-09-18 全站复检）

### ✅ 页面与数据

- sitemap 468 个 URL（6 语言 × 78）全部 200；0 坏页、0 死链、0 破损图片（793 个资源按 GET 校验）
- canonical / hreflang（含 `x-default`）逐页正确：468 页 0 例外；`lang` / `dir`（ar = rtl）正确
- 每页恰好 1 个 `h1`，`<img>` 全部有 alt，404 页正常返回 404，manifest 正常
- 每页都有 JSON-LD：`Organization` + `WebSite`，产品/FAQ/博客页另有对应类型
- CMS 内容本地化覆盖率：products 43/43、faqs 8/8、blogPosts 3/3 在 5 种语言下均非英文
- 界面文案：非英语语言的「与英文逐字相同」比例从 41% 降到 **2%**

### ✅ 功能与交互

- 搜索（`/search?q=`）正常；语言切换保持当前路径（`/en/about → /ru/about`）
- 产品详情页：Related Products 卡片链接逐个校验 200（此前 33/43 页面的相关产品链接是 404）
- 产品页正文不再出现 `Report abuse` / 供应商标签 / 字面量 `\uXXXX` 转义
- 询盘表单提交 → 后台入库 → SMTP 邮件通知（配置后）；限流与反垃圾仍生效（429 / 400）
- 安全头（CSP/HSTS/X-Frame/Referrer/Permissions）完整；`X-Powered-By` 已关闭
- `/admin` 后台可正常打开（未登录 200 到登录页）

### ⚠️ 上线后待办

- **Videos / Downloads** 为空（前台显示空态），上线后后台添加
- **aquaculture / breeding-house 方案暂无关联产品**：这两个方案下所有子分类
  （鱼塘/增氧机/温室/风机等）产品数为 0，这是画册数据本身为空，不是代码问题。
  前台该区块会整体隐藏（不留空标题）。补齐产品后会自动出现。
- **Footer 二维码**：`siteSettings.tiktokQrCode` / `instagramQrCode` 为空时整个二维码区块隐藏。
- **产品长文 `overviewHtml` 仍为英文**（见「界面文案维护」的已知取舍）。
- **机器翻译需母语复核**：本次 5 语言译文由 LLM 生成（术语表与专有名词已约束），
  上线前建议让母语者过一遍 `faq` / `contact` / `distributors` 与产品描述。
- 定期备份：`pnpm backup`（数据库 + media，保留 7 份）

### 🔧 生产环境配置提醒

- `NEXT_PUBLIC_SITE_URL` 必须设为正式域名（否则 robots/sitemap/canonical 指向错误地址）
- `PAYLOAD_SECRET` 用强随机值；生产管理员密码请轮换
- 首次部署后立即通过后台验证：产品/分类/博客/FAQ/媒体上传

## 质量门禁

四条都必须通过：

```bash
pnpm lint         # ESLint 0 error 0 warning
pnpm typecheck    # TypeScript 0 error（覆盖 src/ 与 tests/，scripts/ 不参与）
pnpm build        # 生产构建
pnpm test:int     # Vitest 集成测试
pnpm test:e2e     # Playwright（需要 dev server）
```

> `pnpm test` = `generate:types` → `test:int` → `test:e2e`。它先重新生成类型，因此在新克隆的
> 仓库上也能直接跑通。
>
> `tests/int` 使用 `environment: 'node'`（不是 jsdom）并显式声明 `@/*` 别名：
> 这些 spec 会启动真实的 Payload 实例，jsdom 缺少 `node:` 内置模块与文件系统。
> 当前覆盖 63 项：数据层关系解析、限流、反垃圾启发式、抓取文案清洗
> （`supplier-text`）、结构化数据构造（`structured-data`）、六语言命名空间与文案一致性
> （`i18n-parity`）。
>
> **全站爬虫**（不在 `pnpm test` 里，需要 dev server 在跑）：`scripts/check-links.cjs`
> 可做基础链接检查；本轮审计用的是按 sitemap 全量抓取 + 逐资源校验的方式，
> 注意**用 GET 而不是 HEAD** 校验 `/api/media/file/*`（Payload 对 HEAD 返回 404）。

## 业务设计来源

网站文案与内容框架参考公司内部《外贸经营与销售作战指导手册》：
- **价值计算**（首页 ValueCalculated 区块）——"我们不喊质量，我们展示数字"
- **信任证据链**（TrustEvidence 区块）——QC 报告/检测/溯源文档
- **需求诊断表单**（Contact）——应用场景/现状/采购意图
- **合作流程**（HowWeWork）——从询盘诊断到风险递减交付

## 旧项目

原 Astro + Cloudflare Workers 版本保留在 `D:\Agricon_Website`（迁移前的历史版本）。

> 已删除的旧工具：`scripts/translate-blog-faq.py`、`scripts/translate-content.py`（基于 MyMemory
> 免费配额，逐条调用外部 API）与 `scripts/import-translations.mjs`。它们被
> `i18n-extract-todo.ts` → 译者/LLM → `i18n-apply-todo.ts` 取代：新流水线不依赖外部配额、
> 逐条断言写回，并且只翻译真正缺失的字符串。历史版本仍可在 git 中找到。

## 界面文案（i18n）维护

界面文案的**唯一来源**是 `src/i18n/locales/<locale>/<namespace>.json`（6 种语言同构，16 个命名空间）：

```
common       nav/cta/footer/home/aria/meta（footer 内容内嵌在 common.footer）
contact      contact 页 + 询盘表单 + 需求诊断下拉项
productDetail 产品详情页      faq / distributors / trade-support  对应页面
search       搜索页          videos / privacy / terms / aria     对应页面
blog         博客列表+详情（hero / meta / badge / backToBlog / tags 标签词典）
pages        about / caseStudies / products / solutions 四个页面的 meta 标题与描述
```

`src/i18n/config.ts` 只保留语言元数据与 `getTranslations(locale, namespace)`，**不内联任何字符串**。
查找顺序是「英文 namespace → 该语言 namespace」深度合并，漏翻的键回退英文而不是显示空白。

两条硬约束（由 `tests/int/i18n-parity.int.spec.ts` 强制）：

1. **命名空间与键必须与英文完全一致** —— 少一个键、多一个文件都会让测试失败。
2. **每个命名空间的「与英文逐字相同」比例必须 < 20%**（当前全站 2%）。

> 这条测试是补债：历史上 `blog` 命名空间只有 `fr`、`solutions` 只有 `sw`，而**没有任何页面读它们**，
> 于是法语博客页显示英文、斯瓦希里方案页显示英文，那两个文件纯属死代码；同时 5 种语言的
> `distributors` / `faq` 是 100% 英文。现在两个命名空间对所有语言齐备并真正接线。
>
> 同理删除的还有 `footer.json`：它和 `common.footer` 逐字重复且无人引用。

客户端组件（`Header`、`Newsletter`、`ContactForm` 等）不导入 `config.ts`，而是用更小的
`src/i18n/ui.ts`，避免把全部语言数据打进客户端包。

### 还没翻译的部分（已知取舍）

- **产品长文 `overviewHtml`** 仍是英文：43 个产品 × 平均 4 KB × 5 语言 ≈ 87 万字符，机器翻译不划算。
  产品页在该区块标注了 `lang="en"`，浏览器与读屏软件会据此切换语言规则，而不是拿阿拉伯语字形去排英文。
- **产品名**按要求保留英文技术型号（见上文）。

> 除以上两项，全站其它内容（界面文案、页面 metadata、首页 CMS 区块、产品描述/特性/规格、
> FAQ、博客、案例摘要、页脚地址与标语）**已完成 5 语言本地化**。首页曾经是"数据没本地化 +
> 组件不传 locale"的双重问题，2026-09-18 已修完，迁移与回滚方式见
> [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md) §8。

> 接手维护请看 [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md)：架构地图、常见任务 runbook、已知坑与排错清单。
