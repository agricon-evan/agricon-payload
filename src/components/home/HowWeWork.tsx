import Icon from '@/components/ui/Icon'
import Reveal from '@/components/ui/Reveal'
import SectionHeading from '@/components/ui/SectionHeading'

// Six client-facing stages adapted directly from the Agricon catalog:
// Inquiry, Analysis, Matching, Confirmation, Delivery and Support.
export default function HowWeWork() {
  const steps = [
    { icon: 'users', title: 'Inquiry', desc: 'Understand farm type, capacity, product interest, application scenario and purchasing purpose.' },
    { icon: 'search', title: 'Analysis', desc: 'Review project conditions, operation goals, site requirements and budget expectations.' },
    { icon: 'target', title: 'Matching', desc: 'Recommend suitable products, product lines and accessory packages for the confirmed needs.' },
    { icon: 'clipboard', title: 'Confirmation', desc: 'Finalize models, quantities, specifications, packing and shipment planning before production.' },
    { icon: 'truck', title: 'Delivery', desc: 'Coordinate export packing, container loading, shipping support and required documents.' },
    { icon: 'handshake', title: 'Support', desc: 'Continue with product information, spare parts, repeat orders and future project expansion.' },
  ]

  return (
    <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
      <Reveal>
        <SectionHeading
          eyebrow="How We Work"
          title={<>From Inquiry to <span className="split-accent">Support</span></>}
          description="A structured, evidence-based process — designed to lower your risk on every first order"
        />
      </Reveal>

      {/* Desktop: 3×2 process grid. Arrows connect cards within each row. */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr gap-5 md:gap-6 mt-10">
        {steps.map((step, index) => {
          const isRowEnd = index === 2 || index === 5
          return (
            <Reveal key={step.title} delay={index * 80} className="relative h-full">
              <div className="card card-hover h-full min-h-[176px] p-5 md:p-6 flex flex-col text-left">
                {/* 第一排：图标与标题两端对齐 */}
                <div className="flex items-center justify-between gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-md bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center">
                    <Icon name={step.icon} size={22} />
                  </div>
                  <h3 className="text-right text-[var(--color-text)] leading-tight">{step.title}</h3>
                </div>
                {/* 第二排：具体流程内容 */}
                <p className="mt-5 pt-4 border-t border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] leading-relaxed flex-1">
                  {step.desc}
                </p>
              </div>
              {!isRowEnd && (
                <Icon
                  name="chevron-right"
                  size={18}
                  className="hidden lg:block absolute top-1/2 -right-[21px] z-10 -translate-y-1/2 text-[var(--color-accent)]"
                />
              )}
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
