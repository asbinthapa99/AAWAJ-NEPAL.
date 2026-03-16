const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_ANON_KEY } = require('./config');
const https = require('https');

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

(async () => {
  const { data } = await sb.from('posts')
    .select('id,title,image_url')
    .not('image_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(3);

  for (const p of data) {
    console.log(`\nPost: "${p.title}" | URL: ${p.image_url}`);
    // Try HTTP HEAD to see if image is accessible
    try {
      const res = await fetch(p.image_url, { method: 'HEAD' });
      console.log(`  Status: ${res.status} | Content-Type: ${res.headers.get('content-type')} | Size: ${res.headers.get('content-length')}`);
    } catch (e) {
      console.log(`  FETCH ERROR: ${e.message}`);
    }
  }
})();
