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
    // ── Homepage section content ──
    // Array fields give the admin a row-based table editor for each homepage
    // section. When a section is empty the storefront falls back to the
    // built-in defaults. `items` sub-lists are JSON for flexibility.
    {
      name: 'homeTestimonials',
      type: 'array',
      label: 'Home · Testimonials',
      admin: { description: 'Customer testimonials on the homepage. Empty → built-in defaults.' },
      fields: [
        { name: 'quote', type: 'textarea', required: true, admin: { description: 'Customer quote.' } },
        { name: 'name', type: 'text', required: true, admin: { placeholder: 'e.g. Kenya Layer Farm' } },
        { name: 'role', type: 'text', admin: { placeholder: 'e.g. Layer poultry project' } },
      ],
    },
    {
      name: 'homeWhyChooseUs',
      type: 'array',
      label: 'Home · Why Choose Us',
      admin: { description: 'Advantage cards. Empty → built-in defaults.' },
      fields: [
        { name: 'icon', type: 'text', admin: { description: 'Icon name (see src/components/ui/Icon.tsx).' } },
        { name: 'title', type: 'text', required: true },
        { name: 'desc', type: 'textarea', required: true },
      ],
    },
    {
      name: 'homeHowWeWork',
      type: 'array',
      label: 'Home · How We Work',
      admin: { description: 'Process steps. Empty → built-in defaults.' },
      fields: [
        { name: 'icon', type: 'text', admin: { description: 'Icon name.' } },
        { name: 'title', type: 'text', required: true },
        { name: 'desc', type: 'textarea', required: true },
      ],
    },
    {
      name: 'homeGlobalCoverage',
      type: 'array',
      label: 'Home · Global Coverage',
      admin: { description: 'Coverage cards. Empty → built-in defaults.' },
      fields: [
        { name: 'icon', type: 'text', admin: { description: 'Icon name.' } },
        { name: 'title', type: 'text', required: true },
        { name: 'sub', type: 'textarea', required: true },
      ],
    },
    {
      name: 'homeValueCalculated',
      type: 'array',
      label: 'Home · Value Calculated',
      admin: { description: 'Value cards. Empty → built-in defaults.' },
      fields: [
        { name: 'icon', type: 'text', admin: { description: 'Icon name.' } },
        { name: 'title', type: 'text', required: true },
        { name: 'items', type: 'json', label: 'Items', admin: { description: 'JSON: [{ "label": "…", "value": "…" }]' } },
      ],
    },
    {
      name: 'homeTrustEvidence',
      type: 'array',
      label: 'Home · Trust & Evidence',
      admin: { description: 'Evidence cards. Empty → built-in defaults.' },
      fields: [
        { name: 'icon', type: 'text', admin: { description: 'Icon name.' } },
        { name: 'title', type: 'text', required: true },
        { name: 'items', type: 'json', label: 'Items', admin: { description: 'JSON array of strings: ["…", "…"]' } },
      ],
    },
  ],
  versions: false,
}
