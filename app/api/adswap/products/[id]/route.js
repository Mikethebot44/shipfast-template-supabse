import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function PUT(req, { params }) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data } = await supabase.auth.getSession();
  const { session } = data;

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const body = await req.json();
  const update = {};
  ['name', 'url', 'tagline', 'platform', 'logo_url'].forEach((k) => {
    if (body?.[k] !== undefined) update[k] = body[k];
  });

  try {
    // Ensure the product belongs to the current user
    const { data: product, error: fetchError } = await supabase
      .from('ads_products')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !product || product.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { data: updated, error } = await supabase
      .from('ads_products')
      .update(update)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Update failed' }, { status: 400 });
    }

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (_) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

