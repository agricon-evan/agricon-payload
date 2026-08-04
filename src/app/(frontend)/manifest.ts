import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Agricon - Poultry & Livestock Equipment',
    short_name: 'Agricon',
    description: 'Poultry & Livestock Equipment Solutions',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1a5c38',
  }
}
