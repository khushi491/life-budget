import Link from "next/link";
import { ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { redirectIfAuthenticated } from "@/lib/session";
import { signUpAction } from "@/server/actions";

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
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      <form action={signUpAction} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="name">Your name</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            minLength={10}
            required
          />
          <p className="text-muted-foreground mt-1 text-xs">
            At least 10 characters.
          </p>
        </div>
        <Button type="submit" className="w-full">
          Create account <ChevronsRight className="h-4 w-4" />
        </Button>
      </form>
      <p className="text-muted-foreground mt-6 text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium">
          Sign in
        </Link>
      </p>
    </main>
  );
}
