import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { ROOT } from '../helpers.mjs';

const { loadProviders } = await import(pathToFileURL(join(ROOT, 'providers/_registry.mjs')).href);

test('japan shared helpers and tests follow loader-safe placement conventions', async () => {
  const providerFiles = readdirSync(join(ROOT, 'providers')).sort();
  assert.equal(providerFiles.includes('japan-job-schema.mjs'), false);
  assert.equal(providerFiles.includes('japan-adapter-contract.mjs'), false);
  assert.equal(providerFiles.includes('japan-job-schema.test.mjs'), false);
  assert.equal(providerFiles.includes('japan-adapter-contract.test.mjs'), false);
  assert.equal(providerFiles.includes('_japan-job-schema.mjs'), true);
  assert.equal(providerFiles.includes('_japan-adapter-contract.mjs'), true);

  const providers = await loadProviders(join(ROOT, 'providers'));
  assert.equal(providers.has('japan-job-schema'), false);
  assert.equal(providers.has('japan-adapter-contract'), false);
});
