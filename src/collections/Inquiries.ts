import type { CollectionConfig, Payload } from 'payload'

interface InquiryDoc {
  id: number
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
  }).catch(() => {})
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
  ],
  hooks: {
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
