export function findPlayerById(players, id) {
  return players.find((player) => player.id === id) ?? null;
}

export function decodePlayerRouteId(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function getPlayerSlotLabel(player) {
  const position = typeof player?.position === 'string' ? player.position.trim() : '';
  const suppliedSlot = typeof player?.slot === 'string' ? player.slot.trim() : '';
  const suppliedLabel = typeof player?.position_label === 'string' ? player.position_label.trim() : '';
  const supplied = suppliedSlot || suppliedLabel;
  if (supplied && supplied.toLowerCase() !== 'starter') return supplied;
  if (position === 'K' || position === 'D/ST') return position;
  const rank = typeof player?.position_rank === 'number' && Number.isFinite(player.position_rank) && player.position_rank > 0 ? player.position_rank : '';
  return `${position}${rank}` || 'Unknown';
}

export function projectionDisplay(player, mode = 'season') {
  const value = mode === 'game' ? player.projected_points_per_game : player.projected_points;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

const DEFENSIVE_EVENTS = [['sacks', 'Sacks'], ['interceptions', 'Interceptions'], ['fumble_recoveries', 'Fumble recoveries'], ['defensive_touchdowns', 'Defensive touchdowns'], ['safeties', 'Safeties'], ['blocked_punts', 'Blocked punts'], ['blocked_field_goals', 'Blocked field goals'], ['blocked_extra_points', 'Blocked extra points']];

/** Canonical position/slot data, never team-name text, identifies D/ST entities. */
export function isDST(player) {
  return [player?.position, player?.position_label, player?.slot, player?.role].filter((value) => typeof value === 'string').map((value) => value.trim().toUpperCase()).some((value) => ['D/ST', 'DST', 'DEFENSE', 'DEFENCE'].includes(value));
}
function finite(value) { return typeof value === 'number' && Number.isFinite(value); }
function parseEvidence(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) { try { const parsed = JSON.parse(value); return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null; } catch { return null; } }
  return null;
}
function text(value) { return typeof value === 'string' && value.trim() ? value.trim() : null; }
function numberFrom(value, keys) {
  if (finite(value)) return value;
  if (!value || typeof value !== 'object') return null;
  for (const key of keys) if (finite(value[key])) return value[key];
  return null;
}
/** Normalize supported events while retaining values, per-event completeness, and provenance independently. */
export function defensiveEventEvidence(player) {
  const payload = parseEvidence(player?.defensive_event_evidence);
  const missing = { status: 'unavailable', season: null, perGame: null, scoringContribution: null, source: null };
  if (!payload) return { source: null, status: 'unavailable', events: Object.fromEntries(DEFENSIVE_EVENTS.map(([key]) => [key, { ...missing }])) };

  const source = text(payload.source) || text(payload.provenance) || text(payload.source_url) || text(payload.sourceUrl);
  const payloadStatus = text(payload.status);
  const status = payloadStatus || (source ? 'available' : 'partial');
  const events = Object.fromEntries(DEFENSIVE_EVENTS.map(([key]) => {
    const hasRaw = payload[key] !== undefined && payload[key] !== null || payload.events?.[key] !== undefined && payload.events?.[key] !== null;
    const raw = payload[key] ?? payload.events?.[key];
    if (!hasRaw) return [key, { ...missing }];

    const eventSource = text(raw?.source) || text(raw?.provenance) || text(raw?.source_url) || text(raw?.sourceUrl) || source;
    const season = numberFrom(raw, ['season', 'season_value', 'total', 'value']);
    const perGame = numberFrom(raw, ['per_game', 'perGame', 'game']);
    const scoringContribution = numberFrom(raw, ['scoring_contribution', 'scoringContribution', 'fantasy_points']);
    const hasValue = season !== null || perGame !== null || scoringContribution !== null;
    const complete = season !== null && perGame !== null && scoringContribution !== null;
    const explicitStatus = text(raw?.status);
    const normalizedStatus = explicitStatus?.toLowerCase().replace(/[-\s]+/g, '_');
    const explicitlyInvalid = ['invalid', 'invalid_data'].includes(normalizedStatus) || raw?.invalid === true || raw?.invalid_data === true || raw?.invalidData === true;
    // Data completeness takes precedence over contradictory metadata. Values
    // remain separate from provenance and are retained even for invalid data.
    const eventStatus = explicitlyInvalid ? (explicitStatus || 'invalid') : (hasValue && complete ? 'available' : 'partial');
    return [key, { status: eventStatus, season, perGame, scoringContribution, source: eventSource }];
  }));
  return { source, status, events };
}
export function defensiveEventDefinitions() { return DEFENSIVE_EVENTS.map(([key, label]) => ({ key, label })); }
