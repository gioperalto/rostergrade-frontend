import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

export type EntityKind = 'player' | 'dst';
export type EntityMetric = { label: string; value: ReactNode };
export type EntityIdentity = {
  kind: EntityKind;
  position: string;
  name: string;
  team: string;
  slot: string;
  role?: string | null;
  grade: ReactNode;
};

type Props = {
  identity: EntityIdentity;
  metrics: EntityMetric[];
  children: ReactNode;
};

/** Shared identity/ranking shell. Future D/ST profiles can supply the same shell and their own sections. */
export function EntityCard({ identity, metrics, children }: Props) {
  const initials = identity.name.split(' ').map((part) => part[0]).join('').slice(0, 2);
  return <article className="entity-page">
    <a className="back-link" href="/"><ArrowLeft size={16}/> Back to rankings</a>
    <section className="entity-hero" aria-labelledby="entity-title">
      <div className="entity-avatar">{initials}</div><div className="entity-heading"><p className="eyebrow">{identity.kind === 'player' ? 'PLAYER PROFILE' : 'D/ST PROFILE'} · {identity.position}</p><h1 id="entity-title">{identity.name}</h1><p>{identity.team} · canonical slot <strong>{identity.slot}</strong>{identity.role ? ` · ${identity.role}` : ''}</p></div>
      <div className="hero-grade"><span>RosterGrade</span><strong>{identity.grade}</strong></div>
    </section>
    <section className="entity-stats" aria-label="Entity ranking and projection summary">{metrics.map((metric) => <div key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong></div>)}</section>
    {children}
  </article>;
}

export function unavailableValue() { return <span className="unavailable-value">Unavailable</span>; }
export function formatMetric(value: unknown, prefix = ''): ReactNode {
  return typeof value === 'number' && Number.isFinite(value) ? `${prefix}${value}` : unavailableValue();
}
