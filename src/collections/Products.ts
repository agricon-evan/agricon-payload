import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Product', plural: 'Products' },
  admin: {
    useAsTitle: 'name',
    group: 'Product Catalog',
    description: 'Equipment products shown in the storefront catalog. Attach to a subcategory, link solutions, galleries, downloads and SEO metadata.',
    defaultColumns: ['name', 'subcategory', 'featured', 'sortOrder', 'updatedAt'],
    listSearchableFields: ['name', 'slug', 'description', 'price', 'moq'],
    pagination: { defaultLimit: 20, limits: [10, 20, 50, 100] },
  },
  access: { read: () => true },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General',
          fields: [
            { name: 'name', type: 'text', required: true, localized: true, admin: { placeholder: 'e.g. H-Type Layer Cage 4-Tier' } },
            {
              name: 'subcategory',
              type: 'relationship',
              relationTo: 'subcategories',
              required: true,
              admin: { description: 'Parent subcategory (Categories → Subcategories → Products).' },
            },
            { name: 'slug', type: 'text', required: true, unique: true, admin: { description: 'URL slug, e.g. h-type-layer-cage.' } },
            { name: 'description', type: 'textarea', localized: true, admin: { description: 'Short marketing summary shown in the product header.' } },
            { name: 'price', type: 'text', admin: { description: 'Optional displayed price — leave blank for “Contact for price”.' } },
            { name: 'moq', type: 'text', admin: { description: 'Minimum order quantity, e.g. “1×40HQ container”.' } },
            {
              name: 'tags',
              type: 'array',
              fields: [{ name: 'tag', type: 'text', admin: { placeholder: 'e.g. Export-ready' } }],
              admin: { description: 'Highlight chips shown under the product name.' },
            },
            {
              name: 'solutions',
              type: 'relationship',
              relationTo: 'solutions',
              hasMany: true,
              admin: { description: 'Which solutions include this product.' },
            },
          ],
        },
        {
          label: 'Details',
          fields: [
            {
              name: 'overviewHtml',
              type: 'textarea',
              localized: true,
              admin: { description: 'Long-form HTML overview shown as the main article on the product page.' },
            },
            {
              name: 'features',
              type: 'array',
              fields: [{ name: 'feature', type: 'text', localized: true }],
              admin: { description: 'Advantage bullet list.' },
            },
            {
              name: 'specs',
              type: 'array',
              fields: [
                { name: 'label', type: 'text', localized: true, admin: { placeholder: 'e.g. Rows' } },
                { name: 'value', type: 'text', localized: true, admin: { placeholder: 'e.g. 3–4' } },
              ],
              admin: { description: 'Key technical specifications rendered as a table.' },
            },
          ],
        },
        {
          label: 'Media',
          fields: [
            {
              name: 'images',
              type: 'array',
              fields: [
                { name: 'image', type: 'relationship', relationTo: 'media' },
                { name: 'alt', type: 'text', localized: true },
              ],
              admin: { description: 'Product gallery images. The first image is used as the cover.' },
            },
            { name: 'seoImage', type: 'relationship', relationTo: 'media', admin: { description: 'Social sharing / SEO image.' } },
          ],
        },
        {
          label: 'Downloads',
          fields: [
            {
              name: 'downloads',
              type: 'array',
              fields: [{ name: 'download', type: 'relationship', relationTo: 'downloads' }],
              admin: { description: 'Datasheets, manuals and drawings available for download on the product page.' },
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            { name: 'seoTitle', type: 'text', localized: true, admin: { description: 'Browser tab / search title. Defaults to the product name.' } },
            { name: 'seoDescription', type: 'textarea', localized: true, admin: { description: 'Meta description for search engines.' } },
            { name: 'seoKeywords', type: 'text', admin: { description: 'Comma-separated keywords (legacy).' } },
          ],
        },
      ],
    },
    { name: 'featured', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar', description: 'Feature this product on the homepage.' } },
    { name: 'sortOrder', type: 'number', defaultValue: 0, admin: { position: 'sidebar', description: 'Lower numbers appear first.' } },
  ],
  timestamps: true,
}
