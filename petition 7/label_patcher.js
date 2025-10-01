// CONSTITUENCY LABEL PATCHER
// Only adds missing labels to flags created while toggle was OFF
// Does NOT interfere with main app's toggle system

// Patch a single flag wrapper if it looks like a constituency missing its label
function patchFlagIfMissing(flagWrapper) {
	const messageEl = flagWrapper.querySelector(".balloon-message");
	const flagImg = flagWrapper.querySelector(".balloon-flag");
	if (!messageEl || !flagImg) return false;

	// If there's already text, nothing to do
	if (messageEl.textContent && messageEl.textContent.trim().length > 0)
		return false;

	const flagUrl = messageEl.getAttribute("data-flag-url");
	const bgImage = flagImg.style.backgroundImage || "";
	let constituencyName = "";

	if (flagUrl && flagUrl.includes("/gb-") && !flagUrl.includes("/gb.svg")) {
		const match = flagUrl.match(/\/gb-(.+)\.svg$/);
		if (match)
			constituencyName = match[1]
				.replace(/-/g, " ")
				.replace(/\b\w/g, (l) => l.toUpperCase());
	}

	if (
		!constituencyName &&
		bgImage.includes("/gb-") &&
		!bgImage.includes("/gb.svg")
	) {
		const match = bgImage.match(/\/gb-(.+)\.svg/);
		if (match)
			constituencyName = match[1]
				.replace(/-/g, " ")
				.replace(/\b\w/g, (l) => l.toUpperCase());
	}

	if (constituencyName) {
		messageEl.textContent = constituencyName;
		messageEl.setAttribute("data-constituency-flag", "true");
		return true;
	}
	return false;
}

// One-off scan to fix any existing flags
function startupScan() {
	const overlay = document.getElementById("flag-overlay");
	if (!overlay) {
		setTimeout(startupScan, 200);
		return;
	}
	const wrappers = overlay.querySelectorAll(".falling-flag");
	let patched = 0;
	wrappers.forEach((w) => {
		if (patchFlagIfMissing(w)) patched++;
	});
	if (patched)
		console.log(`🔧 STARTUP: patched ${patched} missing constituency labels`);
}

// Observe future additions and patch new flags as they arrive
function observeNewFlags() {
	const overlay = document.getElementById("flag-overlay");
	if (!overlay) {
		setTimeout(observeNewFlags, 200);
		return;
	}

	const mo = new MutationObserver((mutations) => {
		for (const m of mutations) {
			for (const node of m.addedNodes) {
				if (node.nodeType !== Node.ELEMENT_NODE) continue;
				if (node.classList && node.classList.contains("falling-flag")) {
					// small timeout to let main app set attributes
					setTimeout(() => patchFlagIfMissing(node), 10);
				} else {
					// also check descendants
					const wrappers =
						node.querySelectorAll && node.querySelectorAll(".falling-flag");
					if (wrappers && wrappers.length) {
						wrappers.forEach((w) =>
							setTimeout(() => patchFlagIfMissing(w), 10)
						);
					}
				}
			}
		}
	});
	mo.observe(overlay, { childList: true, subtree: true });
	console.log("🔍 Constituency label observer active");
}

startupScan();
observeNewFlags();

console.log("🔧 Constituency label patcher loaded (observer)");
