// Restored working backup version from petition 5 for stable animations
(function () {
	"use strict";

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

	let animationEnabled = true;
	let showConstituencyLabels = true;
	let animationMode = "drop"; // "drop" | "stream" | "march"
	const STORAGE_KEY_ANIMATION = "flagsAnimation";
	const STORAGE_KEY_LABELS = "flagsLabels";
	const STORAGE_KEY_MODE = "flagsMode";

	function updateDependentVisibility() {
		const flagCheckbox = document.getElementById("flag-toggle");
		const enabled = flagCheckbox ? flagCheckbox.checked : animationEnabled;
		const depWrap = document.getElementById("constituency-toggle-wrapper");
		if (depWrap) depWrap.classList.toggle("is-hidden-dep", !enabled);
		const pairRow = depWrap ? depWrap.closest(".toggle-pair") : null;
		if (pairRow) {
			if (!enabled) pairRow.classList.add("single-toggle-row");
			else pairRow.classList.remove("single-toggle-row");
		}
		const animRow = document.getElementById("animation-mode-row");
		if (animRow) animRow.classList.toggle("is-hidden-dep", !enabled);
	}

	function readToggles() {
		try {
			const stored = localStorage.getItem(STORAGE_KEY_ANIMATION);
			animationEnabled = stored === null ? true : stored === "true";
		} catch (e) {}
		try {
			const stored = localStorage.getItem(STORAGE_KEY_LABELS);
			showConstituencyLabels = stored === null ? true : stored === "true";
		} catch (e) {}
		try {
			const stored = localStorage.getItem(STORAGE_KEY_MODE);
			animationMode = stored || "drop";
		} catch (e) {}
		const f = document.getElementById("flag-toggle");
		if (f) f.checked = animationEnabled;
		const c = document.getElementById("constituency-labels-toggle");
		if (c) c.checked = showConstituencyLabels;
		const m = document.getElementById("animation-mode");
		if (m) m.value = animationMode;
	}

	document.addEventListener("DOMContentLoaded", () => {
		readToggles();
		const f = document.getElementById("flag-toggle");
		const c = document.getElementById("constituency-labels-toggle");
		const m = document.getElementById("animation-mode");
		if (f)
			f.addEventListener("change", (e) => {
				animationEnabled = !!e.target.checked;
				try {
					localStorage.setItem(STORAGE_KEY_ANIMATION, animationEnabled);
				} catch (err) {}
				// Sync block UI if present
				const block = document.getElementById("flag-toggle-block");
				if (block) {
					block.setAttribute(
						"aria-pressed",
						animationEnabled ? "true" : "false"
					);
					const stateEl = document.getElementById("flag-toggle-state");
					if (stateEl) stateEl.textContent = animationEnabled ? "On" : "Off";
				}
				updateDependentVisibility();
			});
		if (c)
			c.addEventListener("change", (e) => {
				showConstituencyLabels = !!e.target.checked;
				try {
					localStorage.setItem(STORAGE_KEY_LABELS, showConstituencyLabels);
				} catch (err) {}
				applyToggleToExistingFlags();
				// Sync block UI if present
				const block = document.getElementById("constituency-labels-block");
				if (block) {
					block.setAttribute(
						"aria-pressed",
						showConstituencyLabels ? "true" : "false"
					);
					const stateEl = document.getElementById("constituency-labels-state");
					if (stateEl)
						stateEl.textContent = showConstituencyLabels ? "On" : "Off";
				}
			});
		if (m)
			m.addEventListener("change", (e) => {
				animationMode = e.target.value;
				try {
					localStorage.setItem(STORAGE_KEY_MODE, animationMode);
				} catch (err) {}
			});
	});

	function isUKFlagUrl(url) {
		if (!url) return false;
		return /gb(-|_)?(eng|sct|wls|nir|\.svg|flag-icon-gb)/i.test(url);
	}

	const SPAWN_RATE_PER_SIGNATURE = 0.5;
	const SPAWN_WINDOW_MS = 10000;
	let _hiddenAccum = [];

	function _flushHiddenAccumulatedSpawns() {
		// purely handles deferred flag spawns when tab refocuses
		if (!_hiddenAccum || _hiddenAccum.length === 0) return;
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

	document.addEventListener("visibilitychange", () => {
		if (!document.hidden) {
			_flushHiddenAccumulatedSpawns();
		}
	});

	function spawnFlags(flagUrl, count, message) {
		if (!animationEnabled) return;
		if (!count || count < 1) count = 1;
		const overlay = ensureFlagOverlay();
		const cap = 100;
		const spawnCount = Math.min(count, cap);
		if (animationMode === "march") {
			return spawnMarchFlags(flagUrl, spawnCount, message, overlay);
		}
		function positionFlag(wrapper) {
			try {
				const frac = parseFloat(wrapper.dataset.leftFraction || Math.random());
				if (isNaN(frac)) wrapper.dataset.leftFraction = Math.random();
				const vw = Math.max(
					document.documentElement.clientWidth || 0,
					window.innerWidth || 0
				);
				const elW = wrapper.offsetWidth || 120;
				let left = Math.round(frac * (vw - elW));
				left = Math.max(0, Math.min(vw - elW, left));
				wrapper.style.left = left + "px";
			} catch (e) {}
		}
		if (!window._flagResizeHandlerInstalled) {
			window._flagResizeHandlerInstalled = true;
			let resizeTimer;
			window.addEventListener(
				"resize",
				() => {
					clearTimeout(resizeTimer);
					resizeTimer = setTimeout(() => {
						try {
							document
								.querySelectorAll(".falling-flag")
								.forEach((n) => positionFlag(n));
						} catch (e) {}
					}, 80);
				},
				{ passive: true }
			);
		}
		for (let i = 0; i < spawnCount; i++) {
			(function () {
				const wrapper = document.createElement("div");
				wrapper.className = "falling-flag";
				wrapper.dataset.leftFraction = Math.random().toString();
				const flagEl = document.createElement("div");
				flagEl.className = "balloon-flag";
				// Robust load + fallback: some country codes (e.g. XK) may not exist in the CDN.
				// We attempt to preload; on failure we show a neutral globe so the spawn is still visible.
				if (flagUrl) {
					const testImg = new Image();
					testImg.onload = () => {
						flagEl.style.backgroundImage = `url('${flagUrl}')`;
					};
					testImg.onerror = () => {
						flagEl.classList.add("neutral","neutral-non-uk");
						flagEl.textContent = "🌐";
					};
					testImg.src = flagUrl;
				} else {
					flagEl.classList.add("neutral","neutral-non-uk");
					flagEl.textContent = "🌐";
				}
				const stringEl = document.createElement("div");
				stringEl.className = "balloon-string";
				const msgEl = document.createElement("div");
				msgEl.className = "balloon-message";
				msgEl.setAttribute("data-original-message", message || "");
				msgEl.setAttribute("data-flag-url", flagUrl || "");
				const isUK = isUKFlagUrl(flagUrl || "");
				msgEl.setAttribute("data-is-uk-flag", isUK ? "true" : "false");
				if (isUK && message && message.trim().length)
					msgEl.setAttribute("data-constituency-flag", "true");
				else msgEl.setAttribute("data-constituency-flag", "false");
				if (message && message.trim().length && showConstituencyLabels) {
					msgEl.textContent = message;
				} else if (message && message.trim().length) {
					msgEl.textContent = message;
				}
				wrapper.appendChild(flagEl);
				wrapper.appendChild(stringEl);
				wrapper.appendChild(msgEl);
				wrapper.style.left = "0px";
				const duration = 3000 + Math.floor(Math.random() * 3000);
				let delay = 0;
				delay =
					animationMode === "stream"
						? Math.floor(Math.random() * 10000)
						: Math.floor(Math.random() * 800);
				wrapper.style.animationDuration = duration + "ms";
				wrapper.style.animationDelay = delay + "ms";
				wrapper.style.setProperty("--flag-duration", duration + "ms");
				wrapper.style.setProperty("--flag-delay", delay + "ms");
				wrapper.style.pointerEvents = "none";
				wrapper.style.setProperty("visibility", "hidden", "important");
				msgEl.style.setProperty("visibility", "hidden", "important");
				overlay.appendChild(wrapper);
				requestAnimationFrame(() => positionFlag(wrapper));
				const onStart = function () {
					try {
						wrapper.style.removeProperty("visibility");
						wrapper.style.setProperty("visibility", "visible", "important");
						const isConstituency =
							msgEl.getAttribute("data-constituency-flag") === "true";
						if (isConstituency) {
							if (showConstituencyLabels) {
								msgEl.style.removeProperty("display");
								msgEl.style.setProperty("display", "block", "important");
								msgEl.style.setProperty("visibility", "visible", "important");
							} else {
								msgEl.style.setProperty("display", "none", "important");
							}
						} else {
							msgEl.style.removeProperty("display");
							msgEl.style.setProperty("display", "block", "important");
							msgEl.style.setProperty("visibility", "visible", "important");
						}
						requestAnimationFrame(() => positionFlag(wrapper));
					} catch (e) {
					} finally {
						wrapper.removeEventListener("animationstart", onStart);
					}
				};
				wrapper.addEventListener("animationstart", onStart, { once: true });
				wrapper.addEventListener("animationend", function () {
					try {
						overlay.removeChild(wrapper);
					} catch (e) {}
				});
			})();
		}
	}

	const MARCH_FORMATION = {
		rows: [
			{ queue: [], nextAvailable: 0, lastWidth: 160 },
			{ queue: [], nextAvailable: 0, lastWidth: 160 },
			{ queue: [], nextAvailable: 0, lastWidth: 160 },
			{ queue: [], nextAvailable: 0, lastWidth: 160 },
		],
		active: [],
		nextRow: 0,
		schedulerRunning: false,
	};

	function spawnMarchFlags(flagUrl, count, message, overlay) {
		const LIFE = 12000;
		for (let i = 0; i < count; i++) {
			const row = MARCH_FORMATION.nextRow;
			MARCH_FORMATION.nextRow = (MARCH_FORMATION.nextRow + 1) % 4;
			const wrapper = document.createElement("div");
			wrapper.className = "falling-flag march-flag";
			wrapper.dataset.marchRow = row.toString();
			wrapper.dataset.createdAt = Date.now().toString();
			wrapper.dataset.lifespan = LIFE.toString();
			wrapper.style.position = "absolute";
			wrapper.style.top = "0";
			wrapper.style.left = "0";
			wrapper.style.opacity = "0";
			wrapper.style.animation = "none";
			const flagEl = document.createElement("div");
			flagEl.className = "balloon-flag";
			if (flagUrl) {
				flagEl.style.backgroundImage = `url('${flagUrl}')`;
			} else {
				flagEl.classList.add("neutral");
				flagEl.textContent = "🌐";
			}
			const msgEl = document.createElement("div");
			msgEl.className = "balloon-message";
			msgEl.textContent = message || "";
			// Provide parity with drop/stream: tag messages so global toggle logic can act.
			const isUK = isUKFlagUrl(flagUrl || "");
			// Treat any UK region march label as constituency-style so it can be toggled off.
			if (isUK && (message || "").trim().length) {
				msgEl.setAttribute("data-constituency-flag", "true");
			} else {
				msgEl.setAttribute("data-constituency-flag", "false");
			}
			msgEl.setAttribute("data-is-uk-flag", isUK ? "true" : "false");
			if (
				!showConstituencyLabels &&
				msgEl.getAttribute("data-constituency-flag") === "true"
			) {
				msgEl.style.display = "none";
			}
			wrapper.appendChild(flagEl);
			wrapper.appendChild(msgEl);
			overlay.appendChild(wrapper);
			MARCH_FORMATION.rows[row].queue.push({
				wrapper,
				row,
				createdAt: Date.now(),
				lifespan: LIFE,
				started: false,
			});
		}
		startMarchScheduler();
	}

	function startMarchScheduler() {
		if (MARCH_FORMATION.schedulerRunning) return;
		MARCH_FORMATION.schedulerRunning = true;
		const DURATION = 10000;
		const baseYStart = 20;
		const rowHeight = 70;
		const GAP_EXTRA = 50;
		function tick() {
			if (animationMode !== "march") {
				MARCH_FORMATION.schedulerRunning = false;
				return;
			}
			const vw = Math.max(
				document.documentElement.clientWidth || 0,
				window.innerWidth || 0
			);
			const pathLength = vw + 140;
			const pxPerMs = pathLength / DURATION;
			const now = Date.now();
			MARCH_FORMATION.rows.forEach((rowObj, rowIndex) => {
				while (rowObj.queue.length) {
					if (now < rowObj.nextAvailable) break;
					const rec = rowObj.queue.shift();
					if (!rec || rec.started) continue;
					const w = rec.wrapper.offsetWidth || 160;
					const y = baseYStart + rowIndex * rowHeight;
					rec.wrapper.style.setProperty("--march-y", y + "px");
					rec.wrapper.style.opacity = "1";
					rec.wrapper.style.animation = `marchMove ${DURATION}ms linear 0ms forwards`;
					rec.started = true;
					MARCH_FORMATION.active.push(rec);
					const distanceNeeded = rowObj.lastWidth + w + GAP_EXTRA;
					const timeNeeded = distanceNeeded / pxPerMs;
					rowObj.nextAvailable = now + timeNeeded;
					rowObj.lastWidth = w;
					setTimeout(() => {
						try {
							rec.wrapper.remove();
						} catch (e) {}
					}, DURATION + 500);
				}
			});
			if (MARCH_FORMATION.schedulerRunning) requestAnimationFrame(tick);
		}
		requestAnimationFrame(tick);
	}

	function applyToggleToExistingFlags() {
		const overlay = document.getElementById("flag-overlay");
		if (!overlay) return;
		overlay.querySelectorAll(".balloon-message").forEach((msgEl) => {
			const isCon = msgEl.getAttribute("data-constituency-flag") === "true";
			if (!isCon) return; // only toggle designated constituency-style labels
			if (showConstituencyLabels) {
				msgEl.style.removeProperty("display");
				msgEl.style.setProperty("display", "block", "important");
				msgEl.style.setProperty("visibility", "visible", "important");
			} else {
				msgEl.style.setProperty("display", "none", "important");
			}
		});
	}

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
				return { url: null, label: "Non-UK" }; // neutral fallback
			case "totalJumpUk":
				return {
					url: "https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.3.0/flags/4x3/gb.svg",
					label: "UK",
				};
			default:
				return { url: null, label: "" };
		}
	}

	function installWrapper() {
		try {
			const existing = window.showJumpCount;
			if (typeof existing === "function") {
				console.log(
					`%c[Flags] ✅ Wrapping existing window.showJumpCount function.`,
					"color: green; font-weight: bold;"
				);
				window.showJumpCount = function (id, jumpSize) {
					console.log(
						`%c[Flags] 👉 Intercepted showJumpCount call! ID: ${id}, Jump: ${jumpSize}`,
						"color: #007acc; font-weight: bold;"
					);
					try {
						existing(id, jumpSize);
					} catch (e) {
						console.warn("[Flags] Original showJumpCount failed", e);
					}
					try {
						if (!animationEnabled) {
							console.log("[Flags] ❌ Animation is disabled, skipping spawn.");
							return;
						}
						const mapping = regionToFlag(id);
						let desired = Math.max(
							1,
							Math.round(jumpSize * SPAWN_RATE_PER_SIGNATURE)
						);
						const CLAMP_MAX = 100;
						desired = Math.min(desired, CLAMP_MAX);
						console.log(
							`[Flags] Spawning ${desired} flags for ${mapping.label}.`
						);
						if (document && document.hidden) {
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
						console.warn("[Flags] ❌ Spawn failed", e);
					}
				};
			} else {
				console.log(
					`%c[Flags] ⏳ window.showJumpCount not found. Polling...`,
					"color: orange;"
				);
				const pollId = setInterval(() => {
					if (typeof window.showJumpCount === "function") {
						clearInterval(pollId);
						console.log(
							`%c[Flags] ✅ Found window.showJumpCount after polling.`,
							"color: green;"
						);
						installWrapper();
					}
				}, 250);
			}
		} catch (e) {
			console.warn("[Flags] ❌ installWrapper failed", e);
		}
	}

	window.spawnFlags = spawnFlags;
	window._petitionFlags = {
		spawnFlags,
		applyToggleToExistingFlags,
		debug() {
			const overlay = document.getElementById("flag-overlay");
			if (!overlay) return { overlay: 0 };
			const total = overlay.querySelectorAll(".falling-flag").length;
			const neutral = overlay.querySelectorAll(".balloon-flag.neutral").length;
			return { overlay: total, neutral };
		},
	};

	document.addEventListener("DOMContentLoaded", () => {
		ensureFlagOverlay();
		readToggles();
		installWrapper();
		// Initialize block states to reflect current preferences
		try {
			const flagBlock = document.getElementById("flag-toggle-block");
			const flagCheckbox = document.getElementById("flag-toggle");
			if (flagBlock && flagCheckbox) {
				flagBlock.setAttribute(
					"aria-pressed",
					flagCheckbox.checked ? "true" : "false"
				);
				const s = document.getElementById("flag-toggle-state");
				if (s) s.textContent = flagCheckbox.checked ? "On" : "Off";
				flagBlock.addEventListener("click", () => {
					flagCheckbox.checked = !flagCheckbox.checked;
					flagCheckbox.dispatchEvent(new Event("change", { bubbles: true }));
				});
			}
			const labelBlock = document.getElementById("constituency-labels-block");
			const labelCheckbox = document.getElementById(
				"constituency-labels-toggle"
			);
			if (labelBlock && labelCheckbox) {
				labelBlock.setAttribute(
					"aria-pressed",
					labelCheckbox.checked ? "true" : "false"
				);
				const s2 = document.getElementById("constituency-labels-state");
				if (s2) s2.textContent = labelCheckbox.checked ? "On" : "Off";
				labelBlock.addEventListener("click", () => {
					labelCheckbox.checked = !labelCheckbox.checked;
					labelCheckbox.dispatchEvent(new Event("change", { bubbles: true }));
				});
			}
			updateDependentVisibility();
		} catch (e) {
			console.warn("[Flags] Failed to init settings-block toggles", e);
		}
	});

	document.addEventListener("DOMContentLoaded", () => {
		const resetBtn = document.getElementById("reset-graph-btn");
		if (resetBtn) {
			resetBtn.addEventListener("click", () => {
				try {
					if (window.sigHistory && Array.isArray(window.sigHistory)) {
						window.sigHistory.length = 0;
					}
					const chart = document.querySelector(".history-chart");
					if (chart) chart.innerHTML = "";
					const totalEl = document.querySelector(".totalSigs");
					if (totalEl) totalEl.textContent = "";
					const jumpEl = document.querySelector(".jump");
					if (jumpEl) jumpEl.textContent = "Reset";
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
		const chartModeSelect = document.getElementById("chart-mode");
		if (chartModeSelect) {
			try {
				const saved = localStorage.getItem("chartMode");
				if (saved) chartModeSelect.value = saved;
			} catch (e) {}
			chartModeSelect.addEventListener("change", (e) => {
				try {
					localStorage.setItem("chartMode", e.target.value);
				} catch (err) {}
				if (typeof window.updateHistoryChart === "function") {
					try {
						window.updateHistoryChart();
					} catch (e) {}
				}
			});
		}
	});
})();
