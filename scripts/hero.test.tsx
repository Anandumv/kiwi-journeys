import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { CinematicHero } from '../src/components/CinematicHero';
import type { SiteSettings } from '../src/lib/content';
test('homepage headline and booking links exist before JavaScript runs',()=>{
 const html=renderToStaticMarkup(createElement(CinematicHero,{settings:{tagline:'Explore New Zealand',description:'A day to remember',heroImage:'/images/brand/Hero-Ocean-Alps.jpg'} as SiteSettings}));
 assert.match(html,/<h1[\s>]/);
 assert.match(html,/href="\/tours"/);
 assert.match(html,/href="\/private-tours"/);
});
