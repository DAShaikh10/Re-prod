export function formatClockTime(
	timestamp: number | Date,
	options?: Intl.DateTimeFormatOptions,
): string {
	const date = typeof timestamp === "number" ? new Date(timestamp) : timestamp;
	return date.toLocaleTimeString(undefined, options);
}

export function formatDateTime(
	timestamp: number | Date,
	options?: Intl.DateTimeFormatOptions,
): string {
	const date = typeof timestamp === "number" ? new Date(timestamp) : timestamp;
	return date.toLocaleString(undefined, options);
}
