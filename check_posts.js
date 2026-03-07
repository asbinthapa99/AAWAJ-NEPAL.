const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://qcngfiwliorztaafhhwo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjbmdmaXdsaW9yenRhYWZoaHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTkyMjUsImV4cCI6MjA4NzM3NTIyNX0.OIpL8lrXS1ZuH3SD0svS-i0wPfrkEc57bUCUwbnf5ZY'
);

async function testFetch() {
    const { data, error } = await supabase.from('posts').select('*').limit(1);
    if (error) {
        console.error('ERROR:', error);
    } else {
        console.log('POSTS columns:', data.length > 0 ? Object.keys(data[0]) : 'Empty table, columns are: ' + JSON.stringify(data));
    }
}

testFetch();
