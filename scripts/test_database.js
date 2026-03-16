const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_ANON_KEY } = require('./config');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDatabase() {
    console.log('1. Fetching all posts...');
    const { data: posts, error: fetchError } = await supabase.from('posts').select('*');
    console.log('Posts count:', posts?.length);
    if (fetchError) console.error('Fetch error:', fetchError);

    if (posts?.length === 0) {
        console.log('2. No posts found. Attempting to insert a test post...');

        // Get a profile ID to use as author
        const { data: profiles } = await supabase.from('profiles').select('id').limit(1);

        if (profiles && profiles.length > 0) {
            const authorId = profiles[0].id;
            console.log('Using author ID:', authorId);

            const { data: newPost, error: insertError } = await supabase.from('posts').insert([
                {
                    title: 'Test Post',
                    content: 'This is a test post to verify the feed is working.',
                    author_id: authorId,
                    category: 'other',
                    urgency: 'medium'
                }
            ]).select();

            if (insertError) {
                console.error('Insert error:', insertError);
            } else {
                console.log('Successfully inserted post:', newPost);
            }
        } else {
            console.log('Cannot insert test post: No profiles found in the database. Please sign up or log in first.');
        }
    }
}

testDatabase();
