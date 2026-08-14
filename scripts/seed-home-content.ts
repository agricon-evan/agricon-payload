/**
 * Seeds the SiteSettings homepage section JSON fields with the current
 * built-in defaults, so the admin can edit them (JSON) immediately.
 * Idempotent — only fills fields that are empty.
 * Usage: pnpm tsx scripts/seed-home-content.ts
 */
import 'dotenv/config'
import { getPayload } from 'payload'

process.env.PAYLOAD_PUSH_SCHEMA = 'false'

async function main() {
  const payload = await getPayload({ config: (await import('../src/payload.config')).default })
  const { docs } = await payload.find({ collection: 'siteSettings', limit: 1 })
  const doc = docs[0] as { id: number; homeTestimonials?: unknown; homeWhyChooseUs?: unknown; homeHowWeWork?: unknown; homeGlobalCoverage?: unknown; homeValueCalculated?: unknown; homeTrustEvidence?: unknown }
  if (!doc) { console.log('siteSettings not found'); process.exit(1) }

  const data: Record<string, unknown> = {}
  if (!doc.homeTestimonials) data.homeTestimonials = [
    { quote: 'Layer cages, feeding, drinking and poultry accessories coordinated for commercial egg production and farm expansion.', name: 'Kenya Layer Farm', role: 'Layer poultry project' },
    { quote: 'Grinding, mixing, pelletizing, cooling and packing support combined into a practical feed production package.', name: 'Ghana Feed Mill Setup', role: 'Animal feed processing project' },
    { quote: 'Floating cage, fish net, walkway support and mooring parts organized for lake, river and coastal aquaculture operations.', name: 'Philippines Fish Cage Support', role: 'Aquaculture equipment package' },
  ]
  if (!doc.homeWhyChooseUs) data.homeWhyChooseUs = [
    { icon: 'layers', title: 'Coordinated Sourcing', desc: 'Poultry, livestock, feed processing, aquaculture, infrastructure and machinery through one supply window.' },
    { icon: 'shield', title: 'Quality & Order Control', desc: 'Product scope, specifications, quantities and key inspection points are confirmed before shipment.' },
    { icon: 'target', title: 'Project-Based Selection', desc: 'Equipment is matched to farm type, target capacity, site conditions, operating requirements and budget.' },
    { icon: 'truck', title: 'Export-Ready Delivery', desc: 'Export packing, product identification, loading plans, container coordination and shipping documents.' },
    { icon: 'users', title: 'Distributor Support', desc: 'Flexible product combinations, repeat-order support and coordinated sourcing for local market development.' },
    { icon: 'handshake', title: 'Long-Term Cooperation', desc: 'From individual equipment to complete project packages, we support expansion and repeat supply.' },
  ]
  if (!doc.homeHowWeWork) data.homeHowWeWork = [
    { icon: 'users', title: 'Inquiry', desc: 'Understand farm type, capacity, product interest, application scenario and purchasing purpose.' },
    { icon: 'search', title: 'Analysis', desc: 'Review project conditions, operation goals, site requirements and budget expectations.' },
    { icon: 'target', title: 'Matching', desc: 'Recommend suitable products, product lines and accessory packages for the confirmed needs.' },
    { icon: 'clipboard', title: 'Confirmation', desc: 'Finalize models, quantities, specifications, packing and shipment planning before production.' },
    { icon: 'truck', title: 'Delivery', desc: 'Coordinate export packing, container loading, shipping support and required documents.' },
    { icon: 'handshake', title: 'Support', desc: 'Continue with product information, spare parts, repeat orders and future project expansion.' },
  ]
  if (!doc.homeGlobalCoverage) data.homeGlobalCoverage = [
    { icon: 'building', title: 'Farm Operations', sub: 'Poultry, livestock, aquaculture and crop production equipment for daily operation.' },
    { icon: 'layers', title: 'Processing & Supply', sub: 'Feed preparation, pelletizing, machinery and mixed-category equipment sourcing.' },
    { icon: 'warehouse', title: 'Infrastructure', sub: 'Farm structures, ventilation, cooling, storage, fencing and environmental support.' },
    { icon: 'globe', title: 'International Buyers', sub: 'Export coordination for farms, importers, distributors and project buyers worldwide.' },
  ]
  if (!doc.homeValueCalculated) data.homeValueCalculated = [
    { icon: 'trending-down', title: 'Portfolio Breadth', items: [{ label: 'Product categories', value: '10+' }, { label: 'Product options', value: '100+' }, { label: 'Supply model', value: 'Integrated' }] },
    { icon: 'zap', title: 'Global Delivery', items: [{ label: 'Export markets', value: '30+' }, { label: 'Container shipments', value: '500+' }, { label: 'Delivery support', value: 'End-to-end' }] },
    { icon: 'shield', title: 'Project Fit', items: [{ label: 'Selection basis', value: 'Farm type' }, { label: 'Capacity and site', value: 'Matched' }, { label: 'Supply window', value: 'One partner' }] },
  ]
  if (!doc.homeTrustEvidence) data.homeTrustEvidence = [
    { icon: 'shield', title: 'Quality & Order Control', items: ['Product scope confirmed', 'Specifications and quantities checked', 'Key inspection points agreed', 'Production follow-up coordinated'] },
    { icon: 'clipboard', title: 'Project Matching', items: ['Farm type and capacity reviewed', 'Site conditions considered', 'Equipment and accessories matched', 'Practical configuration proposed'] },
    { icon: 'briefcase', title: 'Coordinated Supply', items: ['Multiple categories through one window', 'Flexible equipment combinations', 'Individual orders or project packages', 'Repeat-order support for distributors'] },
    { icon: 'file-text', title: 'Export-Ready Delivery', items: ['Export packing and labeling', 'Container loading plans', 'Shipping document preparation', 'Shipment coordination to dispatch'] },
  ]

  if (Object.keys(data).length === 0) {
    console.log('All home sections already seeded.')
    process.exit(0)
  }
  await payload.update({ collection: 'siteSettings', id: doc.id, data })
  console.log(`Seeded ${Object.keys(data).length} home sections: ${Object.keys(data).join(', ')}`)
  process.exit(0)
}

main().catch((err) => { console.error(err); process.exit(1) })
