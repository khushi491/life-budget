import { getActiveHouseholdContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { setHouseholdCouple, setHouseholdFamily, setHouseholdIndividual } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/form";

export default async function HouseholdPage() {
  const { household } = await getActiveHouseholdContext();
  const members = await prisma.householdMember.findMany({
    where: { householdId: household.id, status: "ACTIVE" },
    include: { user: true },
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Household</h1>
        <p className="text-muted-foreground mt-2">
          Change between individual, couple, and family without deleting
          history. Mode only changes how we ask questions and split shared
          costs.
        </p>
      </header>
      <Card>
        <CardTitle>Current mode: {household.mode.toLowerCase()}</CardTitle>
        <CardHint>
          Historical transactions stay attached to this household ID.
        </CardHint>
        <form className="mt-4 flex flex-wrap gap-3">
          <Button formAction={setHouseholdIndividual} variant={household.mode === "INDIVIDUAL" ? "default" : "outline"}>
            individual
          </Button>
          <Button formAction={setHouseholdCouple} variant={household.mode === "COUPLE" ? "default" : "outline"}>
            couple
          </Button>
          <Button formAction={setHouseholdFamily} variant={household.mode === "FAMILY" ? "default" : "outline"}>
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
      </Card>
    </div>
  );
}
