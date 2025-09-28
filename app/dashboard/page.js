import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import ButtonAccount from "@/components/ButtonAccount";
export const dynamic = "force-dynamic";
import DashboardClient from "./DashboardClient";

// This is a private page: It's protected by the layout.js component which ensures the user is authenticated.
// It's a server compoment which means you can fetch data (like the user profile) before the page is rendered.
// See https://shipfa.st/docs/tutorials/private-page
export default async function Dashboard() {
  const supabase = createServerComponentClient({ cookies });
  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-5xl mx-auto space-y-8">
        <ButtonAccount />
        <h1 className="text-3xl md:text-4xl font-extrabold">Dashboard</h1>
        <DashboardClient />
      </section>
    </main>
  );
}
