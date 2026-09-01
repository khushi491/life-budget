import Link from "next/link";
import { ChevronsRight, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Highlight } from "@/components/highlight";
import { demoLoginCouple, demoLoginFamily, demoLoginIndividual } from "@/server/actions";
import { isDemoModeEnabled } from "@/lib/env";

export default function LandingPage() {
  const demo = isDemoModeEnabled();
  return (
    <div className="min-h-screen bg-[#F6EFBE] text-zinc-950">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950 text-white">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="font-bold">LifeBudget</span>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild className="border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild className="bg-zinc-950 text-white hover:bg-zinc-800">
            <Link href="/signup">
              Get started <ChevronsRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-24">
        <section className="grid items-center gap-12 py-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold tracking-wide uppercase">
              A calmer way to budget
            </p>
            <h1 className="mt-4 text-4xl leading-[1.15] font-bold tracking-tight md:text-5xl">
              After this lifestyle, can you afford the next{" "}
              <Highlight tone="mint">bills</Highlight>,{" "}
              <Highlight tone="lavender">home</Highlight>, or{" "}
              <Highlight tone="blush">goal</Highlight>?
            </h1>
            <p className="text-muted-foreground mt-5 max-w-xl text-lg leading-8">
              LifeBudget walks individuals, couples, and families through money
              one question at a time. No dense ledgers. Just a visual path from
              this month’s cash flow to a house, a buffer, and a plan you can
              explain.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild className="bg-zinc-950 text-white hover:bg-zinc-800">
                <Link href="/signup">
                  Get started <ChevronsRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50">
                <Link href="/login">I already have an account</Link>
              </Button>
            </div>
          </div>
          <div className="bg-card relative overflow-hidden rounded-[2.25rem] p-8">
            <div className="bg-mint absolute top-8 right-10 h-24 w-24 rounded-3xl opacity-80" />
            <div className="bg-lavender absolute right-24 bottom-16 h-16 w-28 rounded-2xl opacity-90" />
            <div className="bg-blush absolute bottom-10 left-10 h-14 w-14 rounded-full" />
            <p className="text-muted-foreground relative text-sm">
              A typical monthly story
            </p>
            <p className="relative mt-3 text-2xl font-bold">
              You earned $8,500. After $5,700 in expenses and $1,200 in savings,
              $1,600 remains.
            </p>
            <ol className="relative mt-6 space-y-3 text-sm leading-6">
              <li className="bg-muted rounded-full px-5 py-3">
                1. Who are you budgeting for?
              </li>
              <li className="bg-muted rounded-full px-5 py-3">
                2. How much money enters the household?
              </li>
              <li className="bg-sun rounded-full px-5 py-3 font-medium">
                7. Can you afford the next major goal?
              </li>
            </ol>
          </div>
        </section>

        {demo ? (
          <section className="bg-card rounded-[2.25rem] p-8">
            <h2 className="text-2xl font-bold">
              Try a household without entering your own numbers
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
                  className="h-auto w-full flex-col items-start rounded-[1.5rem] border-zinc-200 bg-white py-5 text-zinc-950 hover:bg-zinc-50"
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
                  className="h-auto w-full flex-col items-start rounded-[1.5rem] bg-zinc-950 py-5 text-white hover:bg-zinc-800"
                >
                  <span>Jordan & Sam · couple</span>
                  <span className="font-normal text-white/80">
                    USD, deciding whether to buy
                  </span>
                </Button>
              </form>
              <form action={demoLoginFamily}>
                <Button
                  type="submit"
                  variant="outline"
                  className="h-auto w-full flex-col items-start rounded-[1.5rem] border-zinc-200 bg-white py-5 text-zinc-950 hover:bg-zinc-50"
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
              "mint",
            ],
            [
              "House planning",
              "Estimate EMI or mortgage, cash to close, emergency savings after buying, and risk in plain language.",
              "lavender",
            ],
            [
              "Guided, not judged",
              "Every step explains what we need, why it matters, and what to consider next.",
              "blush",
            ],
          ].map(([title, body, tone]) => (
            <article
              key={title}
              className={`rounded-[1.75rem] p-6 ${
                tone === "mint"
                  ? "bg-mint"
                  : tone === "lavender"
                    ? "bg-lavender"
                    : "bg-blush"
              }`}
            >
              <h3 className="font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6">{body}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
