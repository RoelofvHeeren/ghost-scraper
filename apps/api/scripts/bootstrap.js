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
        console.warn('⚠️ Prisma DB Push failed. Re-capturing error output for inspection...');

        let errOutput = '';
        try {
            execSync('npx prisma db push --schema=../../prisma/schema.prisma --accept-data-loss', { stdio: 'pipe' });
        } catch (pipeError) {
            errOutput = (pipeError.stdout?.toString() || '') + (pipeError.stderr?.toString() || '');
        }

        console.log('🔍 captured Error snippet:', errOutput.slice(0, 300));

        if (errOutput.includes('P1014') || errOutput.includes('does not exist') || errOutput.includes('LearnedSelector')) {
            console.log('🚨 Confirmed: Missing tables (P1014). Running manual SQL initialization...');

            const { Client } = pg;
            const client = new Client({
                connectionString: process.env.DATABASE_URL,
            });

            try {
                await client.connect();
                const sqlPath = path.join(__dirname, 'full_schema.sql');
                const sqlContent = fs.readFileSync(sqlPath, 'utf8');

                // Split SQL by markers to handle pre-existing objects independently
                const blocks = sqlContent.split(/^-- /m).filter(b => b.trim().length > 0);

                console.log(`📝 Executing ${blocks.length} SQL blocks...`);

                for (const block of blocks) {
                    const statement = '-- ' + block; // Restore the marker
                    try {
                        await client.query(statement);
                    } catch (stmtError) {
                        if (stmtError.message.includes('already exists')) {
                            // Silently ignore objects that are already there
                            // This is expected for enums or base tables
                        } else {
                            console.warn(`📜 Warning in block: ${stmtError.message}`);
                        }
                    }
                }

                console.log('✅ Manual SQL initialization completed (ignoring existing objects).');

                // Final sync to ensure Prisma state is unified
                console.log('📡 Re-attempting Prisma DB Push after manual init...');
                execSync('npx prisma db push --schema=../../prisma/schema.prisma --accept-data-loss', { stdio: 'inherit' });
            } catch (sqlError) {
                console.error('❌ Manual SQL initialization failed:', sqlError.message);
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
