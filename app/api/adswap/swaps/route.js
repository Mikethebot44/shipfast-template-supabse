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
    const { data: swaps, error } = await supabase
      .from('ads_swaps')
      .select('*')
      .or(`requester_user_id.eq.${session.user.id},target_user_id.eq.${session.user.id}`)
      .order('created_at', { ascending: false });

    if (error || !swaps?.length) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const productIds = Array.from(new Set(swaps.map((s) => s.target_product_id).filter(Boolean)));
    let productsMap = {};
    if (productIds.length) {
      const { data: products } = await supabase
        .from('ads_products')
        .select('*')
        .in('id', productIds);
      productsMap = (products || []).reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {});
    }

    const result = swaps.map((s) => ({
      ...s,
      product: productsMap[s.target_product_id] || null,
    }));

    return NextResponse.json({ data: result }, { status: 200 });
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
  const { productId } = body || {};
  if (!productId) {
    return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
  }

  try {
    const { data: product, error: pError } = await supabase
      .from('ads_products')
      .select('*')
      .eq('id', productId)
      .single();

    if (pError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.user_id === session.user.id) {
      return NextResponse.json({ error: 'Cannot request swap on your own product' }, { status: 400 });
    }

    const insertBody = {
      requester_user_id: session.user.id,
      target_user_id: product.user_id,
      target_product_id: product.id,
      platform: product.platform,
      status: 'pending',
    };

    const { data: created, error } = await supabase
      .from('ads_swaps')
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

