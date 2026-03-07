async function checkSchema() {
    const url = 'https://qcngfiwliorztaafhhwo.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjbmdmaXdsaW9yenRhYWZoaHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTkyMjUsImV4cCI6MjA4NzM3NTIyNX0.OIpL8lrXS1ZuH3SD0svS-i0wPfrkEc57bUCUwbnf5ZY';

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
