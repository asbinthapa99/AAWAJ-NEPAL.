const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://qcngfiwliorztaafhhwo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjbmdmaXdsaW9yenRhYWZoaHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTkyMjUsImV4cCI6MjA4NzM3NTIyNX0.OIpL8lrXS1ZuH3SD0svS-i0wPfrkEc57bUCUwbnf5ZY'
);

async function diagnose() {
    console.log('=== DATABASE DIAGNOSIS ===\n');

    // 1. Check all tables
    const tables = ['profiles', 'posts', 'comments', 'supports', 'dislikes', 'follows', 'conversations', 'messages', 'reports'];
    for (const table of tables) {
        const { data, error, count } = await supabase.from(table).select('*', { count: 'exact', head: false }).limit(3);
        if (error) {
            console.log(`❌ ${table}: ${error.message}`);
        } else {
            console.log(`✅ ${table}: exists (${data.length} rows sampled)`);
        }
    }

    // 2. Check posts structure (video_url, deleted_at, image_url columns)
    console.log('\n=== POSTS STRUCTURE ===');
    const { data: post, error: postErr } = await supabase.from('posts').select('*').limit(1).single();
    if (post) {
        const cols = Object.keys(post);
        console.log('Columns:', cols.join(', '));
        console.log('Has video_url:', cols.includes('video_url'));
        console.log('Has deleted_at:', cols.includes('deleted_at'));
        console.log('Has image_url:', cols.includes('image_url'));
    } else {
        console.log('Could not read post:', postErr?.message);
    }

    // 3. Try inserting into supports as anon (should fail with RLS, not table-not-found)
    console.log('\n=== SUPPORTS RLS TEST ===');
    const { error: supErr } = await supabase.from('supports').insert({ post_id: '00000000-0000-0000-0000-000000000000', user_id: '00000000-0000-0000-0000-000000000000' });
    console.log('Anon insert into supports:', supErr?.message || 'Unexpectedly succeeded');
    console.log('Error code:', supErr?.code);

    // 4. Check RLS policies on supports via trying select
    console.log('\n=== SUPPORTS SELECT TEST ===');
    const { data: supData, error: supSelErr } = await supabase.from('supports').select('*').limit(5);
    console.log('Select supports:', supSelErr?.message || `OK, ${supData?.length} rows`);

    // 5. Check storage buckets
    console.log('\n=== STORAGE BUCKETS ===');
    const { data: buckets, error: buckErr } = await supabase.storage.listBuckets();
    if (buckErr) {
        console.log('Cannot list buckets:', buckErr.message);
    } else {
        for (const b of buckets) {
            console.log(`Bucket: ${b.name} | public: ${b.public} | fileSizeLimit: ${b.file_size_limit || 'none'}`);
        }
    }

    // 6. Check if there's a bucket for post images/media
    console.log('\n=== POST IMAGE BUCKET TEST ===');
    const mediaBuckets = ['posts', 'post-images', 'media', 'images', 'avatars', 'post_images'];
    for (const name of mediaBuckets) {
        const { data, error } = await supabase.storage.from(name).list('', { limit: 1 });
        if (!error) {
            console.log(`✅ Bucket "${name}": accessible (${data?.length || 0} items)`);
        }
    }
}

diagnose().catch(console.error);
