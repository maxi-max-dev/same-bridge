const assert=require('node:assert/strict'),E=require('../engine.js'),L=require('../levels.js');
L.slice(0,3).forEach((l,i)=>{let p=E.solve(l),s=E.initial(l);assert.equal(p.length,l.par);for(const a of p)s=E.step(l,s,a);assert(E.won(l,s));if(i)assert.deepEqual([l.a,l.b],[L[i-1].ga,L[i-1].gb]);console.log(i+1,p.join(''),p.length);});
let l=L[0],s=E.initial(l),n=E.step(l,s,'R');assert.deepEqual(n.b,s.b);s=E.step(l,n,'W');assert.deepEqual(s.a,n.a);assert.deepEqual(s.b,[1,2]);n=E.step(l,s,'R');assert.deepEqual(n.b,s.b);assert.equal(E.solve(l,undefined,{wait:false}).length,9);
l=L[2];s=E.initial(l);for(const d of ['U','R','D','L'])s=E.step(l,s,d);n=E.step(l,s,'X');assert.equal(n.last,s.last);assert.equal(n.lead,1-s.lead);assert.deepEqual(n.a,s.a);assert.deepEqual(n.b,s.b);assert.equal(n.moves,s.moves);assert.equal(E.solve(l,undefined,{swap:false}).length,13);assert.equal(E.solve(l,undefined,{wait:false}).length,10);
assert.equal(E.step(L[0],E.initial(L[0]),'L'),null);
console.log('Wait propagation, unchanged pending action after handoff, continuous positions, optimal routes, blocked-input rules: PASS');

L.slice(3).forEach((l,i)=>{const p=E.solve(l);assert.equal(p.length,l.par);let s=E.initial(l);for(const a of p)s=E.step(l,s,a);assert(E.won(l,s));console.log(`encore ${i+1}: ${p.join('')} (${p.length})`);});
