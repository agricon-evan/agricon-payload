import type { CollectionConfig } from 'payload'
import { antiSpamFields } from '@/lib/anti-spam'
import { publicWriteGuard } from '@/lib/public-write-guard'

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
    // Public by design: the per-IP window and the honeypot/timing checks run in
    // the `beforeValidate` hook below, never in an access function (Payload
    // evaluates those while rendering the admin panel). See
    // lib/public-write-guard.ts.
    create: () => true,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    { name: 'email', type: 'email', required: true, unique: true, admin: { readOnly: true } },
    { name: 'name', type: 'text', admin: { readOnly: true } },
    { name: 'source', type: 'text', defaultValue: 'website', admin: { readOnly: true, description: 'Where the subscription came from.' } },
    // Hidden anti-spam plumbing (virtual — never persisted). See lib/anti-spam.ts.
    ...antiSpamFields,
  ],
  hooks: {
    beforeValidate: [
      publicWriteGuard({
        scope: 'newsletter',
        label: 'Newsletter signup',
        rateLimitedMessage: 'Too many signups from this address. Please try again later.',
        rejectedMessage: 'This signup was rejected.',
      }),
    ],
  },
  timestamps: true,
}
