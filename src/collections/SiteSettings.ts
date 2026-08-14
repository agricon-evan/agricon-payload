import type { CollectionConfig } from 'payload'

export const SiteSettings: CollectionConfig = {
  slug: 'siteSettings',
  labels: { singular: 'Site Setting', plural: 'Site Settings' },
  admin: {
    useAsTitle: 'siteName',
    group: 'System',
    description: 'Global site settings — contact details, social links, footer QR codes and the numbers/claims shown on the homepage. Keep exactly one document.',
  },
  access: {
    read: () => true,
    update: ({ req }) => !!req.user,
  },
  fields: [
    { name: 'siteName', type: 'text', defaultValue: 'Agricon' },
    { name: 'siteTagline', type: 'text', localized: true },
    { name: 'contactEmail', type: 'email', admin: { description: 'Shown on the contact page.' } },
    { name: 'contactPhone', type: 'text', admin: { description: 'Shown on the contact page.' } },
    { name: 'whatsappNumber', type: 'text', admin: { description: 'Full international format, e.g. +8613800000000.' } },
    {
      name: 'tiktokQrCode',
      type: 'upload',
      relationTo: 'media',
      label: 'TikTok QR Code',
      admin: { description: 'Upload the TikTok QR code shown in the global footer.' },
    },
    {
      name: 'instagramQrCode',
      type: 'upload',
      relationTo: 'media',
      label: 'Instagram QR Code',
      admin: { description: 'Upload the Instagram QR code shown in the global footer.' },
    },
    { name: 'address', type: 'textarea', localized: true },
    {
      name: 'socialLinks',
      type: 'group',
      label: 'Social Links',
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
        { name: 'countriesServed', type: 'text', defaultValue: '30+', label: 'Export Markets' },
        { name: 'farmProjects', type: 'text', defaultValue: '100+', label: 'Farm Projects' },
        { name: 'yearsInBusiness', type: 'text', defaultValue: '15+', label: 'Years in Business' },
        { name: 'onTimeDelivery', type: 'text', defaultValue: '98%', label: 'On-Time Delivery' },
        { name: 'equipmentModels', type: 'text', defaultValue: '10+', label: 'Equipment Categories' },
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
