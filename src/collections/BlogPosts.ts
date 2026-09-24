import type { CollectionConfig } from 'payload'

export const BlogPosts: CollectionConfig = {
  slug: 'blogPosts',
  labels: { singular: 'Blog Post', plural: 'Blog Posts' },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    description: 'Articles published under /blog. Only published posts appear on the website.',
    defaultColumns: ['title', 'slug', 'published', 'createdAt'],
    listSearchableFields: ['title', 'excerpt', 'author'],
  },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'excerpt', type: 'text', localized: true, admin: { description: 'Short summary shown in article cards.' } },
    { name: 'content', type: 'richText', localized: true },
    { name: 'coverImage', type: 'relationship', relationTo: 'media' },
    { name: 'author', type: 'text' },
    { name: 'tags', type: 'relationship', relationTo: 'blogTags', hasMany: true },
    // Indexed: every public read filters on this column
    // (`where: { published: { equals: true } }` in lib/payload.ts and sitemap.ts).
    // Payload auto-indexes unique/relationship/timestamp fields but not plain
    // checkbox filters.
    { name: 'published', type: 'checkbox', defaultValue: false, index: true, admin: { position: 'sidebar', description: 'Unpublished posts are hidden from the website.' } },
  ],
  timestamps: true,
}
