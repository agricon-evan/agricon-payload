import type { CollectionConfig } from 'payload'

export const FaqCategories: CollectionConfig = {
  slug: 'faqCategories',
  labels: { singular: 'FAQ Category', plural: 'FAQ Categories' },
  admin: {
    useAsTitle: 'name',
    group: 'Content',
    description: 'Categories used to organize FAQ entries.',
    defaultColumns: ['name', 'sortOrder'],
  },
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    { name: 'sortOrder', type: 'number', defaultValue: 0, admin: { description: 'Lower numbers appear first.' } },
  ],
  timestamps: false,
}
