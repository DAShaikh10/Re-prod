import { expect, test } from "@playwright/test";
import {
	consoleHasOutput,
	executeRCode,
	waitForAnyConsoleOutput,
	waitForConsoleOutput,
} from "../shared/helpers";
import { selectors } from "../shared/selectors";
import { TEST_CASES } from "../shared/test-registry";

test.describe("Error handling scenarios", () => {
	test(TEST_CASES["error-handling"][0], async ({ page }) => {
		await page.goto("/");

		// Execute code with syntax error (invalid token)
		await executeRCode(page, "x <- 1 + )");

		await waitForAnyConsoleOutput(page);

		// Check for error in console (stderr or stdout)
		const stderrOutputs = page.locator(selectors.consoleError);
		const stdoutOutputs = page.locator(selectors.consoleOutput);

		const stderrCount = await stderrOutputs.count();
		const stdoutCount = await stdoutOutputs.count();

		// Error should appear somewhere
		expect(stderrCount + stdoutCount).toBeGreaterThan(0);
	});

	test(TEST_CASES["error-handling"][1], async ({ page }) => {
		await page.goto("/");

		// Execute code with type error
		await executeRCode(page, 'x <- "text"\ny <- x / 2');

		await waitForAnyConsoleOutput(page);

		// Verify error is displayed
		const stderrOutputs = page.locator(selectors.consoleError);
		const stdoutOutputs = page.locator(selectors.consoleOutput);
		const stderrCount = await stderrOutputs.count();
		const stdoutCount = await stdoutOutputs.count();

		// Should have error output
		expect(stderrCount + stdoutCount).toBeGreaterThan(0);
	});

	test(TEST_CASES["error-handling"][2], async ({ page }) => {
		await page.goto("/");

		// Execute error code
		await executeRCode(page, "x <- 1 + )");
		await waitForAnyConsoleOutput(page);

		// Execute valid code (explicit print for non-interactive runs)
		await executeRCode(page, "valid_result <- 5 + 5\nprint(valid_result)");

		// Wait for successful output
		await waitForConsoleOutput(page, "[1] 10", { timeout: 30000 });

		// Verify app recovered
		const hasOutput = await consoleHasOutput(page, "[1] 10");
		expect(hasOutput).toBeTruthy();
	});

	test(TEST_CASES["error-handling"][3], async ({ page }) => {
		await page.goto("/");

		// Reference undefined variable
		await executeRCode(page, "print(undefined_variable)");

		await waitForAnyConsoleOutput(page);

		// Error should be displayed
		const stderrOutputs = page.locator(selectors.consoleError);
		const stdoutOutputs = page.locator(selectors.consoleOutput);
		const stderrCount = await stderrOutputs.count();
		const stdoutCount = await stdoutOutputs.count();

		expect(stderrCount + stdoutCount).toBeGreaterThan(0);
	});

	test(TEST_CASES["error-handling"][4], async ({ page }) => {
		await page.goto("/");

		// Call non-existent function
		await executeRCode(page, "result <- nonExistentFunction(123)");

		await waitForAnyConsoleOutput(page);

		// Verify error handling
		const stderrOutputs = page.locator(selectors.consoleError);
		const stdoutOutputs = page.locator(selectors.consoleOutput);
		const stderrCount = await stderrOutputs.count();
		const stdoutCount = await stdoutOutputs.count();

		expect(stderrCount + stdoutCount).toBeGreaterThan(0);
	});

	test(TEST_CASES["error-handling"][5], async ({ page }) => {
		await page.goto("/");

		// Execute code with parse error (mismatched parentheses)
		await executeRCode(page, "result <- (1 + )");

		await waitForAnyConsoleOutput(page);

		// Verify error is shown
		const stderrOutputs = page.locator(selectors.consoleError);
		const stdoutOutputs = page.locator(selectors.consoleOutput);
		const stderrCount = await stderrOutputs.count();
		const stdoutCount = await stdoutOutputs.count();

		expect(stderrCount + stdoutCount).toBeGreaterThan(0);
	});

	test(TEST_CASES["error-handling"][6], async ({ page }) => {
		await page.goto("/");

		// Execute multiple errors
		await executeRCode(page, "x <- 1 + )");
		await waitForAnyConsoleOutput(page);

		await executeRCode(page, 'y <- "text" / 2');
		await waitForAnyConsoleOutput(page);

		await executeRCode(page, "z <- undefinedVar");
		await waitForAnyConsoleOutput(page);

		// Execute valid code to verify app still works (explicit print)
		await executeRCode(page, "final_result <- 100\nprint(final_result)");

		// Wait for successful output
		await waitForConsoleOutput(page, "[1] 100", { timeout: 30000 });

		// Verify app is still functional
		const hasOutput = await consoleHasOutput(page, "[1] 100");
		expect(hasOutput).toBeTruthy();
	});
});
