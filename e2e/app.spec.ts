import { test, expect } from "@playwright/test";

test("demo couple can open the dashboard story", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Jordan & Sam/ }).click();
  await expect(page.getByText(/Current leftover/i)).toBeVisible();
  await expect(page.getByText(/You earned/i)).toBeVisible();
});

test("onboarding is reachable after signup", async ({ page }) => {
  const email = `playwright.${Date.now()}@example.com`;
  await page.goto("/signup");
  await page.getByLabel("Your name").fill("Pat Example");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("PlaywrightPass1");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Welcome" })).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Who is this for?")).toBeVisible();
});

test("demo user can add a transaction", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Jordan & Sam/ }).click();
  await page.getByRole("button", { name: "Add money movement" }).click();
  await page.getByLabel("Amount").fill("12.50");
  await page.getByLabel("Who or where?").fill("Playwright cafe");
  await page.getByRole("button", { name: "Save" }).click();
  await page.goto("/transactions");
  await expect(page.getByText("Playwright cafe")).toBeVisible();
});

test("budget builder can be confirmed", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Jordan & Sam/ }).click();
  await page.goto("/budget");
  await expect(
    page.getByRole("heading", { name: "Budget builder" }),
  ).toBeVisible();
  for (let i = 0; i < 7; i += 1) {
    await page.getByRole("button", { name: "Continue" }).click();
  }
  await page.getByRole("button", { name: "Confirm this budget" }).click();
  await expect(page.getByText(/Budget saved|Allocated expenses/i)).toBeVisible({
    timeout: 10_000,
  });
});

test("house planner shows an affordability band from live data", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Jordan & Sam/ }).click();
  await page.goto("/house");
  await expect(
    page
      .getByText(/Comfortable|Manageable|High risk|Not currently affordable/i)
      .first(),
  ).toBeVisible();
  await expect(page.getByText(/educational estimates/i)).toBeVisible();
});

test("scenario comparison table uses calculated values", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Jordan & Sam/ }).click();
  await page.goto("/scenarios");
  await expect(
    page.getByRole("heading", { name: "Scenario comparison" }),
  ).toBeVisible();
  await expect(page.getByText("Buy now — Oak Street two-bed")).toBeVisible();
  await expect(page.getByText("Smaller condo")).toBeVisible();
});
