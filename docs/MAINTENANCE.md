# Agricon 网站维护手册（接手必读）

面向**接手这个仓库的人**：怎么把站点跑起来、每类改动该动哪个文件、哪些坑踩过一次不要再踩。
项目概览与技术栈见 [`../README.md`](../README.md)。

- 站点：Payload CMS 3.82 + Next.js 16（App Router），6 语言（en/ru/fr/es/sw/ar，ar 为 RTL）
- 开发库：SQLite（`agricon-dev.db`）；生产：Vercel Postgres + Vercel Blob
- 前端页面全部 `force-dynamic`（按请求渲染），数据层有两层缓存

---

## 1. 十分钟跑起来

```bash
pnpm install
pnpm generate:types          # src/payload-types.ts 不入库，新克隆必须先跑
pnpm dev                     # → http://localhost:3000 ，后台 /admin
```

- 首次进 `/admin` 会要求创建管理员。
- 前端 6 语言入口：`/en` `/ru` `/fr` `/es` `/sw` `/ar`；根路径 `/` 会 308 到 `/en`。
- 改了 collection 字段后**必须**同步开发库 schema（见 §4.1），否则会出现
  `SQLITE_ERROR: no such table: ...` 让整站数据读取失败。
- 质量门禁：`pnpm lint`、`pnpm typecheck`、`pnpm test:int`（63 项）。
  `scripts/` 目录**不参与 typecheck**（`tsconfig.json` 显式排除），所以脚本靠跑真实流程验证。

---

## 2. 架构地图

| 层 | 位置 | 说明 |
|---|---|---|
| 路由 | `src/app/(frontend)/[locale]/**` | 首页 / products（分类→子分类→产品三级）/ solutions / case-studies / blog / about / contact / faq / distributors / trade-support / videos / search / privacy / terms |
| 后台与 API | `src/app/(payload)/**` | Payload 自动生成 admin + REST/GraphQL |
| 语言路由 | `src/proxy.ts` | 注入 `x-pathname`（layout 用它算 canonical/hreflang）、大小写语言重定向、无前缀 → `/en` |
| 内容模型 | `src/collections/**`（17 个） | Products / Categories / Subcategories / Solutions / CaseStudies / BlogPosts / BlogTags / FAQs / FaqCategories / Downloads / Videos / Countries / Media / Inquiries / NewsletterSubscribers / SiteSettings / Users |
| 数据层 | `src/lib/payload.ts` | 所有读取都走这里：React `cache()`（单次渲染内）+ `unstable_cache`（跨请求，TTL 300s；站点设置 60s） |
| 文案 | `src/i18n/**` | JSON 单一来源 + `getTranslations()` 深度合并（英文兜底） |
| SEO | `src/lib/seo.ts` + `src/lib/structured-data.ts` + `src/components/JsonLd.tsx` | canonical/hreflang/OG/默认分享图/JSON-LD |
| 公开写接口防护 | `src/lib/rate-limit.ts`、`src/lib/anti-spam.ts`、`src/lib/public-write-guard.ts` | 限流 + 蜜罐/时序/关键词启发式 |
| 内容卫生 | `src/lib/supplier-text.ts` + `scripts/cleanup-supplier-copy.ts`、`scripts/repair-product-copy.ts` | 抓取残留清洗与描述修复 |

**缓存注意**：数据层 TTL 是 300 秒。用脚本改完 CMS 内容后，页面最多 5 分钟后才更新；
要在开发环境立刻看到，删掉 `.next/dev/cache` 再重启 dev server（见 §4.7 —— **不是**
`.next/cache`，Next 16 + Turbopack 下那个目录根本不存在，删了等于没删）。

---

## 3. 常见任务 runbook

### 3.1 改界面文案 / 加一种语言

1. 文案只存在于 `src/i18n/locales/<locale>/<namespace>.json`。**英文文件是基准**：
   先在 `en/` 里加键，再补其他 5 种语言。
2. `src/i18n/config.ts` 里需要把新命名空间登记三处：静态 import、`localeNamespaces`、
   `namespaceTable`（否则 `getTranslations()` 拿不到）。
3. 页面通过 `getTranslations(locale, 'x')` 读取；页面级 `<title>`/`description` 用
   `pageMetadata(locale, { path, namespace, key })`，文案优先级 `t.meta.*` → `t.hero.*` → 英文兜底。
4. 跑 `pnpm test:int`：`i18n-parity` 会强制「命名空间与键和英文一致」「与英文逐字相同比例 < 20%」。

### 3.2 改 CMS 内容并翻译

```bash
pnpm tsx scripts/i18n-extract-todo.ts            # 导出缺口 → scripts/translations/_todo/
#   译者/LLM 产出 scripts/translations/<lang>-ui-translated.json / -content-translated.json
pnpm tsx scripts/i18n-apply-todo.ts              # dry-run：看会改什么
pnpm tsx scripts/i18n-apply-todo.ts --apply      # 写回 JSON + CMS（幂等、逐条断言）
```

- 只导出「缺失或与英文逐字相同」的字符串 → 反复跑不会重复翻译，也不会覆盖人工润色。
- 内容被修复过（例如描述重写）后，用 `--round2` 只重导「产品描述 + FAQ 答案」，再 `--apply --round=2`。
- 键规则：产品/子分类按 slug；产品特性与规格标签按**英文原文**（43 个产品共享同一张词表）。
- ⚠️ `blogTags.name` **不是** localized 字段（改动它需要 schema 迁移），所以博客标签的显示文案
  走界面文案 `blog.tags.<slug>`，而不是 CMS。应用脚本会打印提示并跳过 `blogTags`。

### 3.2.1 `i18n-apply-todo.ts` 覆盖不到的字段（补充脚本）

`i18n-apply-todo.ts` 只处理 `description` / `features` / `specLabels` / `faqs` / `blogPosts`
的标题摘要。以下字段它**不碰**，各自有独立脚本，全部幂等、逐条 no-fallback 重读断言：

| 脚本 | 处理字段 | 为什么需要单独脚本 |
|---|---|---|
| `i18n-product-names.ts` | `products.name` | 65 个产品在 6 种语言里存的是**同一串英文**。字段"有值"所以缺口统计从没报过它，但页面 `<h1>`、面包屑、卡片、图片 alt、搜索结果全是英文 |
| `i18n-product-descriptions.ts` | `products.description` | 只有 32/65 有译文，其余回退英文 —— 而它渲染在产品名正下方 |
| `i18n-product-seo.ts` | `products.seoTitle` / `seoDescription` | 两个字段都是**派生值**（见下），且非英语行里存的是英文字符串 —— `fallbackLocale: false` 也识别不出来，因为英文确实写在了俄语行里 |
| `i18n-image-alt.ts` | `products.images[].alt` | 357 条 alt 只有英文；其中 207 条是 Alibaba listing 标题（关键词堆砌）。改为从**已本地化的产品名**派生，属确定性变换，无需人工审校 |
| `i18n-faq-categories.ts` | `faqCategories.name` | 只有英文行。前端另有一层 `faq.categoryChips` 映射兜底（分类集合没有 slug 字段，英文名就是稳定键） |
| `i18n-build-blog-content.ts` → `i18n-blog-content.ts` | `blogPosts.content` | Lexical 富文本。**先**用 build 脚本把扁平译文数组套回英文文档结构（结构正确性由构造保证），**再**用 apply 脚本写库 |
| `i18n-case-study.ts` | `caseStudies` 的 8 个字段 | `fish-farm-equipment` 只有英文行，其余 11 条案例都是 6 语言齐全 |

**`seoTitle` / `seoDescription` 是派生字段，不要手写**：英文数据本身就证明了模板 ——
`seoTitle` 63/65 恰好是 `<name> | Agricon Agricultural Equipment`；
`seoDescription` 29/65 是 `<name> — <subcategory> from Agricon. Factory-direct …`，
其余 36 条是 `description` 截断到 158 字符（存量英文行的长度就是 158,158,110,158…）。
`i18n-product-seo.ts` 按同一规则从**已本地化**的内容重生成，因此描述来自真实句子而非样板文字。

> ⚠️ 这些脚本直接写库，而 `getProducts()` 走 300s 的 `unstable_cache`。
> 跑完必须**停 server → 删整个 `.next` → 重启**才能看到效果（§4.7）。

### 3.2.2 `overviewHtml` 为什么不翻译（刻意取舍）

产品长文 `overviewHtml`（60 条 / 673 KB HTML、210 KB 正文）**只有英文**，这是有意的：

- 内容是 Alibaba 供应商页抓取的原始文案，且入库时格式已被破坏 ——
  最短的一条是 8 个"段落"被压成一整块无标点的文本（`<p>` 里塞了 5000 字符）。
- 673 KB × 5 语言 ≈ 3.4 MB 需要人工逐条审校的机器翻译，而这些文字**本来就需要先重写**。
- 产品页因此对非英语语言用 `lang="en"` 标注该区块的阅读语言（浏览器与读屏软件会切换发音），
  这是"内容确实是英文"时的正确处理，而不是假装它是译文。

要真正翻译，正确顺序是：先重写正文（`scripts/repair-product-copy.ts` 已能从它派生干净描述），
再走 §3.2 的流水线。**不要**直接机器翻译现在的 HTML。

### 3.3 产品内容来自哪里 / 怎么重导

- 抓取原始数据：`docs/scrape/*.jsonl`（`alibaba-products` 描述被截断到 900 字符，
  `alibaba-details` 才是完整正文）。
- 全量重导：`pnpm tsx scripts/import-alibaba-catalogue.ts`。
  **破坏性**：会先清空 category/subcategory/product，**产品 ID 会变**，已有翻译与关联会丢。
  可加 `--dry-run` / `--keep-taxonomy` / `--skip-media`。
- 只想修内容、不想重导时，用 §3.4 的两个脚本（幂等、不动关系）。

### 3.4 清洗抓取残留 / 修复产品描述

```bash
pnpm tsx scripts/cleanup-supplier-copy.ts --check    # CI 用：有残留就 exit 1
pnpm tsx scripts/cleanup-supplier-copy.ts --apply    # 清标签 + 解字面量 \uXXXX 转义（全语言、含数组字段）
pnpm tsx scripts/repair-product-copy.ts  --apply     # 用 overviewHtml 重新派生被截断的描述
```

导入脚本已调用同一套 `src/lib/supplier-text.ts` 函数，**重导不会把脏数据带回来**。
新增脏标签时，把标签加进 `BOILERPLATE_LABELS` 即可，两个脚本自动共享。

### 3.5 首页 CMS 内容的多语言维护

首页六个区块的卡片正文存在 CMS 里（`siteSettings`），文本字段已本地化：

```bash
pnpm tsx scripts/migrate-home-content.ts --export-todo   # 导出待翻译清单
#   译者产出 scripts/translations/<lang>-home.json
pnpm tsx scripts/migrate-home-content.ts --check         # 校验每个语言是否完整
pnpm tsx scripts/migrate-home-content.ts --apply         # 写入
```

细节、坑与生产执行方式见 §8。日常只改文案的话，直接在后台按语言标签编辑即可，无需跑脚本。

### 3.6 重新生成分享图

```bash
node scripts/generate-og-image.mjs     # → public/images/og-default.jpg (1200×630, ~130 KB)
```

`src/lib/seo.ts` 的 `DEFAULT_OG_IMAGE` 指向它；页面/产品有 CMS 图时以 CMS 图为准。

### 3.7 备份

