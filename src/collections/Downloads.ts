import type { CollectionConfig } from 'payload'

export const Downloads: CollectionConfig = {
  slug: 'downloads',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'category', 'fileType'] },
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'file', type: 'upload', relationTo: 'media' },
    { name: 'category', type: 'text' },
    { name: 'fileType', type: 'text' },
    { name: 'fileSize', type: 'text' },
  ],
  timestamps: false,
}
