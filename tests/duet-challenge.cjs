const assert = require('node:assert/strict');
const G = require('../duet/engine.js');
const C = require('../duet/challenge.js');
let bests = {};
for (const [i, level] of G.levels.entries()) {
  const path = G.solve(level), t = C.targets(level);
  assert.equal(t.optimal, path.length);
  const wins = [];
  // Real winning runs at every boundary, including victory on the final allowed beat.
  for (let extra = 0; extra <= 4; extra++) {
    let s = G.initial(level);
    for (const d of 'W'.repeat(extra) + path) {
      const old = structuredClone(s), next = C.step(level, s, d);
      assert(next); assert.deepEqual(s, old); s = next;
    }
    assert.equal(C.outcome(level, s), 'won');
    assert.equal(C.stars(level, s.steps), extra === 0 ? 3 : extra <= 2 ? 2 : 1);
    assert.equal(C.step(level, s, 'R'), null);
    wins.push(s);
  }
  // Excess waiting stops the run; a further key cannot silently exceed the limit.
  let s = G.initial(level), previous;
  for (let k = 0; k < t.limit; k++) { previous = s; s = C.step(level, s, 'W'); }
  assert.equal(C.outcome(level, s), 'spent');
  assert.equal(C.step(level, s, 'R'), null);
  assert.equal(C.outcome(level, previous), 'playing');
  assert(C.step(level, previous, 'R'));
  assert.equal(C.recordBest(bests, i, s), bests);
  // A raw engine victory beyond the budget must never receive a star or record.
  let over = G.initial(level);
  for (const d of 'WWWWW' + path) over = G.step(level, over, d);
  assert(G.won(level, over)); assert.equal(C.outcome(level, over), 'spent');
  assert.equal(C.stars(level, over.steps), 0);
  assert.equal(C.recordBest(bests, i, over), bests);
  bests = C.recordBest(bests, i, wins[4]); assert.equal(bests[i], t.limit);
  bests = C.recordBest(bests, i, wins[2]); assert.equal(bests[i], t.silver);
  bests = C.recordBest(bests, i, wins[0]); assert.equal(bests[i], t.optimal);
  const saved = bests;
  assert.equal(C.recordBest(bests, i, wins[4]), saved, 'a worse replay cannot replace a best');
  console.log(`Room ${i + 1}: 3 stars ${t.optimal}, 2 stars <=${t.silver}, limit ${t.limit}; all boundaries pass`);
}
assert.deepEqual(C.readBests(JSON.stringify(bests)), bests, 'saved results survive reload');
for (const bad of ['bad json', 'null', '[]', '"6"', '{"0":-1,"1":"9","2":0.5,"3":999999}']) assert.deepEqual(C.readBests(bad), {});
assert.deepEqual(C.readBests('{"0":6,"1":10,"999":8}'), { 0: 6, 1: 10 });
assert.equal(C.stars(G.levels[0], NaN), 0);
assert.equal(C.stars(G.levels[0], 0), 0);
console.log('PASS: all 11 levels, gold/silver/bronze, final-beat win, hard limit, undo recovery, best upgrades, corrupted storage');