```bash
pnpm backup            # 数据库 + media → backups/，保留 7 份
pnpm tsx scripts/backup-db.ts --keep=14 --no-media
```

### 3.8 部署（Vercel）

1. 环境变量见 README 的表格；`NEXT_PUBLIC_SITE_URL` 必须是正式域名（canonical/sitemap/robots 都用它）。
2. `vercel-build` = `generate:types` → `generate:importmap` → `payload migrate` → `next build`。
3. **改了 collection 字段就必须提交 migration**，否则生产库不会有这一列 —— 详见 §3.8.1。
4. 生产库与开发 SQLite **是两套数据**：任何内容修复脚本都要在生产环境变量下再跑一次
   （`POSTGRES_URL=... pnpm tsx scripts/cleanup-supplier-copy.ts --apply`）。

### 3.8.1 生产 schema 只能靠 migration（血泪教训）

**`push` 在生产环境是彻底不生效的**，不是"首次部署靠 push"。
`@payloadcms/db-vercel-postgres/dist/connect.js` 里写死了：

```js
// Only push schema if not in production
if (process.env.NODE_ENV !== 'production' && ... && this.push !== false) {
  await pushDevSchema(this)
}
```

Vercel 上 `NODE_ENV=production`，所以 `payload.config.ts` 里的
`push: process.env.PAYLOAD_PUSH_SCHEMA !== 'false'` 在生产**永远为假**。而当时
`src/migrations/index.ts` 是空数组（`export const migrations = []`），
于是：**建库之后所有的 schema 变更都没有进过生产库。**

后果（2026-09-24 线上 500 事故）：`products.faqs`、`products.detailImages`
以及六个 `siteSettings.home*` 本地化数组的表在生产库里不存在，
部署读取它们的代码后 `/api/products` 与 `/api/siteSettings` 直接 500，
所有依赖这两个接口的页面（`/en`、`/en/products` …）全部不可访问。
本地因为 SQLite 一直在 push，所以完全正常 —— **本地能跑不代表生产能跑。**

**规矩：任何字段增删改，都要跟着一条 migration。**

```bash
# 1) 先在本地改 config，然后对着生产库生成 migration（会 diff 出缺的表/列）
POSTGRES_URL='<生产连接串>' PAYLOAD_SECRET='<...>' pnpm payload migrate:create <描述性名字>
# 2) ⚠️ 生成的文件默认假设"空库"，用的是裸 CREATE TABLE，直接在生产跑会报 already exists。
#    必须手工改成 CREATE TABLE IF NOT EXISTS / 加 DO $$ ... pg_constraint ... $$ 守卫，
#    只保留真正缺的部分，并在事务里预演（见下）。
# 3) 在事务里预演，确认能干净回滚
# 4) 注册到 src/migrations/index.ts（不注册就不会执行）
# 5) 应用
POSTGRES_URL='<生产连接串>' PAYLOAD_SECRET='<...>' pnpm payload migrate:status   # 确认 pending
POSTGRES_URL='<生产连接串>' PAYLOAD_SECRET='<...>' pnpm payload migrate
```

预演用的最小脚本（在生产上跑但最后 `ROLLBACK`，不改任何数据）：

```ts
import pg from 'pg'
import { up } from '../src/migrations/<你的 migration>'
const c = new pg.Client({ connectionString: process.env.POSTGRES_URL!, ssl: { rejectUnauthorized: false } })
await c.connect()
await c.query('BEGIN')
const stmts: string[] = []
const fake = { execute: async (q: any) => { stmts.push(q.queryChunks.map((x: any) => x.value ?? '').join('')) } }
await up({ db: fake } as any)
for (const s of stmts) await c.query(s)
console.log('OK'); await c.query('ROLLBACK')   // ← 关键
```

几个坑：

- ⚠️ **`payload_migrations` 里若有 `name='dev'`（`batch = -1`）的行，`payload migrate` 会交互式
  追问"data loss will occur, proceed?"，而在 Vercel 构建这种没有 TTY 的环境里它会
  `process.exit(0)` —— 迁移全部静默跳过、构建照样成功。**
  正确做法不是喂 `"y"`（`vercel-build` 根本喂不进去），而是**删掉那一行**：
  `DELETE FROM payload_migrations WHERE batch = -1 AND name = 'dev';`
  详见 §12.8 —— 这是 2026-09-24 那次 500 事故的另一半原因。
- 老的非本地化列（如 `site_settings_home_*.title/desc/sub/quote`）在字段改成
  `localized` 之后仍然残留且是 `NOT NULL`，会让插入失败。**改成 nullable，别 drop**
  —— `scripts/migrate-home-content.ts` 的 `readLegacy` 还要读它们来回填本地化表。
  等回填跑完再考虑删除。
- `vercel env pull` 会写出**真实生产凭据**到 `.env.prod.tmp`。已加进 `.gitignore`
  （`.env.prod.tmp` / `.env.*.tmp`），用完**立刻删除**。
- 生产 Postgres 连接偶发 `Connection terminated unexpectedly` / `timeout expired`，
  脚本里对连接和查询都加重试。

### 3.8.2 回滚会"钉住"生产域名（部署成功但线上还是旧版）

**症状**：`vercel ls` / Deployments 里最新一条已经是 `READY` 且 `target=production`，
但线上仍旧是旧代码。本次事故收尾时踩到：`c49b771` 已经 READY，
`www.agricon.cn` 却还在跑被回滚到的 `c3287fd`，`/api/products` 里看不到新字段。

**原因**：Vercel 的 **Instant Rollback 会把这个项目的生产域名"钉"在回滚目标上**。
之后的新生产部署**不会自动抢回域名**（Hobby 套餐下 `projects/{id}/rollback` 还会报
`To rollback further than the previous production deployment, upgrade to pro`）。

**怎么确认线上到底跑的是哪个版本**——不要靠猜，找只有新代码才有的东西：

```bash
# 8a8aee3 之后 products 才有 faqs / detailImages 字段
curl -s "https://www.agricon.cn/api/products?limit=1&depth=0" | grep -o '"faqs"'
```

字段不在 → 线上就是旧版。也可以比对 `_locales` 是否生效
（旧版 `homeTrustEvidence.items` 是 json 字符串数组，新版是 `[{text}]`）。

**怎么修**：把域名显式指回新部署（或去 Dashboard 点 Promote）：

```bash
TOKEN='<Vercel token>'; TEAM='team_QndIkcpNjTARzSsZyENDs8kQ'
UID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.vercel.com/v6/deployments?teamId=$TEAM&limit=1&target=production" \
  | python -c 'import sys,json;print(json.load(sys.stdin)["deployments"][0]["uid"])')
for D in www.agricon.cn agricon.cn agricon-payload.vercel.app; do
  curl -s -X POST -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
    -d "{\"alias\":\"$D\"}" "https://api.vercel.com/v2/deployments/$UID/aliases?teamId=$TEAM"
done
```

另外两个坑：

- `vercel redeploy <url>` **默认是 preview**，必须显式加 `--target production`，
  否则只会生成一个 `*-agricon.vercel.app` 的预览别名，线上纹丝不动。
- **`/sitemap.xml` 是预渲染静态页，会被 CDN 长期缓存**：本次见到 `X-Vercel-Cache: HIT`
  且 `Age ≈ 219955s`（约 61 小时），内容还是几天前的。判断代码行为**不要用 sitemap**；
  加查询串也不一定能绕过（静态预渲染走同一缓存条目）。看 API 响应头里的
  `X-Vercel-Cache` / `Age` 来判断新鲜度。

### 3.9 删除重复产品 / 调整分类归属

抓取数据里同一个货源会被挂成两条产品（不同 Alibaba ID、**同规格同价格**），前台就出现两张
重复卡片。删掉其中一条：

```bash
pnpm backup                                                                          # 先备份
pnpm tsx scripts/delete-product.ts --slug=<要删的> --redirect-to=<要留的>              # 预演
pnpm tsx scripts/delete-product.ts --slug=<要删的> --redirect-to=<要留的> --apply
```

脚本会**先**把 `solutions.products` 里的引用摘掉再删产品（不摘的话，Postgres 下这一行有指向
`products` 的外键，删除会直接失败），然后打印该贴进 `next.config.ts` 的重定向。
它**不删图片**，只报告哪些 media 因此变成孤儿。

留哪条一般看：首图是不是产品图、`overviewHtml` 长度、SEO 描述完整度。

> 产品 URL 是 `/products/<分类>/<子分类>/<slug>`，所以**任何**归属变化都会改 URL：
> 移动整个子分类用 `scripts/move-subcategory.ts --from= --to=`，
> 后台手动改 `subcategory` 也一样——必须补一条 308 重定向，否则旧链接和已收录页面全 404。

### 3.10 调整分类卡的顺序 / 名称 / 简介

`/products/<分类>` 的卡片顺序由子分类的 `sortOrder` 决定，`sortOrder` **不本地化**，改一次
6 种语言同时生效：

```bash
pnpm tsx scripts/reorder-subcategories.ts --category=poultry-equipment \
  --order=layer-cage,broiler-cage,chick-cage,quail-cage,automatic-cage,hatcher-equipment,floor-rearing-equipment,cage-accessories,breeding-accessories \
  --rename=cage-accessories:"Cage Accessory" \
  --rename=breeding-accessories:"Breeding Accessory" \
  --rename=floor-rearing-equipment:"Flat Breeding Equipment" --apply

# 卡片简介（description，按语言，逐语言跑）
pnpm tsx scripts/reorder-subcategories.ts --category=agriculture-machinery \
  --describe=vibrating-screen:"For grading peanuts, soybeans and other grain seed by size." --locale=en --apply
```

- 分类稿 `docs/scrape/taxonomy-78sub-2026-09-17.json` 是**顺序与英文名**的来源（§10.4）。
- `name` / `description` 都是**按语言**存的：`--locale=en` 只改英文，其它语言保留各自译法——
  分类名在俄/法/西等语言里习惯用复数，不要为了对齐英文去改成单数。
- 未列出的子分类保持原 `sortOrder`，脚本会打印出来，不会静默移动。
- **卡片缩略图不在这个脚本里**：改 `src/lib/images.ts` 的 `subcategoryImages`（§11.10）。
- ⚠️ 全量重导（`import-alibaba-catalogue.ts`）会重建分类表并写入它自己的 `sortOrder` 与名称，
  **重导后要再跑一次这条命令**。后台改完内容后前台要等缓存 TTL（§4.7）。

### 3.11 改产品名称（不动 URL）

```bash
pnpm tsx scripts/rename-products.ts \
  --rename=48-bird-half-set-layer-cage:"Half-Set Layer Cage" \
  --rename=128-bird-4-tier-layer-cage:"A-Type Layer Cage" --apply
```

- `name` 与 `seoTitle` **都是按语言存的**：只在后台的英文标签页改，另外 5 种语言仍是旧名。
  脚本默认把 6 种语言全写一遍，并逐语言读回校验（写入失败会报错，不会"看起来成功"）。
- 产品名刻意保留英文（技术型号），所以 6 种语言写的是同一个英文名。
- `seoTitle` 形如 `<名称> | Agricon Agricultural Equipment`：只替换前缀里的旧名称，后缀保留；
  不以旧名称开头的 seoTitle 不动，并会打印提示。
- **slug 不动**，所以 URL、308 重定向、已收录页面都不受影响。
- 同名产品 schema 允许，但会渲染成两张标题完全一样的卡片，脚本会对此警告（§10.5）。

### 3.12 按客户清单增量补产品（不重建目录）

