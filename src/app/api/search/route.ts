import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
    const q = request.nextUrl.searchParams.get('q')?.trim();

    if (!q || q.length < 2) {
        return NextResponse.json({ users: [] });
    }

    const supabase = createClient();
    const searchTerm = `%${q}%`;

    const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .or(`username.ilike.${searchTerm},full_name.ilike.${searchTerm}`)
        .limit(10);

    if (error) {
        return NextResponse.json({ users: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: data || [] });
}
