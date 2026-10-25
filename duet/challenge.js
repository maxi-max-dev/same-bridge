(function (root) {
  const G = typeof module !== 'undefined' ? require('./engine.js') : root.Duet;
  const cache = new WeakMap();

  function targets(level) {
    if (!cache.has(level)) {
      const solution = G.solve(level);
      if (!solution) throw new Error('A challenge needs a verified solution.');
      cache.set(level, Object.freeze({ optimal: solution.length, silver: solution.length + 2, limit: solution.length + 4 }));
    }
    return cache.get(level);
  }
  function stars(level, steps) {
    const t = targets(level);
    if (!Number.isInteger(steps) || steps < t.optimal || steps > t.limit) return 0;
    return steps === t.optimal ? 3 : steps <= t.silver ? 2 : 1;
  }
  function outcome(level, state) {
    if (G.won(level, state) && stars(level, state.steps)) return 'won';
    return state.steps >= targets(level).limit ? 'spent' : 'playing';
  }
  function step(level, state, direction) {
    return outcome(level, state) === 'playing' ? G.step(level, state, direction) : null;
  }
  function readBests(raw) {
    const clean = {};
    try {
      const value = JSON.parse(raw);
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        G.levels.forEach((level, i) => { if (stars(level, value[i])) clean[i] = value[i]; });
      }
    } catch {}
    return clean;
  }
  function recordBest(bests, index, state) {
    const level = G.levels[index];
    if (!level || outcome(level, state) !== 'won') return bests;
    const prior = bests[index];
    if (stars(level, prior) && prior <= state.steps) return bests;
    return { ...bests, [index]: state.steps };
  }
  const api = { targets, stars, outcome, step, readBests, recordBest };
  if (typeof module !== 'undefined') module.exports = api; else root.DuetChallenge = api;
})(globalThis);