客户会不定时给一份整理好的链接清单（形如 `链接.txt`：分组标题 + Alibaba 链接）。抓取与入库：

```bash
# 1. 用 BrowserSkill 打开清单里每条链接，取页面 JSON-LD（标题/价格/图片/SKU）
#    见 §6 的 browser-skill 说明；产出 docs/scrape/alibaba-links-<date>.jsonl
# 2. 维护映射文件 docs/scrape/import-names-<date>.json：sku -> [子分类 slug, 型号级名称]
# 3. 预演 / 执行（幂等：按 alibaba-<sku> 标签判断，已存在则只改名/移动）
pnpm tsx scripts/import-links.ts
pnpm tsx scripts/import-links.ts --apply
```

要点：

- **它是增量的，不会清库**；与 `import-alibaba-catalogue.ts`（全量重建、会换 ID、丢翻译）完全不同。
- 名称以映射文件为准，**不是 Alibaba 标题**——那些标题是关键词堆砌（100+ 字符）。
- 产品换了子分类 = 换了 URL（URL 含子分类），脚本不会自动加重定向，
  **必须手动补进 `next.config.ts`**（见 §10.6 的例子）。
- 只建映射里存在、站点上没有的子分类；目前唯一例外是 `vibrating-screen`（分类稿有、站点原先没有）。
- 抓到的 JSON-LD `description` 是 "Find Complete Details about …" 这类样板文，脚本会丢弃，
  所以新产品**没有正文和参数**——需要长文案时要另外抓详情页，见 §3.4。

### 3.13 批量改子分类的多语种名称与简介（走 JSON，不走 shell）

`reorder-subcategories.ts --rename=` 一次只能带一个 `--locale`，且名字要经 shell 传参 ——
**俄/法/西/斯瓦希里/阿拉伯文有乱码风险，而它的回读校验拿同一个（已乱码的）参数比对，会假通过**。
要一次把 6 个语种的名字/简介写对，用：

```bash
pnpm tsx scripts/set-subcategory-copy.ts --from=docs/scrape/agri-rename-2026-09-22.json          # 预演
pnpm tsx scripts/set-subcategory-copy.ts --from=docs/scrape/agri-rename-2026-09-22.json --apply   # 落库
```

JSON 形状（`_` 开头的键是注释，会被跳过；`name` / `description` 任缺其一）：

```json
{ "screw-conveyor": { "en": { "name": "Screw Elevator", "description": "For lifting grain…" },
                      "ar": { "name": "الرافعات اللولبية" } } }
```

- 每个语种写完都会**读回逐字段比对**，不一致打 `✗` 并以 exit 1 结束（不会"看起来成功"）。
- ⚠️ 只给 `description` 不给 `name` 时，Payload 会因 localized `required` 字段按本次提交的数据
  校验而报 `Name: This field is required.`（该语种没有自己的 name 行、只是回退英文时必现）。
  脚本自动把该语种**当前显示的名字**读出来一起提交；副作用是这个名字从"回退"变成"各语种各存一份"，
  显示值不变，但以后改英文名就不能只改 `en` 了（要 6 个语种一起写）。
- 只改**已存在**的子分类；要新建分类得连缩略图与简介一起做，见 §11.10。
- 改完前台有 300s 数据缓存，见 §4.7。

---

## 4. 容易踩的坑

### 4.1 SQLite schema 必须手工同步

`.env` 里 `PAYLOAD_PUSH_SCHEMA=false`：`@payloadcms/db-sqlite` 的 push 在 Windows/libsql 上会
反复创建已存在的索引并崩溃。改字段后：

```bash
pnpm tsx scripts/sync-dev-schema.ts --check   # 只报告
pnpm tsx scripts/sync-dev-schema.ts           # 只增不减地补齐表/列
pnpm generate:types                           # 类型跟着更新
```

### 4.2 `access.create` 里不要放副作用

Payload 在**渲染后台**时也会评估每个 collection 的 access 函数。曾把限流+反垃圾写进
`inquiries.access.create`，结果：未登录打开 `/admin` 时没有蜜罐/时间戳 token → 抛 400 →
**整个后台 500**；已登录员工打开 5 次后台也会被自己限流。
现在这类逻辑在 `beforeValidate` hook（`src/lib/public-write-guard.ts`）。access 只做纯判断。

### 4.3 关系字段的 depth 陷阱

`getProducts()` 用 `depth: 1`（`depth: 2` 会把 `solutions` 双向关系展开成 8 MB，超过 Next
数据缓存 2 MB 上限）。**depth 1 下 `product.subcategory.category` 只是一个 id**：
直接读 `.slug` 会得到 `undefined`，拼出 `/en/products//layer-cage/xxx` 这种死链
（曾影响 33/43 个产品页）。需要分类 slug 时用 `resolveProductCategorySlug()`。

### 4.4 校验资源用 GET，不要用 HEAD

Payload 的 `/api/media/file/*` 对 HEAD 返回 404、对 GET 返回 200。用 HEAD 写爬虫会把
几百张正常图片报成坏图。

### 4.5 限流是「按实例」的

`rate-limit.ts` 的计数器在进程内存里：Vercel 上 N 个热实例 ≈ 上限 ×N。需要全局硬上限时
把 `consume()` 换成 Redis/KV，调用点不用改。

### 4.6 `force-dynamic` 是刻意的

所有前台页面按请求渲染，这样 `next build` 不需要连生产库（首次部署时表还不存在）。
代价是 TTFB 依赖数据层缓存；若要改静态生成，得先把 `[locale]/layout.tsx` 对
`headers()`（`x-pathname` → canonical/hreflang/lang）的依赖改成从路由 `params` 推导。

### 4.7 后台改完内容，前台 5 分钟后才变

`unstable_cache` TTL 300s。开发时想立刻验证：**停 server → 删缓存 → 重启**。

```powershell
# 1. 关掉 dev server，等到端口真正释放（否则旧进程会在关闭时把缓存再写回来）
while (Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue) { Start-Sleep 1 }
# 2. 删缓存。只刷数据用 .next\dev\cache；构建状态可疑时删整个 .next
Remove-Item .next\dev\cache -Recurse -Force      # 不是 .next/cache！
# 3. 重新 npx next dev
```

**为什么不是 `.next/cache`**：Next 16 + Turbopack 把 dev 的缓存放在
`.next/dev/cache/fetch-cache`（整个 `.next/dev` 约 1.6 GB）。`.next/cache` 在 dev 下压根
不存在，删它是静默 no-op —— 现象就是"明明清了缓存、改了库，某个语言还是旧数据"，等 5 分钟
TTL 到了又自己好了。

**⚠️ 删 `.next/dev/cache` 一定要先停 server**：在运行中删这个子目录会破坏 Turbopack 的
增量构建状态，症状是**整个 `/products/**` 全站 404**——服务还活着、`/en/blog` 还 200、
`sitemap.xml` 照常列出 696 条，所以特别容易误判成路由或数据问题。踩过一次，正确修法是
**停 server → `Remove-Item .next -Recurse -Force` → 重启**。

`pnpm devsafe`（`rm -rf .next`）能清干净，但那条命令用的是 Unix 的 `rm -rf`，
**在 Windows 上不生效**，用上面的 PowerShell 版本。

排查"改了没生效"时先确认拿到的不是旧缓存：`GET /api/...` 直连数据库（不带应用层缓存），
若 API 已是新值而页面是旧值，就是缓存问题。

---

## 5. 排错清单

| 现象 | 先看哪里 |
|---|---|
| `/admin` 500 | 是否有人往 access 函数里塞了会抛错/带副作用的逻辑（§4.2）；看 dev server 日志的堆栈 |
| 产品/列表页大面积报 SQL 错 | 开发库 schema 与 collection 不一致 → `sync-dev-schema.ts`（§4.1） |
| 页面图片 404 | 先确认是不是用 HEAD 测的（§4.4）；再确认 media 文件在 `media/`（生产在 Vercel Blob） |
| 改了内容看不到 | 缓存 TTL 300s（§4.7） |
| 产品页出现 `Report abuse`、`\uD83C\uDFED` | 跑 `cleanup-supplier-copy.ts --check` 定位，再 `--apply`（§3.4） |
| 产品页 "Related Products" 点进去 404 | `resolveProductCategorySlug()` 是否被绕过（§4.3） |
| 某种语言页面还是英文 | `pnpm test:int` 的 `i18n-parity` 会指出是哪个命名空间/键；再按 §3.2 补翻译 |
| 分享链接没有缩略图 | 该页是否设置了 `openGraph.images`；`DEFAULT_OG_IMAGE` 文件是否存在 |
| 询盘提交 429 | 限流生效：同一 IP 10 分钟 5 次（开发时重启 dev server 即清零） |
| 询盘提交 400 | 反垃圾命中（蜜罐被填 / 提交太快 / 关键词）；服务端日志会写明具体原因 |
| 冷启动后偶发某个页面 500 `SyntaxError: Unexpected end of JSON input` | 已知的**开发环境瞬态**：刚清过 `.next/dev/cache` 又立刻用并发爬虫打服务时，Next 的 dev 缓存文件会被边写边读。实测 1 次出现、随后 33 次请求（含 8 路并发）全部 200；重启或重试即可，生产不受影响（用真实缓存后端）。若在生产复现，抓完整堆栈再查 |

### 迁移后必查的两件事

1. **`pnpm tsx scripts/migrate-home-content.ts --check`** —— 六个首页区块在每个语言下都必须行数一致且文本非空。
2. **读取路径是否传了 locale** —— 数据本地化了、组件却调 `getSiteSettings()`（无参）的话，页面依旧显示英文。
   这类问题只有页面级核对能发现（见 §8 的踩坑记录）。

---

## 6. 本次集中修复了什么（2026-09-18）

留给后来者的上下文 —— 这些不是「新功能」，而是把已经上线的问题修掉：

| 问题 | 根因 | 修法 |
|---|---|---|
| `/admin` 整站后台 500 | 限流/反垃圾写在 `access.create` 里，Payload 渲染后台时会执行它 | 移到 `beforeValidate`（`public-write-guard.ts`） |
| 33/43 产品页的 Related Products 全是 404 | depth 1 下 `subcategory.category` 是 id，`.slug` 为 undefined | 用 `resolveProductCategorySlug()`，并在拼不出路径时不渲染链接 |
| 31/43 产品正文以 `Product descriptions from the supplier Report abuse …` 开头 | 导入脚本的清洗正则要求标签在字符串开头，而实际前置了另一段标签 | 共享 `supplier-text.ts`，导入与存量数据同一套规则 |
| 产品特性显示 `\uD83C\uDFED Certified Factory Partnerships` | 抓取数据里的 emoji 被二次转义，以文本形式入库 | `decodeLiteralUnicodeEscapes()`（文本/HTML/数组字段全覆盖） |
| 22/43 产品描述被截断（`"This 4."`、`"…by up to 80 perce"`） | `shortDesc()` 硬切 260 字符，找不到句号就切在词中间 | `summarizeCopy()` 句子→词边界；存量数据用 `repair-product-copy.ts` 从 `overviewHtml` 重派生 |
| 非英语语言 41% 的界面文案是英文（`distributors`/`faq` 100%） | 只有 5 种语言的部分命名空间被翻译；`fr/blog.json`、`sw/solutions.json` 无任何页面引用 | 新三步流水线补齐；死命名空间接线；`i18n-parity` 测试防回归 |
| 全站 0 处 JSON-LD，非产品页无 `og:image` | README 写了但代码里没有 | `structured-data.ts` + `JsonLd`；layout 补默认分享图 |
| 六语言页面的 `<title>`/描述基本是英文 | `pageMetadata()` 支持 `namespace`，但多数页面没传 | 传 `namespace`/`key`；补 `pages.json`、`blog.json` |
| `public/` 里 13 张图无人引用（含 4.6 MB 的 `home-hero.png`，和一张 0 字节 PNG） | 页面 hero 改走 `siteSettings.pageHeroImages` 后遗留 | 删除（约 23 MB）+ 删掉仓库根目录 67 KB 的 `layer-cage.html` |
| `/EN/faq` 404 | 大小写不匹配的语言段被当成普通路径前缀 | `proxy.ts` 重定向到小写语言段 |

