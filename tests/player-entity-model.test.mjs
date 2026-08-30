import assert from 'node:assert/strict';
import { findPlayerById, projectionDisplay, getPlayerSlotLabel, decodePlayerRouteId, isDST, defensiveEventEvidence } from '../src/playerEntityModel.mjs';

const visible = [{ id: 'visible', roster_grade: 80, projected_points: 100, projected_points_per_game: 10 }];
const complete = [...visible, { id: 'filtered-out', roster_grade: 95, projected_points: 200, projected_points_per_game: 20 }];
assert.equal(findPlayerById(complete, 'filtered-out').id, 'filtered-out', 'entity lookup must use the complete dataset');
assert.equal(findPlayerById(visible, 'filtered-out'), null, 'lookup should not manufacture a missing player');
assert.equal(projectionDisplay(complete[1], 'season'), 200, 'season projection uses total points');
assert.equal(projectionDisplay(complete[1], 'game'), 20, 'game projection uses per-game points');
assert.equal(projectionDisplay({ id: 'missing' }, 'game'), null, 'missing projection is explicitly unavailable');
assert.equal(getPlayerSlotLabel({ position: 'WR', position_rank: 2, slot: '  Flex  ', position_label: 'Starter' }), 'Flex', 'canonical supplied slot labels are preserved');
assert.equal(getPlayerSlotLabel({ position: 'K', position_rank: 1, slot: { bad: true }, position_label: null }), 'K', 'malformed slot values must not crash or replace special positions');
assert.equal(getPlayerSlotLabel({ position: null, position_rank: 'bad', slot: null, position_label: 42 }), 'Unknown', 'malformed position data has a safe fallback');
assert.equal(decodePlayerRouteId('A%20B'), 'A B', 'encoded player route IDs decode normally');
assert.equal(decodePlayerRouteId('%E0%A4%A'), null, 'malformed encoded route IDs are handled safely');
assert.equal(isDST({ position: 'D/ST', name: 'Arizona Cardinals' }), true, 'canonical D/ST position identifies defense');
assert.equal(isDST({ position: 'WR', name: 'Defense Jones' }), false, 'name text must not identify D/ST');
assert.equal(isDST({ position: 'WR', role: 'Defense' }), false, 'offensive role text must not identify D/ST');
const evidence = defensiveEventEvidence({ defensive_event_evidence: { source: 'PFR 2025', status: 'available', sacks: { season: 45, per_game: 2.65, scoring_contribution: 90 }, interceptions: { season: 12 } } });
assert.equal(evidence.events.sacks.season, 45, 'supported defensive event season value is preserved');
assert.equal(evidence.events.sacks.perGame, 2.65, 'supported defensive event per-game value is preserved');
assert.equal(evidence.events.sacks.scoringContribution, 90, 'supported scoring contribution is preserved');
assert.equal(evidence.events.sacks.source, 'PFR 2025', 'event provenance is retained');
assert.equal(evidence.events.safeties.status, 'unavailable', 'omitted event categories must not inherit available status');

const provenanceLess = defensiveEventEvidence({ defensive_event_evidence: { status: 'available', sacks: { season: 8, per_game: 0.5, scoring_contribution: 16 } } });
assert.equal(provenanceLess.events.sacks.season, 8, 'supported values survive absent provenance');
assert.equal(provenanceLess.events.sacks.perGame, 0.5, 'supported per-game values survive absent provenance');
assert.equal(provenanceLess.events.sacks.scoringContribution, 16, 'supported scoring values survive absent provenance');
assert.equal(provenanceLess.events.sacks.source, null, 'event source is independently unavailable without provenance');
assert.equal(provenanceLess.events.sacks.status, 'available', 'value-bearing events remain available even without provenance');
for (const key of ['interceptions', 'fumble_recoveries', 'defensive_touchdowns', 'safeties', 'blocked_punts', 'blocked_field_goals', 'blocked_extra_points']) {
  assert.equal(provenanceLess.events[key].status, 'unavailable', `omitted ${key} category is unavailable`);
  assert.equal(provenanceLess.events[key].season, null, `omitted ${key} value is unavailable`);
}

const partial = defensiveEventEvidence({ defensive_event_evidence: { sacks: { per_game: 1.2 } } });
assert.equal(partial.events.sacks.status, 'partial', 'present but incomplete event data is partial');
assert.equal(partial.events.sacks.perGame, 1.2, 'partial event data retains supported values');
assert.equal(partial.events.sacks.season, null, 'missing event measures remain unavailable');

const partialWithAvailableMetadata = defensiveEventEvidence({ defensive_event_evidence: { sacks: { status: 'available', per_game: 1.2 } } });
assert.equal(partialWithAvailableMetadata.events.sacks.status, 'partial', 'available metadata cannot promote incomplete event data');
assert.equal(partialWithAvailableMetadata.events.sacks.perGame, 1.2, 'metadata precedence preserves partial event values');

const completeWithUnavailableMetadata = defensiveEventEvidence({ defensive_event_evidence: { sacks: { status: 'unavailable', season: 8, per_game: 0.5, scoring_contribution: 16 } } });
assert.equal(completeWithUnavailableMetadata.events.sacks.status, 'available', 'unavailable metadata cannot hide complete event data');
assert.equal(completeWithUnavailableMetadata.events.sacks.season, 8, 'complete event values survive unavailable metadata');

const invalid = defensiveEventEvidence({ defensive_event_evidence: { sacks: { status: 'invalid', season: 8, per_game: 0.5, scoring_contribution: 16 } } });
assert.equal(invalid.events.sacks.status, 'invalid', 'explicit invalid-data status takes precedence over values');
assert.equal(invalid.events.sacks.season, 8, 'invalid status does not erase supplied values');
assert.equal(defensiveEventEvidence({ defensive_event_evidence: null }).events.sacks.status, 'unavailable', 'missing evidence is explicitly unavailable');
console.log('player entity model regression tests passed');
