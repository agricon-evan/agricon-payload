import type { CollectionConfig } from 'payload'

export const Subcategories: CollectionConfig = {
  slug: 'subcategories',
  labels: { singular: 'Subcategory', plural: 'Subcategories' },
  admin: {
    useAsTitle: 'name',
    group: 'Product Catalog',
    description: 'Second level of the product tree. Products are attached to a subcategory.',
    defaultColumns: ['name', 'category', 'slug', 'sortOrder', 'updatedAt'],
    listSearchableFields: ['name', 'slug', 'description'],
  },
  access: { read: () => true },
  fields: [
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      admin: { description: 'Parent category.' },
    },
    { name: 'name', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'description', type: 'text', localized: true },
    { name: 'subtitle', type: 'text', localized: true },
    { name: 'image', type: 'relationship', relationTo: 'media' },
    { name: 'heroImage', type: 'relationship', relationTo: 'media', admin: { description: 'Wide banner image for the category landing page.' } },
    { name: 'sortOrder', type: 'number', defaultValue: 0, admin: { description: 'Lower numbers appear first.' } },
  ],
  timestamps: true,
}
