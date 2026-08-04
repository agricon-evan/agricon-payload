import type { CollectionConfig } from 'payload'

export const BlogPosts: CollectionConfig = {
  slug: 'blogPosts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'published', 'createdAt'],
  },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'excerpt', type: 'text', localized: true },
    { name: 'content', type: 'richText', localized: true },
    { name: 'coverImage', type: 'relationship', relationTo: 'media' },
    { name: 'author', type: 'text' },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'blogTags',
      hasMany: true,
    },
    { name: 'published', type: 'checkbox', defaultValue: false },
  ],
  timestamps: true,
}
