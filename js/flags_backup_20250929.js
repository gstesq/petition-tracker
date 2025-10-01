// Backup of flags.js before restoring cached version
// (auto-created on 2025-09-29)

(function () {
	"use strict";

	// Ensure overlay container exists
	function ensureFlagOverlay() {
		let overlay = document.getElementById("flag-overlay");
		if (!overlay) {
			overlay = document.createElement("div");
			overlay.id = "flag-overlay";
			overlay.className = "flag-overlay";
			document.body.appendChild(overlay);
		}
		return overlay;
	}

	// Toggle state (kept in sync with the page inputs). Persist flags toggle to localStorage
	let animationEnabled = true;
	let showConstituencyLabels = true;
	const STORAGE_KEY = "flagsAnimation";

	function readToggles() {
		// Prefer localStorage value for the animation toggle if present
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored !== null) {
				animationEnabled = stored === "true";
			}
		} catch (e) {
			// ignore storage failures
		}

		const f = document.getElementById("flag-toggle");
		const c = document.getElementById("constituency-labels-toggle");
		if (f) {
			// Ensure the checkbox reflects stored preference
			try {
				f.checked = !!animationEnabled;
			} catch (e) {}
			animationEnabled = !!f.checked;
		}
		if (c) {
			showConstituencyLabels = !!c.checked;
		}
	}

	// Wire up the page inputs if present
	document.addEventListener("DOMContentLoaded", () => {
		readToggles();
		const f = document.getElementById("flag-toggle");
		const c = document.getElementById("constituency-labels-toggle");
		if (f)
			f.addEventListener("change", (e) => {
				animationEnabled = !!e.target.checked;
				try {
					localStorage.setItem(
						STORAGE_KEY,
						animationEnabled ? "true" : "false"
					);
				} catch (err) {}
			});
		if (c)
			c.addEventListener("change", (e) => {
				showConstituencyLabels = !!e.target.checked;
				applyToggleToExistingFlags();
			});
	});

	// Simple detection for UK subregion flags inside a URL
	function isUKFlagUrl(url) {
		if (!url) return false;
		return /gb(-|_)?(eng|sct|wls|nir|\.svg|flag-icon-gb)/i.test(url);
	}

	// Configuration: how many flags per signature (e.g. 0.5 = 1 flag per 2 signatures)
	const SPAWN_RATE_PER_SIGNATURE = 0.5;
	const SPAWN_WINDOW_MS = 10000; // spread replay over 10s

	// Accumulate spawns while page is hidden and replay on visibility
	let _hiddenAccum = [];

	function _flushHiddenAccumulatedSpawns() {
		if (!_hiddenAccum || _hiddenAccum.length === 0) return;
		// Flatten into individual spawn items
		const items = [];
		_hiddenAccum.forEach((e) => {
			for (let i = 0; i < e.count; i++)
				items.push({ flagUrl: e.flagUrl, label: e.label });
		});
		_hiddenAccum = [];
		if (items.length === 0) return;
		const total = items.length;
		const windowMs = SPAWN_WINDOW_MS;
		for (let i = 0; i < total; i++) {
			const delay = Math.round(
				(i / total) * windowMs + (Math.random() - 0.5) * 200
			);
			setTimeout(() => {
				try {
					spawnFlags(items[i].flagUrl, 1, items[i].label);
				} catch (e) {}
			}, Math.max(0, delay));
		}
	}

	// Replay when tab becomes visible
	document.addEventListener("visibilitychange", () => {
		if (!document.hidden) {
			_flushHiddenAccumulatedSpawns();
		}
	});

	// Spawn simple falling flags. Message may be empty.
	function spawnFlags(flagUrl, count, message) {
		if (!animationEnabled) return;
		if (!count || count < 1) count = 1;
		const overlay = ensureFlagOverlay();
		const cap = 100;
		const spawnCount = Math.min(count, cap);

		const vw = Math.max(
			document.documentElement.clientWidth || 0,
			window.innerWidth || 0
		);

		for (let i = 0; i < spawnCount; i++) {
			(function (i) {
				const wrapper = document.createElement("div");
				wrapper.className = "falling-flag";

				const flagEl = document.createElement("div");
				flagEl.className = "balloon-flag";
				if (flagUrl) flagEl.style.backgroundImage = `url('${flagUrl}')`;

				const stringEl = document.createElement("div");
				stringEl.className = "balloon-string";

				const msgEl = document.createElement("div");
				msgEl.className = "balloon-message";
				msgEl.setAttribute("data-original-message", message || "");
				msgEl.setAttribute("data-flag-url", flagUrl || "");
				// Mark whether this is likely a UK constituency flag
				const isUK = isUKFlagUrl(flagUrl || "");
				msgEl.setAttribute("data-is-uk-flag", isUK ? "true" : "false");
				// Keep a reliable marker for constituency (we show/hide these)
				if (isUK && message && message.trim().length) {
					msgEl.setAttribute("data-constituency-flag", "true");
				} else {
					msgEl.setAttribute("data-constituency-flag", "false");
				}

				if (message && message.trim().length && showConstituencyLabels) {
					msgEl.textContent = message;
				} else if (message && message.trim().length) {
					// Keep the message text so it can be shown later when toggle is enabled
					msgEl.textContent = message;
					// But keep it hidden initially if toggle is off - the animationstart handler will enforce
				}

				wrapper.appendChild(flagEl);
				wrapper.appendChild(stringEl);
				wrapper.appendChild(msgEl);

				// Random X position but keep inside viewport
				const elWidth = 120; // safe width estimate
				const left = Math.floor(Math.random() * Math.max(1, vw - elWidth));
				wrapper.style.left = left + "px";

				// Random timing
				const duration = 3000 + Math.floor(Math.random() * 3000); // 3-6s
				const delay = Math.floor(Math.random() * 800);
				wrapper.style.animationDuration = duration + "ms";
				wrapper.style.animationDelay = delay + "ms";
				wrapper.style.setProperty("--flag-duration", duration + "ms");
				wrapper.style.setProperty("--flag-delay", delay + "ms");

				// Prevent click catching
				wrapper.style.pointerEvents = "none";

				// Hide until animation starts to avoid a top-of-screen flash
				wrapper.style.setProperty("visibility", "hidden", "important");
				msgEl.style.setProperty("visibility", "hidden", "important");

				overlay.appendChild(wrapper);

				// When animation starts, reveal if CSS won't immediately hide it
				const onStart = function () {
					try {
						// If computed style already hides it due to a toggle, keep it hidden
						const compWrap = window.getComputedStyle(wrapper);
						const compMsg = window.getComputedStyle(msgEl);
						if (
							compWrap.display === "none" ||
							compWrap.visibility === "hidden" ||
							compMsg.display === "none" ||
							compMsg.visibility === "hidden"
						) {
							// keep hidden, label_patcher or our toggles will show later
							wrapper.removeEventListener("animationstart", onStart);
							return;
						}
						wrapper.style.removeProperty("visibility");
						wrapper.style.setProperty("visibility", "visible", "important");
						// Reveal the message only if allowed
						const isCon =
							msgEl.getAttribute("data-constituency-flag") === "true";
						if (isCon) {
							if (showConstituencyLabels) {
								msgEl.style.removeProperty("display");
								msgEl.style.setProperty("display", "block", "important");
								msgEl.style.setProperty("visibility", "visible", "important");
							} else {
								msgEl.style.setProperty("display", "none", "important");
							}
						} else {
							// Non-constituency messages should be visible
							msgEl.style.removeProperty("display");
							msgEl.style.setProperty("display", "block", "important");
							msgEl.style.setProperty("visibility", "visible", "important");
						}
					} catch (e) {
						// ignore
					} finally {
						wrapper.removeEventListener("animationstart", onStart);
					}
				};

				wrapper.addEventListener("animationstart", onStart, { once: true });

				// Cleanup after animation end
				wrapper.addEventListener("animationend", function () {
					try {
						overlay.removeChild(wrapper);
					} catch (e) {}
				});
			})(i);
		}
	}

	// Apply current toggle to existing flags (show/hide constituency labels)
	function applyToggleToExistingFlags() {
		const overlay = document.getElementById("flag-overlay");
		if (!overlay) return;
		const all = overlay.querySelectorAll(".balloon-message");
		all.forEach((msgEl) => {
			const isCon = msgEl.getAttribute("data-constituency-flag") === "true";
			if (isCon) {
				if (showConstituencyLabels) {
					msgEl.style.removeProperty("display");
					msgEl.style.setProperty("display", "block", "important");
					msgEl.style.setProperty("visibility", "visible", "important");
				} else {
					msgEl.style.setProperty("display", "none", "important");
				}
			}
		});
	}

	// Map region jump id to a usable flag and message
	function regionToFlag(id) {
		switch (id) {
			case "totalJumpEng":
				return {
					url: "https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.3.0/flags/4x3/gb-eng.svg",
					label: "England",
				};
			case "totalJumpSco":
				return {
					url: "https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.3.0/flags/4x3/gb-sct.svg",
					label: "Scotland",
				};
			case "totalJumpWal":
				return {
					url: "https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.3.0/flags/4x3/gb-wls.svg",
					label: "Wales",
				};
			case "totalJumpIre":
				return {
					url: "https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.3.0/flags/4x3/gb-nir.svg",
					label: "N. Ireland",
				};
			case "totalJumpNonUk":
				return { url: "img/splash.jpg", label: "Non-UK" };
			case "totalJumpUk":
				return {
					url: "https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.3.0/flags/4x3/gb.svg",
					label: "UK",
				};
			default:
				return { url: "img/splash.jpg", label: "" };
		}
	}

	// Wrap the existing showJumpCount (if present) so we also spawn flags
	function installWrapper() {
		try {
			const existing = window.showJumpCount;
			if (typeof existing === "function") {
				window.showJumpCount = function (id, jumpSize) {
					try {
						existing(id, jumpSize);
					} catch (e) {
						console.warn("showJumpCount original failed", e);
					}
					try {
						const mapping = regionToFlag(id);
						// Derive spawn count from jumpSize so it's reflective of real activity
						let desired = Math.max(
							1,
							Math.round(jumpSize * SPAWN_RATE_PER_SIGNATURE)
						);
						// clamp per-region burst to reasonable numbers
						const CLAMP_MAX = 100;
						desired = Math.min(desired, CLAMP_MAX);
						if (document && document.hidden) {
							// accumulate by label+url
							let entry = _hiddenAccum.find(
								(e) => e.flagUrl === mapping.url && e.label === mapping.label
							);
							if (!entry) {
								entry = {
									flagUrl: mapping.url,
									label: mapping.label,
									count: 0,
								};
								_hiddenAccum.push(entry);
							}
							entry.count += desired;
						} else {
							spawnFlags(mapping.url, desired, mapping.label);
						}
					} catch (e) {
						console.warn("flags spawn failed", e);
					}
				};
			} else {
				// If not present yet, poll until it appears (first-boot)
				const id = setInterval(() => {
					if (typeof window.showJumpCount === "function") {
						clearInterval(id);
						installWrapper();
					}
				}, 250);
			}
		} catch (e) {
			console.warn("installWrapper failed", e);
		}
	}

	// Expose safe API for debugging
	window.spawnFlags = spawnFlags;
	window._petitionFlags = {
		spawnFlags,
		applyToggleToExistingFlags,
	};

	// Install on load
	document.addEventListener("DOMContentLoaded", () => {
		ensureFlagOverlay();
		readToggles();
		installWrapper();

		// One-time demo spawn so user sees activity immediately when loading the page.
		// Only run if animation is enabled and not in a background tab.
		try {
			if (animationEnabled && !document.hidden) {
				setTimeout(() => {
					try {
						spawnFlags("img/splash.jpg", 3, "Demo");
					} catch (e) {}
				}, 600);
			}
		} catch (e) {}
	});

	// Small UX helpers: wire Reset Graph button and persist chart-mode selection
	document.addEventListener("DOMContentLoaded", () => {
		// Reset graph button: clear in-memory history and chart DOM elements if present
		const resetBtn = document.getElementById("reset-graph-btn");
		if (resetBtn) {
			resetBtn.addEventListener("click", () => {
				// Best-effort clear of globals used by the older app
				try {
					if (window.sigHistory && Array.isArray(window.sigHistory)) {
						window.sigHistory.length = 0;
					}
					// Clear chart container
					const chart = document.querySelector(".history-chart");
					if (chart) chart.innerHTML = "";
					// Reset visible counters
					const totalEl = document.querySelector(".totalSigs");
					if (totalEl) totalEl.textContent = "";
					const jumpEl = document.querySelector(".jump");
					if (jumpEl) jumpEl.textContent = "Reset";
					// If Tabulator table exists, clear and refresh it
					if (window.table && typeof window.table.replaceData === "function") {
						try {
							window.table.replaceData([]);
						} catch (e) {}
					}
					console.log("Reset graph data (best-effort)");
				} catch (e) {
					console.warn("Reset handler failed", e);
				}
			});
		}

		// Persist chart-mode selection if present so the preference survives reloads
		const chartModeSelect = document.getElementById("chart-mode");
		if (chartModeSelect) {
			// restore previous value if any
			try {
				const saved = localStorage.getItem("chartMode");
				if (saved) chartModeSelect.value = saved;
			} catch (e) {}
			chartModeSelect.addEventListener("change", (e) => {
				try {
					localStorage.setItem("chartMode", e.target.value);
				} catch (err) {}
				// If a chart update function exists, call it
				if (typeof window.updateHistoryChart === "function") {
					try {
						window.updateHistoryChart();
					} catch (e) {}
				}
			});
		}
	});
})();
