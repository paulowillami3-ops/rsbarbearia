const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');


const app = express();
const PORT = 3001;

// Supabase Init
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key missing in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());

// Legacy endpoints removed or kept as placeholder. 
// Since frontend uses Supabase directly, this server now acts primarily as a Background Worker.

app.get('/health', (req, res) => {
    res.json({ status: 'ok', mode: 'worker' });
});

// --- Auto-Complete Background Service ---
async function checkAutoCompletion() {
    const now = new Date();
    // console.log(`[Worker] Checking for completions at ${now.toLocaleTimeString()}...`);

    // Fetch PENDING appointments
    const { data: rows, error } = await supabase
        .from('appointments')
        .select('id, appointment_date, appointment_time')
        .eq('status', 'PENDING');

    if (error) {
        console.error("Error checking auto-completion:", error.message);
        return;
    }

    if (!rows || rows.length === 0) return;

    for (const app of rows) {
        // app.appointment_date is "YYYY-MM-DD"
        // app.appointment_time is "HH:mm" or "HH:mm:ss"
        const dateStr = app.appointment_date;
        const timeStr = app.appointment_time;

        if (!dateStr || !timeStr) continue;

        const [year, month, day] = dateStr.split('-').map(Number);
        const [hours, minutes] = timeStr.split(':').map(Number);

        // Date used: Month is 0-indexed in JS Date
        const appDate = new Date(year, month - 1, day, hours, minutes);

        // Add 30 minutes tolerance
        // If current time > appointment time + 30 mins
        const completionThreshold = new Date(appDate.getTime() + 30 * 60000);

        if (now > completionThreshold) {
            console.log(`[Worker] Auto-completing appointment ${app.id} (Scheduled: ${dateStr} ${timeStr})`);

            const { error: updateError } = await supabase
                .from('appointments')
                .update({ status: 'COMPLETED' })
                .eq('id', app.id);

            if (updateError) {
                console.error(`Failed to update appointment ${app.id}:`, updateError.message);
            }
        }
    }
}

// Run immediately on start, then every minute
checkAutoCompletion();
setInterval(checkAutoCompletion, 60 * 1000);

app.listen(PORT, () => {
    console.log(`Worker Server running on port ${PORT}`);
    console.log(`Connected to Supabase: ${supabaseUrl}`);
});

