// NUCLEAR CONSTITUENCY TOGGLE - Continuous monitoring approach
// This approach uses aggressive continuous scanning to catch all flags

console.log("🚀 Loading NUCLEAR constituency toggle system...");

// Track state globally
let globalToggleState =
	localStorage.getItem("showConstituencyLabels") === "true";
let scanInterval;
let totalFlagsFound = 0;

// Helper functions
function isUKConstituencyFlag(flagUrl) {
	if (!flagUrl) return false;
	return flagUrl.includes("/gb-") && !flagUrl.includes("/gb.svg");
}

function looksLikeUKConstituency(text) {
	if (!text || typeof text !== "string") return false;

	// Common UK constituency patterns
	const patterns = [
		/\b(North|South|East|West|Central)\s+\w+/i,
		/\b\w+\s+(North|South|East|West|Central)\b/i,
		/\b\w+\s+and\s+\w+/i,
		/\bGreater\s+\w+/i,
		/\b\w+\s+(Borough|City|District|Vale|Forest|Hill|Park|Green|Heath|Common|Upon|Under)\b/i,
		/\b(St\.|Saint)\s+\w+/i,
		/\b\w+\s+(Moor|Fields|Cross|Bridge|Gate|Wood|Hall|Rise|View)\b/i,
	];

	return patterns.some((pattern) => pattern.test(text));
}

