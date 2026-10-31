// Test-only extraction: tar data filter avoids applying archive ownership in rootless CI.
import { brotliDecompressSync } from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const output = '/tmp/omnifix-chromium';
fs.mkdirSync(output, { recursive: true });
for (const name of fs.readdirSync('node_modules/@sparticuz/chromium/bin')) {
  if (!name.endsWith('.br')) continue;
  const data = brotliDecompressSync(fs.readFileSync(path.join('node_modules/@sparticuz/chromium/bin', name)));
  const dest = path.join(output, name.slice(0, -3));
  fs.writeFileSync(dest, data);
  if (name.endsWith('.tar.br')) execFileSync('python3', ['-c', "import tarfile,sys\nwith tarfile.open(sys.argv[1]) as t:t.extractall(sys.argv[2],filter='data')", dest, output]);
  else fs.chmodSync(dest, 0o755);
}
console.log(path.join(output, 'chromium'));
