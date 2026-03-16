const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_ANON_KEY } = require('./config');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runUserQuery() {
    const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

    console.log("POSTS_FETCH", { count: data?.length, data, error });
}

runUserQuery();
