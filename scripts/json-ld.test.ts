import test from 'node:test';
import assert from 'node:assert/strict';
import {serializeJsonLd} from '../src/lib/json-ld';
test('CMS text cannot escape a JSON-LD script element',()=>{
 const value={name:'</script><script>alert(1)</script>'};
 const result=serializeJsonLd(value);
 assert.equal(result.includes('<'),false);
 assert.deepEqual(JSON.parse(result),value);
});
