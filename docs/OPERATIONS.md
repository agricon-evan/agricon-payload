# Agricon 站点 · 运维操作手册（写给下一个 Agent）

> 本手册面向**接手的 Agent/开发者**：看完即可安全地做增删改查、本地开发、部署、迁移与排障。
> API 级增删改查的详细示例见仓库根目录 **`AGENT-API.md`**（REST/GraphQL/Local API、认证、字段结构）。
> 本手册聚焦：**环境、部署、数据迁移、媒体、以及全项目最贵的几个坑**。

---

## 0. 一页总览

| 项 | 值 |
|---|---|
| 站点 | https://agricon-payload.vercel.app（生产） |
| 仓库 | https://github.com/agricon-evan/agricon-payload（public，默认分支 `main`） |
| 技术栈 | Payload CMS 3.82.1 + Next.js 16.2.7（Turbopack）+ React 19 + pnpm 11.20.0 + Tailwind 4 |
| 集合数 / 语言 | 17 个集合；6 语种 en/ru/fr/es/sw/ar（阿拉伯语 RTL） |
| 开发库 | SQLite（`agricon-dev.db`，本地） |
| 生产库 | Neon Postgres（`POSTGRES_URL`） |
| 媒体存储 | Vercel Blob（store `wqqdmdni7x1vusvs`） |
| 性能监控 | Vercel Speed Insights + Web Analytics（`<SpeedInsights/>`、`<Analytics/>` 注入在前台根布局 `src/app/(frontend)/layout.tsx`，共用 `/_vercel/insights/script.js` 路由） |
| 部署 | Vercel **原生 Git 集成**：push `main` → 自动构建部署（无需任何手动步骤） |
| 数据访问三层 | Admin 后台 / REST+GraphQL API / Local API（详见 AGENT-API.md） |

关键文件：
- `src/payload.config.ts` — 集合注册、DB adapter、Blob 存储插件、i18n、admin 组件
- `src/collections/*.ts` — 17 个集合定义
- `src/app/(payload)/*` — admin 与 `/api/*` 路由；`src/app/(frontend)/*` — 前台页面
- `scripts/` — 20+ 个数据导入/修复脚本（是 Local API 用法的最佳参考）
- `.github/workflows/ci.yml` — lint/typecheck/build

---

## 1. 环境变量（重要）

生产环境变量全部托管在 Vercel 项目里（Settings → Environment Variables），**不要写进代码/仓库**。

| 变量 | 用途 | 备注 |
|---|---|---|
| `POSTGRES_URL` | Neon Postgres 连接串 | Vercel 里是**不透明 token 形态**（`eyJ...`），可用但别手抄 |
| `PAYLOAD_SECRET` | Payload 加密密钥 | 同上，不透明形态，正常 |
| `BLOB_READ_WRITE_TOKEN` | Blob 读写 token | ⚠️ 由 Vercel 自动管理，**不要去改它**（会被还原）；见 §6 坑② |
| `STORAGE_VERCEL_BLOB_BASE_URL` | **媒体 404 修复关键** | `https://wqqdmdni7x1vusvs.public.blob.vercel-storage.com`，**别删** |
| `NEXT_PUBLIC_SITE_URL` | 前台/SEO 用的站点 URL | `https://agricon-payload.vercel.app` |
| `PAYLOAD_PUSH_SCHEMA` | 生产**保持不设置** | 不设 = 启动时自动 push schema（当前 schema 来源）；设 `false` 则只走 migrations |
| `DATABASE_URI` | 本地 SQLite 路径 | 默认 `file:./agricon-dev.db`，本地 dev 用 |
| `SMTP_HOST/PORT/USER/PASS/FROM` | 邮件（可选） | 不配则邮件仅打日志 |

> 本地调试：复制 `.env.example` → `.env`（gitignore 已忽略 `.env*`）。

---

## 2. 本地开发

```bash
pnpm install          # 必须用 pnpm（packageManager: pnpm@11.20.0）
pnpm dev              # http://localhost:3000（admin 在 /admin）
pnpm build            # 本地构建（= next build）
pnpm test:e2e         # 本地 e2e（依赖本地库有内容，见 §7）
pnpm backup           # 备份本地 SQLite（scripts/backup-db.ts）
pnpm lint / pnpm exec tsc --noEmit   # 静态检查
```

- 本地库 `agricon-dev.db` **已含全部内容**（3 篇博客、43 个产品、259 个媒体、6 语种），改 UI/前端可直接基于它开发。
- 改完 collection 字段后运行 `pnpm payload generate:types` 重新生成类型（见 §6 坑①）。
- ⚠️ 本机沙箱环境若遇到 `pnpm` 报 `[ERROR] [safe-delete] ... trash operation`，是**沙箱限制**（正常终端没有），可换 PowerShell/真实终端运行。

---

## 3. 增删改查（CRUD）速查

三种等价方式，按场景选：

