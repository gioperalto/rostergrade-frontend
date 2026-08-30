import { PUBLISHED_MATCHUPS } from './nfl2026Schedule.mjs';

export const STARTER_SLOTS = ['QB1', 'RB1', 'RB2', 'WR1', 'WR2', 'WR3', 'TE1'];
export const TEAM_ABBREVIATIONS = ['ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC', 'LV', 'LAC', 'LAR', 'MIA', 'MIN', 'NE', 'NO', 'NYG', 'NYJ', 'PHI', 'PIT', 'SEA', 'SF', 'TB', 'TEN', 'WSH'];
export const NEUTRAL_INDEX = 50;
export const NEUTRAL_GRADE = 70;
export const NEUTRAL_DEFENSE = 50;
export const BASELINE_WINS = 8.5;
export const OFFENSE_WIN_SCALE = 11;
export const PRODUCTION_BASELINE = 850;

const positionsForSlot = { QB1: ['QB'], RB1: ['RB'], RB2: ['RB'], WR1: ['WR'], WR2: ['WR'], WR3: ['WR'], TE1: ['TE'] };
const finite = value => typeof value === 'number' && Number.isFinite(value);
const numericOrZero = value => finite(value) ? value : 0;
const usableDefenseStatus = status => {
  const normalized = String(status ?? '').trim().toLowerCase();
  return normalized !== '' && !['unavailable', 'pending', 'no_signal'].includes(normalized);
};
const slotLabel = player => {
  const supplied = String(player.slot || player.position_label || '').trim();
  if (supplied && supplied.toLowerCase() !== 'starter') return supplied.toUpperCase();
  return `${player.position}${player.position_rank || ''}`.toUpperCase();
};
const stablePreference = (a, b) => (numericOrZero(b.roster_grade) - numericOrZero(a.roster_grade)) || (numericOrZero(b.projected_points) - numericOrZero(a.projected_points)) || String(a.id).localeCompare(String(b.id));
const uniqueById = rows => [...new Map(rows.map(row => [String(row.id), row])).values()];

export function deriveMetrics(abbreviation, players) {
  const candidates = uniqueById(players.filter(player => player.team === abbreviation && ['QB', 'RB', 'WR', 'TE'].includes(player.position) && finite(player.roster_grade) && player.roster_grade > 0 && finite(player.projected_points) && player.projected_points > 0));
  const starterMap = new Map();
  for (const slot of STARTER_SLOTS) {
    const compatible = candidates.filter(player => slotLabel(player) === slot && positionsForSlot[slot].includes(player.position)).sort(stablePreference);
    if (compatible[0]) starterMap.set(slot, compatible[0]);
  }
  const starters = STARTER_SLOTS.map(slot => starterMap.get(slot)).filter(Boolean);
  const perGamePlayers = starters.filter(player => finite(player.projected_points_per_game) && player.projected_points_per_game > 0);
  const projected = starters.reduce((sum, player) => sum + player.projected_points, 0);
  const perGame = perGamePlayers.reduce((sum, player) => sum + player.projected_points_per_game, 0);
  const counts = { QB: starters.filter(player => player.position === 'QB').length, RB: starters.filter(player => player.position === 'RB').length, WR: starters.filter(player => player.position === 'WR').length, TE: starters.filter(player => player.position === 'TE').length };
  const averageGrade = starters.length ? starters.reduce((sum, player) => sum + player.roster_grade, 0) / starters.length : 0;
  return { score: 0, measuredScore: 0, contextScore: 0, projected, perGame, perGameModeled: perGamePlayers.length, averageGrade, modeled: starters.length, counts, top: [...starters].sort(stablePreference)[0], roles: starters.map(slotLabel), starterCoverage: starters.length / STARTER_SLOTS.length, missingSlots: STARTER_SLOTS.filter(slot => !starterMap.has(slot)), gradeScore: 0, productionScore: 0 };
}

export function applyScoreModel(metricMapOrMetrics) {
  const metrics = Array.isArray(metricMapOrMetrics) ? metricMapOrMetrics : [metricMapOrMetrics];
  metrics.forEach(metric => {
    const observedGrade = metric.modeled ? metric.averageGrade : NEUTRAL_GRADE - 25;
    const starterGrade = metric.starterCoverage * observedGrade + (1 - metric.starterCoverage) * 35;
    metric.gradeScore = Math.max(0, Math.min(100, NEUTRAL_INDEX + (starterGrade - NEUTRAL_GRADE) * 1.5));
    metric.productionScore = Math.max(0, Math.min(100, (metric.projected / PRODUCTION_BASELINE) * 100));
    metric.measuredScore = Math.round(Math.max(0, Math.min(100, metric.gradeScore * .65 + metric.productionScore * .35)));
    metric.contextScore = 0;
    metric.score = metric.measuredScore;
  });
  return Array.isArray(metricMapOrMetrics) ? metricMapOrMetrics : metrics[0];
}