**这些修复都有测试兜底**：`tests/int/supplier-text.int.spec.ts`（19 项）、
`tests/int/structured-data.int.spec.ts`（10 项）、`tests/int/i18n-parity.int.spec.ts`（6 项）。

---

## 7. 验证一个改动是否真的生效

```bash
pnpm typecheck && pnpm lint && pnpm test:int && pnpm test:e2e
pnpm dev &                    # 需要 dev server 在跑
# 全站：sitemap 468 条全部抓一遍，检查状态码、资源、canonical/hreflang、JSON-LD
#   ⚠️ 资源用 GET 校验（§4.4）
node scripts/check-links.cjs  # 基础链接检查
```

`pnpm test:e2e`（Playwright，12 项）覆盖的是 **HTTP 爬虫看不到的那一层**：语言切换、移动端菜单、
联系表单控件、博客目录锚点跳转、404 页面、SEO 路由格式。它曾经抓到过 `BlogToc` 的真实缺陷
（见 §6 最后一行）——**改动客户端组件后一定跑它**。

人工抽查建议顺序：`/en`（区块与图片）→ 任意产品详情（描述/特性/相关产品/JSON-LD）→
`/ru`、`/ar`（翻译与 RTL）→ `/admin`（后台可用）→ `/en/faq`（FAQPage 结构化数据）。

**"某个语言还有英文"怎么查**：不要只看 JSON 文件。把 /en 与目标语言的同一路径渲染文本抓下来，
比对 ≥5 个词且完全相同的文本块 —— 命中的就是**硬编码**文案（JSON 文案因为已翻译不会命中）。
本次就是靠这个方法发现首页 11 个区块的标题、newsletter 区块和空态文案完全没走 i18n。

---

## 8. 首页 CMS 内容的多语言化（2026-09-18 已完成）

### 当时的问题

首页 6 个区块的卡片正文读的是 `siteSettings` 集合，而这些字段**没有声明 `localized: true`**，
所以任何语言拿到的都是同一份英文；其中 `homeValueCalculated.items` 与
`homeTrustEvidence.items` 还是 `type: 'json'` —— **Payload 无法本地化 JSON 字段**。

### 现在的状态

| 字段 | 文本子字段 | 结构 |
|---|---|---|
| `homeHowWeWork` / `homeWhyChooseUs` | `title` / `desc` | 数组行共享，文本按语言存在 `*_locales` 表 |
| `homeGlobalCoverage` | `title` / `sub` | 同上 |
| `homeTestimonials` | `quote` / `role`（`name` 是农场专名，保持共享） | 同上 |
| `homeTrustEvidence` | `title` + `items[].text`（**JSON → 数组**） | 嵌套数组，文本按语言 |
| `homeValueCalculated` | `title` + `items[].label` / `items[].value`（**JSON → 数组**） | 嵌套数组，文本按语言 |

后台里这些字段现在都有语言切换标签，可以直接按语言编辑。

### 数据是怎么搬过去的

```bash
pnpm tsx scripts/migrate-home-content.ts --export-todo   # 1. 导出待翻译清单（scripts/translations/_todo/<lang>-home.json）
#    译者产出 scripts/translations/<lang>-home.json（英文原文 → 译文 的扁平映射）
pnpm tsx scripts/migrate-home-content.ts --check         # 2. 看每个语言是否完整
pnpm tsx scripts/migrate-home-content.ts --apply         # 3. 写入 en + 5 语言
```

- **数据源**：首次运行时读**旧列**（`title`/`desc`/`sub`/`quote`/`items`）—— 这些列在迁移后**不会被删除**，
  作为安全网保留；之后再次运行则改读**当前英文内容**。这个回退很关键，因为 Payload 在写入本地化数组时
  会**重建数组行（生成新 id）**，旧列对新行就是空的；早期版本没有这个回退，第二次运行会把内容清空。
- **写入**：走 Payload 本地 API（不是 SQL），因为数组行的 id 由 Payload 生成；写其它语言时必须带上
  en 的行 id，否则会复制出行而不是更新文本。
- **翻译键**：英文原文本身（与产品特性/规格词表同一约定），因为行 id 在重导后会变。
- 生产库同样执行 `--apply`（带 `POSTGRES_URL`）：生产的 schema 由 push 自动建表，旧列同样保留。

### 迁移时踩到的两个坑（已在代码里修掉）

1. **组件不传 locale**：`GlobalCoverage`、`HowWeWork`、`WhyChooseUs`、`TrustEvidence`、
   `ValueCalculated`、`Testimonials`、`StatsSection` 调用 `getSiteSettings()` **不带参数**，
   默认拿英文。数据本地化了，页面却还是英文。现已全部传 `locale`。
2. **`--check` 的英文兜底**：不要在迁移后立刻用 grep 判断"是否还英文" ——
   先确认读取路径传了 locale，再判断数据。

---

## 9. 本次修复记录（第二轮：首页与文档）

第一轮见下文 §6；第二轮补上了第一轮审计方法**看不到**的部分：

| 问题 | 发现方式 | 修法 |
|---|---|---|
| 博客目录锚点全部失效（点击不滚动，`h2` 没有 `id`） | `pnpm test:e2e` 失败 | `BlogToc` 加 `MutationObserver`：Lexical 富文本在客户端重建子树会抹掉一次性写入的 id，改为 DOM 变化后重新同步（`src/components/BlogToc.tsx`） |
| 首页 11 个区块的眉题/标题/描述硬编码英文 | 渲染文本与 /en 逐块比对 | 新增 `common.home.*` + `src/lib/home-copy.ts`，11 个组件接线（6 个原本连 `locale` prop 都没有） |
| 首页 hero 统计标签、最终 CTA、系列标语硬编码 | 同上 | 同上（`home.heroStats` / `home.finalCta` / `home.series`） |
| Newsletter 区块 5 处英文（**出现在每个页面**） | 同上 | 进 `src/i18n/ui.ts`（客户端文案），6 语言齐备 |
| 空产品线页 "Products Coming Soon" 等 2 处英文（49 个子分类受影响） | 同上 | `common.productLine.*` |
| 搜索页 "Searching… / Loading…"、结果类型徽章英文 | 代码扫描 | `search.json`（客户端组件读 `SearchForm` 现有的 translations props） |
| 图片画廊/滚动条/视频弹窗的读屏标签只有英文 | 代码扫描 | 进 `ui.ts`，给 3 个客户端组件加 `locale` prop + 4 处调用点传参 |
| `aria.json`、`footer.json` 两个命名空间注册了但**从未被读取** | 死代码检查 | 删除（内容与 `common.*` 重复） |
| `siteSettings.siteTagline` 与 `address` 字段声明了 `localized: true`，但每种语言存的都是英文 | CMS 数据抽查 | 按语言回填（页脚与 About 页页头因此变成当地语言） |
| 首页 6 个区块的卡片正文在 5 种语言下都是英文 | 见 §8 | schema 本地化 + json→array + 数据迁移 + 77 条文案 × 5 语言回填 |
| 首页组件调用 `getSiteSettings()` **不传 locale**（数据本地化了页面仍显示英文） | 迁移后页面核对 | 7 个组件 + 2 个页面改为传 `locale` |

**首页剩余英文（2026-09-18 迁移后复核）**：`/ru` 首页只剩 4 个英文文本块，**全部是产品名**
（如 `AGP-160 Flat Die Pellet Machine`）——当时判定为"刻意保留的技术型号"。

> **2026-09-24 更正**：那不是技术型号，而是**翻译缺口**。全部 65 个产品在 6 种语言里存的
> 是同一串英文，首页只是最先被看到的地方。已用 `i18n-product-names.ts` 补齐
> （`AGP-160 Flat Die Pellet Machine` → `Дизельный/бензиновый гранулятор кормов`）。
> 型号代码（`AGP-160`、`H-Type`、`4WD`…）仍然原样保留在产品名里，这是对的；
> 但描述性词汇必须翻译。见 §3.2.1。

也就是说：**目前全站唯一"应该翻译但仍是英文"的只有产品长文 `overviewHtml`**（§3.2.2 说明的取舍）。

---

## 10. 分类与产品去重（2026-09-18，第三轮）

### 10.1 分类归属按抓取数据的 `group`，不按子分类名

`docs/scrape/taxonomy-78sub-2026-09-17.json` 才是分类的依据：每个子分类的 `groups` 字段列出
它承接哪些抓取产品组，`scripts/import-alibaba-catalogue.ts` 用 `group → subcategory` 映射导入。

`scripts/import-alibaba-products.ts`（旧脚本）里有一份**硬编码**的 `NEW_SUBCATEGORIES`，
它按产品名而不是 `group` 落库，于是造出了「Transport Crate」这个**没有任何产品组指向它**的
子分类（taxonomy 里它的 `groups` 是空的），并把运输筐产品塞了进去。实际抓取数据里该产品的
`group` 是 `Breeding Accessory`。**重导前不要再跑那个旧脚本**，否则空壳会再次出现。

处理：`scripts/move-subcategory.ts --from=transport-crate --to=breeding-accessories --apply`
（产品迁移 + 删子分类），`next.config.ts` 补 2 条 308。

### 10.2 重复产品

| 问题 | 处理 |
|---|---|
| `poultry-feeding-and-watering-set` 与 `poultry-feeder-and-drinker-set` 是同货源的两条 listing（同规格、同价格 `US$0.18`），`breeding-accessories` 下出现两张重复卡片 | 保留 `poultry-feeder-and-drinker-set`（首图是产品图，`overviewHtml` 2972 > 2198），用 `scripts/delete-product.ts --apply` 删除另一条，并加 308 |

删完 `products` 43 → 42，sitemap 468 → 462（每条产品 × 6 语言），`solutions.products` 无悬空引用。

### 10.3 49 个空子分类是**刻意保留**的，不要清理

69 个子分类里有 49 个暂时没有产品（taxonomy 里这 49 条 `groups` 为空）。它们**是有意留着的**：
以后会上产品，保留可以让分类结构和 URL 稳定。点进去显示 "Products Coming Soon" 是**预期行为**，
不是 bug——不要因为「空的」就删掉或下线它们。

### 10.4 家禽设备分类卡的顺序与名称

`/products/poultry-equipment` 的卡片此前是任意顺序（所有子分类 `sortOrder` 都是 1，平局），
英文名也与分类稿不一致。现按**分类稿 + 用户指定的插入位置**固定为：

| # | slug | 英文名 |
|---|---|---|
| 01 | `layer-cage` | Layer Cage |
| 02 | `broiler-cage` | Broiler Cage |
| 03 | `chick-cage` | Chick Cage |
| 04 | `quail-cage` | Quail Cage |
| 05 | `automatic-cage` | Automatic Cage |
| 06 | `hatcher-equipment` | Hatcher Equipment |
| 07 | `floor-rearing-equipment` | Flat Breeding Equipment |
| 08 | `cage-accessories` | Cage Accessory |
| 09 | `breeding-accessories` | Breeding Accessory |

