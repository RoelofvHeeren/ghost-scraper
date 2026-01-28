import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new pg.Client({
    connectionString: 'postgresql://postgres:oUBkRzpfmLzBIDJsEBjtvuxlErmxIoXh@nozomi.proxy.rlwy.net:35417/railway',
    ssl: { rejectUnauthorized: false }
});

async function initDatabase() {
    try {
        await client.connect();
        console.log('✅ Connected to Railway database');

        const sqlPath = '/Users/roelofvanheeren/.gemini/antigravity/brain/f71d256b-bd41-46d0-b713-19372967d6d2/railway_init_schema.sql';
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('🔄 Running schema initialization...');
        await client.query(sql);

        console.log('✅ Database schema initialized successfully!');

        // Verify tables were created
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);

        console.log('\n📊 Created tables:');
        result.rows.forEach(row => console.log(`  - ${row.table_name}`));

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

initDatabase();
