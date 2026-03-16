const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_ANON_KEY } = require('./config');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFetch() {
    const tables = ['profiles', 'posts', 'comments', 'supports', 'dislikes'];
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        console.log(`Table ${table}:`, error ? error.message : (data.length > 0 ? 'Has data' : 'Empty but exists'));
    }
}

testFetch();
