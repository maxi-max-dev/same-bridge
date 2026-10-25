const assert = require('node:assert/strict');
const G = require('../duet/engine.js');
const newLevels = G.levels.slice(7);
const key = s => JSON.stringify([s.a, s.b, s.last, s.hold, s.lit]);
function search(l, allow = () => true, limit = 100000) {
  const start = G.initial(l), queue = [[start, '']], seen = new Set([key(start)]);
  for (let i = 0; i < queue.length; i++) {
    assert(i < limit, 'audit must exhaust graph, never treat search budget as impossibility');
    const [s, path] = queue[i];
    if (G.won(l, s)) return { path, states: seen.size, exhausted: false };
    for (const d of Object.keys(G.dirs)) {
      const n = G.step(l, s, d);
      if (!n || !allow(s, n, d)) continue;
      const k = key(n);
      if (!seen.has(k)) { seen.add(k); queue.push([n, path + d]); }
    }
  }
  return { path: null, states: seen.size, exhausted: true };
}
const ideas = [
  (l, s, n, d) => G.eq(s.a, [2, 1]) && n.blocked[0] && d === 'R',
  (l, s, n, d) => !G.eq(s.a, n.a) && !G.eq(s.b, n.b) && d !== s.last && l.gates.every(g => G.eq(g.owner ? n.a : n.b, g.at)),
  (l, s, n) => G.eq(s.a, [3, 2]) && G.eq(n.a, [3, 1]),
  (l, s, n) => !G.eq(s.a, l.gates[0].plate) && s.hold[0] > 0 && !G.eq(s.b, l.gates[0].at) && G.eq(n.b, l.gates[0].at)
];
const report = [];
for (const [i, l] of newLevels.entries()) {
  const answer = search(l), withoutInsight = search(l, (s, n, d) => !ideas[i](l, s, n, d));
  assert(answer.path, 'room must be solvable');
  if (i === 1) assert(withoutInsight.path && withoutInsight.path.length > answer.path.length, 'allow thoughtful waiting, but simultaneous opposite crossing must improve the solution');
  else assert(withoutInsight.exhausted && withoutInsight.path === null, 'intended idea cannot be bypassed in any reachable solution');
  let s = G.initial(l), hasIdea = false;
  for (const d of answer.path) { const n = G.step(l, s, d); hasIdea ||= ideas[i](l, s, n, d); s = n; }
  assert(hasIdea && G.won(l, s) && s.passed.every(Boolean));
  // Each physical gate matters: blocking it must disconnect all winning routes.
  for (const gate of l.gates) {
    const map = l.map.slice(); const [x, y] = gate.at;
    map[y] = map[y].slice(0, x) + '#' + map[y].slice(x + 1);
    const noGate = search({ ...l, map }); assert(noGate.exhausted && !noGate.path);
  }
  // No held direction or two-button repeating pattern can clear a room.
  for (const a of Object.keys(G.dirs)) for (const b of Object.keys(G.dirs)) {
    s = G.initial(l); const seen = new Set(); let t = 0;
    while (!seen.has(key(s) + ':' + t % 2)) {
      seen.add(key(s) + ':' + t % 2); s = G.step(l, s, t++ % 2 ? b : a);
      assert(!G.won(l, s), `repeating ${a}${b} bypasses ${l.name}`);
    }
  }
  // Test actual undo/hint state data at every prefix rather than just initial paths.
  s = G.initial(l);
  for (const d of answer.path) {
    const original = structuredClone(s), n = G.step(l, s, d); assert.deepEqual(s, original);
    if (!G.won(l, n)) assert(G.solve(l, n)); s = n;
  }
  report.push({ room: i + 8, name: l.name, shortest: answer.path, withoutInsight });
}
// Deterministic random input is a limited stress check, not a measure of human difficulty.
let seed = 87237;
const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
for (const [i, l] of newLevels.entries()) {
  let wins = 0;
  for (let trial = 0; trial < 10000; trial++) {
    let s = G.initial(l);
    for (let turn = 0; turn < 24; turn++) {
      s = G.step(l, s, 'RDLUW'[Math.floor(random() * 5)]);
      if (G.won(l, s)) { wins++; break; }
    }
  }
  report[i].random24 = { wins, trials: 10000 }; assert(wins < 200, 'unexpected easy random completion; inspect level');
}
console.log(JSON.stringify(report, null, 2));
console.log('PASS: critical insights, necessary gates, all repeating pairs, undo/hint states, seeded random stress');
