import { expect, test } from "@playwright/test";

/**
 * The one path that only works if every layer is wired up: account creation,
 * a signed session in a cookie, a write to Postgres, and a read back after a
 * full reload. Each run creates its own account so the suite can repeat.
 */
test("a favorite survives a reload", async ({ page }) => {
  const email = `e2e-${Date.now()}-${process.env.TEST_WORKER_INDEX ?? 0}@example.com`;

  await page.goto("/register");
  await page.getByLabel("Name").fill("E2E");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password12345");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/favorites$/);
  await expect(page.getByText("Nothing here yet.")).toBeVisible();

  await page.goto("/discover");
  const firstCard = page.locator('a[href^="/movie/"]').first();
  const title = await firstCard.locator("h3").textContent();
  const [saved] = await Promise.all([
    // The toggle is optimistic; navigating too early would abort the write.
    page.waitForResponse(
      (res) => res.url().endsWith("/api/favorites") && res.request().method() === "POST",
    ),
    firstCard.getByRole("button", { name: "Add to favorites" }).click(),
  ]);
  expect(saved.status()).toBe(201);

  await page.goto("/favorites");
  await expect(page.getByRole("heading", { name: title!, exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: title!, exact: true })).toBeVisible();
});
