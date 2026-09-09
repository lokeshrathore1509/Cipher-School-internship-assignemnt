import { test, expect } from "@playwright/test";

test.describe("LLD Practice Platform - Full Learner Journey", () => {
  test("Choose problem -> Start practice -> Fill solution -> Submit -> See evaluation -> Open history", async ({
    page,
  }) => {
    // 1. Visit Dashboard
    await page.goto("/");
    await expect(page).toHaveTitle(/LLD Practice Platform/i);
    await expect(page.getByRole("heading", { name: /Stop guessing your Low-Level Design quality/i })).toBeVisible();

    // 2. Navigate to Problems Library
    await page.getByRole("link", { name: /Explore Problem Library/i }).click();
    await expect(page).toHaveURL(/\/problems/);
    await expect(page.getByRole("heading", { name: /Low-Level Design Challenges/i })).toBeVisible();

    // 3. Select Parking Lot Problem
    const parkingLotCard = page.locator("div").filter({ hasText: /Multi-Floor Parking Lot System/i }).first();
    await parkingLotCard.getByRole("link", { name: /Start Practice|View Details/i }).first().click();

    // 4. On Problem Detail Page, click Start Practice
    await expect(page).toHaveURL(/\/problems\/parking-lot/);
    await expect(page.getByRole("heading", { name: /Multi-Floor Parking Lot System/i })).toBeVisible();
    await page.getByRole("link", { name: /Start Practice|Start First Attempt|Practice Again/i }).first().click();

    // 5. Arrive at Practice Workspace
    await expect(page).toHaveURL(/\/problems\/parking-lot\/practice/, { timeout: 20000 });
    await expect(
      page.getByRole("heading", { name: /Multi-Floor Parking Lot System/i })
    ).toBeVisible({ timeout: 20000 });

    // 6. Click Load Starter Template to fill in the structured design
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: /Load Starter Template/i }).click();

    // Verify fields are populated
    const coreClassesInput = page.locator("textarea").nth(2);
    await expect(coreClassesInput).not.toBeEmpty();

    // 7. Submit for Evaluation
    await page.getByRole("button", { name: /Submit for Evaluation/i }).first().click();

    // 8. Wait for evaluation to complete and redirect to /attempts/[id]
    await expect(page).toHaveURL(/\/attempts\/cm[a-z0-9]+/, { timeout: 30000 });
    await expect(page.getByText(/Architectural Assessment/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Overall Score/i)).toBeVisible();
    await expect(page.getByText(/8-Dimension Rubric Breakdown/i)).toBeVisible();

    // Verify key rubric sections are visible
    await expect(page.getByText(/Key Architectural Strengths/i)).toBeVisible();
    await expect(page.getByText(/Priority Improvement Opportunities/i)).toBeVisible();

    // 9. Navigate to Attempt History
    await page.getByRole("link", { name: /Attempt History/i }).click();
    await expect(page).toHaveURL(/\/attempts/, { timeout: 20000 });
    await expect(page.getByRole("heading", { name: /Attempt History/i })).toBeVisible({ timeout: 20000 });

    // 10. Verify attempt is listed in the history table
    await expect(page.getByText(/Multi-Floor Parking Lot System/i).first()).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/Completed/i).first()).toBeVisible();
  });
});