- `Quail Cage` 不在分类稿里（分类稿该分类只有 8 项），是更早的种子数据留下的，按用户要求插在 04。
- **slug 一律没动**，URL、sitemap、已收录页面全部不受影响；改的只有 `sortOrder` 与英文 `name`。
- 其它 5 种语言的名称保持原有译法（见 §3.10）。
- 复现命令见 §3.10；**全量重导后需要重跑**。

### 10.5 蛋鸡笼（layer-cage）产品改名

供应商标题是拼贴出来的（`H-Type Layer CageBattery System`、`128-Bird 4-Tier Layer Cage`），
按用户要求改成型号名。`scripts/rename-products.ts` 写入 6 种语言 + 同步 `seoTitle`，slug 未动：

| slug（未变） | 旧名称 | 新名称 |
|---|---|---|
| `48-bird-half-set-layer-cage` | 48-Bird Half-Set Layer Cage | **Half-Set Layer Cage** |
| `h-type-layer-cage-battery-system` | H-Type Layer Cage Battery System | **H-Type Layer Cage** |
| `h-type-layer-cage-96-160-birds` | H-Type Layer Cage 96-160 Birds | **H-Type Layer Cage** |
| `128-bird-4-tier-layer-cage` | 128-Bird 4-Tier Layer Cage | **A-Type Layer Cage** |

⚠️ **遗留问题（待用户决定）**：中间两条现在**同名** `H-Type Layer Cage`，在
`/products/poultry-equipment/layer-cage` 上渲染成两张标题完全一样的卡片（`H-Type Layer Cage`
出现两次）。若要区分，建议 `H-Type Layer Cage (Battery System)` 与
`H-Type Layer Cage 96–160 Birds`——一条命令即可改回（§3.11）。

另外 `128-bird-4-tier-layer-cage` 与 `h-type-layer-cage-battery-system` 的 `description` /
`overviewHtml` **正文完全相同**（都是 "PREMIUM POULTRY CAGE SYSTEMS 🔧…"），是抓取时两条
listing 复制了同一段文案；两张卡片描述一模一样，需要的话要重新撰写其中一条。

---

## 11. 按客户清单补产品（2026-09-18，第四轮）

客户给了一份整理好的清单（53 条 Alibaba 链接、37 个分组）。核对结果与处理：

| 项目 | 结果 |
|---|---|
| 清单条目 | 53 |
| 导入前已在站 | 14（其中 7 个名字已达标，7 个改名） |
| **本次新增** | **39** |
| 站点产品数 | 42 → **81** |
| 有产品的子分类 | 20 → **32**（子分类 69 → 70） |
| 新增子分类 | `vibrating-screen`（Vibrating Screen，农业机械下；分类稿有、站点原先漏建） |

数据与工具：

- 抓取：BrowserSkill 逐条打开 53 条链接取 JSON-LD → `docs/scrape/alibaba-links-2026-09-18.jsonl`
  （标题/SKU/价格/图片/MOQ）。清单里 53 条链接 100% 抓取成功。
- 映射：`docs/scrape/import-names-2026-09-18.json`（sku → 子分类 + 型号级名称），
  导入脚本 `scripts/import-links.ts`（增量、幂等，见 §3.12）。
- 差距报告：`docs/scrape/site-gap-2026-09-18.md`；分类方案：`docs/scrape/import-plan-2026-09-18.md`。

### 11.1 名称统一到「型号级」

客户明确要求：**名字按他们给的清单改，裁到型号级**。Alibaba 标题是关键词堆砌
（`Agricon Welded Wire Mesh Fence Roll Galvanized Steel Square Opening Garden Fence Panel Farm
Boundary Livestock Barrier Metal - Buy Product on Alibaba.com`），因此统一裁成
`Galvanized Welded Wire Mesh Roll` 这类写法（保留容量/层数/功率型号信息）。
已在站的 14 条也一并改名（如 `Chicken Drinking Bowl` → `Automatic Chicken Drinking Bowl`）。

### 11.2 3 个产品换了子分类 → 已补 308

客户的分组里，饮水碗/乳头饮水器/水压调节器属于 **Breeding Accessory**（此前落在
cage-accessories），已随导入迁移。URL 含子分类，所以 `next.config.ts` 补了 3 条 308：

```
/products/poultry-equipment/cage-accessories/<slug>
  → /products/poultry-equipment/breeding-accessories/<slug>
```

### 11.3 详情页与参数（2026-09-18 补做）

客户确认清单已筛过（孵化机/蛋鸡笼不用再合并），并要求补**详情正文 + 参数**。

- 抓取：BrowserSkill 再跑一轮，取每个产品的 `detailData.globalData.product.productBasicProperties`
  （参数表）与 `.module-structure-description`（正文 HTML）→
  `docs/scrape/alibaba-details-2026-09-18.jsonl`（53/53，参数 10–27 项/产品，正文 17–22 KB）。
- 写库：`scripts/import-links.ts` 的**详情补全段**，只填空白字段（空 `specs` / `overviewHtml` /
  `description`），因此重跑不会覆盖人工改过的文案；`--locale=en` 只写英文，其余 5 种语言靠
  `localization.fallback` 回退（与目录里长文 `overviewHtml` 的既定取舍一致）。
- 结果：**81/81 有参数表，75 有正文 + 简介**（8 个产品的 Alibaba 页本身没有正文段）。
- 入库时清洗（`cleanOverview()`）：剥掉供应商样板文字、拆掉指回 `alibaba.com` 的链接、
  给缺 `alt` 的 `<img>` 补 `alt`——否则链接审计（1 条）与图片审计（20 张）会报出来。
- 脏数据复查：全库 `description`/`overviewHtml`/`specs` 里 `Report abuse`、
  `Product descriptions from the supplier`、`Find Complete Details`、
  `Frequently bought together`、字面量 `\uXXXX` 均为 **0**。

### 11.4 遗留

1. **一组同名产品**（客户已确认清单是筛过的，此处仅记录）：
   `Automatic Poultry Feeding Line`：旧的 `automatic-poultry-feeding-line`（cage-accessories，
   老硬编码清单遗留）VS 新导入的 `automatic-poultry-feeding-line-2`（floor-rearing-equipment）。
2. **孵化机 12 个**：客户已确认是筛过的，不做同规格合并。

### 11.5 客户复核后删掉的 4 条蛋鸡笼（2026-09-21）

客户看完 `/products/poultry-equipment/layer-cage` 后点名去掉 4 条，已按
`scripts/delete-product.ts --slug=… --apply` 删除（**删前先 `npx tsx scripts/backup-db.ts`**）：

| 删除的 slug | 备注 |
|---|---|
| `h-type-layer-cage-battery-system` | 旧 listing |
| `h-type-layer-cage-96-160-birds` | 旧 listing |
| `half-set-layer-cage-48-160-birds` | 本次导入的新 listing |
| `a-type-layer-cage-120-birds` | 本次导入的新 listing |

- 两条被 `poultry-farming` 方案引用，脚本已先摘引用再删（不摘会因外键失败）。
- `next.config.ts` 补了 4 条 **308 → 分类页**（没有明确的一对一替代品，所以指向
  `/products/poultry-equipment/layer-cage` 而不是猜一个产品；要改成指向某个保留产品是一行的事）。
- 结果：layer-cage 从 8 个变 **4 个**（Half-Set Layer Cage、A-Type Layer Cage、
  H-Type Layer Cage 3–4 Tiers、H-Type Layer Cage for Poultry）。
- 图片**没删**：24 张变孤儿（保留在媒体库，需要时手动清）。

> `pnpm backup` 在本机 shell 里**把输出吞掉了**（看起来像没跑），用
> `npx tsx scripts/backup-db.ts` 才有回显；两者都会生成 `backups/<时间戳>/`。

### 11.6 名称与「没有简介」的处理（2026-09-21）

客户要求：

1. `H-Type Layer Cage 3–4 Tiers` 与 `H-Type Layer Cage for Poultry` **都叫 `H-Type Layer Cage`**
   → 改映射文件后重跑 `import-links.ts --apply`（映射是名称的单一来源，不要直接改库）。
2. 其中一个「没有简介」→ 查明原因并修好。

**为什么会没有简介**：那个 listing 的 Alibaba 页**根本没有 "Product Description" 模块**
（53 条里有 8 条是这样）。两轮独立抓取都返回「21 项参数、0 描述」，所以不是选择器漏抓。

**修法**：把 `describeFromSpecs()` 从 `import-alibaba-catalogue.ts` **上移到
`src/lib/supplier-text.ts`**（两个导入脚本共用一份），并补一条分支 —— 原来的实现只认笼具
（要求 `animal cage type` 或非通用的 `type`），孵化机的 `type` 是 `Automatic` / `Home` 这类
通用词，于是直接返回 null。现在没有笼具类型时会退回用 `feature` / `application` 当主语、
`capacity` 当规格，例如：

> `4-500Pcs full-automatic digital eggs incubator, 98% hatching rate, new and supplied with a
> 1 year warranty. Send your capacity and site requirements for a matched quotation.`

**只写自己生成的文案**：`import-links.ts` 会重算以
`Send your capacity and site requirements for a matched quotation.` 结尾的简介（模板改进时能
自动刷新），**手写的简介不带这句，永远不会被覆盖**。

结果：**77/77 有简介**；6 个产品仍无正文（供应商页没有正文模块），但都有参数表 + 简介。

### 11.7 映射文件里的 `_removed` 守卫

`import-names-*.json` 有个 `_removed` 段：客户点名删掉的 SKU 必须**同时从 `products` 里移除**，
否则重跑 `import-links.ts` 会把它们**重新建回来**（预演时会显示成 `+ 新建`，注意看这一行）。
同理，**产品换了子分类后，映射里的子分类 slug 也要跟着改**，否则重跑会因为找不到该子分类
而直接报错退出（`subcategory "x" does not exist`）。

### 11.8 畜牧设备的合并与删除（2026-09-21）

客户在 `/products/livestock-equipment` 上要求：

| 操作 | 结果 |
|---|---|
| 删除 `Gestation Crate` 子分类 | 已删（该分类下只有 1 个产品） |
| `Pig Gestation Crate` 移到 `Farrow Pen` | 已迁移，URL 随之变为 `/products/livestock-equipment/farrow-pen/pig-gestation-crate` |
| 删除 `Farrow Pen` 下的 `Adjustable Farrowing Crate` | 已删（5 张图片留作孤儿） |

执行顺序与命令（**先迁移、再删产品、最后删分类**；`move-subcategory` 会拒绝删除非空分类）：

```bash
npx tsx scripts/backup-db.ts                                            # 先备份
npx tsx scripts/move-subcategory.ts --from=gestation-crate --to=farrow-pen --apply
npx tsx scripts/delete-product.ts   --slug=adjustable-farrowing-crate --apply
```

结果：`livestock-equipment` 子分类 8 → **7 个**；`farrow-pen` 保持 2 个产品
（Farrowing Crate、Pig Gestation Crate）。`next.config.ts` 补了 3 条 308（分类页 → 上级分类、
迁移产品 → 新 URL、被删产品 → 分类页）。

### 11.9 正文里的供应商视频已剥除

