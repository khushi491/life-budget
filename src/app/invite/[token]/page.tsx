import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { acceptInvitationAction } from "@/server/finance-actions";

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  const session = await getSession();
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { household: true },
  });

  if (!invitation) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6">
        <h1 className="text-3xl font-semibold">Invite not found</h1>
        <p className="text-muted-foreground mt-3">
          This link is missing or was typed incorrectly.
        </p>
      </main>
    );
  }

  const expired = invitation.expiresAt.getTime() < Date.now();
  const inactive = invitation.status !== "PENDING" || expired;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6">
      <h1 className="text-3xl font-semibold">Join {invitation.household.name}</h1>
      <p className="text-muted-foreground mt-3">
        This invite is for {invitation.email} as a{" "}
        {invitation.role.toLowerCase()}.
      </p>
      {error ? <p className="text-destructive mt-4 text-sm">{error}</p> : null}
      {inactive ? (
        <p className="text-destructive mt-4 text-sm">
          {expired
            ? "This invite has expired."
            : "This invite is no longer valid."}
        </p>
      ) : null}
      {!session ? (
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="bg-primary text-primary-foreground inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold"
          >
            Sign in to join
          </Link>
          <Link
            href="/signup"
            className="border-border inline-flex h-11 items-center rounded-full border px-5 text-sm font-semibold"
          >
            Create an account
          </Link>
        </div>
      ) : inactive ? null : (
        <form
          action={acceptInvitationAction.bind(null, token)}
          className="mt-8"
        >
          <Button type="submit">Join this household</Button>
        </form>
      )}
    </main>
  );
}
