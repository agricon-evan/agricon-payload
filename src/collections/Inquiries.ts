import type { CollectionConfig } from 'payload'

export const Inquiries: CollectionConfig = {
  slug: 'inquiries',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'email', 'status', 'createdAt'] },
  access: {
    read: ({ req }) => !!req.user,
    create: () => true,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'company', type: 'text' },
    { name: 'country', type: 'text' },
    { name: 'phone', type: 'text' },
    // Needs-diagnosis fields (from company 手册 04)
    { name: 'application', type: 'text', label: 'Application / Farm Type' },
    { name: 'currentSetup', type: 'text', label: 'Current Setup' },
    { name: 'purchaseType', type: 'text', label: 'Purchase Type' },
    {
      name: 'productInterest',
      type: 'array',
      label: 'Interested Products',
      fields: [{ name: 'product', type: 'text' }],
    },
    { name: 'message', type: 'textarea' },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Quoted', value: 'quoted' },
        { label: 'Won', value: 'won' },
        { label: 'Lost', value: 'lost' },
        { label: 'Closed', value: 'closed' },
      ],
    },
    { name: 'notes', type: 'textarea' },
  ],
  timestamps: true,
}
