import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data } = await supabase.auth.getSession();
  const { session } = data;

  if (!session) {
    return NextResponse.json({ data: [] }, { status: 200 });
  }

  try {
    const { data: products, error } = await supabase
      .from('ads_products')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    return NextResponse.json({ data: products || [] }, { status: 200 });
  } catch (_) {
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}

export async function POST(req) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data } = await supabase.auth.getSession();
  const { session } = data;

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, url, tagline, platform, logo_url } = body || {};
  if (!name || !url || !tagline || !platform) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const insertBody = {
      name,
      url,
      tagline,
      platform,
      logo_url: logo_url || null,
      user_id: session.user.id,
    };

    const { data: created, error } = await supabase
      .from('ads_products')
      .insert(insertBody)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Insert failed' }, { status: 400 });
    }

    return NextResponse.json({ data: created }, { status: 200 });
  } catch (_) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

