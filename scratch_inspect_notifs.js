const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    try {
        console.log("--- Fetching a few Users ---");
        const { data: users, error: uErr } = await supabase
            .from('Users')
            .select('id, username, code, role')
            .limit(5);
        if (uErr) throw uErr;
        console.log(users);

        console.log("\n--- Fetching a few StaffNotifications ---");
        const { data: notifs, error: nErr } = await supabase
            .from('StaffNotifications')
            .select('id, bookingId, employeeId, type, message, isRead, createdAt')
            .order('createdAt', { ascending: false })
            .limit(10);
        if (nErr) throw nErr;
        console.log(notifs);
    } catch (err) {
        console.error(err);
    }
}

checkData();
