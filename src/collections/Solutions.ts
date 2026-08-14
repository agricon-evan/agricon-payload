import type { CollectionConfig } from 'payload'

export const Solutions: CollectionConfig = {
  slug: 'solutions',
  labels: { singular: 'Solution', plural: 'Solutions' },
  admin: {
    useAsTitle: 'name',
    group: 'Content',
    description: 'Integrated farm solutions (e.g. Poultry Farm Setup). Bundles of products with features and case studies.',
    defaultColumns: ['name', 'slug', 'sortOrder', 'updatedAt'],
    listSearchableFields: ['name', 'slug', 'description'],
  },
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'description', type: 'textarea', localized: true },
    {
      name: 'features',
      type: 'array',
      fields: [{ name: 'feature', type: 'text', localized: true }],
      admin: { description: 'Key value points shown on the solution card.' },
    },
    { name: 'image', type: 'relationship', relationTo: 'media' },
    { name: 'sortOrder', type: 'number', defaultValue: 0, admin: { description: 'Lower numbers appear first.' } },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      admin: { description: 'Products included in this solution.' },
    },
    {
      name: 'caseStudies',
      type: 'relationship',
      relationTo: 'caseStudies',
      hasMany: true,
    },
  ],
  timestamps: true,
}
