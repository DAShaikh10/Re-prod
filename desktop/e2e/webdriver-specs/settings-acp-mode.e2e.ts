import assert from "node:assert";
import { TEST_CASES } from "../shared/test-registry";

const settingsDialogTitle = "Settings";

describe("Settings ACP mode", () => {
	it(TEST_CASES["settings-acp-mode"][0], async () => {
		const statusBarSettingsButton = await browser.$(".statusbar-ai");
		await statusBarSettingsButton.waitForDisplayed({ timeout: 30000 });
		await statusBarSettingsButton.click();

		const settingsTitle = await browser.$(`//h2[normalize-space()="${settingsDialogTitle}"]`);
		await settingsTitle.waitForDisplayed({ timeout: 10000 });

		const externalAgentRadio = await browser.$('input[aria-label="External Agent (ACP)"]');
		await externalAgentRadio.click();
		await browser.waitUntil(async () => externalAgentRadio.isSelected(), {
			timeout: 10000,
			timeoutMsg: "External Agent (ACP) should be selected",
		});

		const externalAgentHeading = await browser.$('//h3[normalize-space()="External Agents (ACP)"]');
		await externalAgentHeading.waitForDisplayed({ timeout: 10000 });

		const refreshButton = await browser.$("button=Refresh");
		await refreshButton.waitForDisplayed({ timeout: 10000 });

		assert.ok(await externalAgentRadio.isSelected(), "External Agent (ACP) should remain selected");

		const apiProvidersRadio = await browser.$('input[aria-label="API Providers"]');
		assert.ok(!(await apiProvidersRadio.isSelected()), "API Providers should not be selected");
	});
});
