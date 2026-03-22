const { test, expect } = require("@playwright/test");

test("create page saves a draft preview", async ({ page }) => {
  await page.goto("/create.html");

  await page.getByLabel("Item Title").fill("Aurora Signal");
  await page.getByLabel("Description For Item").fill("Playable demo listing");
  await page.getByLabel("Your Username").fill("@studioatlas");
  await page.getByLabel("Price Of Item").fill("1.10 ETH");
  await page.getByLabel("Royalties").fill("8% creator royalty");

  await expect(page.locator("#preview-title")).toHaveText("Aurora Signal");
  await expect(page.locator("#preview-price-usd")).toHaveText("($3,575.00)");

  await page.getByRole("button", { name: "Save Listing Draft" }).click();
  await expect(page.locator("#create-form-message")).toContainText("saved in this browser");
});

test("explore page filters listings", async ({ page }) => {
  await page.goto("/explore.html");

  await page.getByLabel("Filter by category").selectOption("blockchain");
  await expect(page.locator("#explore-results-label")).toContainText("1 listing shown");

  await page.getByLabel("Filter by category").selectOption("all");
  await page.locator("#explore-keyword").fill("Genesis");
  await expect(page.locator("#explore-results-label")).toContainText("1 listing shown");
});

test("details page accepts a higher bid", async ({ page }) => {
  await page.goto("/details.html");

  await page.locator("#bid-amount").fill("6.40 ETH");
  await page.getByRole("button", { name: "Submit Demo Bid" }).click();

  await expect(page.locator("#current-bid-value")).toHaveText("6.40 ETH");
  await expect(page.locator("#bid-form-message")).toContainText("updated locally");
});

test("author page toggles follow state", async ({ page }) => {
  await page.goto("/author.html");

  await expect(page.locator("[data-follow-count]")).toHaveText("559");
  await page.locator("[data-follow-button]").click();
  await expect(page.locator("[data-follow-button]")).toHaveText("Following @melanie32");
  await expect(page.locator("[data-follow-count]")).toHaveText("560");
});
