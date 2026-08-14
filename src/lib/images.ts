// Images selected from the company product catalog. Unsplash remains the final fallback
// for content that has not yet received a CMS or catalog image.

export const categoryImages: Record<string, string> = {
  "poultry-equipment": "/catalog/categories/poultry-equipment.jpg",
  "livestock-equipment": "/catalog/categories/livestock-equipment.jpg",
  "aquaculture-equipment": "/catalog/categories/aquaculture-equipment.jpg",
  "agriculture-machinery": "/catalog/categories/agriculture-machinery.jpg",
  "breeding-house-equipment": "/catalog/categories/breeding-house-equipment.jpg",
  "slaughter-equipment": "/catalog/categories/slaughter-equipment.jpg",
  "farming-tools": "/catalog/categories/farming-tools.jpg",
  "farming-vehicles": "/catalog/categories/farming-vehicles.jpg",
  "wire-mesh-fencing": "/catalog/categories/wire-mesh-fencing.jpg",
  "other-machines": "/catalog/categories/other-machines.jpg",
}

export const subcategoryImages: Record<string, string> = {
  "layer-cage": "/catalog/products/layer-cage.jpg",
  "broiler-cage": "/catalog/products/broiler-cage.jpg",
  "hatcher-equipment": "/catalog/products/hatcher-equipment.jpg",
  "farm-fence": "/catalog/products/farm-fence.jpg",
  "cattle-panels": "/catalog/products/cattle-panels.jpg",
  "water-pump": "/catalog/products/water-pump.jpg",
  "pellet-machine": "/catalog/products/pellet-machine.jpg",
  "exhaust-fan": "/catalog/products/exhaust-fan.jpg",
  "plucker-machine": "/catalog/products/plucker-machine.jpg",
  "tractor": "/catalog/products/tractor.jpg",
  "welded-wire-mesh": "/catalog/products/welded-wire-mesh.jpg"
}

export const caseStudyImages: Record<string, string> = {
  "kenya-layer-farm": "/catalog/cases/kenya-layer-farm.jpg",
  "tanzania-layer-farm": "/catalog/cases/tanzania-layer-farm.jpg",
  "indonesia-goat-pen": "/catalog/cases/indonesia-goat-pen.jpg",
  "africa-cattle-fence": "/catalog/cases/africa-cattle-fence.jpg",
  "ghana-feed-mill": "/catalog/cases/ghana-feed-mill.jpg",
  "nigeria-feed-production": "/catalog/cases/nigeria-feed-production.jpg",
  "ecuador-greenhouse": "/catalog/cases/ecuador-greenhouse.jpg",
  "tanzania-ventilation": "/catalog/cases/tanzania-ventilation.jpg",
  "philippines-fish-cage": "/catalog/cases/philippines-fish-cage.jpg",
  "fish-farm-equipment": "/catalog/cases/fish-farm-equipment.jpg",
  "se-asia-farm-machines": "/catalog/cases/se-asia-farm-machines.jpg",
  "sa-crop-farming": "/catalog/cases/sa-crop-farming.jpg",
}

export const heroFallback = "/images/heroes/farm-landscape.jpg"

export function getImageUrl(slug: string, type: 'category' | 'subcategory' | 'case-study' = 'category'): string {
  const map = type === 'category' ? categoryImages : type === 'subcategory' ? subcategoryImages : caseStudyImages
  return map[slug] || heroFallback
}

// Full image galleries per case study (from the AGRICON catalog)
export const caseStudyGalleries: Record<string, string[]> = {
  "africa-cattle-fence": ["/catalog/cases/africa-cattle-fence.jpg", "/catalog/cases/africa-cattle-fence-2.jpg", "/catalog/cases/africa-cattle-fence-3.jpg", "/catalog/cases/africa-cattle-fence-4.jpg"],
  "ecuador-greenhouse": ["/catalog/cases/ecuador-greenhouse.jpg", "/catalog/cases/ecuador-greenhouse-2.jpg", "/catalog/cases/ecuador-greenhouse-3.jpg", "/catalog/cases/ecuador-greenhouse-4.jpg"],
  "ghana-feed-mill": ["/catalog/cases/ghana-feed-mill.jpg", "/catalog/cases/ghana-feed-mill-2.jpg", "/catalog/cases/ghana-feed-mill-3.jpg", "/catalog/cases/ghana-feed-mill-4.jpg"],
  "indonesia-goat-pen": ["/catalog/cases/indonesia-goat-pen.jpg", "/catalog/cases/indonesia-goat-pen-2.jpg", "/catalog/cases/indonesia-goat-pen-3.jpg", "/catalog/cases/indonesia-goat-pen-4.jpg"],
  "kenya-layer-farm": ["/catalog/cases/kenya-layer-farm.jpg", "/catalog/cases/kenya-layer-farm-2.jpg", "/catalog/cases/kenya-layer-farm-3.jpg", "/catalog/cases/kenya-layer-farm-4.jpg"],
  "nigeria-feed-production": ["/catalog/cases/nigeria-feed-production.jpg", "/catalog/cases/nigeria-feed-production-2.jpg", "/catalog/cases/nigeria-feed-production-3.jpg", "/catalog/cases/nigeria-feed-production-4.jpg"],
  "philippines-fish-cage": ["/catalog/cases/philippines-fish-cage.jpg", "/catalog/cases/philippines-fish-cage-2.jpg", "/catalog/cases/philippines-fish-cage-3.jpg", "/catalog/cases/philippines-fish-cage-4.jpg"],
  "fish-farm-equipment": ["/catalog/cases/fish-farm-equipment.jpg", "/catalog/cases/fish-farm-equipment-2.jpg", "/catalog/cases/fish-farm-equipment-3.jpg", "/catalog/cases/fish-farm-equipment-4.jpg"],
  "sa-crop-farming": ["/catalog/cases/sa-crop-farming.jpg", "/catalog/cases/sa-crop-farming-2.jpg", "/catalog/cases/sa-crop-farming-3.jpg", "/catalog/cases/sa-crop-farming-4.jpg"],
  "se-asia-farm-machines": ["/catalog/cases/se-asia-farm-machines.jpg", "/catalog/cases/se-asia-farm-machines-2.jpg", "/catalog/cases/se-asia-farm-machines-3.jpg", "/catalog/cases/se-asia-farm-machines-4.jpg"],
  "tanzania-layer-farm": ["/catalog/cases/tanzania-layer-farm.jpg", "/catalog/cases/tanzania-layer-farm-2.jpg", "/catalog/cases/tanzania-layer-farm-3.jpg", "/catalog/cases/tanzania-layer-farm-4.jpg"],
  "tanzania-ventilation": ["/catalog/cases/tanzania-ventilation.jpg", "/catalog/cases/tanzania-ventilation-2.jpg", "/catalog/cases/tanzania-ventilation-3.jpg", "/catalog/cases/tanzania-ventilation-4.jpg"]
}