`cleanOverview()` 现在还会删掉 `<video>` 块和指向 `play.video.alibaba.com` 的 `<source>`：
站的 CSP 是 `default-src 'self'` 且没有 `media-src`，那个播放器**永远加载不出来**，只会留一个
死框。剥除后清洗也才**收敛**（否则每次重跑都会把同一篇文章标记为"待清洗"）。

### 11.10 新建分类后必须补缩略图和简介

`vibrating-screen` 建好后客户发现**卡片没有缩略图、也没有简介**。原因与修法：

| 问题 | 原因 | 修法 |
|---|---|---|
| 没有缩略图 | 69 个子分类的 **CMS `image` 字段全是空的**，卡片一律回退到 `src/lib/images.ts` 的 `subcategoryImages[slug]`；新分类不在这个表里 → 走占位图标 | 往 `subcategoryImages` 加一条 + 放文件到 `public/catalog/products/<slug>.jpg` |
| 没有简介 | 建分类时只写了 name/slug/category/sortOrder（它是全站**唯一**没有 `description` 的子分类） | `reorder-subcategories.ts --describe=…`（见 §3.10） |

⚠️ 注意别加错表：分类页卡片用 `subcategoryImages`（`src/lib/images.ts`，键=**子分类 slug**）；
而 `catalogProductImages`（`src/lib/catalog-images.ts`）键是**产品 slug**，加在那里没用。
缩略图用该分类下产品的实拍图（`media/` 里的原图直接复制到 `public/catalog/products/`）。

顺手清掉了 `subcategoryImages` 里两条已删分类的死条目（`gestation-crate`、`transport-crate`）。

### 11.11 导入后核对（2026-09-18）

| 检查 | 结果 |
|---|---|
| 全站爬虫 | **696/696 页 200**（导入前 462），断链 0、坏资源 0（978 个 GET 校验） |
| title / meta description / canonical | 0 / **0** / 0 缺失 |
| hreflang / canonical 不符 / lang / rtl | 0 / 0 / 0 / 0 |
| h1 / JSON-LD 无效 / JSON-LD 缺失 | 0 / 0 / 0 |
| 图片 alt / 空 src | 0 / 0 |
| 单测 / e2e | 63/63 · 12/12 |

> 两个必踩的坑：
> 1. 导入写完 `seoDescription` / 清洗完 `overviewHtml` 后**立刻**跑爬虫，会照旧报 234 页缺
>    description、20 张图缺 alt —— 那是 300s 数据缓存的旧渲染（§4.7）。必须等 TTL 或
>    **停 server → 删整个 `.next` → 重启**后重爬。
> 2. 删过整个 `.next` 之后第一次跑 e2e，`admin › can navigate to dashboard` 会因为
>    `/admin` 首次现编译而超时失败（单独跑或跑第二遍就 12/12）。属于 dev 冷启动，不是回归。

### 11.12 `livestock-equipment` 卡片排序（2026-09-21）

客户给了 01–07 的顺序，用 `scripts/reorder-subcategories.ts` 落库（见 §3.10）：

```
01 farm-fence         Farm Fence          05 goat-pen              Goat Pen
02 cattle-panels      Cattle Panels       06 rabbit-cage           Rabbit Cage
03 livestock-scale    Livestock Scale     07 livestock-accessories Livestock Equipment
04 farrow-pen         Farrow Pen
```

这个顺序**与 `docs/scrape/taxonomy-78sub-2026-09-17.json` 里 `livestock-equipment` 的书写顺序一致**，
所以将来重跑全量导入不会被改回去。此前 7 个子分类的 `sortOrder` 全是 1（种子数据默认值），
卡片顺序是任意的 —— "排序"到这一步才真正生效。

两个细节：

- 07 的英文名从 `Livestock Accessories` 改成 **`Livestock Equipment`**（照客户给的名字），
  **slug 保持 `livestock-accessories` 不动** —— 改 slug 会让该分类下所有产品 URL 失效。
  其余 5 个语种的译名（`Аксессуары…`/`Accessoires…`/`ملحقات…`）语义仍是"配件"，与客户中文
  标注"牧配件"一致，**未改**。它与父分类同名，这是客户 taxonomy 里就这么写的。
- 改完页面上看到的仍是旧顺序 → 就是 §4.7 的 300s 数据缓存。停 server → 删
  `.next\dev\cache` → 重启后，`/en` 与 `/ar` 两页的卡片顺序均已核对正确，
  7 张卡片的缩略图（`/catalog/products/<slug>.jpg`）与简介也都在。

### 11.13 删除 `H-Type Rabbit Cage`（2026-09-22）

客户给 URL `/en/products/livestock-equipment/rabbit-cage` + "删除 H-Type Rabbit Cage"。
`rabbit-cage` 原本 3 个产品，**名字精确匹配只有 1 个**（id 38 / slug `h-type-rabbit-cage`）；
`3-Tier H-Type Rabbit Cage`、`European-Style H-Type Rabbit Cage` 是型号级名字，**保留**。

流程照 §11.5：`npx tsx scripts/backup-db.ts --no-media`（→ `backups/20260922-154939`）
→ `delete-product.ts --slug=h-type-rabbit-cage --apply` → 补 308 → 停 server + 删
`.next\dev\cache` + 重启。

| 核对 | 结果 |
|---|---|
| 站点规模（`audit-catalogue.ts`） | **75 产品** · 10 分类 · 69 子分类 |
| sitemap | 666 → **660**（少的 6 条 = 1 个产品 × 6 语种） |
| 6 语种 `rabbit-cage` 列表页 | 全 200，各 **2** 张卡片，指向已删 slug 的链接残留 0 |
| 旧 URL ×6 语种 | 全部 **308** → `/:locale/products/livestock-equipment/rabbit-cage` |
| 保留的 2 个产品页（`/en` `/ru` `/ar`）+ `livestock-equipment` + `/en/solutions/livestock-farming` | 200 |

值得记的四点：

1. 它是 solution `livestock-farming` 引用的产品，脚本**先剥引用再删**（5 → 4 个产品），
   否则 Postgres 上会被外键挡住。全站只有 `Solutions` 一个集合 `relationTo: 'products'`
   （改前 `grep "relationTo: 'products'" src/collections` 自查），所以不会有别处悬空引用。
2. 它的 6 张图（media id 223–228）无别处引用，**仍留在媒体库**（脚本从不删媒体）；
   `scripts/translations/*.json` 里也仍有它的 slug 条目 —— 与 §11.6 那几次删除一样不动，
   `i18n-apply-todo.ts` 找不到对应文档会跳过。
3. **不会被 `import-links.ts` 重建**：它的 SKU `1601838925367` 根本不在
   `docs/scrape/import-names-2026-09-18.json` 里（该分类只有 1601838959014 / 1601822874275
   两个 SKU，对应保留的两条），所以 §11.7 的 `_removed` 守卫这次**不需要改映射**。
   它出现在 `docs/scrape/site-gap-2026-09-18.md`「站点有、清单没有的旧 listing」第 55 行 ——
   客户 taxonomy 给 `rabbit-cage` 的两个 group 正好就是保留的那两条，这次删除等于把
   清单外的旧 listing 又清掉一条。
4. ⚠️ 但它**硬编码在** `scripts/import-alibaba-products.ts`（`PRODUCT_MAP` 第 77 行 +
   `NAME_OVERRIDES` 第 126 行）。那个脚本是 2026-09-16 一次性导入用的，里面还留着
   后来被删的 `h-type-layer-cage-96-160-birds` 等多条 —— **别拿它重跑全量**，
   重跑会把这一批旧 listing 全部建回来。要再导入只认 `import-links.ts`（映射文件）
   或 `import-alibaba-catalogue.ts`（子分类）。

> `docs/alibaba-imported-products-urls.txt` 是 2026-09-16 那一批的**快照**，里面还写着已删/已搬走的
> `gestation-crate`、`farrowing-crate`、`h-type-rabbit-cage` —— 别当现状索引看；要现状用
> `audit-catalogue.ts` 或直接看 `/admin`。

### 11.14 `agriculture-machinery` 排序 + Production Line 换图（2026-09-22）

客户给了 1–16 的顺序（前 10 条中英对照，后 6 条只给中文），并让 Production Line 卡片换成
自己车间的实拍图。

**排序**：库里这个分类只有 **12 个子分类**，客户列的 16 条里有 4 条根本不存在（见下表右侧），
所以先把 12 个按客户给的相对顺序落库（`reorder-subcategories.ts --apply`，见 §3.10）：

| 客户 # | 卡片 slug | 备注 |
|---|---|---|
| 1–8 | `pellet-machine` `extruder-machine` `grinding-machine` `grass-chaff-machine` `mixing-machine` `drying-machine` `rice-mill-machine` `production-line` | 与 taxonomy 顺序一致 |
| 9 | — | **库里没有** `machine-accessory`（机器配件） |
| 10 | `screw-conveyor` | taxonomy 里叫 `screw-elevator` / Screw Elevator，库里 slug 与名字是 Screw Conveyor |
| 11 | `threshing-machine` | taxonomy 里叫 `multifunctional-thresher` / Multifunctional thresher（多功能脱粒机） |
| 12 | `peanut-sheller` | |
| 13–15 | — | **库里没有** `corn-peeler`（玉米剥皮机）、`corn-peeler-thresher`（玉米剥皮脱粒一体机）、`corn-thresher`（玉米脱粒机） |
| 16 | `vibrating-screen` | |

改前这 12 个的 `sortOrder` 是 8 个并列 1 + `screw-conveyor`/`peanut-sheller`/`threshing-machine`/
`vibrating-screen` = 167/168/169/170（后 4 个是导入脚本按创建顺序给的），所以卡片顺序同样是乱的。
改后 1–12 连续。核对：`/en` 与 `/ar` 两页卡片顺序、12 张缩略图（HEAD 全 200）、12 条简介全非空。

> 客户中文里的简写按 taxonomy 对齐：「齐压机」=挤压机=Extruder Machine、「草机」=铡草机、
> 「米机」=碾米机、「提升机」=Screw Elevator（原名 Screw Conveyor）、「振筛机」=Vibrating Screen。

**换图**：分类卡片缩略图走 `src/lib/images.ts` 的 `subcategoryImages[slug]`（§11.10），
`production-line` → `public/catalog/products/production-line.jpg`，所以**直接覆盖这个文件**即可，
不用动 CMS（69 个子分类的 CMS `image` 字段全是空的）。客户原图 2289×1831 / 742 KB，
用 sharp 压到 **1200×960 / 204 KB**（与同目录其它卡片图 1000 px 量级一致，不裁剪）：

```powershell
node -e "require('sharp')('src.jpg').rotate().resize({width:1200,withoutEnlargement:true}).jpeg({quality:82,progressive:true}).toFile('public/catalog/products/production-line.jpg')"
```

⚠️ `sharp` 的 `withMetadata({exif:'none'})` 在本机版本会直接抛错（`Expected object for exif`），
去掉这个调用即可 —— 默认就会剥掉元数据。旧图备份在 `backups/replaced-images/production-line.jpg.20260922-163036`。

> 文件名没变 → dev 下 `cache-control: public, max-age=0` + ETag，刷新就能看到新图；
> 若线上 CDN 仍回旧图，把它改名（同时改 `subcategoryImages` 里那条）即可强制失效。

**改名（客户选了"都改，5 语种一起跟上"）**：`screw-conveyor` → **Screw Elevator**、
`threshing-machine` → **Multifunctional Thresher**（**slug 与 URL 都不动**；taxonomy 里本来就叫这两个名字）。
顺带把这三条卡片的模板句简介换成与同分类其它卡片同风格的说明（`peanut-sheller` 只换简介，名字不动）：

