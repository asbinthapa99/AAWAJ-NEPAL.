const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_ANON_KEY } = require('./config');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFetch() {
    const { data, error } = await supabase.from('posts').select('*').limit(1);
    if (error) {
        console.error('ERROR:', error);
    } else {
        console.log('POSTS columns:', data.length > 0 ? Object.keys(data[0]) : 'Empty table, columns are: ' + JSON.stringify(data));
    }
}

testFetch();