| 方式 | 适用 | 参考 |
|---|---|---|
| **Admin 后台** `/admin` | 日常编辑、看图改字 | 各集合列表/编辑页；`siteSettings` 首页数组字段用表格编辑器 |
| **REST API** `/api/<slug>` | 脚本/自动化/远程 | `AGENT-API.md` §3（含 `?locale=ru` 多语言、上传图片） |
| **GraphQL** `/api/graphql` | 前端/查询 | `AGENT-API.md` §4 |
| **Local API**（`payload.find/create/...`） | 批量脚本 | `AGENT-API.md` §1；`scripts/*.ts` 全是模板 |
| **直接操作数据库** | 兜底（迁移/修复） | 见 §4；⚠️ 有坑 |

**写操作都需要登录**（Admin 登录 或 `POST /api/users/login` 拿 JWT 后带 `Authorization: JWT <token>`）。
17 个集合 slug 与读写权限见 `AGENT-API.md` §2。

### 直接操作数据库的硬规则（违反会出数据事故）

1. **永远不要用 `payload.create({..., id})` 传 id** —— Payload 会忽略传入 id、重新分配序列号，
   导致所有关系错乱。迁移/复制必须用**原生 INSERT 保留 id**（见 §4）。
2. Payload 表名**无前缀**：`categories`、`products`、`site_settings`…（不是 `payload_categories`）。
3. 关系表 `*_rels`（多对多）、本地化表 `*_locales`（每语言一行）、版本表 `*_versions` / `_site_settings_v`：
   直接改库时这些表都要同步。
4. richText 字段（博客正文、FAQ 答案）是 **lexical JSON**，不是纯文本；构造方式参考 `scripts/seed-fallback-content.ts`。

---

## 4. 数据迁移 / 备份（SQLite ↔ Postgres）

**已验证的方法论**（2026-08 完成 48 张表全量迁移，源=SQLite 目标=Neon，独立比对一致）：

1. **直接表级复制**，不要用 Payload Local API（见 §3 规则 1）。两个 adapter 表名一致、无前缀。
2. 语句形态（幂等、可断点续跑）：
   ```sql
   INSERT INTO target.<table> (...) VALUES (...) ON CONFLICT (id) DO NOTHING;
   ```
3. **Neon 会杀空闲连接**：pg Client 会发未处理的 `error` 导致进程 exit 1。
   处理：每个 chunk（100 行）新建 Client + `pg.on('error', ()=>{})` + 按表重试 + `START_TABLE/STOP_TABLE` 断点续跑。
4. 复制完用 `setval(pg_get_serial_sequence('<table>','id'), MAX(id))` 重置序列，否则后续新增会撞 id。
5. 迁移后必须**独立比对**：源与目标逐表 COUNT(*)（以及抽样行）比对。

**备份**：`pnpm backup`（备份本地 SQLite 到 `backups/`）。生产库备份 = Neon 控制台的导出/快照。

---

## 5. 媒体文件（Vercel Blob）

- 上传路径：Admin 后台或 `POST /api/media`（multipart）→ 二进制写入 Blob，`media.url` 自动指向
  `https://wqqdmdni7x1vusvs.public.blob.vercel-storage.com/<filename>`。
- 本地 `media/` 目录（326MB）是**源文件**，已 gitignore，不作为线上存储。
- 前台访问媒体统一走 `/api/media/file/<filename>`（Payload static handler 从 Blob 取数）。
- **如果直接改库**（绕过 API）：必须同时把二进制 `put` 到 Blob 并更新 `media.url`，否则前台 404。
- 批量上传示例见 `scripts/import-alibaba-products.ts`、`scripts/fix-missing-detail-images.ts`。

---

## 6. 部署

### 6.1 生产部署（唯一入口 = push main）

Vercel **原生 Git 集成**已生效（project `agricon-payload` ↔ repo `agricon-evan/agricon-payload`，生产分支 `main`）。

```bash
git push origin main   # 触发 Vercel 自动构建 + 部署，无需其他步骤
```

构建流程（`package.json` 的 `vercel-build`，**顺序不要改**）：
`payload generate:types` → `payload migrate`（无迁移文件=no-op）→ `next build`（Turbopack + 类型检查）。

> 注意：仓库里**没有** deploy.yml / 任何 Actions 部署工作流 —— 已删除，避免与原生集成重复部署。

### 6.2 查看部署状态 / 日志

```bash
# 部署列表（state: READY/ERROR/BUILDING）
curl -s "https://api.vercel.com/v6/deployments?projectId=prj_on0Q6uHEzzsyOrFLJrx4w8INvQlx&teamId=team_QndIkcpNjTARzSsZyENDs8kQ" \
  -H "Authorization: Bearer <VERCEL_TOKEN>"

# 单个部署构建日志（最后 1000 条事件）
curl -s "https://api.vercel.com/v2/deployments/<DEPLOYMENT_UID>/events?limit=1000&teamId=team_QndIkcpNjTARzSsZyENDs8kQ" \
  -H "Authorization: Bearer <VERCEL_TOKEN>"
```

