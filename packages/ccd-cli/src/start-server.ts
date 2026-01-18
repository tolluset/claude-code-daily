#!/usr/bin/env bun
// CCD Server startup script
// Start the server directly with the ccd-server command

import { join } from 'path';
import { existsSync } from 'fs';

const serverDir = join(__dirname, '../ccd-server');
const serverEntry = join(serverDir, 'src/index.ts');

if (existsSync(serverEntry)) {
  // Development: Run TypeScript directly
  import(serverEntry);
} else {
  // Production: Run built server
  const builtServer = join(serverDir, 'dist/index.js');
  if (existsSync(builtServer)) {
    import(builtServer);
  } else {
    console.error('CCD server not found.');
    process.exit(1);
  }
}
