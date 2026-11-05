// Single-alert finite reference model, no production adapter.
import assert from 'node:assert/strict';
const initial={queued:false,delivered:false,acked:false,revoked:false,effects:0};
const actions=['queue','deliver','retry','ack','revoke'];
const key=s=>JSON.stringify(s);
function step(s,a){
  if(a==='queue'&&!s.revoked) return {...s,queued:true};
  if(a==='deliver'&&s.queued&&!s.delivered&&!s.revoked)
    return {...s,delivered:true,effects:1};
  if(a==='ack'&&s.delivered) return {...s,acked:true};
  if(a==='revoke') return {...s,revoked:true};
  return s; // duplicate retries and invalid operations stutter
}
const invariant=s=>(!s.delivered||s.queued)&&(!s.acked||s.delivered)&&
  s.effects<=1&&(!s.delivered||s.effects===1);
function verify(successor){
  const seen=new Map([[key(initial),initial]]),queue=[initial];
  for(let i=0;i<queue.length;i++){
    const s=queue[i];
    assert.ok(invariant(s),`unsafe ${key(s)}`);
    for(const a of actions){
      const n=successor(s,a);
      assert.ok(!s.revoked||n.effects===s.effects,'delivery after revoke');
      assert.ok(n.effects>=s.effects,'effect counter decreased');
      if(!seen.has(key(n))){
        assert.ok(seen.size<128,'state bound overflow');
        seen.set(key(n),n);queue.push(n);
      }
    }
  }
  return [...seen.values()];
}
const states=verify(step);
assert.ok(states.length>=5,'vacuous graph');
assert.ok(states.some(s=>s.acked));
assert.ok(states.some(s=>s.revoked&&!s.delivered));
assert.throws(()=>verify((s,a)=>a==='ack'?{...s,acked:true}:step(s,a)),/unsafe/);
console.log(`model=alert_delivery_idempotence states=${states.length} negative_controls=1 status=PASS scope=abstract`);
