import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('fork identity names career-ops-japan and credits upstream', async () => {
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  assert.match(readme, /career-ops-japan/i);
  assert.match(readme, /santifer\/career-ops|based on career-ops/i);
});
