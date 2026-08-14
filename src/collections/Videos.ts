import type { CollectionConfig } from 'payload'

export const Videos: CollectionConfig = {
  slug: 'videos',
  labels: { singular: 'Video', plural: 'Videos' },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    description: 'Video library shown on /videos. Paste a YouTube or TikTok link — the thumbnail and player are generated automatically for YouTube.',
    defaultColumns: ['title', 'platform', 'published', 'sortOrder', 'updatedAt'],
    listSearchableFields: ['title', 'description'],
  },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    {
      name: 'url',
      type: 'text',
      required: true,
      admin: { placeholder: 'https://www.youtube.com/watch?v=… or https://www.tiktok.com/…' },
    },
    {
      name: 'platform',
      type: 'select',
      defaultValue: 'youtube',
      options: [
        { label: 'YouTube', value: 'youtube' },
        { label: 'TikTok', value: 'tiktok' },
        { label: 'Other', value: 'other' },
      ],
      admin: { position: 'sidebar', description: 'Detected automatically from the URL; adjust if needed.' },
    },
    { name: 'description', type: 'textarea', localized: true },
    {
      name: 'thumbnail',
      type: 'relationship',
      relationTo: 'media',
      admin: { description: 'Optional custom thumbnail — YouTube thumbnails are fetched automatically when empty.' },
    },
    { name: 'sortOrder', type: 'number', defaultValue: 0, admin: { position: 'sidebar', description: 'Lower numbers appear first.' } },
    { name: 'published', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar', description: 'Unpublished videos are hidden on the website.' } },
  ],
  timestamps: false,
}
