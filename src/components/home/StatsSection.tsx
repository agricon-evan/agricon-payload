export default function StatsSection() {
  const stats = [
    { num: '20+', label: 'Countries Served' },
    { num: '500+', label: 'Farm Projects' },
    { num: '15+', label: 'Years in Business' },
    { num: '98%', label: 'On-time Delivery' },
  ]

  return (
    <section className="bg-[var(--color-primary-dark)] text-white py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
          {stats.map((s, i) => (
            <div key={s.label} className={`text-center reveal reveal-fade-up stagger-${i + 1}`}>
              <div className="stat-num">{s.num}</div>
              <div className="mt-2 text-sm md:text-base opacity-70">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
