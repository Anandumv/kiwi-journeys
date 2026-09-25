import test from 'node:test';
import assert from 'node:assert/strict';
import {absoluteUrl, serializeJsonLd} from '../src/lib/json-ld';
test('CMS text cannot escape a JSON-LD script element',()=>{
 const value={name:'</script><script>alert(1)</script>'};
 const result=serializeJsonLd(value);
 assert.equal(result.includes('<'),false);
 assert.deepEqual(JSON.parse(result),value);
});
test('structured-data images become absolute URLs',()=>{
 const site='https://example.test';
 assert.equal(absoluteUrl(site,'/images/a.jpg'),'https://example.test/images/a.jpg');
 assert.equal(absoluteUrl(site,'images/a.jpg'),'https://example.test/images/a.jpg');
 assert.equal(absoluteUrl(site,'https://cdn.test/a.jpg'),'https://cdn.test/a.jpg');
 assert.equal(absoluteUrl(site,''),undefined);
 assert.equal(absoluteUrl(site,null),undefined);
});
