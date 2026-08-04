import type { CollectionConfig } from 'payload'

export const CaseStudies: CollectionConfig = {
  slug: 'caseStudies',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'country', 'published'],
  },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'subtitle', type: 'text', localized: true },
    { name: 'summary', type: 'textarea', localized: true },
    { name: 'content', type: 'richText', localized: true },
    { name: 'location', type: 'text', localized: true },
    { name: 'equipment', type: 'textarea', localized: true, label: 'Equipment Supplied' },
    { name: 'application', type: 'textarea', localized: true, label: 'Application' },
    { name: 'challenge', type: 'textarea', localized: true, label: 'Project Challenge' },
    {
      name: 'country',
      type: 'relationship',
      relationTo: 'countries',
    },
    {
      name: 'solution',
      type: 'relationship',
      relationTo: 'solutions',
    },
    { name: 'farmName', type: 'text', localized: true },
    { name: 'farmScale', type: 'text', localized: true },
    { name: 'keyResult', type: 'text', localized: true },
    { name: 'image', type: 'relationship', relationTo: 'media' },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    { name: 'published', type: 'checkbox', defaultValue: true },
    { name: 'sortOrder', type: 'number', defaultValue: 0 },
  ],
  timestamps: true,
}
