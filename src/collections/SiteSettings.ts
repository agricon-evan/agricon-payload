import type { CollectionConfig } from 'payload'

export const SiteSettings: CollectionConfig = {
  slug: 'siteSettings',
  admin: {
    useAsTitle: 'siteName',
    description: 'Global site settings — singleton pattern (create only one document)',
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'siteName', type: 'text', defaultValue: 'Agricon' },
    { name: 'siteTagline', type: 'text', localized: true },
    { name: 'contactEmail', type: 'email' },
    { name: 'contactPhone', type: 'text' },
    { name: 'whatsappNumber', type: 'text' },
    { name: 'address', type: 'textarea', localized: true },
    {
      name: 'socialLinks',
      type: 'group',
      fields: [
        { name: 'linkedin', type: 'text' },
        { name: 'facebook', type: 'text' },
        { name: 'instagram', type: 'text' },
        { name: 'youtube', type: 'text' },
      ],
    },
    // ── Company statistics shown on homepage & about (editable in admin) ──
    {
      name: 'stats',
      type: 'group',
      label: 'Company Statistics',
      admin: { description: 'Numbers displayed on the homepage stats band. Verified figures only — edit in admin without code changes.' },
      fields: [
        { name: 'countriesServed', type: 'text', defaultValue: '20+', label: 'Countries Served' },
        { name: 'farmProjects', type: 'text', defaultValue: '500+', label: 'Farm Projects Delivered' },
        { name: 'yearsInBusiness', type: 'text', defaultValue: '15+', label: 'Years in Business' },
        { name: 'onTimeDelivery', type: 'text', defaultValue: '98%', label: 'On-time Delivery Rate' },
        { name: 'equipmentModels', type: 'text', defaultValue: '200+', label: 'Equipment Models' },
      ],
    },
    {
      name: 'claims',
      type: 'group',
      label: 'Verified Claims',
      admin: { description: 'Certifications and claims shown in trust sections. Keep verified only.' },
      fields: [
        { name: 'iso9001', type: 'checkbox', defaultValue: true, label: 'ISO 9001 Certified' },
        { name: 'ceMarked', type: 'checkbox', defaultValue: true, label: 'CE Marked Components' },
        { name: 'galvanizedLifespan', type: 'text', defaultValue: '15+ years', label: 'Galvanized Steel Lifespan' },
      ],
    },
  ],
  versions: { drafts: false },
}
