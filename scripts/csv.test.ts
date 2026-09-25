import test from 'node:test';
import assert from 'node:assert/strict';
import { csvCell } from '../src/lib/csv';
test('booking CSV exports customer text without executable formulas',()=>{
  for(const value of ['=1+1','+123','-1+2','@SUM(A1)','  =1+1','\tformula']) assert.ok(csvCell(value).startsWith('"\''));
  assert.equal(csvCell('A "quoted", name'),'"A ""quoted"", name"');
  assert.equal(csvCell('Normal Guest'),'"Normal Guest"');
});
