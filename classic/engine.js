(function(root){
const dirs={U:[0,-1],R:[1,0],D:[0,1],L:[-1,0]};
function initial(l){return {a:[...l.a],b:[...l.b],lead:0,last:null,moves:0,swaps:0};}
function same(a,b){return a[0]===b[0]&&a[1]===b[1];}
function adjacent(s){return Math.abs(s.a[0]-s.b[0])+Math.abs(s.a[1]-s.b[1])===1;}
function won(l,s){return same(s.a,l.ga)&&same(s.b,l.gb);}
function step(l,s,action){let n=JSON.parse(JSON.stringify(s));if(action==='X'){if(!l.swap||!adjacent(s))return null;n.lead=1-s.lead;n.swaps++;return n;}
if(!dirs[action])return null;
function move(p,d){if(!d)return [...p];const v=dirs[d],q=[p[0]+v[0],p[1]+v[1]];return l.map[q[1]]&&l.map[q[1]][q[0]]==='.'?q:[...p];}
let a=move(s.a,s.lead===0?action:s.last),b=move(s.b,s.lead===1?action:s.last);
if(same(a,b)||(same(a,s.b)&&same(b,s.a))){a=[...s.a];b=[...s.b];}
n.a=a;n.b=b;n.last=action;n.moves++;return n;}
function key(s){return [s.a,s.b,s.lead,s.last].join('|');}
function solve(l,start=initial(l),allowSwap=l.swap){let q=[[start,[]]],seen=new Set([key(start)]);for(let i=0;i<q.length;i++){let [s,path]=q[i];if(won(l,s))return path;for(let d of allowSwap?['U','R','D','L','X']:['U','R','D','L']){let n=step(l,s,d);if(n&&!seen.has(key(n))){seen.add(key(n));q.push([n,[...path,d]]);}}}return null;}
const api={dirs,initial,same,adjacent,won,step,key,solve};if(typeof module!=='undefined')module.exports=api;else root.GameEngine=api;
})(typeof window!=='undefined'?window:globalThis);
