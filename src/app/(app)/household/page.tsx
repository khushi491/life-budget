import { getActiveHouseholdContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import {
  setHouseholdCouple,
  setHouseholdFamily,
  setHouseholdIndividual,
} from "@/server/actions";
import {
  addHouseholdMemberAction,
  createInvitationAction,
  revokeInvitationAction,
} from "@/server/finance-actions";
import { Button } from "@/components/ui/button";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { Badge, Input, Label } from "@/components/ui/form";
import { ConfirmButton } from "@/components/confirm-button";
import { CopyButton } from "@/components/copy-button";

export default async function HouseholdPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { household } = await getActiveHouseholdContext();
  const [members, invitations] = await Promise.all([
    prisma.householdMember.findMany({
      where: { householdId: household.id, status: "ACTIVE" },
      include: { user: true },
    }),
    prisma.invitation.findMany({
      where: { householdId: household.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Household</h1>
        <p className="text-muted-foreground mt-2">
          Change between individual, couple, and family without deleting
          history. Mode only changes how we ask questions and split shared
          costs.
        </p>
        {error ? <p className="text-destructive mt-3 text-sm">{error}</p> : null}
      </header>
      <Card>
        <CardTitle>Current mode: {household.mode.toLowerCase()}</CardTitle>
        <CardHint>
          Historical transactions stay attached to this household ID.
        </CardHint>
        <form className="mt-4 flex flex-wrap gap-3">
          <Button
            formAction={setHouseholdIndividual}
            variant={household.mode === "INDIVIDUAL" ? "default" : "outline"}
          >
            individual
          </Button>
          <Button
            formAction={setHouseholdCouple}
            variant={household.mode === "COUPLE" ? "default" : "outline"}
          >
            couple
          </Button>
          <Button
            formAction={setHouseholdFamily}
            variant={household.mode === "FAMILY" ? "default" : "outline"}
          >
            family
          </Button>
        </form>
      </Card>
      <Card>
        <CardTitle>People</CardTitle>
        <ul className="mt-4 space-y-3">
          {members.map((member) => (
            <li
              key={member.id}
              className="bg-muted flex items-center justify-between rounded-2xl px-4 py-3"
            >
              <div>
                <p className="font-medium">{member.displayName}</p>
                <p className="text-muted-foreground text-sm">
                  {member.user?.email ?? "No login yet"}
                </p>
              </div>
              <Badge>
                {member.role.toLowerCase()}
                {member.isDependent ? " · dependent" : ""}
              </Badge>
            </li>
          ))}
        </ul>
        <form
          action={addHouseholdMemberAction}
          className="mt-6 grid gap-3 md:grid-cols-3"
        >
          <div>
            <Label htmlFor="displayName">Add someone without a login</Label>
            <Input id="displayName" name="displayName" required />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              className="h-11 w-full rounded-2xl border px-3"
              defaultValue="PARTNER"
            >
              <option value="PARTNER">Partner</option>
              <option value="ADULT">Adult</option>
              <option value="DEPENDENT">Dependent</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit">Add person</Button>
          </div>
        </form>
      </Card>
      <Card>
        <CardTitle>Invite someone to log in</CardTitle>
        <CardHint>
          We create a link you can copy. They must use the same email. The link
          expires in 7 days.
        </CardHint>
        <form
          action={createInvitationAction}
          className="mt-4 grid gap-3 md:grid-cols-3"
        >
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="invite-role">Role</Label>
            <select
              id="invite-role"
              name="role"
              className="h-11 w-full rounded-2xl border px-3"
              defaultValue="PARTNER"
            >
              <option value="PARTNER">Partner</option>
              <option value="ADULT">Adult</option>
              <option value="DEPENDENT">Dependent</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit">Create invite link</Button>
          </div>
        </form>
        <ul className="mt-6 space-y-3">
          {invitations.map((invite) => {
            const url = `${appUrl}/invite/${invite.token}`;
            return (
              <li
                key={invite.id}
                className="bg-muted flex flex-col gap-3 rounded-2xl px-4 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium">{invite.email}</p>
                  <p className="text-muted-foreground break-all text-xs">{url}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <CopyButton value={url} />
                  <ConfirmButton
                    message="Revoke this invite?"
                    action={revokeInvitationAction.bind(null, invite.id)}
                  >
                    Revoke
                  </ConfirmButton>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
