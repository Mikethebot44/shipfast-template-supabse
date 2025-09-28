import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data } = await supabase.auth.getSession();
  const { session } = data;

  if (!session) {
    return NextResponse.json({ completed: 0, pending: 0, credits: 0 }, { status: 200 });
  }

  try {
    const { data: swapsPending } = await supabase
      .from('ads_swaps')
      .select('*')
      .or(`requester_user_id.eq.${session.user.id},target_user_id.eq.${session.user.id}`)
      .eq('status', 'pending');

    const { data: swapsCompleted } = await supabase
      .from('ads_swaps')
      .select('*')
      .or(`requester_user_id.eq.${session.user.id},target_user_id.eq.${session.user.id}`)
      .eq('status', 'completed');

    // Try credits table if exists; otherwise default to 0
    let credits = 0;
    try {
      const { data: creditRow } = await supabase
        .from('ads_credits')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      if (creditRow && typeof creditRow.credits === 'number') {
        credits = creditRow.credits;
      }
    } catch (_) {}

    return NextResponse.json({
      completed: swapsCompleted?.length || 0,
      pending: swapsPending?.length || 0,
      credits,
    }, { status: 200 });
  } catch (_) {
    return NextResponse.json({ completed: 0, pending: 0, credits: 0 }, { status: 200 });
  }
}

