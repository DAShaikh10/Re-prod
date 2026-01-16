import assert from "node:assert";
import path from "node:path";
import { TEST_CASES } from "../shared/test-registry";

const CONNECTED_TIMEOUT_MS = 240000;
const fileTreeNodeByLabel = (name: string) =>
	browser.$(
		`//div[contains(@class,"file-tree-node")][.//div[contains(@class,"file-tree-label") and normalize-space()="${name}"]]`,
	);
const waitForEditorContains = async (expected: string, timeoutMs = 30000) => {
	await browser.waitUntil(
		async () =>
			browser.execute((value) => {
				const monaco = (window as any).monaco;
				const editors = monaco?.editor?.getEditors?.() ?? [];
				return (editors[0]?.getValue?.() ?? "").includes(value);
			}, expected),
		{
			timeout: timeoutMs,
			timeoutMsg: `Expected editor to contain "${expected}"`,
		},
	);
};
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

describe("Open Folder", () => {
	it(TEST_CASES["open-folder"][0], async () => {
		const repoRoot = path.resolve(process.cwd(), "../..");
		const fixtureFolder = path.join(repoRoot, "desktop/e2e/shared/fixtures/open-folder");
		const fixtureFileName = "sample.R";

		await waitForConnected(CONNECTED_TIMEOUT_MS);

		const didSend = await browser.execute((folderPath) => {
			const helper = (window as any).reprodTest as
				| { sendMessage?: (payload: { type: string; path: string }) => boolean }
				| undefined;
			if (!helper?.sendMessage) {
				throw new Error("reprodTest helper not available");
			}
			return helper.sendMessage({ type: "project_switch_folder", path: folderPath });
		}, fixtureFolder);
		assert.ok(didSend, "Expected project switch message to be sent");

		await browser.execute((projectName) => {
			const helper = (window as any).reprodTest as
				| { waitForProjectOpened?: (name: string, timeoutMs?: number) => Promise<void> }
				| undefined;
			if (!helper?.waitForProjectOpened) {
				throw new Error("reprodTest waitForProjectOpened not available");
			}
			return helper.waitForProjectOpened(projectName, 30000);
		}, "open-folder");

		const projectLabel = await browser.$('//*[contains(text(),"Project: open-folder")]');
		await projectLabel.waitForDisplayed({ timeout: 30000 });

		const fixtureLabel = await browser.$(
			`//div[contains(@class,"file-tree-label") and normalize-space()="${fixtureFileName}"]`,
		);
		await fixtureLabel.waitForDisplayed({ timeout: 30000 });

		const repoFileLabels = await browser.$$(
			'//div[contains(@class,"file-tree-label") and normalize-space()="AGENTS.md"]',
		);
		assert.strictEqual(repoFileLabels.length, 0);
	});

	it(TEST_CASES["open-folder"][1], async () => {
		const repoRoot = path.resolve(process.cwd(), "../..");
		const fixtureFolder = path.join(repoRoot, "desktop/e2e/shared/fixtures/open-folder");
		const fixtureFileName = "sample.R";
		const fixtureText = "Open folder fixture loaded";

		await waitForConnected(CONNECTED_TIMEOUT_MS);

		const didSend = await browser.execute((folderPath) => {
			const helper = (window as any).reprodTest as
				| { sendMessage?: (payload: { type: string; path: string }) => boolean }
				| undefined;
			if (!helper?.sendMessage) {
				throw new Error("reprodTest helper not available");
			}
			return helper.sendMessage({ type: "project_switch_folder", path: folderPath });
		}, fixtureFolder);
		assert.ok(didSend, "Expected project switch message to be sent");

		await browser.execute((projectName) => {
			const helper = (window as any).reprodTest as
				| { waitForProjectOpened?: (name: string, timeoutMs?: number) => Promise<void> }
				| undefined;
			if (!helper?.waitForProjectOpened) {
				throw new Error("reprodTest waitForProjectOpened not available");
			}
			return helper.waitForProjectOpened(projectName, 30000);
		}, "open-folder");

		const fileNode = await fileTreeNodeByLabel(fixtureFileName);
		await fileNode.waitForDisplayed({ timeout: 30000 });

		const activeTab = await browser.$(".tab-bar .tab.active");
		await activeTab.waitForDisplayed({ timeout: 30000 });
		const activeText = await activeTab.getText();
		assert.ok(activeText.includes("Untitled"));

		await fileNode.doubleClick();
		await browser.waitUntil(async () => (await activeTab.getText()).includes(fixtureFileName), {
			timeout: 30000,
			timeoutMsg: "Expected active tab to update with fixture file",
		});

		await waitForEditorContains(fixtureText);
	});

	it(TEST_CASES["open-folder"][2], async () => {
		const repoRoot = path.resolve(process.cwd(), "../..");
		const invalidFolder = path.join(repoRoot, "path-does-not-exist");

		await waitForConnected(CONNECTED_TIMEOUT_MS);

		const rootLabel = await browser.$(
			'//div[contains(@class,"file-tree-label") and normalize-space()="alpha"]',
		);
		await rootLabel.waitForDisplayed({ timeout: CONNECTED_TIMEOUT_MS });

		const didSend = await browser.execute((folderPath) => {
			const helper = (window as any).reprodTest as
				| { sendMessage?: (payload: { type: string; path: string }) => boolean }
				| undefined;
			if (!helper?.sendMessage) {
				throw new Error("reprodTest helper not available");
			}
			return helper.sendMessage({ type: "project_switch_folder", path: folderPath });
		}, invalidFolder);
		assert.ok(didSend, "Expected project switch message to be sent");

		await browser.pause(500);
		await rootLabel.waitForDisplayed({ timeout: CONNECTED_TIMEOUT_MS });

		const fixtureLabel = await browser.$$(
			'//div[contains(@class,"file-tree-label") and normalize-space()="sample.R"]',
		);
		assert.strictEqual(fixtureLabel.length, 0);
	});
});
