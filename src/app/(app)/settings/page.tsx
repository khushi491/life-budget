import { getActiveHouseholdContext } from "@/lib/session";
import { ConfirmButton } from "@/components/confirm-button";
import { deleteAccountAction, signOutAction } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { CURRENCY_META } from "@/lib/finance";

export default async function SettingsPage() {
  const { household, session } = await getActiveHouseholdContext();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Settings</h1>
      </header>
      <Card>
        <CardTitle>Household</CardTitle>
        <CardHint>
          {household.name} · {CURRENCY_META[household.currency].name} ·{" "}
          {session.user.email}
        </CardHint>
        <p className="text-muted-foreground mt-3 text-sm">
          Dark mode follows your system appearance. Reduce-motion is respected
          automatically. Bank connections and a paid AI assistant are extension
          points — the app works without them.
        </p>
      </Card>
      <Card>
        <CardTitle>Session</CardTitle>
        <form action={signOutAction} className="mt-4">
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </Card>
      <Card>
        <CardTitle>Delete account</CardTitle>
        <CardHint>
          This removes your login and any household you solely own.
          Transactions, budgets, and goals for those households are deleted.
          This cannot be undone.
        </CardHint>
        <div className="mt-4">
          <ConfirmButton
            variant="destructive"
            message="Delete your account and any household you solely own? This cannot be undone."
            action={deleteAccountAction}
          >
            Delete my account
          </ConfirmButton>
        </div>
      </Card>
    </div>
  );
}
