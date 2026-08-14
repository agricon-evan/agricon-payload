import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Category', plural: 'Categories' },
  admin: {
    useAsTitle: 'name',
    group: 'Product Catalog',
    description: 'Top-level product categories (e.g. Poultry Housing, Feed Processing). Each contains subcategories.',
    defaultColumns: ['name', 'slug', 'sortOrder', 'updatedAt'],
    listSearchableFields: ['name', 'slug', 'description'],
  },
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true, admin: { description: 'URL slug, e.g. poultry-housing.' } },
    { name: 'description', type: 'text', localized: true },
    { name: 'image', type: 'relationship', relationTo: 'media', admin: { description: 'Category card image.' } },
    { name: 'sortOrder', type: 'number', defaultValue: 0, admin: { description: 'Lower numbers appear first.' } },
  ],
  timestamps: true,
}
