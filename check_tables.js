const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://qcngfiwliorztaafhhwo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjbmdmaXdsaW9yenRhYWZoaHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTkyMjUsImV4cCI6MjA4NzM3NTIyNX0.OIpL8lrXS1ZuH3SD0svS-i0wPfrkEc57bUCUwbnf5ZY'
);

async function testFetch() {
    const tables = ['profiles', 'posts', 'comments', 'supports', 'dislikes'];
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        console.log(`Table ${table}:`, error ? error.message : (data.length > 0 ? 'Has data' : 'Empty but exists'));
    }
}

testFetch();
