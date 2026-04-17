import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { next } = await searchParams;

  if (user) redirect(next || "/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center bg-[color:var(--surface)] p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold tracking-tight">BrandPulse</h1>
          <p className="text-xs text-[color:var(--text-tertiary)] mt-1 tracking-wide">
            Reputation Intelligence
          </p>
        </div>
        <LoginForm next={next} />
      </div>
    </main>
  );
}
