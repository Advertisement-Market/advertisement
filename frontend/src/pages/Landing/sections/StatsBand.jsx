import { Reveal } from '@/components/ui/Reveal';
import { Counter } from '@/components/ui/Counter';
import { STATS_BAND } from '@/data/landing';

export function StatsBand() {
  return (
    <section className="stats-band">
      <div className="stats-grid">
        {STATS_BAND.map((stat, i) => (
          <Reveal as="div" className="stat-block" index={i} key={stat.label}>
            <Counter className="stat-val" target={stat.target} />
            <span className="stat-lbl">{stat.label}</span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
