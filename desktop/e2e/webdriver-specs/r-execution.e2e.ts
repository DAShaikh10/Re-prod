import assert from "node:assert";
import { clickRunAll, setEditorValue } from "./helpers";
import { TEST_CASES } from "../shared/test-registry";

const consoleOutputSelector = ".console-stdout";

describe("R execution flow", () => {
	it(TEST_CASES["r-execution"][0], async () => {
		const editorInput = await browser.$(".monaco-editor textarea");
		await editorInput.waitForDisplayed({ timeout: 30000 });
		await setEditorValue("x <- 1 + 1\nprint(x)");
		await clickRunAll();

		await browser.waitUntil(
			async () => {
				const texts = await browser.execute(() =>
					Array.from(document.querySelectorAll(".console-stdout"), (element) =>
						(element.textContent ?? "").trim(),
					),
				);
				return texts.some((text) => text.includes("[1] 2"));
			},
			{
				timeout: 30000,
				timeoutMsg: "Expected R execution output to include [1] 2",
			},
		);

		const outputs = await browser.execute(() =>
			Array.from(document.querySelectorAll(".console-stdout"), (element) =>
				(element.textContent ?? "").trim(),
			),
		);
		assert.ok(
			outputs.some((text) => text.includes("[1] 2")),
			"Console should show the result [1] 2",
		);
	});

	it(TEST_CASES["r-execution"][1], async () => {
		const editorInput = await browser.$(".monaco-editor textarea");
		await editorInput.waitForDisplayed({ timeout: 30000 });

		const code = `x <- 5
y <- 10
print(x + y)`;
		await setEditorValue(code);
		await clickRunAll();

		await browser.waitUntil(
			async () => {
				const texts = await browser.execute(() =>
					Array.from(document.querySelectorAll(".console-stdout"), (element) =>
						(element.textContent ?? "").trim(),
					),
				);
				return texts.some((text) => text.includes("[1] 15"));
			},
			{
				timeout: 30000,
				timeoutMsg: "Expected R execution output to include [1] 15",
			},
		);

		const outputs = await browser.execute(() =>
			Array.from(document.querySelectorAll(".console-stdout"), (element) =>
				(element.textContent ?? "").trim(),
			),
		);
		assert.ok(
			outputs.some((text) => text.includes("[1] 15")),
			"Console should show the result [1] 15",
		);
	});

	it(TEST_CASES["r-execution"][2], async () => {
		const editorInput = await browser.$(".monaco-editor textarea");
		await editorInput.waitForDisplayed({ timeout: 30000 });

		await setEditorValue('print("Hello, Re-prod!")');
		await clickRunAll();

		await browser.waitUntil(
			async () => {
				const texts = await browser.execute(() =>
					Array.from(document.querySelectorAll(".console-stdout"), (element) =>
						(element.textContent ?? "").trim(),
					),
				);
				return texts.some((text) => text.includes("Hello, Re-prod!"));
			},
			{
				timeout: 30000,
				timeoutMsg: "Expected R execution output to include Hello, Re-prod!",
			},
		);

		const outputs = await browser.execute(() =>
			Array.from(document.querySelectorAll(".console-stdout"), (element) =>
				(element.textContent ?? "").trim(),
			),
		);
		assert.ok(
			outputs.some((text) => text.includes("Hello, Re-prod!")),
			"Console should show formatted output",
		);
	});
});
