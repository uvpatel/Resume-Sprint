const assert=require('node:assert/strict');const E=require('./engine.js');const copy=()=>structuredClone(E.source);
let d=copy();assert.equal(E.validate(d).valid,true);assert.equal(E.score(d).total,70);
d.pop();assert.equal(E.validate(d).valid,false,'missing language blocked');
d=copy();d[2].text='Built AWS APIs connecting Salesforce and SAP.';assert.equal(E.validate(d).valid,false,'equal counts cannot conceal changed facts');
d=copy();d[3].text+=' Processing 10 million records.';assert.equal(E.validate(d).valid,false,'invented metrics blocked');
d=copy();d[8]={...d[0]};assert.equal(E.validate(d).valid,false,'duplicate IDs cannot replace source units');
d=copy();for(const c of E.changes)d.find(x=>x.id===c.block).text=c.after;assert.equal(E.validate(d).valid,true);assert.equal(E.score(d).total,73);assert.equal(E.score(d).total,E.score(d).parts.reduce((a,b)=>a+b));
d=copy();d[0].text=E.changes[2].after;assert.equal(E.score(d).total,70,'safe edits need not raise score');
for(const c of E.changes){let b=E.source.find(x=>x.id===c.block).text;const tokens=E.diff(b,c.after);assert.equal(tokens.filter(x=>x.type!=='add').map(x=>x.text).join(''),b);assert.equal(tokens.filter(x=>x.type!=='remove').map(x=>x.text).join(''),c.after)}
assert.equal(E.source[2].text,'Responsible for building MuleSoft APIs connecting Salesforce and SAP.','source immutable across operations');console.log('All 11 preservation/scoring checks and 6 diff reconstruction checks passed.');