// NUCLEAR SCAN - Finds and fixes ALL constituency flags (including falling ones!)
function nuclearScan() {
	// Scan EVERYWHERE - not just .balloon-message, but all possible containers
	const allFlags = document.querySelectorAll(
		".balloon-message, .falling-flag .balloon-message, [class*='balloon'], [class*='message']"
	);
	let processedCount = 0;
	let recoveredCount = 0;

	console.log(
		`🔬 NUCLEAR SCAN: Found ${allFlags.length} total flags (including falling ones)`
	);

	allFlags.forEach((flag) => {
		const hasText = flag.textContent && flag.textContent.trim().length > 0;
		if (!hasText) return;

		let isConstituency = false;
		let method = "";

		// Check if already marked
		const currentMark = flag.getAttribute("data-constituency-flag");
		if (currentMark === "true") {
			isConstituency = true;
			method = "already-marked";
		} else if (currentMark === "false") {
			// DON'T skip - recheck these too in case they were misclassified!
			// We need to be ULTRA aggressive for falling flags
		}

		// ALWAYS try to detect constituency - even if previously marked false

		// Method 1: URL detection
		const flagUrl = flag.getAttribute("data-flag-url");
		if (flagUrl && isUKConstituencyFlag(flagUrl)) {
			isConstituency = true;
			method = "url-detection";
		}

		// Method 2: Parent flag image (more aggressive search)
		if (!isConstituency) {
			const flagWrapper = flag.closest(".falling-flag") || flag.parentElement;
			if (flagWrapper) {
				const flagImg =
					flagWrapper.querySelector(".balloon-flag") ||
					flagWrapper.querySelector("[style*='background']") ||
					flagWrapper.querySelector("div[style]");
				if (flagImg) {
					const bgImage = flagImg.style.backgroundImage || "";
					if (bgImage.includes("/gb-") && !bgImage.includes("/gb.svg")) {
						isConstituency = true;
						method = "parent-flag-image";
					}
				}
			}
		}

		// Method 3: Search ALL siblings and ancestors for flag URLs
		if (!isConstituency) {
			let searchElement = flag.parentElement;
			while (searchElement && searchElement !== document.body) {
				// Check all children for flag images
				const flagImages = searchElement.querySelectorAll(
					"[style*='background'], img"
				);
				for (let img of flagImages) {
					const src = img.style.backgroundImage || img.src || "";
					if (src.includes("/gb-") && !src.includes("/gb.svg")) {
						isConstituency = true;
						method = "ancestor-flag-search";
						break;
					}
				}
				if (isConstituency) break;
				searchElement = searchElement.parentElement;
			}
		}

		// Method 4: Text pattern analysis (more patterns)
		if (!isConstituency) {
			if (looksLikeUKConstituency(flag.textContent.trim())) {
				isConstituency = true;
				method = "text-pattern";
			}
		}

		// Method 5: Brute force - check if text contains common UK words
		if (!isConstituency) {
			const text = flag.textContent.trim().toLowerCase();
			const ukWords = [
				"constituency",
				"borough",
				"upon",
				"north",
				"south",
				"east",
				"west",
				"central",
				"greater",
				"saint",
				"st.",
			];
			if (ukWords.some((word) => text.includes(word))) {
				isConstituency = true;
				method = "brute-force-keywords";
			}
		}

		if (isConstituency) {
			// Mark it permanently
			flag.setAttribute("data-constituency-flag", "true");

			// Apply current toggle state with SUPER NUCLEAR FORCE
			if (globalToggleState) {
				// SUPER NUCLEAR SHOW - completely reset ALL styles
				console.log(`🚀 SUPER NUCLEAR SHOW: "${flag.textContent}"`);
				console.log(
					`   - Before: display="${flag.style.display}", computed="${
						window.getComputedStyle(flag).display
					}"`
				);
				console.log(`   - Classes: ${flag.className}`);
				console.log(
					`   - Data attr: ${flag.getAttribute("data-constituency-flag")}`
				);
				console.log(`   - Body classes: ${document.body.className}`);

				// BRUTAL METHOD: Remove from DOM and re-add to force recalculation
				const parent = flag.parentElement;
				const nextSibling = flag.nextSibling;

				// Remove ALL hiding classes first
				flag.classList.remove(
					"hidden",
					"hide",
					"no-message",
					"invisible",
					"d-none"
				);

				// Add nuclear visibility class FIRST
				flag.classList.add("nuclear-visible");

				// Clear all inline styles that might hide it
				flag.style.removeProperty("display");
				flag.style.removeProperty("visibility");
				flag.style.removeProperty("opacity");
				flag.style.removeProperty("height");
				flag.style.removeProperty("width");

				// FORCE with inline styles as backup
				flag.style.setProperty("display", "block", "important");
				flag.style.setProperty("visibility", "visible", "important");
				flag.style.setProperty("opacity", "1", "important");

				// Temporarily remove and re-add to trigger style recalculation
				if (parent) {
					parent.removeChild(flag);
					// Force a reflow
					parent.offsetHeight;
					// Add back
					if (nextSibling) {
						parent.insertBefore(flag, nextSibling);
					} else {
						parent.appendChild(flag);
					}
				}

				console.log(
					`   - After: display="${flag.style.display}", computed="${
						window.getComputedStyle(flag).display
					}"`
				);
				console.log(`   - Final classes: ${flag.className}`);
			} else {
				// HIDE with maximum force
				flag.style.setProperty("display", "none", "important");
				flag.classList.remove("nuclear-visible");
			}

			if (method !== "already-marked") {
				recoveredCount++;
				console.log(`💥 RECOVERED: "${flag.textContent}" via ${method}`);
			}
			processedCount++;
		} else {
			// Only mark as false if we're really sure it's not constituency
			if (currentMark !== "false") {
				flag.setAttribute("data-constituency-flag", "false");
			}
		}
	});

	totalFlagsFound = processedCount;

	if (recoveredCount > 0) {
		console.log(
			`💥 NUCLEAR SCAN: Recovered ${recoveredCount} flags, total constituency flags: ${processedCount}`
		);
	}

	// Update counter display
	updateToggleCounter();
}

// Update the toggle label to show how many flags we're managing
function updateToggleCounter() {
	const toggle = document.getElementById("constituency-labels-toggle");
	if (toggle) {
		const label = document.querySelector(
			`label[for="constituency-labels-toggle"]`
		);
		if (label) {
			const baseText = "Show constituency labels";
			if (totalFlagsFound > 0) {
				label.textContent = `${baseText} (${totalFlagsFound} found)`;
			} else {
				label.textContent = baseText;
			}
		}
	}
}

