const { test } = require('node:test');
const assert = require('node:assert/strict');
const { generateKeyPairSync, sign, verify } = require('node:crypto');
const path = require('node:path');

test('Firebase signing-key dependency loads in CommonJS and returns usable RSA public keys', async () => {
  const { retrieveSigningKeys } = require(path.join(path.dirname(require.resolve('jwks-rsa')), 'utils.js'));
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key', use: 'sig', alg: 'RS256' };
  const keys = await retrieveSigningKeys([jwk]);
  assert.equal(keys.length, 1);
  assert.equal(keys[0].kid, 'test-key');
  const message = Buffer.from('Firebase runtime compatibility');
  assert.equal(verify('RSA-SHA256', message, keys[0].getPublicKey(), sign('RSA-SHA256', message, privateKey)), true);
});
