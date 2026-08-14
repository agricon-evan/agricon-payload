import type { CollectionConfig } from 'payload'

export const BlogTags: CollectionConfig = {
  slug: 'blogTags',
  labels: { singular: 'Blog Tag', plural: 'Blog Tags' },
  admin: {
    useAsTitle: 'name',
    group: 'Content',
    description: 'Taxonomy tags for blog posts.',
    defaultColumns: ['name', 'slug'],
  },
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
  ],
  timestamps: false,
}
