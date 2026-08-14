import type { CollectionConfig } from 'payload'

export const FAQs: CollectionConfig = {
  slug: 'faqs',
  labels: { singular: 'FAQ', plural: 'FAQs' },
  admin: {
    useAsTitle: 'question',
    group: 'Content',
    description: 'Frequently asked questions shown on /faq.',
    defaultColumns: ['question', 'category', 'published', 'sortOrder', 'updatedAt'],
    listSearchableFields: ['question'],
  },
  access: { read: () => true },
  fields: [
    { name: 'category', type: 'relationship', relationTo: 'faqCategories' },
    { name: 'question', type: 'text', required: true, localized: true },
    { name: 'answer', type: 'richText', required: true, localized: true },
    { name: 'sortOrder', type: 'number', defaultValue: 0, admin: { description: 'Lower numbers appear first.' } },
    { name: 'published', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
  ],
  timestamps: true,
}
