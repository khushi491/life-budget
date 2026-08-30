# LifeBudget

LifeBudget is a guided personal finance web application. It helps individuals, couples, and families answer one question:

**After paying for my current lifestyle, can I safely afford my next major life decision?**

The product is a visual, step-by-step journey — not a traditional accounting dashboard. Results are educational estimates, not professional financial advice.

## Architecture

- **Next.js 16** App Router, React 19, TypeScript (strict)
- **Tailwind CSS 4** and shadcn-style primitives (Radix UI)
- **PostgreSQL 16** via Docker Compose
- **Prisma 6** ORM
- **Better Auth** email and password sessions
- **decimal.js** plus integer minor units (cents/paise) for money
- **Recharts** and CSS/SVG flow charts
- **Vitest** for formulas, validation, and household authorization
- **Playwright** for onboarding, transactions, budget, house, and comparison flows

Financial math lives in `src/lib/finance` and is independent of UI. Server queries in `src/server/queries.ts` always filter by `householdId`. Chart pages compute from those queries — they do not hardcode outcomes.

### Extension points

| Interface      | Location                             | Current implementation                     |
| -------------- | ------------------------------------ | ------------------------------------------ |
| Bank import    | `src/lib/providers/bank.ts`          | Mock provider; swap for Plaid later        |
| AI questions   | `src/lib/providers/ai.ts`            | Rules-based fallback; no paid API required |
| Exchange rates | `src/lib/providers/exchange-rate.ts` | Mock USD-based rates for development       |

Currencies are never silently mixed. Households have one working currency.

## Features

- Guided 13-step onboarding with save-and-resume
- Individual, couple, and family modes (mode changes keep history)
- Visual cash-flow dashboard and financial health score
- Milestone journey with badges, no leaderboards
- Transactions, income, recurring bills, CSV import/export
- Guided monthly budget builder with live allocation
- Goals with contribution simulator
- House affordability planner (EMI / mortgage wording by locale)
- Scenario comparison and what-if simulator
- Net worth, debt snowball / avalanche
- Rules-based insights
- Dark mode (system), responsive layout, reduced-motion support

## Local setup

Requirements: Node.js 20.19+ (20.17 works with engine warnings), npm, Docker Desktop.

```bash
cp .env.example .env
# Set BETTER_AUTH_SECRET to 32+ characters
docker compose up -d
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable                | Purpose                                     |
| ----------------------- | ------------------------------------------- |
| `DATABASE_URL`          | PostgreSQL connection string                |
| `BETTER_AUTH_SECRET`    | Session signing secret (min 32 chars)       |
| `BETTER_AUTH_URL`       | Auth base URL, e.g. `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL`   | Public app URL                              |
| `NEXT_PUBLIC_DEMO_MODE` | `true` to show demo household buttons       |

### Database migrations

```bash
npx prisma migrate dev --name describe-the-change
npx prisma migrate deploy   # production
```

### Seed data

`npm run db:seed` creates three demo households with twelve months of transactions, budgets, goals, assets, debts, bills, snapshots, and house scenarios (USD and INR).

## Demo credentials

Password for all demo logins: `DemoPass123!`

| Household      | Email                                 | Notes                                      |
| -------------- | ------------------------------------- | ------------------------------------------ |
| Individual     | `alex.individual@demo.lifebudget.app` | USD, emergency fund + car                  |
| Couple         | `jordan.couple@demo.lifebudget.app`   | USD house-hunting household (primary demo) |
| Couple partner | `sam.couple@demo.lifebudget.app`      | Shared Hale household                      |
| Family         | `priya.family@demo.lifebudget.app`    | INR, apartment EMI planning                |

The landing page “try a household” buttons sign these users in when `NEXT_PUBLIC_DEMO_MODE=true`.

## Testing

```bash
npm test              # Vitest: formulas, validation, authorization
npm run test:e2e      # Playwright (app must be seedable; config starts `next dev`)
npm run typecheck
npm run lint
npm run build
```

Unit tests cover normal loans, 0% interest, invalid values, large principals, long terms, extra principal, affordability bands, and rent-versus-buy projections.

## Financial assumptions

Documented in `src/lib/finance/assumptions.ts`:

- Money is stored as integer minor units. Intermediate math uses decimal.js (40 digits, HALF_EVEN).
- APR is converted to a monthly rate as `APR / 12` (educational, not daily APY).
- Housing comfort / stretch / risk uses 28% / 36% / 50% of take-home income.
- Debt-to-income uses 36% comfort and 43% high-risk guidelines.
- Emergency coverage uses liquid goal balance / monthly required spending.
- Rent-versus-buy compounds rent with inflation, grows property value, and invests leftover cash. Default selling cost is 6%.

## Security considerations

- Sessions are httpOnly cookies via Better Auth.
- Every query is scoped to the signed-in member’s household.
- Private transactions are hidden from other partners (owners can still see them).
- Zod validates inputs. Auth errors are generic.
- Environment variables are validated on the server. Secrets are not exposed to the browser.
- Production Prisma logs errors only — not transaction payloads.
- Account deletion removes the user and any household they solely own.
- Destructive actions should be confirmed in the UI.
- Do not describe this project as “bank-level security.” It has not been independently audited.

## Deployment

1. Provision PostgreSQL.
2. Set production environment variables, including a unique `BETTER_AUTH_SECRET`.
3. Run `npx prisma migrate deploy` and optionally seed only in non-production.
4. `npm run build` and `npm start`, or deploy the Next.js app to a Node-compatible host (Vercel, Fly, etc.).
5. Turn `NEXT_PUBLIC_DEMO_MODE` off in production unless you want public demo logins.

## Product pages

Landing, authentication, onboarding, dashboard, journey, transactions, income, budget, goals, house planner, scenario comparison, what-if simulator, net worth, debts, bills, household, reports, and settings.
