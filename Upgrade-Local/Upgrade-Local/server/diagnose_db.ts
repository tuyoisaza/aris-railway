
import { supabase } from './src/db';

async function run() {
    console.log("Diagnosing DB connection...");

    // 1. Check Profiles
    const { data: profiles, error: pError } = await supabase.from('profiles').select('id').limit(1);
    console.log("Profiles check:", pError ? `Error: ${pError.message}` : `Success (Found ${profiles?.length ?? 0})`);

    // 2. Check System Settings
    const { data: settings, error: sError } = await supabase.from('system_settings').select('*').limit(1);
    console.log("Settings check:", sError ? `Error: ${sError.code} - ${sError.message}` : `Success (Found ${settings?.length ?? 0})`);

    // 3. Check System Logs
    const { data: logs, error: lError } = await supabase.from('system_logs').select('*').limit(1);
    console.log("Logs check:", lError ? `Error: ${lError.code} - ${lError.message}` : `Success (Found ${logs?.length ?? 0})`);
}

run();
