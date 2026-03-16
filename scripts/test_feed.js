const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_ANON_KEY } = require('./config');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFetch() {
    const { data, error } = await supabase.from('profiles').select('id, username').limit(2);
    console.log('PROFILES:', data, error);

    const { data: postsData, error: postsError } = await supabase.from('posts').select('*').limit(2);
    console.log('POSTS:', postsData, postsError);
}

testFetch();
lado