| # | slug | en 卡片名 | en 简介 |
|---|---|---|---|
| 09 | `screw-conveyor` | Screw Elevator（ru/fr/es/sw/ar 已按新名重译） | For lifting grain, mash and pellets between machines in a feed line. |
| 10 | `threshing-machine` | Multifunctional Thresher（同上） | For threshing maize, wheat, rice, sorghum, soybean and beans. |
| 11 | `peanut-sheller` | Peanut Sheller（未改） | For shelling dried peanuts out of their husks in one pass. |

多语种名字/简介用新工具 **`scripts/set-subcategory-copy.ts --from=<json> [--apply]`**（§3.13），
这次的值在 `docs/scrape/agri-rename-2026-09-22.json`：

- 为什么不用 `reorder-subcategories.ts --rename=`：那是把名字经 shell 传参，**西里尔/阿拉伯文有乱码风险**，
  而它的回读校验拿同一个（已乱码的）参数比对，会**假通过**。JSON 文件不经 shell。
- ⚠️ **只写 `description` 会失败**：Payload 对 localized 的 `required` 字段是按"本次提交的数据"校验的，
  非默认语种若该字段没有自己的行（只是回退到英文），就报 `Name: This field is required.`。
  脚本的做法是先把该语种**当前显示的名字**读出来一起提交（副作用：名字从"回退"变成"各语种各存一份"，显示值不变）。
- 客户列的 16 条里有 4 条（机器配件 / 玉米剥皮机 / 玉米剥皮脱粒一体机 / 玉米脱粒机）**库里没有**，
  客户明确选择**先不建**（等有产品再加）。要建时按 §11.10 补齐简介 + 缩略图，别建裸分类。
- 这个分类里名字仍是"英文回退"的还剩 `vibrating-screen`（各语种都显示 Vibrating Screen），
  客户没要求改，保持现状。

### 11.15 产品页 `<title>` 品牌重复（2026-09-22，已修）

**症状**：75 个产品页的浏览器标题是 `A-Type Layer Cage | Agricon Agricultural Equipment | Agricon`
—— 品牌出现两次。分类页、子分类页、博客、方案页都正常。

**原因**：`(frontend)/[locale]/layout.tsx` 设了 `title.template: '%s | Agricon'`，Next 会把页面
`generateMetadata` 返回的字符串**一律**套进这个模板（页面无法声明"绝对标题"）；而产品页直接返回
库里的 `seoTitle`，`seoTitle` 本身又以 `| Agricon Agricultural Equipment` 结尾（75 条 × 6 语种全一样，
未翻译）。两边各带一份品牌 → 拼出重复。

**修法**（`src/app/(frontend)/[locale]/products/[category]/[subcategory]/[product]/page.tsx`）：
`<title>` 用剥掉尾部品牌后的值，让模板成为品牌的唯一来源；**`og:title` 仍用原始 `seoTitle`**
（分享卡带全称是好事，OG 不走 template）：

```ts
const pageTitle =
  (product.seoTitle || product.name)?.replace(/\s*\|\s*Agricon( Agricultural Equipment)?\s*$/i, '') ||
  product.name
```

> 库里 `seoTitle` 的后缀**没有清理**：`og:title` 要用它。以后若有人把 `title.template` 去掉，
> 产品页标题会退回带全称 —— 那时再决定是清库还是清代码。
> 全站只有 `Products` 集合有 `seoTitle` 字段（`grep seoTitle src/collections` 可自查），
> 所以别处不会有同样的问题。

**核对**：抓 sitemap 里全部 **450 个产品页 URL**（75 产品 × 6 语种）→ 标题缺失 0、品牌重复 0。
`pnpm tsx scripts/audit-catalogue.ts` 之外，这类"模板叠加"问题只能靠抓渲染后的 `<title>` 发现。

**同时**：`poultry-equipment/quail-cage` 是全站最后一个简介仍为模板句「X — agricultural equipment
for modern farms.」的子分类，已按同分类其它卡片的两句式重写（6 语种，`docs/scrape/quail-cage-blurb-2026-09-22.json`
→ `set-subcategory-copy.ts --apply`）。此后 **69 个子分类简介全部非模板句**（`/api/subcategories`
按 `description -match 'agricultural equipment for modern farms'` 复查 = 0 条）。

### 11.16 `agriculture-machinery` 第二轮删减 + 2 处改名（2026-09-23）

客户按子分类逐个看了卡片，给定名单：删 10 个产品、2 个改名。一次性批量做
（`scripts/tmp-bulk-changes-20260922.ts`，先 dry run 后 `--apply`；脚本用完即删，逻辑与
`delete-product.ts` 相同：先剥 `solutions.products` 引用再删）。

**删除的 10 个产品**（全部在 `agriculture-machinery`，URL 永久消失，`next.config.ts` 已补 308 →
各自子分类页；唯一例外见下）：

| 子分类 | 删除的 slug |
|---|---|
| pellet-machine | `diesel-gasoline-feed-pellet-mill` |
| grinding-machine | `diesel-disk-mill-grinder-800kg-h` |
| grass-chaff-machine | `large-chaff-cutter-5t-h`、`4-8t-multi-function-chaff-cutter`、`small-chaff-cutter-400kg-h` |
| mixing-machine | `feed-mixing-and-grinding-machine` |
| threshing-machine | `diesel-corn-thresher-8hp`、`corn-peeling-and-shelling-machine`、`bean-thresher-200kg-h` |
| peanut-sheller | `electric-peanut-sheller` |

> 混淆提醒：`mixing-machine` 里删的是名字**恰好等于** `feed-mixing-and-grinding-machine` 的那条
> （id=25）；同名的 `feed-mixing-and-grinding-machine-250-2000kg`（250–2000kg 型号）是另一个产品，
> **保留了**。

**改名 2 条**（客户点名的新标题；`name` 和 `seoTitle` 一起改，6 个语种全写同一英文值 —— 产品英文名
跨语种保持英文的惯例，见 §3.11）：

| 产品（slug 不变） | 原名 | 新名 |
|---|---|---|
| `agp-160-flat-die-pellet-machine` | AGP-160 Flat Die Pellet Machine | **Pellet Mill Diesel/Gasoline Feed** |
| `dgp-series-floating-fish-feed-extruder` | DGP Series Floating Fish Feed Extruder | **Floating Fish Feed Extruder** |

`seoTitle` 写的是**不带品牌后缀**的裸名 —— 模板 `'%s | Agricon'` 会补品牌（§11.15），
`og:title` 从此显示 `Pellet Mill Diesel/Gasoline Feed`（没有 `| Agricon Agricultural Equipment`
全称了，可接受）。

**唯一的重定向到产品页**：`diesel-gasoline-feed-pellet-mill` →
`pellet-machine/agp-160-flat-die-pellet-machine`。客户把两条视为同一台机器（柴油/汽油款与
AGP-160 是同一个），只留一条并冠以合并后的名字；其余 9 条按惯例指向子分类页。

**核对**（2026-09-23）：10 条旧 URL 全部 `308` 且 `Location` 正确；改名产品页 `<title>` =
`Pellet Mill Diesel/Gasoline Feed | Agricon`、`Floating Fish Feed Extruder | Agricon`，H1 同步。
备份：`backups/20260923-164901`（DB only）。产品总数 75 → **65**。

### 11.17 Plucker Machine 换封面图（2026-09-23）

客户上传 `Plucker_MainPic_12.jpg`（4 台不同规格脱毛机并排的厂房照），要求更换
`slaughter-equipment` 里 Plucker Machine 的封面，且"所有用到这张图的地方"都要换。

**引用关系**（换图前先查清，`grep plucker-machine src/`）：
`plucker-machine` 这个 slug 的封面路径 `/catalog/products/plucker-machine.jpg` 出现在 **3 处，
但全部指向同一个文件** ——
- `src/lib/catalog-images.ts` 封面映射（产品页主图）
- `src/lib/images.ts` 子分类卡缩略图（`/en/products/slaughter-equipment` 的 Plucker Machine 卡）
- `src/lib/catalog-images.ts` 详情画廊第一张（plucker-machine-2/3/4.jpg 是另外三张图，未动）

所以**只需覆盖一个文件**，三处同时生效；CMS `media` 表不涉及（封面不走 Payload media，见 §3.6）。

**操作**（与 §11.14 Production Line 换图同款流程）：

```powershell
Copy-Item public\catalog\products\plucker-machine.jpg backups\replaced-images\plucker-machine.jpg.<时间戳>
node -e "require('sharp')(<新图>).rotate().resize({width:1200,withoutEnlargement:true})
  .jpeg({quality:82,progressive:true}).toFile('public/catalog/products/plucker-machine.jpg')"
```

新图 1000×1000（`withoutEnlargement` 不放大），146 KB。备份：
`backups/replaced-images/plucker-machine.jpg.20260923-170526`（旧图 635×424）。

**核对**：`GET /catalog/products/plucker-machine.jpg` 的 SHA-256 与磁盘文件一致；子分类页与
`stainless-steel-chicken-plucker` 产品页均 200。`/catalog/**` 是静态文件带 ETag，浏览器刷新即见新图，
无需清缓存。

### 11.18 首页第 2–5 屏：产品卡一律链接到具体产品（2026-09-23）

**症状**：首页第 2–5 屏（`ProductSeriesScreens` 的 4 个系列整屏）的产品卡点进去落在**二级分类页**
甚至分类页，而不是具体产品。

**原因**（`src/components/home/ProductSeriesScreens.tsx`）：
- 22 张策展卡里 17 张 `href` 为空或只写到子分类，`resolveCardHref` 的规则 2/4/5 把它们落到
  子分类/分类页；
- 更糟的是 3 个显式 href 指向**早已不存在的产品 slug**（`automatic-h-type-chicken-cage` 等），
  规则 1 匹配失败后同样退化成子分类页 —— 即"写了链接也白写"。

**修法**：
1. 22 张卡的 `href` 全部改写为 `<子分类>/<产品slug>`，逐一对照 2026-09-23 线上目录核实。
   `resolveCardHref` 的校验逻辑保留：产品将来被删时自动退回子分类页，**不会 404**。
2. 左侧系列大图原来链到首个子分类，改为链到系列分类页（它是系列入口，不是产品卡）。
3. 顺手修了第 6+ 屏 `FeaturedProducts` 的真 bug：`getProducts` 是 depth 1，`subcategory.category`
   只是 id，导致 `categorySlug` 恒为空，兜底 `|| 'poultry-equipment'` 把所有非家禽产品都塞进
   `poultry-equipment/xxx` 的错误 URL（靠路由按 slug 匹配才"碰巧 200"，分类段是错的）。
   改用现成的 `resolveProductCategorySlug()` 解析，并删掉误导性兜底；解析失败的卡直接不渲染。

**需要知道的两个例外**（整个 `livestock-equipment` 系列没有可对应的产品页，只能先落二级分类，
等有产品再升级为产品链接）：
- "Livestock Fence" → `/products/livestock-equipment/farm-fence`
- "Sheep Pen" → `/products/livestock-equipment/goat-pen`

**核对**（2026-09-23）：抓渲染后的首页，`/en/products/**` 链接中产品级 32 条全部 200、
意外落到子分类的 0 条；`tsc --noEmit` 0、`eslint` 0、集成测试 67/67。
（另注意：产品路由按 slug 匹配、不校验分类归属，所以错误分类段的 URL 也会 200 —— 
判断链接对错要看 URL 分类段，不能只看状态码。）

