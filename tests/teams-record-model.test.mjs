import assert from 'node:assert/strict';
import { calculateWins, deriveDefenseMetrics, deriveMetrics, applyScoreModel } from '../src/teamRecordModel.mjs';

const player = (overrides = {}) => ({
  id: overrides.id || Math.random().toString(), name: 'Player', team: 'CLE', position: 'WR',
  position_rank: 1, slot: null, position_label: null, roster_grade: 80,
  projected_points: 100, projected_points_per_game: 10, ...overrides,
});
const fullOffense = [
  player({ id: 'qb', position: 'QB', slot: 'QB1', roster_grade: 65, projected_points: 50 }), player({ id: 'rb1', position: 'RB', slot: 'RB1', roster_grade: 65, projected_points: 50 }),
  player({ id: 'rb2', position: 'RB', slot: 'RB2', roster_grade: 65, projected_points: 50 }), player({ id: 'wr1', position: 'WR', slot: 'WR1', roster_grade: 65, projected_points: 50 }),
  player({ id: 'wr2', position: 'WR', slot: 'WR2', roster_grade: 65, projected_points: 50 }), player({ id: 'wr3', position: 'WR', slot: 'WR3', roster_grade: 65, projected_points: 50 }),
  player({ id: 'te', position: 'TE', slot: 'TE1', roster_grade: 65, projected_points: 50 }),
];

// Slot labels cannot override positional compatibility, and duplicate rows use a stable winner.
const duplicate = deriveMetrics('CLE', [
  player({ id: 'bad', position: 'RB', slot: 'QB1', roster_grade: 99 }),
  player({ id: 'later', position: 'QB', slot: 'QB1', roster_grade: 81 }),
  player({ id: 'first', position: 'QB', slot: 'QB1', roster_grade: 75 }),
]);
assert.equal(duplicate.modeled, 1);
assert.equal(duplicate.top.id, 'later');

// No modeled starters is explicitly conservative rather than a neutral-information score.
const empty = applyScoreModel(deriveMetrics('CLE', []));
assert.equal(empty.modeled, 0);
assert.ok(empty.measuredScore < 50);
assert.equal(empty.productionScore, 0);

// Pending/unavailable defensive signals are neutral, while usable signals are accepted.
const pending = deriveDefenseMetrics('CLE', [player({ id: 'dst', position: 'D/ST', defensive_grade: 95, defensive_signal: 90, defensive_signal_status: 'pending', projected_points: 20 })]);
assert.equal(pending.grade, null);
assert.equal(pending.signal, null);
assert.equal(pending.projected, 20);
const usable = deriveDefenseMetrics('CLE', [player({ id: 'dst', position: 'D/ST', defensive_grade: 95, defensive_signal: 90, defensive_signal_status: 'available' })]);
assert.equal(usable.grade, 95);
const missingStatus = deriveDefenseMetrics('CLE', [player({ id: 'dst-missing-status', position: 'D/ST', defensive_grade: undefined, defensive_signal: undefined, defensive_signal_status: undefined, projected_points: 20 })]);
assert.equal(missingStatus.modeled, 0);
assert.equal(missingStatus.usable, false);
assert.equal(missingStatus.grade, null);
assert.equal(missingStatus.signal, null);

// D/ST ranking remains deterministic when optional ranking fields are missing or malformed.
const stableDst = deriveDefenseMetrics('CLE', [
  player({ id: 'a-invalid', position: 'D/ST', defensive_signal_status: 'available', roster_grade: undefined, projected_points: 'not-a-number', defensive_grade: 80 }),
  player({ id: 'z-valid', position: 'D/ST', defensive_signal_status: 'available', roster_grade: 75, projected_points: 10, defensive_grade: 70 }),
]);
assert.equal(stableDst.grade, 70);

// Duplicate D/ST rows are counted once, and fantasy D/ST projection cannot change records.
const dst = deriveDefenseMetrics('CLE', [
  player({ id: 'dst', position: 'D/ST', defensive_grade: 70, defensive_signal: 70, defensive_signal_status: 'available', projected_points: 10 }),
  player({ id: 'dst-duplicate-source', position: 'D/ST', defensive_grade: 70, defensive_signal: 70, defensive_signal_status: 'available', projected_points: 10 }),
]);
assert.equal(dst.rows, 1);
assert.equal(dst.projected, 10);
const offense = applyScoreModel(deriveMetrics('CLE', fullOffense));
assert.equal(calculateWins(offense, missingStatus), calculateWins(offense, { grade: null, signal: null }));
assert.equal(calculateWins(offense, { ...dst, grade: 50, signal: 50 }), calculateWins(offense, { ...dst, grade: 50, signal: 50, projected: 999 }));
assert.ok(calculateWins(offense, { grade: 50, signal: 50 }) < 9, 'Cleveland remains non-winning in the live snapshot');
assert.ok(calculateWins(offense, { grade: 50, signal: 50 }) >= 0 && calculateWins(offense, { grade: 50, signal: 50 }) <= 17);

console.log('teams-record-model behavioral regression checks passed');
