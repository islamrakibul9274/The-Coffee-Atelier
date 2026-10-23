const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(require('node:path').join(__dirname, '../src/lib/checkout.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const sandbox = { exports: {}, require };
vm.runInNewContext(compiled, sandbox);
const { normalizeCart } = sandbox.exports;
const id = '6a01f0105d8d8b730645d4de';

test('checkout accepts product IDs and quantities, never a browser supplied price', () => {
  const result = normalizeCart({ items: [{ id, quantity: 2, price: 0.01, name: 'Fake price' }] });
  assert.equal(JSON.stringify(result), JSON.stringify([{ id, quantity: 2 }]));
});

test('duplicate product lines and differently cased IDs share one quantity limit', () => {
  assert.equal(normalizeCart({ items: [{ id, quantity: 2 }, { id: id.toUpperCase(), quantity: 3 }] })[0].quantity, 5);
  assert.throws(() => normalizeCart({ items: [{ id, quantity: 50 }, { id, quantity: 50 }] }));
});

test('malformed IDs, empty carts and unsafe quantities cannot reach checkout', () => {
  for (const quantity of [-1, 0, 1.5, 100, NaN, Infinity, '2', null]) {
    assert.throws(() => normalizeCart({ items: [{ id, quantity }] }));
  }
  for (const input of [null, {}, { items: [] }, { items: [{ id: { $ne: null }, quantity: 1 }] }, { items: [{ id: 'invalid', quantity: 1 }] }]) {
    assert.throws(() => normalizeCart(input));
  }
});

const offerSource = fs.readFileSync(require('node:path').join(__dirname, '../src/lib/offers.ts'), 'utf8');
const offerSandbox = { exports: {}, require };
vm.runInNewContext(ts.transpileModule(offerSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, offerSandbox);
const { offerSavings, isOfferActive } = offerSandbox.exports;
const offer = (changes = {}) => ({ type: 'percentage', value: 10, isActive: true, appliesTo: { type: 'all' }, ...changes });

test('offers use the best eligible saving, without stacking or negative totals', () => {
  assert.equal(offerSavings(1000, 2, id, 'cat', [offer(), offer({ type: 'fixed', value: 3 })]), 600);
  assert.equal(offerSavings(1000, 2, id, 'cat', [offer({ value: 200 })]), 2000);
  assert.equal(offerSavings(1000, 2, id, 'cat', [offer({ value: -10 }), offer({ value: NaN })]), 0);
});

test('category and product offers cannot leak to unrelated products', () => {
  assert.equal(offerSavings(1000, 2, id, 'cat', [offer({ appliesTo: { type: 'product', targetId: 'other' } })]), 0);
  assert.equal(offerSavings(1000, 2, id, 'cat', [offer({ appliesTo: { type: 'category', targetId: 'cat' } })]), 200);
});

test('BOGO discounts only complete pairs and expired offers do not apply', () => {
  assert.equal(offerSavings(1000, 3, id, 'cat', [offer({ type: 'bogo' })]), 1000);
  assert.equal(isOfferActive(offer({ endDate: '2020-01-01' }), Date.parse('2026-10-23')), false);
  assert.equal(isOfferActive(offer({ startDate: '2030-01-01' }), Date.parse('2026-10-23')), false);
  assert.equal(isOfferActive(offer({ isActive: false })), false);
});

test('weekly offers recur inside their scheduled window', () => {
  const weekly = offer({ startDate: '2026-10-01T00:00:00Z', endDate: '2026-10-02T00:00:00Z', repeatWeekly: true });
  assert.equal(isOfferActive(weekly, Date.parse('2026-10-08T12:00:00Z')), true);
  assert.equal(isOfferActive(weekly, Date.parse('2026-10-10T12:00:00Z')), false);
});
