import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowUpDown, BarChart3, CalendarClock, ChevronRight, CircleHelp, Layers3, Search, Shield, Sparkles, Trophy, Users } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '');
const positions = ['ALL', 'QB', 'RB', 'WR', 'TE', 'K', 'D/ST'];
type Player = { id: string; name: string; position: string; team: string; role?: string; potential: number; consistency: number; value: number; expert_consensus: number; injury_risk: number; roster_grade: number; position_rank: number; projected_points?: number; projected_points_per_game?: number; projection_source?: string; projection_model_version?: string };
type Team = { id: string; abbreviation: string; name: string; logo?: string | null };

export default function App() {
  const [view, setView] = useState<'players' | 'offenses' | 'defenses' | 'mock'>('players');
  const [position, setPosition] = useState('ALL');
  const [sort, setSort] = useState('roster_grade');
  const [reception, setReception] = useState(1);
  const [search, setSearch] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const projectedCount = players.filter(player => typeof player.projected_points === 'number').length;
  const projectionSource = players.find(player => player.projection_source)?.projection_source;
  const projectionModel = players.find(player => player.projection_model_version)?.projection_model_version;

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/rankings?position=${position === 'ALL' ? '' : position}&sort=${sort}&reception=${reception}&search=${encodeURIComponent(search)}`).then(r => r.json()),
      fetch(`${API}/api/teams`).then(r => r.json()),
    ]).then(([rankingData, teamData]) => {
      setPlayers(rankingData.players || []); setLastRefresh(rankingData.last_refresh); setSource(rankingData.source || null); setTeams(teamData.teams || []);
    }).finally(() => setLoading(false));
  }, [position, sort, search, reception]);

  const visiblePlayers = useMemo(() => view === 'defenses' ? players.filter(p => p.position === 'D/ST') : view === 'offenses' ? [] : players, [players, view]);

  return <div className="app-shell">
    <header className="topbar"><div className="brand"><div className="brand-mark"><Sparkles size={18} /></div><div><strong>RosterGrade</strong><span>Fantasy intelligence</span></div></div><div className="season-pill"><Activity size={16} /> 2026 season workspace</div><button className="avatar">GP</button></header>
    <main className="workspace">
      <aside className="sidebar"><div className="side-label">Workspace</div><button className={view === 'players' ? 'nav active' : 'nav'} onClick={() => setView('players')}><BarChart3 size={18}/> Player rankings</button><button className={view === 'offenses' ? 'nav active' : 'nav'} onClick={() => setView('offenses')}><Users size={18}/> Team offenses</button><button className={view === 'defenses' ? 'nav active' : 'nav'} onClick={() => setView('defenses')}><Shield size={18}/> Defenses</button><div className="side-label space-top">Draft room</div><button className={view === 'mock' ? 'nav active' : 'nav'} onClick={() => setView('mock')}><Layers3 size={18}/> Mock draft</button><div className="sidebar-note"><CircleHelp size={16}/><span>Grades explain the why, not just the rank.</span></div></aside>
      <section className="content"><div className="page-heading"><div><p className="eyebrow">THE BOARD</p><h1>{view === 'players' ? 'Player rankings' : view === 'offenses' ? 'Team offenses' : view === 'defenses' ? 'Defensive units' : 'Mock draft room'}</h1><p className="subhead">A broader view of fantasy value, built for decisions that last beyond draft day.</p></div><button className="primary"><Trophy size={17}/> My roster</button></div>
        {view === 'mock' ? <MockDraft players={players} /> : view === 'offenses' ? <Offenses teams={teams} players={players} /> : <><div className="insight"><div className="insight-icon"><Sparkles size={18}/></div><div><strong>RosterGrade is more than a projection.</strong><span>Potential measures ceiling and opportunity. Consistency measures how safely a player gets you there. {projectedCount ? `${projectedCount} players have a ${projectionModel || 'versioned'} projection.` : 'Projections are waiting for the scheduled worker.'}</span></div><ChevronRight size={18}/></div><div className="toolbar"><div className="search"><Search size={17}/><input placeholder="Search player or team" value={search} onChange={e => setSearch(e.target.value)}/></div><div className="sort"><ArrowUpDown size={16}/><select value={sort} onChange={e => setSort(e.target.value)}><option value="roster_grade">RosterGrade</option><option value="projected_points">Projected points</option><option value="potential">Potential</option><option value="consistency">Consistency</option><option value="value">Value</option><option value="name">Name</option></select></div><label className="scoring-input">Points per reception <input aria-label="Points per reception" type="number" min="0" max="2" step="0.5" value={reception} onChange={e => setReception(Number(e.target.value))}/></label></div><div className="position-tabs">{positions.map(item => <button key={item} className={position === item ? 'tab selected' : 'tab'} onClick={() => setPosition(item)}>{item}</button>)}</div><div className="table-card"><div className="table-head"><span>Player</span><span>Position</span><span>RosterGrade</span><span>Potential</span><span>Consistency</span><span>Consensus</span><span>Injury risk</span><span>Value</span></div>{loading ? <div className="empty">Loading rankings…</div> : visiblePlayers.map((player, index) => <PlayerRow key={player.id} player={player} index={index}/>)}</div><div className="updated"><CalendarClock size={15}/> Rankings last refreshed {lastRefresh ? new Date(lastRefresh).toLocaleString() : 'not yet'} · metadata: {source || 'pending'} · projections: {projectionSource || 'pending'} · refreshes at most once per day</div></>}
      </section>
    </main>
  </div>;
}

function scoreClass(value: number) { return value >= 90 ? 'excellent' : value >= 80 ? 'good' : 'steady'; }
function PlayerRow({ player, index }: { player: Player; index: number }) { const projection = player.projected_points != null ? `${player.projected_points} projected points${player.projected_points_per_game != null ? ` · ${player.projected_points_per_game}/game` : ''}` : 'projection pending'; return <div className="player-row"><div className="player-name"><span className="rank">{index + 1}</span><div className="player-avatar">{player.name.split(' ').map(p => p[0]).join('').slice(0, 2)}</div><div><strong>{player.name}</strong><span>{player.team} · {player.role ? `${player.role} · ` : ''}{projection}</span></div></div><div><span className="position-badge">{player.position}</span></div><div className="grade"><strong>{player.roster_grade}</strong><span>{player.position_rank <= 3 ? `Top ${player.position_rank}` : 'strong value'}</span></div><Score value={player.potential}/><Score value={player.consistency}/><Score value={player.expert_consensus}/><Score value={100 - player.injury_risk}/><Score value={player.value}/></div>; }
function Score({ value }: { value: number }) { return <div className="score"><span className={scoreClass(value)}>{value}</span><div className="meter"><i style={{ width: `${value}%` }}/></div></div>; }
function Offenses({ teams, players }: { teams: Team[]; players: Player[] }) { const grouped = teams.slice(0, 16); return <div className="team-grid">{grouped.map(team => { const members = players.filter(p => p.team === team.abbreviation); return <article className="team-card" key={team.id}><div className="team-logo">{team.abbreviation?.slice(0, 2)}</div><div><strong>{team.name}</strong><span>{members.length ? `${members.length} graded players` : 'Team environment profile'}</span></div><ChevronRight size={17}/></article>})}</div>; }
function MockDraft({ players }: { players: Player[] }) { const [picks, setPicks] = useState<Player[]>([]); const next = players.find(p => !picks.some(x => x.id === p.id)); return <div className="mock-layout"><div className="draft-board"><div className="draft-banner"><div><p className="eyebrow">LIVE SIMULATION</p><h2>Giovanni's practice draft</h2></div><span className="live-dot">● LIVE</span></div><div className="draft-meta"><span>12 teams</span><span>Snake format</span><span>Pick {picks.length + 1}.01</span></div>{picks.length ? picks.map((p, i) => <div className="draft-pick" key={p.id}><span>{i + 1}</span><strong>{p.name}</strong><em>{p.position} · {p.team}</em></div>) : <div className="empty draft-empty">Your picks will appear here. Select a player to begin.</div>}</div><div className="on-clock"><p className="eyebrow">ON THE CLOCK</p><h3>{next?.name || 'Draft complete'}</h3><p>{next ? `${next.position} · ${next.team} · Grade ${next.roster_grade}` : 'All available players selected.'}</p>{next && <button className="primary full" onClick={() => setPicks([...picks, next])}>Draft player <ChevronRight size={17}/></button>}<button className="ghost full" onClick={() => setPicks([])}>Reset simulation</button></div></div>; }
