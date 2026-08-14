import type { CollectionConfig } from 'payload'

export const Downloads: CollectionConfig = {
  slug: 'downloads',
  labels: { singular: 'Download', plural: 'Downloads' },
  admin: {
    useAsTitle: 'name',
    group: 'Content',
    description: 'Reusable resource files (datasheets, manuals, drawings). Attach them to products from the product edit screen.',
    defaultColumns: ['name', 'category', 'fileType', 'published', 'sortOrder', 'updatedAt'],
    listSearchableFields: ['name', 'category', 'fileType'],
  },
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true, admin: { placeholder: 'e.g. H-Type Cage Datasheet (PDF)' } },
    {
      name: 'file',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: { description: 'The file users can download.' },
    },
    { name: 'category', type: 'text', admin: { placeholder: 'e.g. Datasheet, Manual, Drawing' } },
    { name: 'fileType', type: 'text', admin: { placeholder: 'e.g. PDF, DWG', description: 'Auto-filled from the file if left blank.' } },
    { name: 'fileSize', type: 'text', admin: { placeholder: 'e.g. 1.2 MB', description: 'Shown next to the download button.' } },
    { name: 'sortOrder', type: 'number', defaultValue: 0, admin: { position: 'sidebar', description: 'Lower numbers appear first.' } },
    { name: 'published', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar', description: 'Unpublished downloads are hidden on product pages.' } },
  ],
  timestamps: false,
}
