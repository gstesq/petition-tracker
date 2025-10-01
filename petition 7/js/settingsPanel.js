// Settings Panel Toggle (isolated)
// Does not alter existing PetitionTracker logic; only manages show/hide of settings UI.
(function () {
	const toggleBtn = document.getElementById("settings-toggle-btn");
	const content = document.getElementById("settings-content");
	if (!toggleBtn || !content) return; // fail-safe

	function toggle() {
		const expanded = toggleBtn.getAttribute("aria-expanded") === "true";
		const next = !expanded;
		toggleBtn.setAttribute("aria-expanded", String(next));
		if (next) {
			content.classList.remove("hidden");
		} else {
			content.classList.add("hidden");
		}
	}

	toggleBtn.addEventListener("click", toggle);
})();