（`<VERCEL_TOKEN>` = 用户的 Vercel API token，向用户索取，勿写进仓库。）

### 6.3 手动部署（备用）

```bash
npm i -g vercel   # 或临时目录安装
cd <repo> && vercel deploy --prod --token <VERCEL_TOKEN>
```

### 6.4 CI（GitHub Actions，`ci.yml`）

push/PR 触发：`pnpm install → generate:importmap/types → tsc → lint → build`，全绿。
- e2e 步骤**有意移出 CI**：e2e 需要**有内容的数据库**（博客文章、测试用户），CI 的空库跑不了；本地 `pnpm test:e2e` 跑（webServer 已修好：playwright.config.ts 里 webServer 显式设 `NODE_OPTIONS=--no-deprecation`，避免继承 tsx 预载导致 pnpm 报 `.pnpmfile` 错误）。

### 6.5 部署后验证清单

```bash
for u in / /en /ru /admin /api/graphql /api/media/file/g_00.png /en/blog/layer-cage-guide; do
  echo "$u -> $(curl -s -o /dev/null -w '%{http_code}' https://agricon-payload.vercel.app$u)"
done
```
首页 `/` 应 307（i18n 跳转），其余应 200；媒体应是真实图片（`Content-Type: image/*`）。

---

## 7. 已知坑与排查（最贵的经验，务必先看）

1. **`src/payload-types.ts` 被 .gitignore 忽略**（.gitignore 第 12 行）。
   → Vercel **git 构建**（纯 checkout，无生成步骤）会缺类型文件 → `next build` 类型检查报
   “Parameter implicitly has an 'any' type”（博客/产品页）。**已通过 vercel-build 里的 `payload generate:types` 修复**，
   改集合字段后：本地跑 `pnpm payload generate:types` 并确认构建通过。**不要把 generate:types 从 vercel-build 里删掉。**
2. **Vercel 的 `BLOB_READ_WRITE_TOKEN` 是不透明 token**（`eyJ...`，Vercel 自动管理、会还原任何手动修改）。
   Payload 的 Blob adapter 用正则 `^vercel_blob_rw_(storeId)_...` 解析 storeId，解析不出来 → baseUrl 变成
   `https://undefined...` → 媒体 404。**修复 = `STORAGE_VERCEL_BLOB_BASE_URL` 环境变量**（已设置）。
   不要升级 `@vercel/blob`（2.8.0 的 `resolveBlobAuth` 仍按 `_` 切分 token，不支持不透明 token）。
3. **GitHub Actions：`if:` 条件里引用 `secrets.X`** → 工作流以 **0 个 job 静默失败**。
   把密钥检查写进 run 脚本里，不要放 `if:`。
4. **Neon 空闲连接被杀** → 长任务脚本要按 chunk 新建 Client + 吞掉 pg error（见 §4）。
5. **本机 pnpm 在 D: 盘报 `[safe-delete] ... trash operation` 错误**（D: 是虚拟盘/沙箱限制，
   trash 移入回收站必失败；在 C: 盘跑 pnpm 正常）。
   绕过方法：装依赖时在 C: 盘临时目录放 `package.json` + `pnpm-workspace.yaml` + `pnpm-lock.yaml`，
   跑 `pnpm install --lockfile-only` 生成/更新锁文件后拷回；node_modules 里的包可用
   `node node_modules/xxx/bin/xxx` 直接跑（本会话 Speed Insights 即用此法安装）。
6. **前端是 `force-dynamic`**：页面不在构建期查库，所以"无库构建"可行；生产 schema 靠启动时 push（`PAYLOAD_PUSH_SCHEMA` 不设）。
6. **本机沙箱怪癖（不影响功能）**：`git status -sb` 显示 `## master...origin/main [gone]` —— 沙箱对
   `refs/remotes/` 写入静默拦截，纯显示问题；`git ls-remote` 可验证远端一致。真实终端无此问题。
7. **CI e2e 移出**：原因见 §6.4。`tests/helpers/seedUser.ts` 是 e2e 建测试用户的工具。

---

## 8. 凭据 / 资源清单（向用户索取，勿入库）

| 资源 | 标识 |
|---|---|
| Vercel 项目 | `prj_on0Q6uHEzzsyOrFLJrx4w8INvQlx`（team `team_QndIkcpNjTARzSsZyENDs8kQ`） |
| Blob store | `wqqdmdni7x1vusvs` |
| GitHub 仓库 | `agricon-evan/agricon-payload`（public；默认分支 `main`；本地分支 `master` 跟踪它） |
| GitHub 细粒度 PAT | 已授予 `Contents: Read and write`（用户提供）；创建仓库 Secret 需要额外 `Actions` 权限 |
| Vercel API token | 用户提供（`vcp_...`），用于 API 操作 |

**安全约定**：所有 token/密钥只在用户会话中使用，不写进仓库、不写进本文档、不写进日志。
