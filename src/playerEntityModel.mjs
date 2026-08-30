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

/** Canonical position/slot data identifies D/ST entities. Role is intentionally
 * excluded: provider role text is not a reliable position contract and can
 * contain arbitrary offensive labels such as "Defense". */
export function isDST(player) {
  return [player?.position, player?.position_label, player?.slot].filter((value) => typeof value === 'string').map((value) => value.trim().toUpperCase()).some((value) => ['D/ST', 'DST', 'DEFENSE', 'DEFENCE'].includes(value));
}
function finite(value) { return typeof value === 'number' && Number.isFinite(value); }
function nonNegative(value) { return finite(value) && value >= 0; }
function parseEvidence(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) { try { const parsed = JSON.parse(value); return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null; } catch { return null; } }
  return null;
}
function text(value) { return typeof value === 'string' && value.trim() ? value.trim() : null; }
function numberFrom(value, keys) {
  if (nonNegative(value)) return value;
  if (!value || typeof value !== 'object') return null;
  for (const key of keys) if (nonNegative(value[key])) return value[key];
  return null;
}
function hasNegativeNumber(value, keys) {
  if (finite(value) && value < 0) return true;
  if (!value || typeof value !== 'object') return false;
  return keys.some((key) => finite(value[key]) && value[key] < 0);
}
function normalizeStatus(value, fallback) {
  const normalized = text(value)?.toLowerCase().replace(/[-\s]+/g, '_');
  if (normalized === 'invalid_data') return 'invalid';
  if (['available', 'partial', 'unavailable', 'invalid'].includes(normalized)) return normalized;
  return value == null ? fallback : 'unavailable';
}
/** Normalize supported events while retaining values, per-event completeness, and provenance independently. */
export function defensiveEventEvidence(player) {
  const payload = parseEvidence(player?.defensive_event_evidence);
  const missing = { status: 'unavailable', season: null, perGame: null, scoringContribution: null, source: null };
  if (!payload) return { source: null, status: 'unavailable', events: Object.fromEntries(DEFENSIVE_EVENTS.map(([key]) => [key, { ...missing }])) };

  const source = text(payload.source) || text(payload.provenance) || text(payload.source_url) || text(payload.sourceUrl);
  const payloadStatus = text(payload.status);
  // Statuses are a closed set. Unknown provider statuses are unavailable, not
  // arbitrary UI labels/classes. Values are still retained below for audit.
  const status = normalizeStatus(payloadStatus, source ? 'available' : 'partial');
  const payloadIsInvalid = status === 'invalid';
  const events = Object.fromEntries(DEFENSIVE_EVENTS.map(([key]) => {
    const hasRaw = payload[key] !== undefined && payload[key] !== null || payload.events?.[key] !== undefined && payload.events?.[key] !== null;
    const raw = payload[key] ?? payload.events?.[key];
    if (!hasRaw) return [key, { ...missing }];

    const eventSource = text(raw?.source) || text(raw?.provenance) || text(raw?.source_url) || text(raw?.sourceUrl) || source;
    const seasonKeys = ['season', 'season_value', 'total', 'value'];
    const perGameKeys = ['per_game', 'perGame', 'game'];
    const scoringKeys = ['scoring_contribution', 'scoringContribution', 'fantasy_points'];
    const invalidNumber = hasNegativeNumber(raw, seasonKeys) || hasNegativeNumber(raw, perGameKeys) || hasNegativeNumber(raw, scoringKeys);
    const season = numberFrom(raw, seasonKeys);
    const perGame = numberFrom(raw, perGameKeys);
    const scoringContribution = numberFrom(raw, scoringKeys);
    const hasValue = season !== null || perGame !== null || scoringContribution !== null;
    const complete = season !== null && perGame !== null && scoringContribution !== null;
    const explicitStatus = text(raw?.status);
    const normalizedStatus = normalizeStatus(explicitStatus, null);
    const explicitlyUnknown = explicitStatus !== null && !['available', 'partial', 'unavailable', 'invalid', 'invalid_data'].includes(explicitStatus.toLowerCase().replace(/[-\s]+/g, '_'));
    const explicitlyInvalid = normalizedStatus === 'invalid' || raw?.invalid === true || raw?.invalid_data === true || raw?.invalidData === true || invalidNumber;
    // Data completeness takes precedence over contradictory metadata. Values
    // remain separate from provenance and are retained even for invalid data.
    // `invalid_data` is normalized to the documented `invalid` status.
    const eventStatus = payloadIsInvalid || explicitlyInvalid ? 'invalid' : status === 'unavailable' || explicitlyUnknown ? 'unavailable' : (hasValue && complete ? 'available' : 'partial');
    return [key, { status: eventStatus, season, perGame, scoringContribution, source: eventSource }];
  }));
  return { source, status, events };
}
export function defensiveEventDefinitions() { return DEFENSIVE_EVENTS.map(([key, label]) => ({ key, label })); }
