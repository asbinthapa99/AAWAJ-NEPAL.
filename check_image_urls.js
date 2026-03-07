const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const sb = createClient(
  'https://qcngfiwliorztaafhhwo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjbmdmaXdsaW9yenRhYWZoaHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTkyMjUsImV4cCI6MjA4NzM3NTIyNX0.OIpL8lrXS1ZuH3SD0svS-i0wPfrkEc57bUCUwbnf5ZY'
);

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