export function deriveDefenseMetrics(abbreviation, players) {
  const dstCandidates = uniqueById(players.filter(player => player.team === abbreviation && player.position === 'D/ST'));
  const dst = dstCandidates.sort((a, b) => (Number(usableDefenseStatus(b.defensive_signal_status)) - Number(usableDefenseStatus(a.defensive_signal_status))) || stablePreference(a, b)).slice(0, 1);
  const usable = dst.filter(player => usableDefenseStatus(player.defensive_signal_status));
  const values = key => usable.map(player => player[key]).filter(finite);
  const average = valuesList => valuesList.length ? valuesList.reduce((a, b) => a + b, 0) / valuesList.length : null;
  const evidence = [...new Set(dst.flatMap(player => typeof player.defensive_event_evidence === 'string' && player.defensive_event_evidence.trim() ? [player.defensive_event_evidence.trim()] : []))].sort().join(' · ');
  return { projected: dst.reduce((sum, player) => sum + (finite(player.projected_points) && player.projected_points > 0 ? player.projected_points : 0), 0), perGame: average(dst.map(player => player.projected_points_per_game).filter(value => finite(value) && value > 0)), grade: average(values('defensive_grade')), modeled: usable.length, rows: dst.length, usable: usable.length > 0, signal: average(values('defensive_signal')), eventEvidence: evidence || null };
}

export function calculateWins(offense, defense) {
  const defensiveInput = defense.grade ?? defense.signal ?? NEUTRAL_DEFENSE;
  return Math.max(0, Math.min(17, Math.round(BASELINE_WINS + (offense.measuredScore - NEUTRAL_INDEX) / OFFENSE_WIN_SCALE + (defensiveInput - NEUTRAL_DEFENSE) / 20)));
}

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const effectiveDefense = defense => finite(defense?.grade) ? defense.grade : finite(defense?.signal) ? defense.signal : NEUTRAL_DEFENSE;
const teamStrength = metrics => clamp(50 + ((numericOrZero(metrics?.measuredScore) - 50) * 0.55) + ((effectiveDefense(metrics?.defense) - 50) * 0.25), 35, 65);
const matchupProbability = (a, b, neutral = false) => clamp(1 / (1 + Math.exp(-(teamStrength(a) - teamStrength(b) + (neutral ? 0 : 1.5)) / 14)), 0.2, 0.8);

function completeSchedule() {
  const appearances = Object.fromEntries(TEAM_ABBREVIATIONS.map(team => [team, 0]));
  const games = PUBLISHED_MATCHUPS.map(([home, away, week]) => ({ home, away, week, published: true, neutral: false }));
  games.forEach(game => { appearances[game.home] += 1; appearances[game.away] += 1; });
  const missing = TEAM_ABBREVIATIONS.flatMap(team => Array.from({ length: 17 - appearances[team] }, () => team));
  for (let i = 0; i < missing.length / 2; i += 1) games.push({ home: missing[i], away: missing[i + missing.length / 2], week: null, published: false, neutral: true });
  const finalAppearances = Object.fromEntries(TEAM_ABBREVIATIONS.map(team => [team, 0]));
  games.forEach(game => { finalAppearances[game.home] += 1; finalAppearances[game.away] += 1; });
  return { games, appearances: finalAppearances };
}

export function buildScheduleModel(metricMap) {
  const schedule = completeSchedule();
  const expected = Object.fromEntries(TEAM_ABBREVIATIONS.map(team => [team, 0]));
  const opponentStrength = Object.fromEntries(TEAM_ABBREVIATIONS.map(team => [team, 0]));
  const publishedMatchups = Object.fromEntries(TEAM_ABBREVIATIONS.map(team => [team, 0]));
  const neutralMatchups = Object.fromEntries(TEAM_ABBREVIATIONS.map(team => [team, 0]));
  for (const game of schedule.games) {
    const home = metricMap[game.home] || {};
    const away = metricMap[game.away] || {};
    const probability = matchupProbability(home, away, game.neutral);
    expected[game.home] += probability;
    expected[game.away] += 1 - probability;
    opponentStrength[game.home] += teamStrength(away);
    opponentStrength[game.away] += teamStrength(home);
    for (const team of [game.home, game.away]) (game.published ? publishedMatchups : neutralMatchups)[team] += 1;
  }
  const floors = Object.fromEntries(TEAM_ABBREVIATIONS.map(team => [team, Math.floor(expected[team])]));
  const remaining = 272 - Object.values(floors).reduce((sum, value) => sum + value, 0);
  const rankedRemainders = [...TEAM_ABBREVIATIONS].sort((a, b) => (expected[b] - floors[b]) - (expected[a] - floors[a]) || a.localeCompare(b));
  const records = Object.fromEntries(TEAM_ABBREVIATIONS.map(team => {
    const wins = floors[team] + (rankedRemainders.indexOf(team) < remaining ? 1 : 0);
    return [team, { wins, losses: 17 - wins, expectedWins: expected[team], strength: teamStrength(metricMap[team] || {}), scheduleStrength: opponentStrength[team] / 17, publishedMatchups: publishedMatchups[team], neutralMatchups: neutralMatchups[team] }];
  }));
  return { records, schedule: { games: schedule.games, totalGames: schedule.games.length, publishedGames: PUBLISHED_MATCHUPS.length, neutralGames: schedule.games.length - PUBLISHED_MATCHUPS.length, appearances: schedule.appearances }, totalExpectedWins: Math.round(Object.values(expected).reduce((sum, value) => sum + value, 0) * 1e12) / 1e12 };
}
