import type { CollectionConfig } from 'payload'

export const Videos: CollectionConfig = {
  slug: 'videos',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'sortOrder'] },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'url', type: 'text', required: true },
    { name: 'description', type: 'textarea', localized: true },
    { name: 'thumbnail', type: 'relationship', relationTo: 'media' },
    { name: 'sortOrder', type: 'number', defaultValue: 0 },
  ],
  timestamps: false,
}
