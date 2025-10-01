// SIMPLE STABLE TOGGLE - No more nuclear chaos!
// This approach is simple, stable, and effective

console.log("🟢 Loading SIMPLE STABLE constituency toggle system...");

// Track state globally
let globalToggleState =
	localStorage.getItem("showConstituencyLabels") === "true";
let scanInterval;
let totalFlagsFound = 0;

// Helper functions (keep these simple)
function isUKConstituencyFlag(flagUrl) {
	if (!flagUrl) return false;
	return flagUrl.includes("/gb-") && !flagUrl.includes("/gb.svg");
}

function looksLikeUKConstituency(text) {
	if (!text || typeof text !== "string") return false;

	// Simple UK constituency patterns
	const patterns = [
		/\b(North|South|East|West|Central)\s+\w+/i,
		/\b\w+\s+and\s+\w+/i,
		/\bGreater\s+\w+/i,
		/\b\w+\s+(Borough|District|Upon)\b/i,
	];

	return patterns.some((pattern) => pattern.test(text));
}

// ENHANCED SCAN - Catches all flags including actively falling ones
function simpleStableScan() {
	// Scan ALL possible locations for flags, including actively falling ones
	const allFlags = document.querySelectorAll(
		".balloon-message, .falling-flag .balloon-message"
	);
	let processedCount = 0;
	let newlyFoundCount = 0;
	let fallingFlagsCount = 0;

	console.log(`🔍 Scanning ${allFlags.length} flags (including falling ones)`);

	allFlags.forEach((flag) => {
		const hasText = flag.textContent && flag.textContent.trim().length > 0;
		if (!hasText) return;

		// Check if this flag is currently falling/animating
		const isFalling = flag.closest(".falling-flag") !== null;
		if (isFalling) {
			fallingFlagsCount++;
		}

		// Check if already processed
		const alreadyMarked = flag.hasAttribute("data-constituency-flag");

		let isConstituency = false;

		if (alreadyMarked) {
			// Already processed - just apply current state
			isConstituency = flag.getAttribute("data-constituency-flag") === "true";
		} else {
			// New flag - detect what it is

			// Method 1: URL detection
			const flagUrl = flag.getAttribute("data-flag-url");
			if (flagUrl && isUKConstituencyFlag(flagUrl)) {
				isConstituency = true;
			}

			// Method 2: Parent flag image check (enhanced for falling flags)
			if (!isConstituency) {
				const flagWrapper = flag.closest(".falling-flag");
				if (flagWrapper) {
					const flagImg = flagWrapper.querySelector(".balloon-flag");
					if (flagImg) {
						const bgImage = flagImg.style.backgroundImage || "";
						if (bgImage.includes("/gb-") && !bgImage.includes("/gb.svg")) {
							isConstituency = true;
						}
					}
				}
			}

			// Method 3: Text pattern
			if (!isConstituency) {
				if (looksLikeUKConstituency(flag.textContent.trim())) {
					isConstituency = true;
				}
			}

			// Mark it permanently
			flag.setAttribute(
				"data-constituency-flag",
				isConstituency ? "true" : "false"
			);

			if (isConstituency) {
				newlyFoundCount++;
				console.log(
					`🆕 Found new constituency flag: "${flag.textContent}" ${
						isFalling ? "(FALLING)" : "(STATIC)"
					}`
				);
			}
		}

		if (isConstituency) {
			processedCount++;

			// Apply current toggle state - ENHANCED for falling flags
			if (globalToggleState) {
				// Show it - clear any hiding styles
				flag.style.display = "";
				flag.style.visibility = "";
				flag.style.opacity = "";

				// For falling flags, ensure they're visible during animation
				if (isFalling) {
					flag.style.setProperty("display", "block", "important");
					console.log(`👁️ SHOWING falling flag: "${flag.textContent}"`);
				}
			} else {
				// Hide it - works for both static and falling flags
				flag.style.display = "none";

				if (isFalling) {
					console.log(`🚫 HIDING falling flag: "${flag.textContent}"`);
				}
			}
		}
	});

	totalFlagsFound = processedCount;

	if (newlyFoundCount > 0 || fallingFlagsCount > 0) {
		console.log(
			`🟢 ENHANCED SCAN: Found ${newlyFoundCount} new flags, ${fallingFlagsCount} falling, total: ${processedCount}`
		);
		updateToggleCounter();
	}
}

// Update the toggle label
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

