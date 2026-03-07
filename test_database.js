const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://qcngfiwliorztaafhhwo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjbmdmaXdsaW9yenRhYWZoaHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTkyMjUsImV4cCI6MjA4NzM3NTIyNX0.OIpL8lrXS1ZuH3SD0svS-i0wPfrkEc57bUCUwbnf5ZY'
);

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
