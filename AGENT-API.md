# Agricon CMS · Agent 操作接口文档

面向 **agent / 脚本 / 自动化** 的 Payload CMS 操作指南。所有数据操作都有三种等价方式:
**REST API**(远程)、**GraphQL**(远程)、**Local API**(本地脚本直连)。下面给出认证方式、常用操作示例和注意事项。

---

## 1. 快速开始(认证)

### REST API — 获取 JWT

```bash
# 登录拿 token(admin 账号)
curl -s -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@agricon.com","password":"<你的密码>"}'
# → { "token": "eyJ...", "user": { "email": "admin@agricon.com", ... } }
```

之后所有写操作带请求头:

```bash
-H "Authorization: JWT <token>"
```

> 开发环境密码:见本地部署说明(生产环境请轮换)。

### Local API — 脚本直连(推荐给批量任务)

```ts
// scripts/example.ts
import 'dotenv/config'
import { getPayload } from 'payload'

process.env.PAYLOAD_PUSH_SCHEMA = 'false' // 见 §6 注意事项

async function main() {
  const payload = await getPayload({ config: (await import('../src/payload.config')).default })
  const { docs } = await payload.find({ collection: 'products', limit: 5, depth: 1 })
  console.log(docs.map((d) => d.slug))
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
```

运行:`pnpm tsx scripts/example.ts`

---

## 2. Collection 清单(slug)

| slug | 内容 | 读写权限 |
|---|---|---|
| `users` | 管理员账号 | 登录 |
| `media` | 图片/文件库 | 登录 |
| `categories` | 产品大类(10) | 读公开 / 写需登录 |
| `subcategories` | 产品子类(70) | 读公开 / 写需登录 |
| `products` | 产品(43) | 读公开 / 写需登录 |
| `solutions` | 解决方案(6) | 读公开 / 写需登录 |
| `blogPosts` / `blogTags` | 博客文章 / 标签 | 读公开 / 写需登录 |
| `caseStudies` | 客户案例(12) | 读公开 / 写需登录 |
| `faqs` / `faqCategories` | FAQ / 分类 | 读公开 / 写需登录 |
| `videos` | 视频库 | 读公开 / 写需登录 |
| `downloads` | 下载文件 | 读公开 / 写需登录 |
| `inquiries` | 询盘(表单提交) | 读/改/删需登录,创建公开 |
| `newsletterSubscribers` | 订阅用户 | 读公开 / 写需登录 |
| `countries` | 国家列表 | 读公开 / 写需登录 |
| `siteSettings` | 全局设置(单例,id=1) | 读公开 / 写需登录 |

---

## 3. REST API 操作示例

### 读取

```bash
# 读产品(公开,无需 token)
curl -s "http://localhost:3000/api/products?limit=3&depth=1"

# 条件查询:发布中的博客
curl -s "http://localhost:3000/api/blogPosts?where[published][equals]=true&limit=10"

# 读全局设置
curl -s "http://localhost:3000/api/siteSettings?limit=1"
```

### 创建 / 更新 / 删除(需 token)

```bash
TOKEN="<上一步拿到的 token>"

# 创建 FAQ
curl -s -X POST http://localhost:3000/api/faqs \
  -H "Content-Type: application/json" -H "Authorization: JWT $TOKEN" \
  -d '{"question":"New question?","answer":"<lexical JSON>","published":true,"sortOrder":99}'

# 更新产品价格
curl -s -X PATCH http://localhost:3000/api/products/5 \
  -H "Content-Type: application/json" -H "Authorization: JWT $TOKEN" \
  -d '{"price":"US$55.0","moq":"1 set"}'

# 更新首页 Testimonials(JSON 字段)
curl -s -X PATCH http://localhost:3000/api/siteSettings/1 \
  -H "Content-Type: application/json" -H "Authorization: JWT $TOKEN" \
  -d '{"homeTestimonials":[{"quote":"...","name":"...","role":"..."}]}'

# 删除(谨慎)
curl -s -X DELETE "http://localhost:3000/api/products/99" \
  -H "Authorization: JWT $TOKEN"
```

