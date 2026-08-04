import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
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

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
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
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: process.env.POSTGRES_URL
    ? vercelPostgresAdapter({
        pool: {
          connectionString: process.env.POSTGRES_URL,
        },
      })
    : sqliteAdapter({
        client: {
          url: process.env.DATABASE_URI || 'file:./agricon-dev.db',
        },
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
