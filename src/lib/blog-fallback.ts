// Fallback blog articles — used when the CMS blog is empty (fresh DB).
// Topics and facts follow the AGRICON catalog and poultry/livestock operating practice.

export interface FallbackArticle {
  slug: string
  title: string
  excerpt: string
  date: string
  coverUrl: string | null
  /** sections rendered in the detail page */
  sections: { heading: string; body: string; bullets?: string[] }[]
}

export const FALLBACK_ARTICLES: FallbackArticle[] = [
  {
    slug: 'layer-cage-guide',
    title: 'How to Choose the Right Layer Cage System',
    excerpt: 'A practical guide to A-type and H-type systems, capacity planning, climate control and long-term operating cost.',
    date: '2026',
    coverUrl: '/catalog/categories/poultry-equipment.jpg',
    sections: [
      {
        heading: 'Start with Capacity, Not Price',
        body: 'The first question is not which cage is cheapest but how many birds your house must hold and how many batches per year you plan. Capacity decides rows, tiers and the feeding and drinking line lengths. For a typical commercial house, work backwards from target egg output per day, then check the usable floor area and ceiling height.',
      },
      {
        heading: 'A-Type vs H-Type vs Manure-Belt',
        body: 'A-type (stair-step) cages are compact, low-cost and easy to install — a good fit for smaller houses and manual egg collection. H-type (vertical) cages make much better use of ceiling height and suit larger automated houses, but require stronger house structure and better ventilation. Manure-belt systems remove droppings continuously and are recommended for hot climates or houses where ammonia control matters.',
        bullets: [
          'A-type: low investment, simple installation, manual or semi-automatic collection',
          'H-type: high density, full automation, needs good house structure',
          'Manure-belt: cleaner air, less labor, better for hot regions',
        ],
      },
      {
        heading: 'Climate and Ventilation Come First',
        body: 'A cage system is only as productive as the environment around it. In hot climates, choose systems with wider aisles and plan for tunnel ventilation and evaporative cooling before the cages arrive. Where humidity is high, manure removal and air exchange determine ammonia levels, which directly affect egg production and flock health.',
      },
      {
        heading: 'Match Automation to Labor Cost',
        body: 'Automatic feeding, drinking, egg collection and manure removal reduce daily labor and make results more consistent. If labor is cheap but scarce in skill, a partial automation package — automatic feeding plus manual egg collection — is often the practical middle step. Automation also reduces human contact with birds, which supports biosecurity.',
      },
      {
        heading: 'Calculate the Full Cost, Not the Cage Price',
        body: 'Compare systems on installed cost per bird, expected lifespan, spare-parts availability and daily operating cost. Galvanized steel with adequate coating, reliable drinker and feeder components, and easy-to-replace wear parts protect your investment over the full production cycle.',
      },
    ],
  },
  {
    slug: 'incubation-guide',
    title: 'Five Factors Behind Better Hatch Rates',
    excerpt: 'Temperature, humidity, turning, ventilation and sanitation — the operating details that protect your incubation results.',
    date: '2026',
    coverUrl: '/catalog/categories/breeding-house-equipment.jpg',
    sections: [
      {
        heading: '1. Stable Temperature',
        body: 'Embryo development depends on a narrow temperature band. Fluctuations during the first half of incubation cause the most damage, so the incubator must hold set-point temperature with minimal drift. Calibrate sensors regularly and avoid placing the machine in direct sunlight or near strong drafts.',
      },
      {
        heading: '2. Humidity Control',
        body: 'Humidity controls moisture loss from the egg and affects the size of the air cell at hatch. Too low and chicks stick to shells; too high and they drown or hatch late. Track weight loss against the expected curve and adjust water input to the incubator rather than guessing by feel.',
      },
      {
        heading: '3. Correct Egg Turning',
        body: 'Turning prevents the embryo from sticking to the shell membrane and supports even nutrient use. Turn at least every two hours during the first 18 days, then stop turning in the hatcher. Consistent turning frequency matters more than the exact angle used by the machine.',
      },
      {
        heading: '4. Fresh Air and CO₂ Control',
        body: 'Embryos consume oxygen and release carbon dioxide. Ventilation must increase with embryo age and with machine load. In multi-stage machines, match air exchange to the number of eggs so early embryos are not stressed by CO₂ from late-stage eggs.',
      },
      {
        heading: '5. Sanitation and Egg Handling',
        body: 'Clean eggs from clean nests give the best results. Wash only when necessary and with correct water temperature, because dirty handling or washing with cold water drives bacteria into the shell. Disinfect the incubator, hatcher and trays between batches, and keep records so a bad batch can be traced to the operation that caused it.',
      },
    ],
  },
  {
    slug: 'feed-mill-guide',
    title: 'Designing a Profitable Feed Processing Line',
    excerpt: 'How to match grinding, mixing, pelleting and bagging capacity to your farm and market plan.',
    date: '2026',
    coverUrl: '/catalog/categories/agriculture-machinery.jpg',
    sections: [
      {
        heading: 'Define Output Before Buying Equipment',
        body: 'A feed line is a chain: grinding, mixing, pelleting, cooling and bagging. Every stage must handle the target hourly output, otherwise the weakest link caps the whole line. Decide whether you feed only your own flock or also sell feed, because that changes the required capacity and the level of automation.',
      },
      {
        heading: 'Grinding: Match Screen and Power to the Material',
        body: 'The hammer mill or disc mill must match your main raw materials — maize, wheat, cassava, rice by-products. Screen size controls particle size, which affects mixing quality and pellet durability. For mixed raw materials, choose a machine with adjustable screens and enough power to avoid frequent blockages.',
      },
      {
        heading: 'Mixing: Consistency Is the Product',
        body: 'Feed quality is measured by uniformity. A vertical mixer is practical for medium farms; ribbon mixers suit larger, continuous lines. Check mixing time in the manual and stick to it — over-mixing wastes energy and can separate light ingredients. Add liquid ingredients only with a mixer designed for it.',
      },
      {
        heading: 'Pelleting and Cooling',
        body: 'Pellets reduce waste, improve digestibility and make feed easier to store and transport. The pellet mill must be matched to the die size for your target species — poultry, pig or fish. Hot pellets must be cooled and dried before bagging, otherwise moisture causes mould in storage.',
        bullets: [
          'Grinding → mixing → pelleting → cooling → bagging, with matched capacity',
          'Die size and conditioner time depend on the target species',
          'Cooling before bagging prevents mould and extends shelf life',
        ],
      },
      {
        heading: 'Layout, Labor and Quality Control',
        body: 'Keep the flow linear: intake, grinding, mixing, pelleting, bagging, storage. A clean layout reduces manual carrying and makes daily cleaning possible. Keep samples of each batch, record formulation changes, and calibrate the scales regularly — in feed production, consistency is what customers pay for.',
      },
    ],
  },
]

export function getFallbackArticle(slug: string): FallbackArticle | undefined {
  return FALLBACK_ARTICLES.find((a) => a.slug === slug)
}
