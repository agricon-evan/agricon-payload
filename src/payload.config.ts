import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import nodemailer from 'nodemailer'
import path from 'path'
import { buildConfig, type EmailAdapter } from 'payload'
import { fileURLToPath } from 'url'

// Collections
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Subcategories } from './collections/Subcategories'
import { Products } from './collections/Products'
import { Solutions } from './collections/Solutions'
import { BlogPosts } from './collections/BlogPosts'
import { BlogTags } from './collections/BlogTags'
import { CaseStudies } from './collections/CaseStudies'
import { FaqCategories } from './collections/FaqCategories'
import { FAQs } from './collections/FAQs'
import { Downloads } from './collections/Downloads'
import { Videos } from './collections/Videos'
import { Countries } from './collections/Countries'
import { Inquiries } from './collections/Inquiries'
import { NewsletterSubscribers } from './collections/NewsletterSubscribers'
import { SiteSettings } from './collections/SiteSettings'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Email adapter — uses SMTP when SMTP_HOST is configured, otherwise logs to
 * the console (safe for local development). See README → Email.
 */
const emailAdapter: EmailAdapter = ({ payload }) => {
  const smtpHost = process.env.SMTP_HOST
  const fromAddress = process.env.EMAIL_FROM || 'noreply@agricon.com'
  const fromName = process.env.EMAIL_FROM_NAME || 'Agricon'

  if (smtpHost) {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    })
    return {
      name: 'agricon-smtp-email',
      defaultFromAddress: fromAddress,
      defaultFromName: fromName,
      sendEmail: async (message) => {
        const to = Array.isArray(message.to) ? message.to.join(', ') : String(message.to || '')
        const subject = message.subject || '(no subject)'
        const html = typeof message.html === 'string'
          ? message.html
          : (typeof message.text === 'string' ? message.text.replace(/\n/g, '<br/>') : '')
        try {
          await transporter.sendMail({
            from: `"${fromName}" <${fromAddress}>`,
            to,
            subject,
            html,
            text: typeof message.text === 'string' ? message.text : undefined,
          })
          payload.logger.info({ to, subject }, 'Email sent via SMTP')
        } catch (err) {
          payload.logger.error({ to, subject, err: (err as Error).message }, 'SMTP send failed')
        }
      },
    }
  }

  // No SMTP configured — log instead of sending
  return {
    name: 'agricon-console-email',
    defaultFromAddress: fromAddress,
    defaultFromName: fromName,
    sendEmail: async (message) => {
      payload.logger.info({ message }, 'Email delivery is not configured; message logged instead')
    },
  }
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '- Agricon CMS',
      icons: { icon: '/company-logo.svg' },
      openGraph: { images: [{ url: '/images/home-hero-agricon.png' }] },
    },
    // NOTE: 必须使用相对路径（相对 importMap.baseDir），不能用 path.resolve 的绝对路径。
    // Payload 只对以 './' 或 '/' 开头的路径做反斜杠→正斜杠规范化；绝对 Windows 路径
    // （如 D:\...）会原样写入 importMap.js，Turbopack 解析字符串时会把 \a、\p 当作转义符。
    components: {
      beforeDashboard: ['./app/(payload)/admin/components/BeforeDashboard.tsx'],
      afterNav: ['./app/(payload)/admin/components/ThemeInjector.tsx'],
      graphics: {
        Logo: './app/(payload)/admin/components/Logo.tsx',
        Icon: './app/(payload)/admin/components/Icon.tsx',
      },
    },
  },
  collections: [
    Users,
    Media,
    Categories,
    Subcategories,
    Products,
    Solutions,
    BlogPosts,
    BlogTags,
    CaseStudies,
    FaqCategories,
    FAQs,
    Downloads,
    Videos,
    Countries,
    Inquiries,
    NewsletterSubscribers,
    SiteSettings,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  email: emailAdapter,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: process.env.POSTGRES_URL
    ? vercelPostgresAdapter({
        pool: {
          connectionString: process.env.POSTGRES_URL,
        },
        // Production: the checked-in migrations only cover the initial schema,
        // so the first production deploy relies on push to build the full schema.
        // Set PAYLOAD_PUSH_SCHEMA=false to force migrations-only mode.
        push: process.env.PAYLOAD_PUSH_SCHEMA !== 'false',
      })
    : sqliteAdapter({
        client: {
          url: process.env.DATABASE_URI || 'file:./agricon-dev.db',
        },
        push: process.env.PAYLOAD_PUSH_SCHEMA !== 'false',
        busyTimeout: 5000,
      }),
  plugins: process.env.BLOB_READ_WRITE_TOKEN
    ? [
        vercelBlobStorage({
          collections: {
            media: true,
          },
          token: process.env.BLOB_READ_WRITE_TOKEN,
        }),
      ]
    : [],
  // --- i18n locales (6 languages) ---
  localization: {
    locales: [
      { label: 'English', code: 'en' },
      { label: 'Русский', code: 'ru' },
      { label: 'Français', code: 'fr' },
      { label: 'Español', code: 'es' },
      { label: 'Kiswahili', code: 'sw' },
      { label: 'العربية', code: 'ar' },
    ],
    defaultLocale: 'en',
    fallback: true,
  },
})
