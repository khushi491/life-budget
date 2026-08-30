import Link from "next/link";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { demoLoginCouple, demoLoginFamily, demoLoginIndividual } from "@/server/actions";
import { isDemoModeEnabled } from "@/lib/env";

export default function LandingPage() {
  const demo = isDemoModeEnabled();
  return (
    <div className="bg-background min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <span className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-2xl">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="font-semibold">LifeBudget</span>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Start your journey</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-24">
        <section className="grid items-center gap-12 py-12 lg:grid-cols-2">
          <div>
            <p className="text-primary text-sm font-semibold tracking-wide uppercase">
              A calmer way to budget
            </p>
            <h1 className="mt-3 text-4xl leading-tight font-semibold tracking-tight md:text-5xl">
              After paying for your current lifestyle, can you safely afford the
              next major life decision?
            </h1>
            <p className="text-muted-foreground mt-5 max-w-xl text-lg leading-8">
              LifeBudget walks individuals, couples, and families through money
              one question at a time. No dense ledgers. Just a visual path from
              this month’s cash flow to a house, a buffer, and a plan you can
              explain.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/signup">Begin with a few questions</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">I already have an account</Link>
              </Button>
            </div>
          </div>
          <div className="border-border bg-card rounded-[2rem] border p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)]">
            <p className="text-muted-foreground text-sm">
              A typical monthly story
            </p>
            <p className="mt-3 text-2xl font-semibold">
              You earned $8,500. After $5,700 in expenses and $1,200 in savings,
              $1,600 remains.
            </p>
            <ol className="mt-6 space-y-3 text-sm leading-6">
              <li className="bg-muted rounded-2xl px-4 py-3">
                1. Who are you budgeting for?
              </li>
              <li className="bg-muted rounded-2xl px-4 py-3">
                2. How much money enters the household?
              </li>
              <li className="bg-muted rounded-2xl px-4 py-3">
                3. What must be paid every month?
              </li>
              <li className="bg-accent rounded-2xl px-4 py-3 font-medium">
                7. Can you afford the next major goal?
              </li>
            </ol>
          </div>
        </section>

        {demo ? (
          <section className="border-border bg-card rounded-[2rem] border p-8">
            <h2 className="text-2xl font-semibold">
              Try a realistic household without entering your own numbers
            </h2>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Demo mode uses seeded data for an individual, a couple, and a
              family — including USD and INR examples, a year of transactions,
              and house scenarios.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <form action={demoLoginIndividual}>
                <Button
                  type="submit"
                  variant="outline"
                  className="h-auto w-full flex-col items-start py-4"
                >
                  <span>Alex · individual</span>
                  <span className="text-muted-foreground font-normal">
                    USD, building an emergency fund
                  </span>
                </Button>
              </form>
              <form action={demoLoginCouple}>
                <Button
                  type="submit"
                  className="h-auto w-full flex-col items-start py-4"
                >
                  <span>Jordan & Sam · couple</span>
                  <span className="text-primary-foreground/80 font-normal">
                    USD, deciding whether to buy
                  </span>
                </Button>
              </form>
              <form action={demoLoginFamily}>
                <Button
                  type="submit"
                  variant="outline"
                  className="h-auto w-full flex-col items-start py-4"
                >
                  <span>Mehta family</span>
                  <span className="text-muted-foreground font-normal">
                    INR, planning an apartment EMI
                  </span>
                </Button>
              </form>
            </div>
          </section>
        ) : null}

        <section className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            [
              "Visual cash flow",
              "See income move into housing, essentials, lifestyle, debt, savings, and leftover money.",
            ],
            [
              "House planning",
              "Estimate EMI or mortgage, cash to close, emergency savings after buying, and risk in plain language.",
            ],
            [
              "Guided, not judged",
              "Every step explains what we need, why it matters, and what to consider next.",
            ],
          ].map(([title, body]) => (
            <article
              key={title}
              className="border-border bg-card rounded-3xl border p-6"
            >
              <h3 className="font-semibold">{title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                {body}
              </p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
