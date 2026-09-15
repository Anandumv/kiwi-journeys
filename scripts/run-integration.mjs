import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('@next/env').loadEnvConfig(process.cwd());
const url = new URL(process.env.TEST_DATABASE_URL || process.env.DATABASE_URL);
if (!['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('Integration tests require a local database.');
url.pathname = '/kiwi_journeys_audit_test';
const env = { ...process.env, DATABASE_URL: url.toString(), RESEND_API_KEY: '', STRIPE_SECRET_KEY: '', TWILIO_ACCOUNT_SID: '', TWILIO_AUTH_TOKEN: '', META_WHATSAPP_TOKEN: '', META_WHATSAPP_PHONE_ID: '' };
for (const args of [['node_modules/prisma/build/index.js','migrate','deploy'],['node_modules/tsx/dist/cli.mjs','--test','scripts/booking.integration.ts']]) {
 const result=spawnSync(process.execPath,args,{env,stdio:'inherit'});
 if(result.status !== 0) process.exit(result.status ?? 1);
}
