const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://qcngfiwliorztaafhhwo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjbmdmaXdsaW9yenRhYWZoaHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTkyMjUsImV4cCI6MjA4NzM3NTIyNX0.OIpL8lrXS1ZuH3SD0svS-i0wPfrkEc57bUCUwbnf5ZY'
);

async function verify() {
    console.log('=== POST-MIGRATION VERIFICATION ===\n');

    // Tables
    const tables = ['profiles', 'posts', 'comments', 'supports', 'dislikes', 'reports', 'follows'];
    for (const t of tables) {
        const { error } = await supabase.from(t).select('id').limit(1);
        console.log(`${error ? '❌' : '✅'} ${t}: ${error ? error.message : 'OK'}`);
    }

    // Supports columns
    console.log('\n=== SUPPORTS COLUMNS ===');
    const { error: colErr } = await supabase.from('supports').select('id, post_id, user_id, created_at').limit(1);
    console.log(`Columns check: ${colErr ? '❌ ' + colErr.message : '✅ OK'}`);

    // Comments columns
    console.log('\n=== COMMENTS COLUMNS ===');
    const { error: comErr } = await supabase.from('comments').select('id, post_id, author_id, content, deleted_at, created_at').limit(1);
    console.log(`Columns check: ${comErr ? '❌ ' + comErr.message : '✅ OK'}`);

    // Storage upload test
    console.log('\n=== STORAGE UPLOAD TEST (anon, should fail) ===');
    const blob = Buffer.from('test');
    const { error: upErr } = await supabase.storage.from('post-images').upload(`__verify_${Date.now()}.txt`, blob);
    console.log(`Anon upload: ${upErr ? 'Correctly blocked — ' + upErr.message : '⚠️  Unexpectedly succeeded'}`);

    console.log('\n=== DONE ===');
    console.log('If all tables show ✅, run the app and test:');
    console.log('  1. Tap Love button → should work');
    console.log('  2. Open post → write comment → should post');
    console.log('  3. Create post with photo → should show fullscreen');
}

verify().catch(console.error);
