const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  'https://qcngfiwliorztaafhhwo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjbmdmaXdsaW9yenRhYWZoaHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTkyMjUsImV4cCI6MjA4NzM3NTIyNX0.OIpL8lrXS1ZuH3SD0svS-i0wPfrkEc57bUCUwbnf5ZY'
);

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
