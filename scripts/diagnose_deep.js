const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_ANON_KEY } = require('./config');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function deepDiagnose() {
    // 1. Check supports table columns
    console.log('=== SUPPORTS TABLE STRUCTURE ===');
    const { data: supRows, error: supErr } = await supabase.from('supports').select('*').limit(0);
    // Even with 0 rows, the response headers tell us about columns
    // Let's try inserting with a real user to see what happens
    console.log('Supports select error:', supErr?.message || 'OK');

    // 2. Check all existing RLS policies via pg_policies (may not be accessible with anon key)
    console.log('\n=== CHECKING RLS POLICIES (via rpc) ===');
    const { data: policies, error: polErr } = await supabase.rpc('get_policies', {});
    if (polErr) {
        console.log('Cannot call get_policies RPC:', polErr.message);
    } else {
        console.log('Policies:', JSON.stringify(policies, null, 2));
    }

    // 3. Check supports columns by trying to read with specific column names
    console.log('\n=== SUPPORTS COLUMN CHECK ===');
    for (const col of ['id', 'post_id', 'user_id', 'created_at', 'author_id']) {
        const { error } = await supabase.from('supports').select(col).limit(1);
        console.log(`  Column "${col}":`, error ? `❌ ${error.message}` : '✅ exists');
    }

    // 4. Check posts sample to see image_url format
    console.log('\n=== POSTS WITH IMAGES ===');
    const { data: imgPosts } = await supabase.from('posts')
        .select('id, image_url, video_url')
        .not('image_url', 'is', null)
        .limit(3);
    if (imgPosts) {
        imgPosts.forEach(p => console.log(`  Post ${p.id}: image=${p.image_url?.substring(0, 80)}... video=${p.video_url || 'none'}`));
    }
    
    // Also check posts without images
    const { data: allPosts } = await supabase.from('posts').select('id, title, image_url, video_url').limit(10);
    if (allPosts) {
        console.log('\n=== ALL POSTS ===');
        allPosts.forEach(p => console.log(`  "${p.title?.substring(0, 40)}" | img: ${p.image_url ? 'yes' : 'no'} | vid: ${p.video_url ? 'yes' : 'no'}`));
    }

    // 5. Check storage bucket configs in detail
    console.log('\n=== STORAGE BUCKET DETAILS ===');
    const bucketNames = ['posts', 'post-images', 'media', 'avatars'];
    for (const name of bucketNames) {
        // Try uploading a tiny test file to see size limit
        const testBlob = Buffer.from('test');
        const { error: upErr } = await supabase.storage.from(name).upload(`__test_${Date.now()}.txt`, testBlob, {
            contentType: 'text/plain',
            upsert: true
        });
        if (upErr) {
            console.log(`  Bucket "${name}": upload test failed — ${upErr.message}`);
        } else {
            console.log(`  Bucket "${name}": ✅ upload works`);
            // Clean up
            await supabase.storage.from(name).remove([`__test_${Date.now()}.txt`]);
        }
    }

    // 6. List what's in post-images bucket
    console.log('\n=== POST-IMAGES BUCKET CONTENTS ===');
    const { data: files } = await supabase.storage.from('post-images').list('', { limit: 10 });
    if (files) {
        files.forEach(f => console.log(`  ${f.name} | size: ${f.metadata?.size || 'unknown'} | type: ${f.metadata?.mimetype || 'unknown'}`));
    }
}

deepDiagnose().catch(console.error);
