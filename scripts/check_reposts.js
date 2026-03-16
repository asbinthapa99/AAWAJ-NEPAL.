const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_ANON_KEY } = require('./config');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkReposts() {
    const url = `${SUPABASE_URL}/rest/v1/?apikey=${SUPABASE_ANON_KEY}`;

    const res = await fetch(url);
    const json = await res.json();

    const repostsDefinition = json.definitions?.reposts;
    if (repostsDefinition) {
        console.log('Reposts columns:', Object.keys(repostsDefinition.properties));
    } else {
        console.log('Reposts table NOT found in OpenAPI spec');
    }
}

checkReposts();
