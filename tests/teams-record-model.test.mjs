import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

assert.match(source, /const STARTER_SLOTS = \['QB1', 'RB1', 'RB2', 'WR1', 'WR2', 'WR3', 'TE1'\]/);
assert.match(source, /starterGrade/);
assert.match(source, /productionScore/);
assert.match(source, /missing starter/);
assert.doesNotMatch(source, /const range = \(/);
assert.doesNotMatch(source, /Math\.min\(m\.modeled, 12\)/);
assert.match(source, /NEUTRAL_DEFENSE = 50/);
assert.match(source, /fantasy D\/ST projected pts \(fantasy signal only\)/);
assert.match(source, /defensiveInput = defense\.grade \?\? defense\.signal \?\? NEUTRAL_DEFENSE/);
assert.match(source, /Math\.round\(BASELINE_WINS \+ \(offense\.measuredScore - NEUTRAL_INDEX\) \/ OFFENSE_WIN_SCALE/);

console.log('teams-record-model regression checks passed');
