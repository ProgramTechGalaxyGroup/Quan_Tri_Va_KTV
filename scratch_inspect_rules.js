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
        const { data, error } = await supabase
            .from('SystemConfigs')
            .select('*')
            .eq('key', 'notification_rules')
            .single();
        if (error) throw error;
        console.log("--- Current Notification Rules Config ---");
        console.log(JSON.stringify(data.value, null, 2));
    } catch (err) {
        console.error("Error reading config:", err);
    }
}

checkData();
