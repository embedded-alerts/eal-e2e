import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

function loadPin() {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 6; i += 1) {
    const candidate = path.join(dir, 'env-map-product.json');
    if (existsSync(candidate)) {
      return {
        root: dir,
        pin: JSON.parse(readFileSync(candidate, 'utf8')),
      };
    }
    dir = path.dirname(dir);
  }
  throw new Error('env-map-product.json not found');
}

const { pin } = loadPin();

function materializeProduct() {
  if (process.env.ENV_MAP_PRODUCT_DIR) {
    const dir = path.resolve(process.env.ENV_MAP_PRODUCT_DIR);
    assert.ok(existsSync(path.join(dir, 'Cargo.toml')), 'ENV_MAP_PRODUCT_DIR needs Cargo.toml');
    return { dir, cleanup() {} };
  }
  const dir = mkdtempSync(path.join(tmpdir(), 'env-map-product-'));
  const init = spawnSync('git', ['init', dir], { encoding: 'utf8' });
  assert.equal(init.status, 0, init.stderr);
  spawnSync(
    'git',
    ['-C', dir, 'remote', 'add', 'origin', `https://github.com/${pin.repository}.git`],
    { encoding: 'utf8' },
  );
  const fetched = spawnSync('git', ['-C', dir, 'fetch', '--depth', '1', 'origin', pin.sha], {
    encoding: 'utf8',
  });
  assert.equal(fetched.status, 0, fetched.stderr || fetched.stdout);
  const checked = spawnSync('git', ['-C', dir, 'checkout', '--detach', 'FETCH_HEAD'], {
    encoding: 'utf8',
  });
  assert.equal(checked.status, 0, checked.stderr);
  return { dir, cleanup() { rmSync(dir, { recursive: true, force: true }); } };
}

test(`cloned ${pin.repository}@${pin.sha.slice(0, 7)} src/ does not call set_var`, () => {
  const { dir, cleanup } = materializeProduct();
  try {
    const sha = spawnSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
    assert.equal(sha.stdout.trim(), pin.sha);
    for (const needle of pin.forbidden) {
      const grep = spawnSync(
        'git',
        ['-C', dir, 'grep', '-n', needle, '--', ...(pin.paths || ['src'])],
        { encoding: 'utf8' },
      );
      assert.equal(
        (grep.stdout || '').trim(),
        '',
        `forbidden ${needle}:\n${grep.stdout}`,
      );
    }
  } finally {
    cleanup();
  }
});
