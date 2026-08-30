import assert from 'node:assert/strict';
import { findPlayerById, projectionDisplay } from '../src/playerEntityModel.mjs';

const visible = [{ id: 'visible', roster_grade: 80, projected_points: 100, projected_points_per_game: 10 }];
const complete = [...visible, { id: 'filtered-out', roster_grade: 95, projected_points: 200, projected_points_per_game: 20 }];
assert.equal(findPlayerById(complete, 'filtered-out').id, 'filtered-out', 'entity lookup must use the complete dataset');
assert.equal(findPlayerById(visible, 'filtered-out'), null, 'lookup should not manufacture a missing player');
assert.equal(projectionDisplay(complete[1], 'season'), 200, 'season projection uses total points');
assert.equal(projectionDisplay(complete[1], 'game'), 20, 'game projection uses per-game points');
assert.equal(projectionDisplay({ id: 'missing' }, 'game'), null, 'missing projection is explicitly unavailable');
console.log('player entity model regression tests passed');
