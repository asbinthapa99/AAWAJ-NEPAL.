const { SUPABASE_URL, SUPABASE_ANON_KEY } = require('./config');

async function checkSchema() {
    const url = `${SUPABASE_URL}/rest/v1/?apikey=${SUPABASE_ANON_KEY}`;

    const res = await fetch(url);
    const json = await res.json();

    const postsDefinition = json.definitions?.posts;
    if (postsDefinition) {
        console.log('Posts columns:', Object.keys(postsDefinition.properties));
        console.log('Full posts definition:', JSON.stringify(postsDefinition, null, 2));
    } else {
        console.log('Posts table NOT found in OpenAPI spec');
        console.log('Available tables:', Object.keys(json.definitions || {}));
    }
}

checkSchema();
