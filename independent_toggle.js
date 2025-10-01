// INDEPENDENT CONSTITUENCY TOGGLE - Works alongside main app without interference
// This approach doesn't override anything, just adds independent control

console.log("🔵 Loading INDEPENDENT constituency toggle system...");

// Track our own state independently
let independentToggleState =
	localStorage.getItem("independentConstituencyLabels") === "true";
let scanInterval;
let totalFlagsFound = 0;

// Helper functions
function isUKConstituencyFlag(flagUrl) {
	if (!flagUrl) return false;
	return flagUrl.includes("/gb-") && !flagUrl.includes("/gb.svg");
}

function looksLikeUKConstituency(text) {
	if (!text || typeof text !== "string") return false;

	const patterns = [
		/\b(North|South|East|West|Central)\s+\w+/i,
		/\b\w+\s+and\s+\w+/i,
		/\bGreater\s+\w+/i,
		/\b\w+\s+(Borough|District|Upon)\b/i,
	];

	return patterns.some((pattern) => pattern.test(text));
}

// INDEPENDENT SCAN - Only touches flags we've marked, doesn't interfere with main app
function independentScan() {
	const allFlags = document.querySelectorAll(".balloon-message");
	let processedCount = 0;
	let newlyFoundCount = 0;

	allFlags.forEach((flag) => {
		const hasText = flag.textContent && flag.textContent.trim().length > 0;
		if (!hasText) return;

		// Check if we've already processed this flag
		const ourMark = flag.getAttribute("data-independent-constituency");

		let isConstituency = false;

		if (ourMark === "true") {
			// We've already marked this as constituency
			isConstituency = true;
		} else if (ourMark === "false") {
			// We've already marked this as NOT constituency
			return;
		} else {
			// New flag - check if it's constituency

			// Method 1: URL detection
			const flagUrl = flag.getAttribute("data-flag-url");
			if (flagUrl && isUKConstituencyFlag(flagUrl)) {
				isConstituency = true;
			}

			// Method 2: Parent flag image
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

			// Mark with OUR attribute (separate from main app)
			flag.setAttribute(
				"data-independent-constituency",
				isConstituency ? "true" : "false"
			);

			if (isConstituency) {
				newlyFoundCount++;
				console.log(`🔵 Found constituency flag: "${flag.textContent}"`);
			}
		}

		if (isConstituency) {
			processedCount++;

			// Apply OUR toggle state using CSS classes (doesn't interfere with inline styles)
			if (independentToggleState) {
				flag.classList.remove("independent-hidden");
				flag.classList.add("independent-visible");
			} else {
				flag.classList.remove("independent-visible");
				flag.classList.add("independent-hidden");
			}
		}
	});

	totalFlagsFound = processedCount;

	if (newlyFoundCount > 0) {
		console.log(
			`🔵 INDEPENDENT SCAN: Found ${newlyFoundCount} new flags, total: ${processedCount}`
		);
		updateIndependentCounter();
	}
}

// Update counter
function updateIndependentCounter() {
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

// Setup independent toggle
function setupIndependentToggle() {
	const toggle = document.getElementById("constituency-labels-toggle");
	if (!toggle) {
		console.warn("⚠️ Toggle not found, retrying in 1s...");
		setTimeout(setupIndependentToggle, 1000);
		return;
	}

	// Set initial state
	toggle.checked = independentToggleState;

	// Remove any existing event listeners and add our own
	const newToggle = toggle.cloneNode(true);
	toggle.parentNode.replaceChild(newToggle, toggle);

	// Our independent toggle handler
	newToggle.addEventListener("change", (e) => {
		independentToggleState = e.target.checked;
		localStorage.setItem(
			"independentConstituencyLabels",
			independentToggleState
		);

		console.log(
			`🔵 INDEPENDENT TOGGLE: ${independentToggleState ? "ON" : "OFF"}`
		);

		// Apply changes immediately
		independentScan();
	});

	console.log("🔵 Independent toggle system activated");
}

// Start independent monitoring
function startIndependentMonitoring() {
	// Initial scan
	independentScan();

	// Setup mutation observer for new flags
	const observer = new MutationObserver((mutations) => {
		let foundNewFlags = false;
		mutations.forEach((mutation) => {
			mutation.addedNodes.forEach((node) => {
				if (node.nodeType === Node.ELEMENT_NODE) {
					if (node.classList && node.classList.contains("falling-flag")) {
						foundNewFlags = true;
					}
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
			console.log("🔵 New flags detected!");
			setTimeout(independentScan, 50); // Small delay to let DOM settle
		}
	});

	// Watch for new flags
	const flagOverlay = document.getElementById("flag-overlay");
	if (flagOverlay) {
		observer.observe(flagOverlay, {
			childList: true,
			subtree: true,
		});
		console.log("🔵 Independent flag detection activated");
	}

	// Backup scan every 3 seconds
	scanInterval = setInterval(() => {
		independentScan();
	}, 3000);

	console.log("🔵 Independent monitoring started");
}

// Auto-start
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", () => {
		setTimeout(() => {
			setupIndependentToggle();
			startIndependentMonitoring();
		}, 1000); // Longer delay to let main app initialize first
	});
} else {
	setTimeout(() => {
		setupIndependentToggle();
		startIndependentMonitoring();
	}, 1000);
}

// Export
window.independentToggle = {
	scan: independentScan,
	start: startIndependentMonitoring,
	getState: () => independentToggleState,
	getCount: () => totalFlagsFound,
};

console.log("🔵 Independent constituency toggle system loaded");
