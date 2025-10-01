const fs = require("fs");

function extractArrayFromFile(path) {
	const txt = fs.readFileSync(path, "utf8");
	// Find all JS-style object literals like: { signatures: 12345, timestamp: 1600000000000 }
	const objs = txt.match(/\{[^}]*\}/g) || [];
	const out = objs
		.map((o) => {
			const sigMatch = o.match(/signatures\s*:\s*(\d+)/);
			const tsMatch = o.match(/timestamp\s*:\s*(\d+)/);
			if (sigMatch && tsMatch) {
				return {
					signatures: Number(sigMatch[1]),
					timestamp: Number(tsMatch[1]),
				};
			}
			return null;
		})
		.filter(Boolean);
	return out;
}

const a = extractArrayFromFile("tmp_stats.js");
const b = extractArrayFromFile("tmp_stats2.js");

function clean(arr) {
	const out = [];
	for (let i = 0; i < arr.length; i++) {
		const cur = arr[i];
		const prev = out.length ? out[out.length - 1] : null;
		if (prev && prev.timestamp === cur.timestamp) {
			prev.signatures = Math.max(prev.signatures, cur.signatures);
		} else {
			out.push({ signatures: cur.signatures, timestamp: cur.timestamp });
		}
	}
	return out;
}

const A = clean(a);
const B = clean(b);

function mapByTimestamp(arr) {
	const m = new Map();
	arr.forEach((it) => m.set(it.timestamp, it.signatures));
	return m;
}

const MA = mapByTimestamp(A);
const MB = mapByTimestamp(B);

const timestampsA = Array.from(MA.keys()).sort((x, y) => x - y);
const timestampsB = Array.from(MB.keys()).sort((x, y) => x - y);

const onlyA = timestampsA.filter((t) => !MB.has(t));
const onlyB = timestampsB.filter((t) => !MA.has(t));
const both = timestampsA.filter((t) => MB.has(t));

console.log("A count (cleaned):", A.length);
console.log("B count (cleaned):", B.length);
console.log("Timestamps only in A:", onlyA.length, onlyA.slice(0, 10));
console.log("Timestamps only in B:", onlyB.length, onlyB.slice(0, 10));

// For common timestamps, find where signatures differ
const diffs = [];
for (const t of both) {
	const sa = MA.get(t);
	const sb = MB.get(t);
	if (sa !== sb) diffs.push({ timestamp: t, a: sa, b: sb, diff: sb - sa });
}

console.log("Common timestamps:", both.length);
console.log("Differing values on common timestamps:", diffs.length);
if (diffs.length > 0) console.log(diffs.slice(0, 20));

// Show range overlap
const range = (arr) => ({
	min: arr[0].timestamp,
	max: arr[arr.length - 1].timestamp,
});
console.log("Range A:", range(A));
console.log("Range B:", range(B));

// Compute summary of diffs magnitude
if (diffs.length > 0) {
	const abs = diffs.map((d) => Math.abs(d.diff));
	const sum = abs.reduce((s, v) => s + v, 0);
	const mean = sum / abs.length;
	abs.sort((x, y) => x - y);
	const median =
		abs.length % 2 === 1
			? abs[(abs.length - 1) / 2]
			: (abs[abs.length / 2 - 1] + abs[abs.length / 2]) / 2;
	console.log(
		"Diffs abs mean:",
		mean,
		"median:",
		median,
		"max:",
		abs[abs.length - 1]
	);
}

// Print a few example neighboring entries where timestamps align but counts differ
if (diffs.length < 100) {
	console.log("All diffs:");
	diffs.forEach((d) => console.log(new Date(d.timestamp).toISOString(), d));
} else {
	console.log("First 20 diffs:");
	diffs
		.slice(0, 20)
		.forEach((d) => console.log(new Date(d.timestamp).toISOString(), d));
}

// Exit
process.exit(0);
