import assert from "node:assert";
import { TEST_CASES } from "../shared/test-registry";

const CONNECTED_TIMEOUT_MS = 240000;
const waitForConnected = async (timeoutMs = CONNECTED_TIMEOUT_MS) => {
	const fileBrowser = await browser.$(".file-browser");
	await fileBrowser.waitForDisplayed({ timeout: timeoutMs });

	const connectedStatus = await browser.$('//*[text()="Connected"]');
	await connectedStatus.waitForDisplayed({ timeout: timeoutMs });

	await browser.waitUntil(
		async () =>
			browser.execute(() => {
				const helper = (window as any).reprodTest as { isConnected?: () => boolean } | undefined;
				return helper?.isConnected?.() ?? false;
			}),
		{ timeout: timeoutMs, timeoutMsg: "Expected app to be connected" },
	);
};

describe("Project Switch (Web)", () => {
	it(TEST_CASES["project-switch"][0], async () => {
		await waitForConnected(CONNECTED_TIMEOUT_MS);

		await browser.keys(["Control", "Shift", "O"]);

		const modalTitle = await browser.$('//h2[normalize-space()="Switch Project"]');
		await modalTitle.waitForDisplayed({ timeout: 30000 });

		const alphaItem = await browser.$(
			'//div[contains(@class,"project-switch-item")][contains(., "E2E Alpha")]',
		);
		await alphaItem.waitForDisplayed({ timeout: 30000 });
		await alphaItem.click();

		const openButton = await browser.$('//button[normalize-space()="Open Project"]');
		await browser.waitUntil(async () => openButton.isEnabled(), {
			timeout: 10000,
			timeoutMsg: "Open Project button should be enabled",
		});

		await openButton.click();
		await browser.execute((projectName) => {
			const helper = (window as any).reprodTest as
				| { waitForProjectOpened?: (name: string, timeoutMs?: number) => Promise<void> }
				| undefined;
			if (!helper?.waitForProjectOpened) {
				throw new Error("reprodTest waitForProjectOpened not available");
			}
			return helper.waitForProjectOpened(projectName, 30000);
		}, "E2E Alpha");

		await browser.waitUntil(async () => !(await modalTitle.isDisplayed()), {
			timeout: 30000,
			timeoutMsg: "Switch project modal should close",
		});

		const alphaFile = await browser.$(
			'//div[contains(@class,"file-tree-node")][.//div[contains(@class,"file-tree-label") and normalize-space()="alpha.R"]]',
		);
		await alphaFile.waitForDisplayed({ timeout: 30000 });
		assert.ok(await alphaFile.isDisplayed(), "Alpha project file should be visible");
	});
});
