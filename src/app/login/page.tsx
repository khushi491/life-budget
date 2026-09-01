import Link from "next/link";
import { SignInForm } from "@/components/auth-forms";
import { redirectIfAuthenticated } from "@/lib/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await redirectIfAuthenticated();
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 text-zinc-950">
      <h1 className="text-3xl font-bold">Welcome back</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Sign in to continue your household’s financial journey.
      </p>
      <SignInForm error={error} />
      <p className="text-muted-foreground mt-6 text-sm">
        New here?{" "}
        <Link href="/signup" className="text-primary font-medium">
          Create an account
        </Link>
      </p>
    </main>
  );
}
