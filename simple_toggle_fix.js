// ULTRA SIMPLE TOGGLE - Just CSS, no detection chaos
// This approach uses only CSS and basic DOM manipulation

console.log("🟡 Loading ULTRA SIMPLE toggle system...");

let simpleToggleState =
	localStorage.getItem("simpleConstituencyToggle") === "true";

// NO COMPLEX NORMALIZATION - Keep ultra simple
function normalizeMainAppBehavior() {
	// Do nothing - no interference with main app
	console.log("🔧 NORMALIZE: Disabled for simplicity");
}

function setupSimpleToggle() {
	const toggle = document.getElementById("constituency-labels-toggle");
	if (!toggle) {
		setTimeout(setupSimpleToggle, 500);
		return;
	}

	// Set initial state
	toggle.checked = simpleToggleState;

	// Apply initial CSS state
	if (simpleToggleState) {
		document.body.classList.remove("simple-hide-constituency");
	} else {
		document.body.classList.add("simple-hide-constituency");
	}

	// Clear any existing handlers and add simple one
	const newToggle = toggle.cloneNode(true);
	toggle.parentNode.replaceChild(newToggle, toggle);

	newToggle.addEventListener("change", (e) => {
		simpleToggleState = e.target.checked;
		localStorage.setItem("simpleConstituencyToggle", simpleToggleState);

		console.log(`🟡 SIMPLE TOGGLE: ${simpleToggleState ? "ON" : "OFF"}`);

		// Just toggle CSS class - no scanning, no detection
		if (simpleToggleState) {
			document.body.classList.remove("simple-hide-constituency");
		} else {
			document.body.classList.add("simple-hide-constituency");
		}
	});

	// No monitoring - keep it simple

	console.log("🟡 Ultra simple toggle ready");
}

// Initialize once DOM is ready - NO COMPLEX STUFF
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", setupSimpleToggle);
} else {
	setupSimpleToggle();
}

console.log("🟡 Ultra simple toggle loaded");
