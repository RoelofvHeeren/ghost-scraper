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
        execSync('npx prisma db push --schema=../../prisma/schema.prisma --accept-data-loss', { stdio: 'inherit' });
        console.log('✅ Prisma DB Push successful.');
    } catch (error) {
        console.warn('⚠️ Prisma DB Push failed. Checking if we need to initialize manually...');

        // Check if the error is due to missing tables (P1014)
        const errOutput = error.stdout?.toString() || error.stderr?.toString() || error.message;
        if (errOutput.includes('P1014') || errOutput.includes('does not exist')) {
            console.log('🔍 Detected missing tables (P1014). Running manual SQL initialization...');

            const { Client } = pg;
            const client = new Client({
                connectionString: process.env.DATABASE_URL,
            });

            try {
                await client.connect();
                const sqlPath = path.join(__dirname, 'full_schema.sql');
                const sql = fs.readFileSync(sqlPath, 'utf8');

                // Split by semicolon to run statements separately (pg driver doesn't like multi-statement strings sometimes)
                // But for initialization, we can try running it as one block if the DB supports it.
                // We'll wrap in a transaction.
                await client.query('BEGIN');
                await client.query(sql);
                await client.query('COMMIT');

                console.log('✅ Manual SQL initialization successful.');

                // Try prisma again to ensure everything is synced
                console.log('📡 Re-attempting Prisma DB Push after manual init...');
                execSync('npx prisma db push --schema=../../prisma/schema.prisma --accept-data-loss', { stdio: 'inherit' });
            } catch (sqlError) {
                console.error('❌ Manual SQL initialization failed:', sqlError.message);
                await client.query('ROLLBACK').catch(() => { });
                process.exit(1);
            } finally {
                await client.end();
            }
        } else {
            console.error('❌ Prisma DB Push failed with an unexpected error:', error.message);
            process.exit(1);
        }
    }
}

main();
