// Unsplash 无版权图片配置（无图时的 fallback）
// 所有图片来自 Unsplash（https://unsplash.com）免费使用

export const categoryImages: Record<string, string> = {
  "poultry-equipment": "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&h=600&fit=crop",
  "livestock-equipment": "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&h=600&fit=crop",
  "aquaculture-equipment": "https://images.unsplash.com/photo-1580437602927-2f43e9f2c499?w=800&h=600&fit=crop",
  "agriculture-machinery": "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=600&fit=crop",
  "breeding-house-equipment": "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&h=600&fit=crop",
  "slaughter-equipment": "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&h=600&fit=crop",
  "farming-tools": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop",
  "farming-vehicles": "https://images.unsplash.com/photo-1592837099284-fb86e40eb4ea?w=800&h=600&fit=crop",
  "wire-mesh-fencing": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop",
  "other-machines": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop",
}

export const subcategoryImages: Record<string, string> = {
  "layer-cage": "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&h=400&fit=crop",
  "broiler-cage": "https://images.unsplash.com/photo-1593125623959-7208a3d7b7a4?w=600&h=400&fit=crop",
  "hatcher-equipment": "https://images.unsplash.com/photo-1596627062348-685e5d2a0c40?w=600&h=400&fit=crop",
  "farm-fence": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop",
  "cattle-panels": "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600&h=400&fit=crop",
  "water-pump": "https://images.unsplash.com/photo-1580437602927-2f43e9f2c499?w=600&h=400&fit=crop",
  "pellet-machine": "https://images.unsplash.com/photo-1530268729831-9b083728a87e?w=600&h=400&fit=crop",
  "exhaust-fan": "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600&h=400&fit=crop",
  "plucker-machine": "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&h=400&fit=crop",
  "tractor": "https://images.unsplash.com/photo-1592837099284-fb86e40eb4ea?w=600&h=400&fit=crop",
  "welded-wire-mesh": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop",
}

export const caseStudyImages: Record<string, string> = {
  "kenya-layer-farm": "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&h=500&fit=crop",
  "tanzania-layer-farm": "https://images.unsplash.com/photo-1593125623959-7208a3d7b7a4?w=800&h=500&fit=crop",
  "indonesia-goat-pen": "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&h=500&fit=crop",
  "africa-cattle-fence": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=500&fit=crop",
  "ghana-feed-mill": "https://images.unsplash.com/photo-1530268729831-9b083728a87e?w=800&h=500&fit=crop",
  "nigeria-feed-production": "https://images.unsplash.com/photo-1530268729831-9b083728a87e?w=800&h=500&fit=crop",
  "ecuador-greenhouse": "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&h=500&fit=crop",
  "tanzania-ventilation": "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&h=500&fit=crop",
  "philippines-fish-cage": "https://images.unsplash.com/photo-1580437602927-2f43e9f2c499?w=800&h=500&fit=crop",
  "se-asia-farm-machines": "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=500&fit=crop",
  "sa-crop-farming": "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=500&fit=crop",
}

export const heroFallback = "https://images.unsplash.com/photo-1516253593875-bd7ba052b1b1?w=1400&h=700&fit=crop"

export function getImageUrl(slug: string, type: 'category' | 'subcategory' | 'case-study' = 'category'): string {
  const map = type === 'category' ? categoryImages : type === 'subcategory' ? subcategoryImages : caseStudyImages
  return map[slug] || heroFallback
}
