import { useState, type ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import * as playerEntityModel from './playerEntityModel.mjs';
import { EntityCard, formatMetric, unavailableValue } from './entityCard';

const projectionDisplay = playerEntityModel.projectionDisplay;
const isDST = playerEntityModel.isDST;
const defensiveEventEvidence = playerEntityModel.defensiveEventEvidence;
const defensiveEventDefinitions = playerEntityModel.defensiveEventDefinitions;

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
const unavailable = unavailableValue();
const scoreFields: Array<[keyof Player, string]> = [['potential', 'Potential'], ['consistency', 'Consistency'], ['expert_consensus', 'Consensus'], ['value', 'Value'], ['injury_risk', 'Injury risk']];

export function PlayerDetailCard({ player, overallRank, teamContext, getSlotLabel }: Props) {
  const [mode, setMode] = useState<'season' | 'game'>('season');
  const projection = projectionDisplay(player, mode);
  const dst = isDST(player);
  return <EntityCard identity={{ kind: dst ? 'dst' : 'player', position: player.position, name: player.name, team: player.team, slot: getSlotLabel(player), role: player.role, grade: player.roster_grade }} metrics={[
    { label: 'Overall rank', value: overallRank ? formatMetric(overallRank, '#') : unavailable },
    { label: 'Position rank', value: player.position_rank < 99 ? formatMetric(player.position_rank, '#') : unavailable },
    { label: 'Projected total points', value: formatMetric(player.projected_points) },
    { label: 'Projected points / game', value: formatMetric(player.projected_points_per_game) },
  ]}>
    <section className="entity-section projection-panel"><SectionTitle title="Projection"/><div className="toggle" role="group" aria-label="Projection period"><button aria-pressed={mode === 'season'} className={mode === 'season' ? 'selected' : ''} onClick={() => setMode('season')}>Season</button><button aria-pressed={mode === 'game'} className={mode === 'game' ? 'selected' : ''} onClick={() => setMode('game')}>Per game</button></div><div className="projection-value"><strong>{projection === null ? unavailable : projection}</strong><span>{mode === 'season' ? 'projected fantasy points' : 'projected fantasy points / game'}</span></div><dl className="provenance"><div><dt>Source</dt><dd>{player.projection_source || unavailable}</dd></div><div><dt>Model version</dt><dd>{player.projection_model_version || unavailable}</dd></div></dl><p className="muted">{dst ? 'Fantasy projection is separate from defensive strength and is not itself evidence of defensive events.' : 'Detailed passing, rushing, receiving, kicking, and floor/ceiling breakdowns are unavailable until the API supplies those categories.'}</p></section>
    {dst ? <DefenseEvents player={player}/> : <div className="entity-columns"><section className="entity-section"><SectionTitle title="Grade factors"/><div className="factor-list">{scoreFields.map(([field, label]) => <div className="factor" key={String(field)}><span>{label}</span><strong>{typeof player[field] === 'number' ? player[field] : unavailable}</strong><i><b style={{ width: `${typeof player[field] === 'number' ? player[field] : 0}%` }}/></i></div>)}</div></section><section className="entity-section"><SectionTitle title="Role, opportunity & context"/><div className="context-list"><Info label="Role" value={player.role || unavailable}/><Info label="Team environment signal" value={signalValue(player)}/><Info label="Team contribution" value={typeof player.team_offense_contribution === 'number' ? player.team_offense_contribution : unavailable}/></div></section></div>}
    <section className="entity-section team-context"><SectionTitle title="Team context"/>{teamContext ? <><div className="team-context-heading"><span className="team-logo">{teamContext.abbreviation}</span><div><strong>{teamContext.name}</strong><p>{teamContext.summary || 'Team intelligence is available from the rankings workspace.'}</p></div><a href="/?view=teams">Open teams <ExternalLink size={14}/></a></div>{teamContext.source && <small>Context source: {teamContext.source}</small>}</> : <p className="muted">Team context is unavailable for this player.</p>}</section>
  </EntityCard>;
}
function DefenseEvents({ player }: { player: Player }) {
  const evidence = defensiveEventEvidence(player);
  return <section className="entity-section defensive-events"><SectionTitle title="Defensive event evidence"/><p className="muted">Auditable event-derived components only. Defensive grade/signal remains a separate strength measure.</p><div className="event-grid">{defensiveEventDefinitions().map(({ key, label }) => { const event = evidence.events[key]; const statusLabel = event.status === 'invalid' || event.status === 'invalid_data' ? 'Invalid data' : event.status; return <div className={`event-card event-${event.status}`} key={key}><div className="event-card-heading"><span>{label}</span><strong className={`event-status status-${event.status}`} aria-label={`${label} evidence status: ${statusLabel}`}>{statusLabel}</strong></div><strong className="event-season">{event.season === null ? unavailable : event.season}</strong><small>Season total · {event.season === null ? 'Unavailable' : 'reported'}</small><small>Per game · {event.perGame === null ? 'Unavailable' : event.perGame}</small><small>Scoring contribution · {event.scoringContribution === null ? 'Unavailable' : event.scoringContribution}</small><small className={event.source ? '' : 'unavailable-text'}>{event.source ? `Source: ${event.source}` : 'Source: Unavailable'}</small></div>; })}</div><dl className="provenance"><div><dt>Evidence status</dt><dd>{evidence.status === 'invalid' || evidence.status === 'invalid_data' ? 'Invalid data' : evidence.status}</dd></div><div><dt>Evidence source</dt><dd>{evidence.source || unavailable}</dd></div><div><dt>Defensive grade / signal</dt><dd>{finite(player.defensive_grade) ? player.defensive_grade : unavailable} / {finite(player.defensive_signal) ? player.defensive_signal : unavailable}</dd></div></dl></section>;
}
function Info({ label, value }: { label: string; value: ReactNode }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
function SectionTitle({ title }: { title: string }) { return <h2>{title}</h2>; }
function finite(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value); }
function signalValue(player: Player) { const status = player.team_offense_signal_status?.toLowerCase(); return finite(player.team_offense_signal) && !['unavailable', 'no_signal', 'pending'].includes(status || '') ? `${player.team_offense_signal}/100` : unavailable; }
