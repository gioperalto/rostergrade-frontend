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
  headingId?: string;
  backHref?: string;
  backLabel?: string;
};

/** Shared identity/ranking shell. Future D/ST profiles can supply the same shell and their own sections. */
export function EntityCard({ identity, metrics, children, headingId = 'entity-title', backHref = '/', backLabel = 'Back to rankings' }: Props) {
  const name = typeof identity.name === 'string' ? identity.name.trim() : '';
  const initials = name ? name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() : '??';
  return <article className="entity-page">
    <a className="back-link" href={backHref}><ArrowLeft size={16}/> {backLabel}</a>
    <section className="entity-hero" aria-labelledby={headingId}>
      <div className="entity-avatar">{initials}</div><div className="entity-heading"><p className="eyebrow">{identity.kind === 'player' ? 'PLAYER PROFILE' : 'D/ST PROFILE'} · {identity.position}</p><h1 id={headingId}>{name || 'Unknown entity'}</h1><p>{identity.team} · canonical slot <strong>{identity.slot}</strong>{identity.role ? ` · ${identity.role}` : ''}</p></div>
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
