import type { CollectionConfig } from 'payload'

export const BlogTags: CollectionConfig = {
  slug: 'blogTags',
  admin: { useAsTitle: 'name' },
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
  ],
  timestamps: false,
}
