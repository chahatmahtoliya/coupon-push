import assert from 'node:assert/strict';
import { sanitizeStoreHtml } from '../src/lib/store-html.ts';

const html = sanitizeStoreHtml('<!doctype html><html><head><title>Wrong title</title><link rel="canonical" href="https://merchant.example/"><meta name="robots" content="noindex"></head><body><h1>Guide</h1><p onclick="alert(1)">Useful <strong>copy</strong></p><script>alert(1)</script><a href="javascript:alert(1)">Bad link</a><a href="https://merchant.example/offers">Offers</a></body></html>');
assert.doesNotMatch(html, /<head|<title|<link|<meta|<script|<h1|onclick|javascript:|Wrong title/);
assert.match(html, /<h2>Guide<\/h2>/);
assert.match(html, /Useful <strong>copy<\/strong>/);
assert.match(html, /href="https:\/\/merchant.example\/offers"/);
console.log('Imported document metadata is removed; useful formatting and safe links are preserved.');
