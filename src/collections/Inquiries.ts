import type { CollectionConfig, Payload } from 'payload'
import { antiSpamFields } from '@/lib/anti-spam'
import { publicWriteGuard } from '@/lib/public-write-guard'

interface InquiryDoc {
  id: number | string
  name?: string | null
  email?: string | null
  company?: string | null
  country?: string | null
  phone?: string | null
  application?: string | null
  currentSetup?: string | null
  purchaseType?: string | null
  productInterest?: Array<{ product?: string | null } | string | null> | null
  message?: string | null
}

/**
 * Emails a human-readable inquiry summary to the sales inbox.
 * Runs after a new inquiry is created (contact form submission).
 */
const notifySales = (payload: Payload, doc: InquiryDoc) => {
  const to = process.env.INQUIRY_NOTIFY_EMAIL || process.env.EMAIL_FROM || 'sales@agricon.com'
  const productInterest = (doc.productInterest || [])
    .map((p) => (typeof p === 'object' && p ? p.product || '' : p || ''))
    .filter(Boolean)
    .join(', ') || '—'
  const lines = [
    `Name: ${doc.name || '—'}`,
    `Email: ${doc.email || '—'}`,
    `Company: ${doc.company || '—'}`,
    `Country: ${doc.country || '—'}`,
    `Phone: ${doc.phone || '—'}`,
    `Application: ${doc.application || '—'}`,
    `Current setup: ${doc.currentSetup || '—'}`,
    `Purchase type: ${doc.purchaseType || '—'}`,
    `Products: ${productInterest}`,
    ``,
    `Message:`,
    `${doc.message || '—'}`,
  ]
  payload.sendEmail({
    to,
    subject: `[Agricon] New inquiry from ${doc.name || doc.email || 'website'}`,
    text: lines.join('\n'),
  }).catch((err: unknown) => {
    // Previously swallowed with `.catch(() => {})`, which made a failed SMTP
    // delivery (misconfigured host, auth error, recipient rejected) completely
    // invisible — sales would simply never see the lead. Always log it.
    payload.logger.error(
      { err: err instanceof Error ? err.message : String(err), to, inquiryId: doc.id },
      'Inquiry saved but the sales notification email failed to send',
    )
  })
}

export const Inquiries: CollectionConfig = {
  slug: 'inquiries',
  labels: { singular: 'Inquiry', plural: 'Inquiries' },
  admin: {
    useAsTitle: 'name',
    group: 'Leads',
    description: 'Contact form submissions from the website. Track each lead from new → contacted → quoted → won.',
    defaultColumns: ['name', 'email', 'country', 'status', 'createdAt'],
    listSearchableFields: ['name', 'email', 'company', 'country', 'phone', 'message'],
    pagination: { defaultLimit: 20, limits: [10, 20, 50, 100] },
  },
  defaultSort: '-createdAt',
  access: {
    read: ({ req }) => !!req.user,
    // Public by design (anonymous contact form). The rate limit and the
    // honeypot/timing heuristics live in the `beforeValidate` hook below, NOT
    // here: Payload also evaluates `access.create` when it builds the admin
    // panel's permissions, so anything that throws in this function takes the
    // whole `/admin` down. See lib/public-write-guard.ts.
    create: () => true,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    { name: 'name', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'email', type: 'email', required: true, admin: { readOnly: true } },
    { name: 'company', type: 'text', admin: { readOnly: true } },
    { name: 'country', type: 'text', admin: { readOnly: true } },
    { name: 'phone', type: 'text', admin: { readOnly: true } },
    // Needs-diagnosis fields (from company 手册 04)
    { name: 'application', type: 'text', label: 'Application / Farm Type', admin: { readOnly: true } },
    { name: 'currentSetup', type: 'text', label: 'Current Setup', admin: { readOnly: true } },
    { name: 'purchaseType', type: 'text', label: 'Purchase Type', admin: { readOnly: true } },
    {
      name: 'productInterest',
      type: 'array',
      label: 'Interested Products',
      fields: [{ name: 'product', type: 'text' }],
      admin: { readOnly: true },
    },
    { name: 'message', type: 'textarea', admin: { readOnly: true } },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      // Indexed: the admin list filters and sorts on the pipeline stage, and the
      // inquiries table is the one collection that grows without bound.
      index: true,
      options: [
        { label: '🟢 New', value: 'new' },
        { label: '🔵 Contacted', value: 'contacted' },
        { label: '🟡 Quoted', value: 'quoted' },
        { label: '✅ Won', value: 'won' },
        { label: '❌ Lost', value: 'lost' },
        { label: '🔒 Closed', value: 'closed' },
      ],
      admin: { position: 'sidebar', description: 'Sales pipeline stage.' },
    },
    { name: 'notes', type: 'textarea', admin: { description: 'Internal follow-up notes (not shown to the customer).' } },
    // Hidden anti-spam plumbing (virtual — never persisted). See lib/anti-spam.ts.
    ...antiSpamFields,
  ],
  hooks: {
    beforeValidate: [
      publicWriteGuard({
        scope: 'inquiry',
        label: 'Inquiry submission',
        rateLimitedMessage:
          'Too many submissions from this address. Please try again later or contact us by email.',
        rejectedMessage: 'This submission was rejected. Please contact us by email instead.',
      }),
    ],
    afterChange: [
      async ({ operation, doc, req }) => {
        // Notify sales only for new submissions (not admin edits)
        if (operation === 'create' && req && req.payload) {
          notifySales(req.payload, doc)
        }
      },
    ],
  },
  timestamps: true,
}
