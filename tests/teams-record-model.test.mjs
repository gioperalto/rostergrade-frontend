import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { calculateWins, deriveDefenseMetrics, deriveMetrics, applyScoreModel, buildScheduleModel, TEAM_ABBREVIATIONS } from '../src/teamRecordModel.mjs';
import { PUBLISHED_MATCHUPS } from '../src/nfl2026Schedule.mjs';

const appSource = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
const cssSource = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');
assert.match(appSource, /WSH:\s*\{\s*strategy:/, 'Teams catalog must use the schedule canonical abbreviation for Washington');
assert.doesNotMatch(appSource, /WAS:\s*\{\s*strategy:/, 'Teams catalog must not use the stale Washington abbreviation');
assert.match(cssSource, /@media\(max-width:720px\)\{[\s\S]*?\.page-heading\{[\s\S]*?flex-direction:column/,
  'page heading must switch to the compact layout at the player-row breakpoint');
assert.match(cssSource, /@media\(max-width:720px\)\{[\s\S]*?\.toolbar\{[\s\S]*?flex-direction:column/,
  'ranking controls must stack at the player-row breakpoint');
assert.match(cssSource, /@media\(max-width:720px\)\{[\s\S]*?\.sidebar\{[\s\S]*?display:flex/,
  'sidebar must use the compact navigation layout at the player-row breakpoint');
assert.doesNotMatch(cssSource, /\.player-row-summary\b/, 'removed player row summary must not leave dead CSS behind');
assert.match(appSource, /player\.role && <small className="role-note">\{slotLabel\}<\/small>/, 'PlayerRow secondary label must use the canonical slot label');
assert.doesNotMatch(appSource, /className="role-note">\{player\.role\}/, 'PlayerRow must not render the raw role as its secondary label');
assert.doesNotMatch(appSource, /Role <b>\{player\.role\}<\/b>/, 'PlayerRow details must not render the raw role');
assert.doesNotMatch(appSource, /<details className="player-row">/, 'PlayerRow must not use native details interaction');
assert.match(appSource, /<a className="player-row" href=\{`\/player\/\$\{encodeURIComponent\(player\.id\)\}`\}>/, 'PlayerRow must link the full row using the stable player id');
assert.doesNotMatch(appSource, /className="mobile-expand"/, 'PlayerRow must not expose an expansion affordance');
assert.doesNotMatch(appSource, /className="player-secondary"/, 'PlayerRow must not hide ranking information in secondary expandable content');

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

const neutralSchedule = buildScheduleModel(Object.fromEntries(TEAM_ABBREVIATIONS.map(abbr => [abbr, { ...offense, defense: missingStatus }])));
assert.equal(neutralSchedule.schedule.totalGames, 272);
assert.equal(neutralSchedule.schedule.publishedGames, 241);
assert.equal(neutralSchedule.schedule.neutralGames, 31);
assert.deepEqual(Object.values(neutralSchedule.schedule.appearances), TEAM_ABBREVIATIONS.map(() => 17));
assert.equal(neutralSchedule.totalExpectedWins, 272);
assert.equal(Object.values(neutralSchedule.records).reduce((sum, row) => sum + row.wins, 0), 272);
assert.ok(Object.values(neutralSchedule.records).every(row => row.wins >= 0 && row.wins <= 17 && row.losses === 17 - row.wins));
assert.ok(neutralSchedule.records.CLE.wins < 9, 'Cleveland must remain below .500 in the weak fixture');
assert.ok(Object.values(neutralSchedule.records).filter(row => row.wins >= 13).length <= 2, 'calibration must avoid routine 13-win records');
assert.ok(neutralSchedule.schedule.games.every(game => game.home !== game.away), 'neutral completion must not create self-matchups');
assert.ok(neutralSchedule.records.CLE.neutralMatchups > 0);

// Completion placeholders are genuinely neutral: unknown opponents must not inherit strength differences.
const variedMetrics = Object.fromEntries(TEAM_ABBREVIATIONS.map((abbr, index) => [abbr, { ...offense, measuredScore: index === 0 ? 100 : 0, defense: missingStatus }]));
const variedSchedule = buildScheduleModel(variedMetrics);
assert.ok(variedSchedule.schedule.games.some(game => game.neutral));
assert.ok(variedSchedule.schedule.games.filter(game => game.neutral).every(game => game.winProbability === 0.5), 'neutral completion must use fixed 0.50 probability');

// Completion avoids every published pairing and avoids duplicate generated pairings.
const publishedPairingKeys = new Set(PUBLISHED_MATCHUPS.map(([home, away]) => [home, away].sort().join('-')));
const generatedGames = variedSchedule.schedule.games.filter(game => game.neutral);
const generatedPairingKeys = generatedGames.map(game => [game.home, game.away].sort().join('-'));
assert.ok(generatedPairingKeys.every(key => !publishedPairingKeys.has(key)), 'generated completion must not repeat a published pairing');
assert.equal(new Set(generatedPairingKeys).size, generatedPairingKeys.length, 'generated completion must not contain duplicate pairings');

const reversed = buildScheduleModel(Object.fromEntries([...TEAM_ABBREVIATIONS].reverse().map(abbr => [abbr, { ...offense, defense: missingStatus }])), [...PUBLISHED_MATCHUPS].reverse());
assert.deepEqual(reversed.records, neutralSchedule.records, 'published matchup calculations must be order independent');
const dstInflated = buildScheduleModel(Object.fromEntries(TEAM_ABBREVIATIONS.map(abbr => [abbr, { ...offense, defense: { ...missingStatus, projected: 999999 } }])));
assert.deepEqual(dstInflated.records, neutralSchedule.records, 'fantasy D/ST points must not affect records');

console.log('teams-record-model behavioral regression checks passed');
