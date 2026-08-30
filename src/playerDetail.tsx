import { useState, type ReactNode } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { projectionDisplay } from './playerEntityModel.mjs';

export type Player = {
  id: string; name: string; position: string; team: string; slot?: string | null; position_label?: string | null;
  role?: string | null; potential: number; consistency: number; value: number; expert_consensus: number;
  injury_risk: number; roster_grade: number; position_rank: number; projected_points?: number | null;
  projected_points_per_game?: number | null; projection_source?: string; projection_model_version?: string;
  team_offense_signal?: number | null; team_offense_signal_status?: string | null; team_offense_signal_source?: string | null;
  team_offense_signal_version?: string | null; team_offense_contribution?: number | null;
  team_offense_signal_components?: unknown; defensive_grade?: number | null; defensive_signal?: number | null;
  defensive_signal_status?: string | null; defensive_event_evidence?: unknown;
};

type TeamContext = { name: string; abbreviation: string; summary?: string; source?: string };
type Props = { player: Player; overallRank?: number | null; teamContext?: TeamContext | null; getSlotLabel: (player: Player) => string };
const unavailable = <span className="unavailable-value">Unavailable</span>;
const scoreFields: Array<[keyof Player, string]> = [['potential', 'Potential'], ['consistency', 'Consistency'], ['expert_consensus', 'Consensus'], ['value', 'Value'], ['injury_risk', 'Injury risk']];

export function PlayerDetailCard({ player, overallRank, teamContext, getSlotLabel }: Props) {
  const [mode, setMode] = useState<'season' | 'game'>('season');
  const projection = projectionDisplay(player, mode);
  const initials = player.name.split(' ').map((part) => part[0]).join('').slice(0, 2);
  return <article className="entity-page">
    <a className="back-link" href="/"><ArrowLeft size={16}/> Back to rankings</a>
    <section className="entity-hero" aria-labelledby="player-title">
      <div className="entity-avatar">{initials}</div><div className="entity-heading"><p className="eyebrow">PLAYER PROFILE · {player.position}</p><h1 id="player-title">{player.name}</h1><p>{player.team} · canonical slot <strong>{getSlotLabel(player)}</strong>{player.role ? ` · ${player.role}` : ''}</p></div>
      <div className="hero-grade"><span>RosterGrade</span><strong>{player.roster_grade}</strong></div>
    </section>
    <section className="entity-stats" aria-label="Player ranking and projection summary">
      <Metric label="Overall rank" value={overallRank ? `#${overallRank}` : unavailable}/><Metric label="Position rank" value={`#${player.position_rank < 99 ? player.position_rank : '—'}`}/><Metric label="Projected total points" value={finite(player.projected_points) ? player.projected_points : unavailable}/><Metric label="Projected points / game" value={finite(player.projected_points_per_game) ? player.projected_points_per_game : unavailable}/>
    </section>
    <section className="entity-section projection-panel"><SectionTitle title="Projection"/><div className="toggle" role="group" aria-label="Projection period"><button className={mode === 'season' ? 'selected' : ''} onClick={() => setMode('season')}>Season</button><button className={mode === 'game' ? 'selected' : ''} onClick={() => setMode('game')}>Per game</button></div><div className="projection-value"><strong>{projection === null ? unavailable : projection}</strong><span>{mode === 'season' ? 'projected fantasy points' : 'projected fantasy points / game'}</span></div><dl className="provenance"><div><dt>Source</dt><dd>{player.projection_source || unavailable}</dd></div><div><dt>Model version</dt><dd>{player.projection_model_version || unavailable}</dd></div></dl><p className="muted">Detailed passing, rushing, receiving, kicking, and floor/ceiling breakdowns are unavailable until the API supplies those categories.</p></section>
    <div className="entity-columns"><section className="entity-section"><SectionTitle title="Grade factors"/><div className="factor-list">{scoreFields.map(([field, label]) => <div className="factor" key={String(field)}><span>{label}</span><strong>{typeof player[field] === 'number' ? player[field] : unavailable}</strong><i><b style={{ width: `${typeof player[field] === 'number' ? player[field] : 0}%` }}/></i></div>)}</div></section><section className="entity-section"><SectionTitle title="Role, opportunity & context"/><div className="context-list"><Info label="Role" value={player.role || unavailable}/><Info label="Team environment signal" value={signalValue(player)}/><Info label="Team contribution" value={typeof player.team_offense_contribution === 'number' ? player.team_offense_contribution : unavailable}/></div></section></div>
    <section className="entity-section team-context"><SectionTitle title="Team context"/>{teamContext ? <><div className="team-context-heading"><span className="team-logo">{teamContext.abbreviation}</span><div><strong>{teamContext.name}</strong><p>{teamContext.summary || 'Team intelligence is available from the rankings workspace.'}</p></div><a href="/?view=teams">Open teams <ExternalLink size={14}/></a></div>{teamContext.source && <small>Context source: {teamContext.source}</small>}</> : <p className="muted">Team context is unavailable for this player.</p>}</section>
  </article>;
}
function Metric({ label, value }: { label: string; value: ReactNode }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
function Info({ label, value }: { label: string; value: ReactNode }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
function SectionTitle({ title }: { title: string }) { return <h2>{title}</h2>; }
function finite(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value); }
function signalValue(player: Player) { const status = player.team_offense_signal_status?.toLowerCase(); return finite(player.team_offense_signal) && !['unavailable', 'no_signal', 'pending'].includes(status || '') ? `${player.team_offense_signal}/100` : unavailable; }
