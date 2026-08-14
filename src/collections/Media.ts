import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Media File', plural: 'Media Files' },
  admin: {
    group: 'System',
    description: 'Image and file library used across the site (products, solutions, blog, downloads…).',
    defaultColumns: ['alt', 'filename', 'mimeType', 'filesize', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: { description: 'Accessible alternative text — describe what the image shows.' },
    },
  ],
  upload: true,
}
