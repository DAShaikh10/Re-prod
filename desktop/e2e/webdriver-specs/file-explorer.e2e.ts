import assert from "node:assert";
import { TEST_CASES } from "../shared/test-registry";

const fileBrowserSelector = ".file-browser";
const tabActiveSelector = ".tab-bar .tab.active";
const fileTreeNodeByLabel = (name: string) =>
	browser.$(
		`//div[contains(@class,"file-tree-node")][.//div[contains(@class,"file-tree-label") and normalize-space()="${name}"]]`,
	);
const fileTreeNodeAtDepth = (name: string, depth: number) => {
	const padding = depth * 16 + 12;
	return browser.$(
		`//div[contains(@class,"file-tree-node") and contains(@style,"padding-left: ${padding}px")][.//div[contains(@class,"file-tree-label") and normalize-space()="${name}"]]`,
	);
};
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

describe("File Explorer", () => {
	it(TEST_CASES["file-explorer"][0], async () => {
		const projectFolder = "alpha";
		const fixtureFileName = "alpha.R";
		const fixtureText = "Alpha project loaded";

		const fileBrowser = await browser.$(fileBrowserSelector);
		await fileBrowser.waitForDisplayed({ timeout: 30000 });

		const ensureFolderExpanded = async (
			name: string,
			depth: number,
			childName: string,
			childDepth: number,
		) => {
			const node = await fileTreeNodeAtDepth(name, depth);
			await node.waitForDisplayed({ timeout: 30000 });

			const childNode = await fileTreeNodeAtDepth(childName, childDepth);
			if (!(await childNode.isExisting())) {
				await node.click();
			}

			await childNode.waitForDisplayed({ timeout: 30000 });
		};

		await ensureFolderExpanded(projectFolder, 0, fixtureFileName, 1);

		const fixtureNode = await fileTreeNodeByLabel(fixtureFileName);
		await fixtureNode.waitForDisplayed({ timeout: 30000 });
		await fixtureNode.doubleClick();

		const activeTab = await browser.$(tabActiveSelector);
		await activeTab.waitForDisplayed({ timeout: 30000 });
		const activeTabText = await activeTab.getText();
		assert.ok(activeTabText.includes(fixtureFileName), "Active tab should show fixture file");

		await waitForEditorContains(fixtureText);
	});
});
