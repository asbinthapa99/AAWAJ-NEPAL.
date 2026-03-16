const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_ANON_KEY } = require('./config');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFetch() {
    const { data, error } = await supabase
        .from('posts')
        .select('*, author:profiles!posts_author_id_fkey(id, full_name, username, avatar_url)')
        .is('deleted_at', null)
        .limit(15);

    if (error) {
        console.error('ERROR:', error);
    } else {
        console.log('SUCCESS, fetched count:', data.length);
    }
}

testFetch();
