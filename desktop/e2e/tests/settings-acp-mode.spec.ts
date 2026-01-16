import { expect, test } from "@playwright/test";
import { TEST_CASES } from "../shared/test-registry";

const settingsDialogName = "Settings";

test.describe("Settings ACP mode", () => {
	test(TEST_CASES["settings-acp-mode"][0], async ({ page }) => {
		await page.goto("/");

		const statusBarSettingsButton = page.locator(".statusbar-ai");
		await expect(statusBarSettingsButton).toBeVisible({ timeout: 30000 });
		await statusBarSettingsButton.click();

		const settingsDialog = page.getByRole("dialog", { name: settingsDialogName });
		await expect(settingsDialog).toBeVisible({ timeout: 10000 });

		const externalAgentRadio = page.getByLabel("External Agent (ACP)");
		await externalAgentRadio.click();
		await expect(externalAgentRadio).toBeChecked({ timeout: 10000 });

		const externalAgentHeading = page.getByRole("heading", { name: "External Agents (ACP)" });
		await expect(externalAgentHeading).toBeVisible({ timeout: 10000 });

		const refreshButton = page.getByRole("button", { name: "Refresh" });
		await expect(refreshButton).toBeVisible({ timeout: 10000 });

		await expect(externalAgentRadio).toBeChecked({ timeout: 5000 });
		await expect(page.getByLabel("API Providers")).not.toBeChecked();
	});
});
