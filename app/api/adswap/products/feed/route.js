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
      .neq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    return NextResponse.json({ data: products || [] }, { status: 200 });
  } catch (_) {
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}

