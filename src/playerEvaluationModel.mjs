const text = (value) => typeof value === 'string' && value.trim() ? value.trim() : null;
const list = (value) => Array.isArray(value) ? value.map(text).filter(Boolean) : [];
const finiteConfidence = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1 ? value : null;

export function normalizeAssessment(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const item = raw;
  const playerId = text(item.player_id);
  const entityId = text(item.entity_id);
  // If both supported identity fields are present, conflicting values make
  // the candidate ambiguous rather than allowing either identity to match.
  if (playerId && entityId && playerId !== entityId) return null;
  const identity = playerId || entityId;
  return {
    playerId: identity,
    summary: text(item.summary),
    roleDescription: text(item.role_description),
    teamImpact: text(item.team_impact),
    usageOutlook: text(item.usage_outlook),
    strengths: list(item.strengths),
    risks: list(item.risks),
    assessmentWindow: text(item.assessment_window),
    confidence: finiteConfidence(item.overall_confidence),
    needsReview: item.needs_review === true,
    sourceIds: list(item.source_ids),
  };
}

export function normalizeEvaluationResponse(raw, entityId) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !Array.isArray(raw.assessments)) {
    return { status: 'malformed', assessment: null, sources: [], model: null, receivedAt: null };
  }
  const candidates = raw.assessments.map(normalizeAssessment).filter(Boolean);
  // An assessment without an identity is not usable: otherwise a partial or
  // empty candidate could be displayed for whichever player is being viewed.
  const matching = candidates.filter((item) => item.playerId && entityId && item.playerId === entityId);
  const assessment = matching[0] || null;
  const sources = Array.isArray(raw.sources) ? raw.sources.map((source) => {
    if (!source || typeof source !== 'object' || Array.isArray(source)) return null;
    const item = source;
    return { id: text(item.source_id) || text(item.id), title: text(item.title) || text(item.name), url: text(item.url) };
  }).filter((source) => source && (source.id || source.title || source.url)) : [];
  return {
    status: assessment ? 'available' : 'unavailable',
    assessment,
    sources,
    // Provenance is response-level metadata. Keep it string-only so malformed
    // API values can never leak into the page as narrative or React children.
    model: text(raw.model),
    receivedAt: text(raw.received_at),
  };
}

export function confidenceLabel(value) {
  return typeof value === 'number' ? `${Math.round(value * 100)}%` : 'Unavailable';
}