### 多语言(localized)字段

大部分内容字段是 6 语言(en/ru/fr/es/sw/ar)。REST 默认写 en;更新其他语言用 `?locale=`:

```bash
# 更新俄语产品名
curl -s -X PATCH "http://localhost:3000/api/products/5?locale=ru" \
  -H "Content-Type: application/json" -H "Authorization: JWT $TOKEN" \
  -d '{"name":"Клетка для кур H-типа"}'
```

### 上传图片

```bash
# 先登录拿 cookie/token,然后 multipart 上传
curl -s -X POST http://localhost:3000/api/media \
  -H "Authorization: JWT $TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "alt=Layer cage product photo"
# → 返回 media doc(含 id),之后用 id 关联产品 images
```

---

## 4. GraphQL

端点:`POST /api/graphql`(Content-Type: application/json;认证同上,用 `Authorization: JWT` 头)。

```graphql
query {
  Products(limit: 3, where: { featured: { equals: true } }) {
    docs { id slug name price }
  }
}
```

```bash
curl -s -X POST http://localhost:3000/api/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ Products(limit:3){ docs { id slug name } } }"}'
```

> GraphQL 变更(mutation)需要登录 token,字段与 REST 一致。

---

## 5. 首页内容(最近新增 — 后台 JSON 可管理)

首页 6 个区块的内容现在存于 `siteSettings`(id=1)的 JSON 字段,
后台 Site Settings 编辑页可直接改,agent 可通过 API 改:

| 字段 | 结构 | 对应区块 |
|---|---|---|
| `homeTestimonials` | `[{quote,name,role}]` | 客户评价 |
| `homeWhyChooseUs` | `[{icon,title,desc}]` | 为什么选我们 |
| `homeHowWeWork` | `[{icon,title,desc}]` | 服务流程 6 步 |
| `homeGlobalCoverage` | `[{icon,title,sub}]` | 全球覆盖 |
| `homeValueCalculated` | `[{icon,title,items:[{label,value}]}]` | 价值数据卡 |
| `homeTrustEvidence` | `[{icon,title,items:[string]}]` | 信任与证据 |

**规则**:字段为空数组/空值 → 前端回退到内置默认内容(可安全清空恢复默认)。
`icon` 取值见 `src/components/ui/Icon.tsx` 的图标名(如 `shield`/`truck`/`users`…)。

---

## 6. 注意事项

1. **SQLite push 已关闭**(Windows/libsql 下 payload push 会崩溃)。
   修改 collection 字段后需手动 `ALTER TABLE` 同步开发库 —— 见 README「数据库说明」。
   ⚠️ **有版本表的 collection**(如 `siteSettings` → `_site_settings_v`)要同时给版本表补列。
2. **richText 字段**(blog content、faq answer)是 lexical JSON,不能传纯文本;
   参考现有脚本 `scripts/seed-fallback-content.ts` 里的构造方式。
3. **关系字段**传 id 或对象均可:`subcategory: 5` 或 `subcategory: { id: 5 }`。
4. **幂等脚本模式**:创建前先 `payload.find` 按 slug/唯一字段查重,见 `seed-faq-categories.ts`。
5. **图片文件**:上传到 `media` collection 后,URL 为 `/api/media/file/<filename>`;不要直接引用 `public/catalog/`(那是导入的静态资源)。
6. **询盘表单**对游客开放 `create`,agent 可用它做自动化测试提交。

---

## 7. 现有脚本参考(agent 操作模板)

| 脚本 | 演示能力 |
|---|---|
| `scripts/seed-fallback-content.ts` | 创建 blogPosts + faqs(含 richText 构造) |
| `scripts/seed-faq-categories.ts` | 创建分类 + 关系关联 |
| `scripts/seed-blog-tags.ts` | 创建标签 + 多对多关联 |
| `scripts/seed-home-content.ts` | 更新 siteSettings JSON 字段 |
| `scripts/fix-missing-detail-images.ts` | 数据修复 + 远程图片下载 |
| `scripts/import-alibaba-products.ts` | 批量导入 + media 上传 |
