import Link from "next/link";
import { SignupForm } from "@/components/auth-forms";
import { redirectIfAuthenticated } from "@/lib/session";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await redirectIfAuthenticated();
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 text-zinc-950">
      <h1 className="text-3xl font-bold">Start LifeBudget</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        We’ll ask a few plain-language questions. You can save and come back.
      </p>
      <SignupForm error={error} />
      <p className="text-muted-foreground mt-6 text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium">
          Sign in
        </Link>
      </p>
    </main>
  );
}
