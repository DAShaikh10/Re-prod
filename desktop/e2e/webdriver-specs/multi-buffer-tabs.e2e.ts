import assert from "node:assert";
import { TEST_CASES } from "../shared/test-registry";

const fileBrowserSelector = ".file-browser";
const tabSelector = ".tab-bar .tab";
const tabActiveSelector = ".tab-bar .tab.active";
const tabDirtySelector = ".tab-bar .tab.active .tab-dirty-indicator";
const tabCloseSelector = ".tab-bar .tab.active .tab-close";
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

describe("Editor tabs", () => {
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

	const openFixture = async (folderName: string, filename: string) => {
		await ensureFolderExpanded(folderName, 0, filename, 1);

		const fixtureNode = await fileTreeNodeByLabel(filename);
		await fixtureNode.waitForDisplayed({ timeout: 30000 });
		await fixtureNode.doubleClick();
	};

	const countTabsByName = async (name: string) => {
		const tabs = await browser.$$(tabSelector);
		let count = 0;

		for (const tab of tabs) {
			const text = await tab.getText();
			if (text.includes(name)) {
				count += 1;
			}
		}

		return count;
	};

	const tabByName = async (name: string) =>
		browser.$(
			`//div[contains(@class,"tab")][.//span[contains(@class,"tab-label") and normalize-space()="${name}"]]`,
		);

	it(TEST_CASES["multi-buffer-tabs"][0], async () => {
		const firstFile = "alpha.R";
		const secondFile = "beta.R";
		const firstFixtureText = "Alpha project loaded";
		const secondFixtureText = "Beta project loaded";

		const fileBrowser = await browser.$(fileBrowserSelector);
		await fileBrowser.waitForDisplayed({ timeout: 30000 });

		await openFixture("alpha", firstFile);
		await waitForEditorContains(firstFixtureText);

		await openFixture("beta", secondFile);
		assert.strictEqual(await countTabsByName(secondFile), 1);
		await waitForEditorContains(secondFixtureText);

		assert.strictEqual(await countTabsByName(firstFile), 1);
		assert.strictEqual(await countTabsByName(secondFile), 1);

		await openFixture("alpha", firstFile);
		assert.strictEqual(await countTabsByName(firstFile), 1);
		assert.strictEqual(await countTabsByName(secondFile), 1);

		const firstTab = await tabByName(firstFile);
		await firstTab.click();
		await waitForEditorContains(firstFixtureText);

		await browser.execute(() => {
			const monaco = (window as any).monaco;
			const editors = monaco?.editor?.getEditors?.() ?? [];
			if (!editors.length) return false;
			const editor = editors[0];
			editor.setValue(`${editor.getValue()}\n# dirty`);
			editor.focus();
			return true;
		});

		const dirtyIndicator = await browser.$(tabDirtySelector);
		await dirtyIndicator.waitForDisplayed({ timeout: 30000 });

		const closeButton = await browser.$(tabCloseSelector);
		await closeButton.click();

		const dialog = await browser.$(".confirm-dialog[role='dialog']");
		await dialog.waitForDisplayed({ timeout: 10000 });
		const dialogText = await dialog.getText();
		assert.ok(dialogText.includes(`Save changes to "${firstFile}"?`));

		const cancelButton = await browser.$("button=Cancel");
		await cancelButton.click();
		const activeTab = await browser.$(tabActiveSelector);
		await activeTab.waitForDisplayed({ timeout: 30000 });
		const activeText = await activeTab.getText();
		assert.ok(activeText.includes(firstFile));

		const closeButtonAgain = await browser.$(tabCloseSelector);
		await closeButtonAgain.click();
		const dontSaveButton = await browser.$('//button[normalize-space()="Don\'t Save"]');
		await dontSaveButton.click();

		await browser.waitUntil(async () => (await countTabsByName(firstFile)) === 0, {
			timeout: 10000,
			timeoutMsg: "Expected first tab to close without saving",
		});
	});
});
