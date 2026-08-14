import type { CollectionConfig } from 'payload'

export const NewsletterSubscribers: CollectionConfig = {
  slug: 'newsletterSubscribers',
  labels: { singular: 'Newsletter Subscriber', plural: 'Newsletter Subscribers' },
  admin: {
    useAsTitle: 'email',
    group: 'Leads',
    description: 'Emails collected through the website newsletter signup.',
    defaultColumns: ['email', 'name', 'source', 'createdAt'],
    listSearchableFields: ['email', 'name', 'source'],
    pagination: { defaultLimit: 20, limits: [10, 20, 50, 100] },
  },
  defaultSort: '-createdAt',
  access: {
    read: ({ req }) => !!req.user,
    create: () => true,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    { name: 'email', type: 'email', required: true, unique: true, admin: { readOnly: true } },
    { name: 'name', type: 'text', admin: { readOnly: true } },
    { name: 'source', type: 'text', defaultValue: 'website', admin: { readOnly: true, description: 'Where the subscription came from.' } },
  ],
  timestamps: true,
}
