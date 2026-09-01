"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { authActionErrorMessage } from "@/lib/auth-errors";
import { loginSchema, signupSchema } from "@/lib/schemas";

async function postAuth(
  path: "/sign-up/email" | "/sign-in/email",
  body: Record<string, string>,
) {
  const response = await fetch(`/api/auth${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    code?: string;
    message?: string;
  };
  if (!response.ok) {
    throw Object.assign(new Error(payload.message ?? "Auth request failed"), {
      body: payload,
      code: payload.code,
    });
  }
}

export function SignupForm({ error }: { error?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState(error);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setFormError(undefined);
    const form = new FormData(event.currentTarget);
    const parsed = signupSchema.safeParse({
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    if (!parsed.success) {
      setFormError(
        parsed.error.issues[0]?.message ?? "Please check your details.",
      );
      setPending(false);
      return;
    }
    try {
      await postAuth("/sign-up/email", parsed.data);
      router.push("/onboarding");
      router.refresh();
    } catch (caught) {
      setFormError(
        authActionErrorMessage(
          caught,
          "We could not create that account. Please try again.",
        ),
      );
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      {formError ? (
        <p className="text-destructive text-sm">{formError}</p>
      ) : null}
      <div>
        <Label htmlFor="name">Your name</Label>
        <Input id="name" name="name" autoComplete="name" required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
        />
        <p className="text-muted-foreground mt-1 text-xs">
          At least 10 characters.
        </p>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
        {pending ? null : <ChevronsRight className="h-4 w-4" />}
      </Button>
    </form>
  );
}

export function SignInForm({ error }: { error?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState(error);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setFormError(undefined);
    const form = new FormData(event.currentTarget);
    const parsed = loginSchema.safeParse({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    if (!parsed.success) {
      setFormError(
        parsed.error.issues[0]?.message ?? "Please check your details.",
      );
      setPending(false);
      return;
    }
    try {
      await postAuth("/sign-in/email", parsed.data);
      router.push("/dashboard");
      router.refresh();
    } catch (caught) {
      setFormError(
        authActionErrorMessage(
          caught,
          "We could not sign you in with those details.",
        ),
      );
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      {formError ? (
        <p className="text-destructive text-sm">{formError}</p>
      ) : null}
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
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
        {pending ? null : <ChevronsRight className="h-4 w-4" />}
      </Button>
    </form>
  );
}
