import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'User', plural: 'Users' },
  admin: {
    useAsTitle: 'email',
    group: 'System',
    description: 'Admin panel accounts. Only these users can sign in to the CMS.',
    defaultColumns: ['name', 'email', 'updatedAt'],
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      admin: { placeholder: 'Full name (optional)' },
    },
  ],
  versions: false,
}
