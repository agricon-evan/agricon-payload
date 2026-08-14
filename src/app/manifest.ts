import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Agricon - Poultry & Livestock Equipment',
    short_name: 'Agricon',
    description: 'Poultry & Livestock Equipment Solutions',
    start_url: '/en',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0c5d3f',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  }
}
