import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSettingsJson, parseTourPrices } from '../src/lib/cms-validation';
const settings = () => { const f = new FormData(); for (const [k,v] of Object.entries({nav:[],stats:[],valueProps:[],social:{},currencyRates:{NZD:1}})) f.set(k, JSON.stringify(v)); return f; };
test('CMS rejects malformed JSON instead of erasing settings', () => { const f=settings();f.set('nav','[');assert.throws(()=>parseSettingsJson(f),/No settings were saved/); });
test('CMS rejects valid JSON with the wrong shape and unsafe navigation', () => { const f=settings();f.set('nav','{}');assert.throws(()=>parseSettingsJson(f)); f.set('nav',JSON.stringify([{label:'Bad',href:'javascript:alert(1)'}]));assert.throws(()=>parseSettingsJson(f)); });
test('CMS accepts intentionally empty collections and valid currency rates',()=>assert.equal(parseSettingsJson(settings()).currencyRates.NZD,1));
test('CMS rejects invalid and duplicate prices before writing a tour',()=>{ for(const value of ['adult | Adult | nope | 1','adult | Adult | -1 | 1','adult | Adult | 50 | -1','adult | Adult | 10 | 1\nadult | Other | 20 | 1','']) assert.throws(()=>parseTourPrices(value)); });
test('CMS converts valid prices to cents and preserves group seat counts',()=>assert.deepEqual(parseTourPrices('group | Group | 100.25 | 4')[0],{key:'group',label:'Group',priceCents:10025,seatsPerUnit:4,sortOrder:0}));
