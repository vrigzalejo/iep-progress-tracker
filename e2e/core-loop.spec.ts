import { expect, test } from "@playwright/test";
import { DEMO_PASSPHRASE, demoEmail } from "../src/lib/brand";

test.describe.configure({ mode: "serial" });

test("health reports ok and demo", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.ok).toBe(true);
  expect(body.demo).toBe(true);
});

test("staff can log a session and write a period comment; parent cannot open Team", async ({
  page,
  context,
}) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(demoEmail("maricel.santos"));
  await page.getByLabel("Password").fill(DEMO_PASSPHRASE);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: /Good to see you/ })).toBeVisible({
    timeout: 20_000,
  });

  await page.getByRole("link", { name: "Students" }).click();
  await page.getByRole("link", { name: "Jaime Santos" }).first().click();
  await page.getByRole("link", { name: "Log a session" }).first().click();
  await expect(page.getByRole("heading", { name: "Log a session" })).toBeVisible();
  const trialPad = page.getByRole("button", { name: "Independent" });
  if (await trialPad.count()) {
    await trialPad.click();
    await trialPad.click();
  } else {
    await page.getByLabel("Score / value").fill("88");
    await page.getByLabel(/Session notes/).fill("Jaime read an informational probe at 88 WCPM.");
  }
  await page.getByRole("button", { name: "Save progress" }).click();
  await expect(page).toHaveURL(/saved=1/, { timeout: 20_000 });

  await page.getByRole("link", { name: "Today", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  const openHallway = page.getByRole("link", { name: "Open hallway" });
  if (await openHallway.count()) {
    await openHallway.click();
    await expect(page).toHaveURL(/\/hallway/, { timeout: 20_000 });
    await expect(page.getByRole("button", { name: "Save progress" })).toBeVisible();
  }

  await page.getByLabel("Primary").getByRole("link", { name: "Reports" }).click();
  await page.getByRole("link", { name: "Open report studio" }).click();
  await expect(page.getByRole("heading", { name: "Progress report studio" })).toBeVisible();
  await page.getByLabel("Primary").getByRole("link", { name: "Reports" }).click();
  await page.getByRole("link", { name: "Write period comments" }).click();
  await expect(page.getByRole("heading", { name: /Period comments/ })).toBeVisible();
  await page.getByLabel(/Period narrative/).first().fill(
    "This period Jaime practiced requesting a break with a visual card in small group.",
  );
  await page.getByRole("button", { name: "Save comment" }).first().click();
  await expect(page).toHaveURL(/saved=1/, { timeout: 20_000 });

  await page.getByRole("link", { name: "Students" }).click();
  await page.getByRole("link", { name: "Jaime Santos" }).first().click();
  await page.getByRole("link", { name: "Meeting room" }).click();
  await expect(page.getByRole("heading", { name: /Jaime/ })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/does not suggest a progress code/i)).toBeVisible();

  await context.clearCookies();
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(demoEmail("diana.santos"));
  await page.getByLabel("Password").fill(DEMO_PASSPHRASE);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText(/Jaime/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("heading", { name: /Weekly email/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Students" })).toHaveCount(0);
  await page.goto("/team");
  await expect(page).not.toHaveURL(/\/team$/);
  await page.goto("/schools");
  await expect(page).not.toHaveURL(/\/schools$/);
});