## 12. 生产库目录同步 + 全站多语言补齐（2026-09-24，第五轮）

### 12.1 背景：生产库与本地库是两个数据集

**症状**：线上只有 **43 个产品**（本地 65），且除分类名之外几乎所有 CMS 内容（产品简介、
SEO、功能点、参数、图片 alt、博客、案例、FAQ 分类、方案、子分类）**只有英文**；产品页长文
`overviewHtml` 六语种全是英文。

**根因**：本地 SQLite 一直是唯一在维护的数据集，生产 Postgres 从未被同步过 ——
既不是代码问题，也不是缓存问题。另外生产 **schema 只能靠 migration**：`@payloadcms/db-vercel-postgres`
的 push 被硬关掉（`connect.js` 里 `NODE_ENV !== 'production'` 才 push），所以配置里新声明的表
不会自动出现在生产（那次 500 就是缺 14 张表，见 `20260924_120000_add_missing_production_tables.ts`）。

**方向**：以**本地为准**补生产。生产独有的 11 个产品是被取代的旧 listing（每一个都在
`next.config.ts` 里有 308），已确认后删除。

### 12.2 两个同步脚本（都在 `scripts/`）

| 脚本 | 通道 | 用途 |
|---|---|---|
| `sync-catalogue-to-prod.ts` | Payload Local API | 媒体、子分类、产品、归属迁移、内容、杂项、删除（`--steps=` 可分段跑） |
| `sync-locales-sql.ts` | 直连 SQL（`pg` + `@libsql/client`） | 上面「内容」部分的快速版；同样幂等、可续跑 |

`sync-locales-sql.ts` 存在的原因：**经 Payload API 每次 update 都要往返一次 Neon**
（ap-southeast-1），全量 855 次文档更新 + 约 9000 次数组行更新要**一个多小时**；
直连 SQL 几分钟就完成。两者结果等价，改完本地后用 `sync-locales-sql.ts` 推生产即可。

### 12.3 跨库关联一律不能用 id

两库的 `media` / `categories` / `subcategories` / `products` 编号**各自独立**（生产上还有
Rollback 留下的空洞），所以：

- 产品/分类/子分类 → 按 `slug` 匹配
- 图片 → 按 `filename` 匹配
- `faq_categories` **没有 slug 列** → 按英文名匹配

**产品数组行（`images`/`features`/`specs`/`faqs`）两库也不共享 id**：Payload 数组行 id 在
Postgres 是 24 位十六进制字符串（列类型 `character varying`），在 SQLite 有时是整数。
所以数组行按 **`_order` 位置**配对 —— 两边出自同一次导入；长度不一致时**报出来而不是猜**。

### 12.4 三个必须知道的坑

1. **`payload.create` 不接受数组行带 `id`** —— 传了报 `The following field is invalid: id`，
   而且**父文档已经写进去了**（嵌套数组留空）。所以"失败就删掉父文档重跑"不是无害的：
   会连带删掉已经写好的其它字段。首次导入 33 个产品时踩过。
2. **`Number()` 会把 Postgres 的数组行 id 变成 `NaN`** —— 进而 `RangeError: Only finite
   numbers …`。两库数组行 id 类型不同（见 12.3），不要做数值化假设。
3. **这个 Neon 端点在持续写入下会掉连接**（`Connection terminated unexpectedly`）。
   `sync-locales-sql.ts` 的做法：每个查询重试 + 重连（最多 6 次），并且
   **每个 product+array 块在五语种齐备时跳过**，所以中断后重跑是**续跑而不是重跑**。

### 12.5 长文 `overviewHtml` 的多语言（新增译文，不是同步）

`overviewHtml` 是产品页正文，**本地库原本也只有英文**，所以这一步是**新翻译**。
60 篇文章共 963 段正文，去重后只有 **542 条不同字符串**（供应商样板文字最多重复 28 次），
因此按**唯一字符串**翻译：样板段落只翻一次，28 处出现完全一致。

```bash
pnpm tsx scripts/overview-batches.ts        # 542 条按字符数均分成 6 批（_todo/ 已 gitignore）
#   译者/LLM 产出 _todo/overview-tr/out/<lang>__batchNN.json
pnpm tsx scripts/assemble-overview.ts       # 校验 key 对齐 → <lang>-overview-unique-adopted.json
                                            #            → 按 map 展开成 <lang>-overview.json
pnpm tsx scripts/i18n-overview.ts --check   # 结构校验（见下）
pnpm tsx scripts/i18n-overview.ts --apply   # 写本地库
# 再用 sync-locales-sql.ts 推生产
```

`i18n-overview.ts` 把 HTML 拆成「标签 / 文本」token 序列，**只翻文本 token**，再按原序列
拼回 —— 标签因此是**逐字节不变**的。`--check` 断言：token 数一致、标签序列一致、
重组英文原文能**逐字节还原**。俄语此前已完成 447/542，本次只补最后 95 条。

> ⚠️ `i18n-overview.ts --apply` 写的是**本地库**（用 `payload.config.ts`）。
> 推生产必须再跑 `sync-locales-sql.ts`（加了 `productOverview` 段；
> 它单独成段是因为 `overviewHtml` 很大，且不能和 products 的续跑判据共用第一列）。

### 12.6 结果（2026-09-24）

| 项目 | 同步前 | 同步后 |
|---|---|---|
| 产品 | 43 | **65**（= 本地） |
| 媒体 | 259 | **454**（= 本地，上传 195） |
| 子分类 | 70 | **69**（删 2 个空分类、建 `vibrating-screen`） |
| 博客 / 案例 / FAQ分类 / 方案 / 分类 | 3 / 12 / 6 / 6 / 10 | 一致 |
| 产品 name / desc / seoTitle / seoDesc | 仅 en | **65 × 6 语种** |
| 图片 alt / 功能点 / 参数 | 仅 en | **357 / 185 / 1318 × 6 语种** |
| `overviewHtml` | 仅 en（60 篇） | **60 篇 × 6 语种** |

核对：六语种各 13 条主要路由 **78/78 全 200**；全部 API 200；11 条旧产品 URL 与
2 条旧子分类 URL 全部 **308** 且 `Location` 正确；sitemap **1068** 条、产品 URL 65×6、
`/search` 0 条。

### 12.7 ⚠️ 生产域名会被 Rollback「钉住」

**症状**：push 后新部署 READY，但 `www.agricon.cn` 的 sitemap 一直是**旧数据**
（65 个产品却只列 43 条），而产品页却是新的。

**原因**：Vercel 的 **Instant Rollback 会把生产域名钉在回滚的那个部署上**，
之后的新生产部署**不会自动收回域名**。动态路由（`ƒ`）每次查库所以看着是新的，
而 `/sitemap.xml` 是**构建期预渲染**（`○`，`revalidate 1h`），于是冻在旧构建的数据上。

**修法**：用 API 把三个域名重新指到最新部署：

```bash
curl -X POST "https://api.vercel.com/v2/deployments/<dpl_uid>/aliases?teamId=<orgId>" \
  -H "Authorization: Bearer $VERCEL_TOKEN" -H 'Content-Type: application/json' \
  -d '{"alias":"www.agricon.cn"}'          # 另两个：agricon.cn、agricon-payload.vercel.app
```

**自查**：`GET /v4/aliases?projectId=…` 看域名指向哪个部署的 URL；
或对比 `agricon-payload-git-main-agricon.vercel.app`（总是指向最新的）与生产域名。
**别只看页面能打开就以为发版成功** —— 预渲染的页面（sitemap/robots/icon）才暴露问题。

### 12.8 ⚠️⚠️ `payload_migrations` 里的 `dev` 行会让生产迁移**全部静默跳过**

这是本轮挖出的**最危险**的一个坑，和 12.1 那次 500 是同一个病根。

**症状**：本地跑 `payload migrate` 会弹一个交互式提问：

```
? It looks like you've run Payload in dev mode, meaning you've dynamically pushed changes to
  your database. If you'd like to run migrations, data loss will occur. Would you like to
  proceed? » (y/N)
```

**原因**（`@payloadcms/drizzle/dist/migrate.js`）：

```js
if (migrationsInDB.find((m) => m.batch === -1)) {
  const { confirm } = await prompts({ … }, { onCancel: () => { process.exit(0) } })
  if (!runMigrations) process.exit(0)
}
```

生产库的 `payload_migrations` 里有一行 **`name='dev', batch=-1`** —— 建库初期有人在生产上
跑过 dev push 留下的标记。**只要这一行在，每次 `payload migrate` 都会走这个 prompt。**

**为什么在生产上是致命的**：`vercel-build` 里是 `payload migrate`，而 Vercel 构建**没有 TTY**。
`prompts` 读不到输入就触发 `onCancel` → **`process.exit(0)`** —— 退出码 0，构建继续，
**迁移一条都没跑**。也就是说：

> 只要这行 `dev` 还在，any 提交的 migration 都不会在生产生效，而且**不会有任何报错**。

这正是 12.1 那 14 张表缺失的原因之一：migration 写了、注册了，却从来没被执行过。

**修法**（一次性，之后 `payload migrate` 不再交互）：

```sql
DELETE FROM payload_migrations WHERE batch = -1 AND name = 'dev';
```

**验证**：`SELECT name, batch FROM payload_migrations ORDER BY batch` 应当只有
`batch >= 1` 的行；`payload migrate` 应当**直接输出** `Migrating: …` 而不提问。

**以后每次加 migration，都要真的去看构建日志里有没有 `Migrated:` 那两行** ——
没有就是被这里挡住了。

### 12.9 六个「声明了索引但库里没有」的列（本轮补齐）

`src/collections/*.ts` 给 6 个筛选列标了 `index: true`（注释写着
"Payload auto-indexes unique/relationship/timestamp fields but not plain checkbox filters"），
但**两个库里都没有这些索引**：

| 表 | 列 | 索引名 |
|---|---|---|
| `blog_posts` / `case_studies` / `downloads` / `faqs` / `videos` | `published` | `<table>_published_idx` |
| `inquiries` | `status` | `inquiries_status_idx` |

`published` 是**每一次公开读取**都会筛的列（`lib/payload.ts`、`sitemap.ts`）；
`inquiries.status` 是唯一会无限增长的表，后台列表按它排序筛选。

**两个原因叠加，所以哪边都没有**：

1. 生产拿不到 —— 12.8 那个 prompt 让迁移静默跳过；
2. 本地也拿不到 —— **`.env` 里写着 `PAYLOAD_PUSH_SCHEMA=false`**，
   `payload.config.ts` 把它变成 `push: false`，所以本地 `pnpm dev` **根本不推 schema**。

**修法**：新增 migration `20260925_160000_add_filter_indexes`（已注册、已应用 → batch 2）。
命名沿用 Payload 自己的 `buildIndexName` 规则（`<table>_<column>_idx`），
这样将来生成的 migration 会认出它们、不会重复建。

本地 SQLite 要单独建（迁移文件是 Postgres 方言，本地不走迁移），
用同样的名字执行 `CREATE INDEX IF NOT EXISTS` 即可 —— 本次本地索引 147 → **153**。

> 教训：**`index: true` 在配置里不代表库里真有索引。** 自查方法：
> `SELECT indexdef FROM pg_indexes WHERE indexdef ILIKE '%(published)%'`，
> 或对比 `src/collections/*.ts` 里 `index: true` 的字段清单与 `pg_indexes`。
