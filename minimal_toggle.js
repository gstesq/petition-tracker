// MINIMAL TOGGLE - Absolutely no interference with main app
// Only controls CSS visibility, nothing else

let toggleState = localStorage.getItem("constituency-toggle") === "true";

function setupMinimalToggle() {
	const toggle = document.getElementById("constituency-labels-toggle");
	if (!toggle) {
		setTimeout(setupMinimalToggle, 200);
		return;
	}

	// Set checkbox state
	toggle.checked = toggleState;

	// Apply CSS class
	document.body.classList.toggle("hide-constituency", !toggleState);

	// Listen for changes
	toggle.addEventListener("change", function () {
		toggleState = this.checked;
		localStorage.setItem("constituency-toggle", toggleState);
		document.body.classList.toggle("hide-constituency", !toggleState);
	});
}

// Initialize
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", setupMinimalToggle);
} else {
	setupMinimalToggle();
}
