const fs = require('fs');
const { Client } = require('pg');

async function run() {
    try {
        const env = fs.readFileSync('.env.local', 'utf8');
        const dbUrlLine = env.split('\n').find(l => l.startsWith('DATABASE_URL='));
        if (!dbUrlLine) throw new Error('No DATABASE_URL found');
        const dbUrl = dbUrlLine.split('=')[1].replace(/['"]/g, '').trim();
        
        const client = new Client({ connectionString: dbUrl });
        await client.connect();
        
        const sql = fs.readFileSync('migrations/20260528_fix_turnqueue_time_overwrite.sql', 'utf8');
        console.log('Executing migration...');
        await client.query(sql);
        console.log('Migration successful!');
        
        await client.end();
    } catch (e) {
        console.error('Error:', e);
    }
}
run();
