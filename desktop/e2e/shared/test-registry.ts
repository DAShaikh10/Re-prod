export const TEST_CASES = {
	"r-execution": [
		"runs a simple expression and shows the result",
		"handles multiple expressions",
		"displays formatted output correctly",
	],
	timeline: [
		"opens timeline dialog and displays execution history",
		"filters timeline events by type",
		"displays timeline statistics correctly",
		"navigates to code location when clicking timeline event",
	],
	export: [
		"opens export dialog and displays export options",
		"allows selecting different export formats",
		"allows selecting export mode (timeline vs document)",
		"displays export options configuration",
		"validates export form inputs",
		"handles export errors gracefully",
	],
	"error-handling": [
		"displays R syntax errors in console",
		"displays R runtime errors",
		"recovers from errors and allows subsequent executions",
		"handles undefined variable errors",
		"handles function errors gracefully",
		"displays parse errors",
		"maintains app responsiveness after multiple errors",
	],
	"full-workflow": [
		"completes a full data analysis workflow",
		"handles workflow with errors and recovery",
		"completes workflow with multiple code blocks",
	],
	"file-explorer": ["opens a file and loads editor tab/content"],
	"multi-buffer-tabs": ["opens multiple files in tabs and handles dirty close"],
	"open-folder": [
		"updates file explorer after workspace switch",
		"switches workspace and loads file content",
		"ignores non-existent folder paths",
	],
	"project-switch": ["opens modal and switches to a server project"],
	"settings-acp-mode": ["keeps External Agent (ACP) selected after agent refresh"],
} as const;
