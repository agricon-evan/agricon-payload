import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'subcategory', 'slug', 'featured'],
  },
  access: { read: () => true },
  fields: [
    {
      name: 'subcategory',
      type: 'relationship',
      relationTo: 'subcategories',
      required: true,
    },
    {
      // Reverse many-to-many: which solutions include this product
      name: 'solutions',
      type: 'relationship',
      relationTo: 'solutions',
      hasMany: true,
    },
    { name: 'name', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'description', type: 'textarea', localized: true },
    { name: 'price', type: 'text' },
    { name: 'moq', type: 'text' },
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'tag', type: 'text' }],
    },
    {
      name: 'specs',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', localized: true },
        { name: 'value', type: 'text', localized: true },
      ],
    },
    {
      name: 'images',
      type: 'array',
      fields: [
        { name: 'image', type: 'relationship', relationTo: 'media' },
        { name: 'alt', type: 'text', localized: true },
      ],
    },
    { name: 'overviewHtml', type: 'textarea', localized: true },
    {
      name: 'features',
      type: 'array',
      fields: [{ name: 'feature', type: 'text', localized: true }],
    },
    {
      name: 'downloads',
      type: 'array',
      fields: [{ name: 'download', type: 'relationship', relationTo: 'downloads' }],
    },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    { name: 'sortOrder', type: 'number', defaultValue: 0 },
    // SEO fields
    { name: 'seoTitle', type: 'text', localized: true },
    { name: 'seoDescription', type: 'textarea', localized: true },
    { name: 'seoKeywords', type: 'text' },
    { name: 'seoImage', type: 'relationship', relationTo: 'media' },
  ],
  timestamps: true,
}
