import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Reveal } from '../src/components/Reveal';

test('reveal content is not hidden in the server-rendered page', () => {
  const html = renderToStaticMarkup(createElement(Reveal, { children: 'Find a tour' }));
  assert.ok(html.includes('Find a tour'));
  assert.doesNotMatch(html, /opacity:\s*0(?:[;"\s]|$)/);
});
