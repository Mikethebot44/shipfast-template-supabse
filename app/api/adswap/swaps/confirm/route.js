import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data } = await supabase.auth.getSession();
  const { session } = data;

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { swapId } = body || {};
  if (!swapId) {
    return NextResponse.json({ error: 'Missing swapId' }, { status: 400 });
  }

  try {
    const { data: swap, error: sError } = await supabase
      .from('ads_swaps')
      .select('*')
      .eq('id', swapId)
      .single();

    if (sError || !swap) {
      return NextResponse.json({ error: 'Swap not found' }, { status: 404 });
    }

    if (swap.requester_user_id !== session.user.id && swap.target_user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: updated, error } = await supabase
      .from('ads_swaps')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', swapId)
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