// Setup the toggle system
function setupNuclearToggle() {
	const toggle = document.getElementById("constituency-labels-toggle");
	if (!toggle) {
		console.warn("⚠️ Toggle not found, retrying in 1s...");
		setTimeout(setupNuclearToggle, 1000);
		return;
	}

	// Set initial state
	toggle.checked = globalToggleState;

	// Update body class (for any CSS-based hiding)
	if (globalToggleState) {
		document.body.classList.remove("hide-constituency-labels");
	} else {
		document.body.classList.add("hide-constituency-labels");
	}

	// Toggle handler
	toggle.addEventListener("change", (e) => {
		globalToggleState = e.target.checked;
		localStorage.setItem("showConstituencyLabels", globalToggleState);

		console.log(`💥 NUCLEAR TOGGLE: ${globalToggleState ? "ON" : "OFF"}`);

		// Update body class
		if (globalToggleState) {
			document.body.classList.remove("hide-constituency-labels");
		} else {
			document.body.classList.add("hide-constituency-labels");
		}

		// IMMEDIATE TRIPLE SCAN when toggle changes!
		console.log(`💥 IMMEDIATE TRIPLE SCAN triggered by toggle change...`);
		nuclearScan(); // Scan 1
		setTimeout(nuclearScan, 100); // Scan 2 - catch any just-created flags
		setTimeout(nuclearScan, 500); // Scan 3 - catch anything that was slow to render
	});

	console.log("💥 Nuclear toggle system activated");
}

// Start continuous monitoring
function startNuclearMonitoring() {
	// Initial scan
	nuclearScan();

	// ULTRA AGGRESSIVE - scan every 1 second instead of 3
	scanInterval = setInterval(() => {
		nuclearScan();
	}, 1000);

	console.log(
		"💥 Nuclear monitoring started (1s intervals - ULTRA AGGRESSIVE MODE)"
	);
}

// Stop monitoring (cleanup)
function stopNuclearMonitoring() {
	if (scanInterval) {
		clearInterval(scanInterval);
		scanInterval = null;
		console.log("💥 Nuclear monitoring stopped");
	}
}

// Setup immediate DOM monitoring for new flags
function setupDOMMonitoring() {
	const observer = new MutationObserver((mutations) => {
		let foundNewFlags = false;
		mutations.forEach((mutation) => {
			mutation.addedNodes.forEach((node) => {
				if (node.nodeType === Node.ELEMENT_NODE) {
					// Check if new flag elements were added
					if (
						node.classList &&
						(node.classList.contains("falling-flag") ||
							node.classList.contains("balloon-message"))
					) {
						foundNewFlags = true;
					}
					// Also check children
					if (
						node.querySelectorAll &&
						node.querySelectorAll(".balloon-message, .falling-flag").length > 0
					) {
						foundNewFlags = true;
					}
				}
			});
		});

		if (foundNewFlags) {
			console.log("🚨 DOM MONITOR: New flags detected, immediate scan!");
			nuclearScan();
		}
	});

	// Watch the entire document for changes
	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});

	console.log("💥 DOM monitoring activated - immediate scan on new flags");
}

// Auto-start when DOM is ready
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", () => {
		setTimeout(() => {
			setupNuclearToggle();
			setupDOMMonitoring();
			startNuclearMonitoring();
		}, 500);
	});
} else {
	// DOM already ready
	setTimeout(() => {
		setupNuclearToggle();
		setupDOMMonitoring();
		startNuclearMonitoring();
	}, 500);
}

// Export for manual control
window.nuclearToggle = {
	scan: nuclearScan,
	start: startNuclearMonitoring,
	stop: stopNuclearMonitoring,
	getState: () => globalToggleState,
	getCount: () => totalFlagsFound,
};

console.log("💥 Nuclear constituency toggle system loaded");
