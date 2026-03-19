
import 'dotenv/config';
import { supabaseAdmin } from './server/db.js';

async function diagnose() {
    console.log("Checking invitations table...");
    const { data: invitations, error: invError } = await supabaseAdmin
        .from('invitations')
        .select('*');

    if (invError) {
        console.error("Error fetching invitations:", invError);
    } else {
        console.log("Invitations found:", invitations.length);
        invitations.forEach(inv => {
            console.log(`- ID: ${inv.id}, Email: ${inv.email}, Family: ${inv.family_id}, Status: ${inv.status}`);
        });
    }

    console.log("\nChecking family_members table...");
    const { data: members, error: memError } = await supabaseAdmin
        .from('family_members')
        .select('*');

    if (memError) {
        console.error("Error fetching members:", memError);
    } else {
        console.log("Members found:", members.length);
        members.forEach(mem => {
            console.log(`- User: ${mem.user_id}, Family: ${mem.family_id}, Role: ${mem.role}`);
        });
    }
}

diagnose();
