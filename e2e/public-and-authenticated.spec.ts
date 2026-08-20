import { expect, test } from "@playwright/test";

test("public health and authentication surfaces do not require ChatGPT", async ({
  page,
  request,
}) => {
  const health = await request.get("/api/health");
  expect([200, 503]).toContain(health.status());
  const body = (await health.json()) as {
    authentication: string;
    chatgptAccountRequired: boolean;
  };
  expect(body.authentication).toBe("supabase");
  expect(body.chatgptAccountRequired).toBe(false);

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in to Suadence" })).toBeVisible();
  await expect(page.getByText(/ChatGPT account is never required/i)).toBeVisible();
  expect(await page.locator("body").evaluate(() => document.cookie)).not.toContain("access_token");
  expect((await page.request.get("/login")).headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
});

test("pilot access and recovery surfaces fail safely", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: "Request a pilot invitation" })).toBeVisible();
  await expect(page.getByLabel("Password")).toHaveCount(0);

  await page.goto("/forgot-password");
  await expect(page.getByRole("heading", { name: "Get a reset link" })).toBeVisible();

  await page.goto("/reset-password");
  await expect(page.getByText(/recovery session is invalid or expired/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Save password" })).toHaveCount(0);
});

test("@authenticated owner can enter the Supabase workspace and reach critical flows", async ({
  page,
}) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  test.skip(!email || !password, "E2E_EMAIL and E2E_PASSWORD are required");

  await page.goto("/login");
  await page.getByLabel("Work email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/app(?:\/onboarding)?/);
  expect(page.url()).not.toContain("chatgpt.com");

  if (page.url().endsWith("/app/onboarding")) {
    throw new Error("The authenticated release-test user must belong to a seeded organization.");
  }

  for (const route of [
    "/app",
    "/app/personas/import",
    "/app/scenarios",
    "/app/practice",
    "/app/team",
    "/app/analytics",
    "/app/settings",
  ]) {
    await page.goto(route);
    await expect(page).toHaveURL(new RegExp(route.replaceAll("/", "\\/")));
    await expect(page.locator("main")).toBeVisible();
  }
});
