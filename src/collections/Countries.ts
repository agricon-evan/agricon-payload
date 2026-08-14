import type { CollectionConfig } from 'payload'

export const Countries: CollectionConfig = {
  slug: 'countries',
  labels: { singular: 'Country', plural: 'Countries' },
  admin: {
    useAsTitle: 'name',
    group: 'System',
    description: 'Export markets served. This list powers the inquiry form country dropdown (single source of truth).',
    defaultColumns: ['name', 'code'],
    listSearchableFields: ['name', 'code'],
  },
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true, admin: { placeholder: 'e.g. Nigeria' } },
    { name: 'code', type: 'text', required: true, unique: true, admin: { placeholder: 'e.g. NG', description: 'ISO 3166-1 alpha-2 country code.' } },
  ],
  timestamps: false,
}
