import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'
import { APIError } from 'payload'

/**
 * Accepted upload types.
 *
 * WHY THIS IS AN ALLOWLIST: `upload: true` with no `mimeTypes` accepts whatever
 * an authenticated editor's browser sends, and Payload serves uploads from the
 * app's own origin (`/api/media/file/<filename>`). An uploaded `.html` or
 * `.svg` is therefore a **stored XSS** vector: the browser renders it on the
 * site's origin, with access to that origin's cookies and session.
 *
 * `image/svg+xml` is deliberately absent — SVG is an XML document that can carry
 * `<script>`, so it is the classic upload-based XSS payload. The logo the admin
 * panel uses is `public/company-logo.svg`, a deploy-time asset rather than a
 * user upload, so nothing needs SVG through this collection.
 *
 * PDF is included because the `downloads` collection stores datasheets, manuals
 * and drawings through `media`.
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'application/pdf',
]

/**
 * 12 MB. The largest existing asset is a 7.3 MB PNG (`home-hero-agricon.png`),
 * so this leaves headroom while preventing multi-hundred-megabyte uploads from
 * filling the Blob store / disk.
 *
 * Payload v3's upload config has no `filesize` option, so the limit is enforced
 * in a hook below. `mimeTypes` covers the type half of the same concern.
 */
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024
const MAX_UPLOAD_MB = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))

/**
 * Rejects oversized uploads before validation.
 *
 * `req.file` is only populated for an actual upload (create, or an update that
 * replaces the file), so metadata-only edits of an existing document are not
 * affected.
 */
const enforceFileSize: CollectionBeforeValidateHook = ({ req }) => {
  const file = req.file
  if (file && typeof file.size === 'number' && file.size > MAX_UPLOAD_BYTES) {
    const actualMb = (file.size / (1024 * 1024)).toFixed(1)
    throw new APIError(
      `File is too large (${actualMb} MB). The maximum upload size is ${MAX_UPLOAD_MB} MB.`,
      413,
    )
  }
  return req.data
}

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Media File', plural: 'Media Files' },
  admin: {
    group: 'System',
    description: `Image and file library used across the site (products, solutions, blog, downloads…). Max ${MAX_UPLOAD_MB} MB per file.`,
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
  hooks: {
    beforeValidate: [enforceFileSize],
  },
  upload: {
    mimeTypes: ALLOWED_MIME_TYPES,
    // Defence in depth: Payload's own blocklist of problematic extensions
    // (html, svg, js, …). `mimeTypes` above takes precedence, and this stays off
    // so the two can never disagree in the permissive direction.
    allowRestrictedFileTypes: false,
    // Uploads are served back through the app; disable server-side fetching of
    // remote URLs so an editor cannot make the server fetch an arbitrary
    // internal address (SSRF) by pasting a URL into the upload field.
    pasteURL: false,
  },
}
