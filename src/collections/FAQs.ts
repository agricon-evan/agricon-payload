import type { CollectionConfig } from 'payload'

export const FAQs: CollectionConfig = {
  slug: 'faqs',
  admin: { useAsTitle: 'question', defaultColumns: ['question', 'category', 'published'] },
  access: { read: () => true },
  fields: [
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'faqCategories',
    },
    { name: 'question', type: 'text', required: true, localized: true },
    { name: 'answer', type: 'richText', required: true, localized: true },
    { name: 'sortOrder', type: 'number', defaultValue: 0 },
    { name: 'published', type: 'checkbox', defaultValue: true },
  ],
  timestamps: true,
}
