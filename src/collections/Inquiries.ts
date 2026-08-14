import type { CollectionConfig } from 'payload'

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
  timestamps: true,
}
