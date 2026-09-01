import Link from "next/link";
import { ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { redirectIfAuthenticated } from "@/lib/session";
import { signInAction } from "@/server/actions";

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
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      <form action={signInAction} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <Button type="submit" className="w-full">
          Sign in <ChevronsRight className="h-4 w-4" />
        </Button>
      </form>
      <p className="text-muted-foreground mt-6 text-sm">
        New here?{" "}
        <Link href="/signup" className="text-primary font-medium">
          Create an account
        </Link>
      </p>
    </main>
  );
}