// Setup the toggle system - ENHANCED with main app override
function setupStableToggle() {
	const toggle = document.getElementById("constituency-labels-toggle");
	if (!toggle) {
		console.warn("⚠️ Toggle not found, retrying in 1s...");
		setTimeout(setupStableToggle, 1000);
		return;
	}

	// OVERRIDE: Force main application to always think toggle is ON
	// This ensures all flags are created consistently
	localStorage.setItem("showConstituencyLabels", "true");
	if (window.petitionTracker) {
		window.petitionTracker.showConstituencyLabels = true;
		console.log(
			"🔧 OVERRIDE: Forced main app toggle to ON for consistent flag creation"
		);
	}

	// Set initial state
	toggle.checked = globalToggleState;

	// Update body class for CSS
	if (globalToggleState) {
		document.body.classList.remove("hide-constituency-labels");
	} else {
		document.body.classList.add("hide-constituency-labels");
	} // Toggle handler - ENHANCED for falling flags
	toggle.addEventListener("change", (e) => {
		globalToggleState = e.target.checked;
		localStorage.setItem("showConstituencyLabels", globalToggleState);

		console.log(`🟢 ENHANCED TOGGLE: ${globalToggleState ? "ON" : "OFF"}`);

		// Update body class
		if (globalToggleState) {
			document.body.classList.remove("hide-constituency-labels");
		} else {
			document.body.classList.add("hide-constituency-labels");
		}

		// IMMEDIATE SCAN for falling flags - no delay!
		console.log(`⚡ INSTANT SCAN for falling flags...`);
		simpleStableScan();

		// Follow up scan after 100ms to catch any just-spawned flags
		setTimeout(() => {
			console.log(`⚡ FOLLOW-UP SCAN...`);
			simpleStableScan();
		}, 100);
	});

	console.log("🟢 Simple stable toggle system activated");
}

// Start monitoring - ENHANCED with instant detection
function startStableMonitoring() {
	// Initial scan
	simpleStableScan();

	// Setup instant detection for new flags
	const observer = new MutationObserver((mutations) => {
		let foundNewFlags = false;
		mutations.forEach((mutation) => {
			mutation.addedNodes.forEach((node) => {
				if (node.nodeType === Node.ELEMENT_NODE) {
					// Check if new flag elements were added
					if (node.classList && node.classList.contains("falling-flag")) {
						foundNewFlags = true;
					}
					// Also check children
					if (
						node.querySelectorAll &&
						node.querySelectorAll(".balloon-message").length > 0
					) {
						foundNewFlags = true;
					}
				}
			});
		});

		if (foundNewFlags) {
			console.log("⚡ INSTANT: New flags detected, immediate scan!");
			simpleStableScan();
		}
	});

	// Watch the flag overlay for new flags
	const flagOverlay = document.getElementById("flag-overlay");
	if (flagOverlay) {
		observer.observe(flagOverlay, {
			childList: true,
			subtree: true,
		});
		console.log("⚡ Instant flag detection activated");
	}

	// Moderate scanning every 5 seconds as backup
	scanInterval = setInterval(() => {
		simpleStableScan();

		// PERIODIC OVERRIDE: Ensure main app stays locked to ON for consistent creation
		if (
			window.petitionTracker &&
			!window.petitionTracker.showConstituencyLabels
		) {
			window.petitionTracker.showConstituencyLabels = true;
			localStorage.setItem("showConstituencyLabels", "true");
			console.log("🔧 PERIODIC OVERRIDE: Re-locked main app toggle to ON");
		}
	}, 5000);

	console.log(
		"🟢 Enhanced monitoring started (instant detection + 5s intervals + override lock)"
	);
}

// Stop monitoring
function stopStableMonitoring() {
	if (scanInterval) {
		clearInterval(scanInterval);
		scanInterval = null;
		console.log("🟢 Stable monitoring stopped");
	}
}

// Auto-start when DOM is ready
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", () => {
		setTimeout(() => {
			setupStableToggle();
			startStableMonitoring();
		}, 500);
	});
} else {
	// DOM already ready
	setTimeout(() => {
		setupStableToggle();
		startStableMonitoring();
	}, 500);
}

// Export for manual control
window.stableToggle = {
	scan: simpleStableScan,
	start: startStableMonitoring,
	stop: stopStableMonitoring,
	getState: () => globalToggleState,
	getCount: () => totalFlagsFound,
};

console.log("🟢 Simple stable constituency toggle system loaded");
