import { execSync } from 'child_process';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
    console.log('🚀 Starting Database Bootstrap...');

    try {
        console.log('📡 Attempting Prisma DB Push...');
        // First try with inherit to see real-time output
        execSync('npx prisma db push --schema=../../prisma/schema.prisma --accept-data-loss', { stdio: 'inherit' });
        console.log('✅ Prisma DB Push successful.');
    } catch (error) {
        console.warn('⚠️ Prisma DB Push failed. Re-capturing error output...');

        let errOutput = '';
        try {
            // Re-run quietly to capture the error string
            execSync('npx prisma db push --schema=../../prisma/schema.prisma --accept-data-loss', { stdio: 'pipe' });
        } catch (pipeError) {
            errOutput = (pipeError.stdout?.toString() || '') + (pipeError.stderr?.toString() || '');
        }

        console.log('🔍 Captured Error snippet:', errOutput.slice(0, 300));

        if (errOutput.includes('P1014') || errOutput.includes('does not exist') || errOutput.includes('LearnedSelector')) {
            console.log('🚨 Confirmed: Missing tables (P1014). Running manual SQL initialization...');

            const { Client } = pg;
            const client = new Client({
                connectionString: process.env.DATABASE_URL,
            });

            try {
                await client.connect();
                const sqlPath = path.join(__dirname, 'full_schema.sql');
                const sql = fs.readFileSync(sqlPath, 'utf8');

                console.log('📝 Executing full_schema.sql...');
                await client.query('BEGIN');
                await client.query(sql);
                await client.query('COMMIT');

                console.log('✅ Manual SQL initialization successful.');

                // Final sync to ensure Prisma is satisfied
                console.log('📡 Re-attempting Prisma DB Push after manual init...');
                execSync('npx prisma db push --schema=../../prisma/schema.prisma --accept-data-loss', { stdio: 'inherit' });
            } catch (sqlError) {
                console.error('❌ Manual SQL initialization failed:', sqlError.message);
                if (client) await client.query('ROLLBACK').catch(() => { });
                process.exit(1);
            } finally {
                await client.end().catch(() => { });
            }
        } else {
            console.error('❌ Prisma DB Push failed with an unhandled error. Output was:', errOutput);
            process.exit(1);
        }
    }
}

main();
