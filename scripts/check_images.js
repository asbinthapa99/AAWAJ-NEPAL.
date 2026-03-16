const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_ANON_KEY } = require('./config');

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

(async () => {
  // Check recent posts - are images null?
  const { data } = await sb.from('posts')
    .select('id,title,image_url,video_url,created_at')
    .order('created_at', { ascending: false })
    .limit(8);

  console.log('=== RECENT POSTS ===');
  data.forEach(p => {
    console.log(
      (p.title || '(no title)').slice(0, 30).padEnd(32),
      '| img:', p.image_url ? p.image_url.slice(0, 50) + '...' : 'NULL',
      '| vid:', p.video_url ? 'YES' : 'null'
    );
  });

  // Test storage upload as anon
  console.log('\n=== STORAGE UPLOAD TEST (as anon) ===');
  const { error } = await sb.storage.from('post-images').upload(
    '__test_' + Date.now() + '.txt',
    Buffer.from('test'),
    { contentType: 'text/plain' }
  );
  console.log('Anon upload result:', error ? error.message : 'SUCCESS');
})();
