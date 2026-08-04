import type { CollectionConfig } from 'payload'

export const NewsletterSubscribers: CollectionConfig = {
  slug: 'newsletterSubscribers',
  admin: { useAsTitle: 'email', defaultColumns: ['email', 'name', 'createdAt'] },
  access: {
    read: ({ req }) => !!req.user,
    create: () => true,
  },
  fields: [
    { name: 'email', type: 'email', required: true, unique: true },
    { name: 'name', type: 'text' },
    { name: 'source', type: 'text', defaultValue: 'website' },
  ],
  timestamps: true,
}
