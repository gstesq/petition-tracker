(function () {
	const picker = document.getElementById("petition-select");
	if (!picker) return;

	// State filter UI
	const stateInputs = document.querySelectorAll('input[name="petition-state"]');

	const getCurrentPetitionId = () => {
		const qs = new URLSearchParams(window.location.search);
		return qs.get("petition") || qs.get("id") || null;
	};

	const getCurrentState = () => {
		const qs = new URLSearchParams(window.location.search);
		const v = (qs.get("state") || "both").toLowerCase();
		return v === "open" || v === "closed" ? v : "both";
	};

	const setStateInUrl = (state) => {
		const qs = new URLSearchParams(window.location.search);
		if (state && state !== "both") qs.set("state", state);
		else qs.delete("state"); // keep URL tidy for default
		const newUrl = `${window.location.pathname}?${qs.toString()}${
			window.location.hash
		}`;
		try {
			window.history.replaceState({}, "", newUrl);
		} catch (_) {
			// no-op if blocked
		}
	};

	const toPetitionMeta = (p) => {
		try {
			const id = String(p.id);
			const a = p.attributes || p;
			const action = a.action || a.title || `Petition ${id}`;
			const signatureCount = a.signature_count ?? a.signatures ?? 0;
			const state = a.state || "unknown";
			return { id, action, signatureCount, state };
		} catch (_) {
			return null;
		}
	};

	const setLoading = (isLoading) => {
		if (isLoading) {
			picker.innerHTML = '<option value="" disabled selected>Loading…</option>';
		}
	};

	// Go button to explicitly load selected petition
	const goBtn = document.getElementById("petition-go-btn");

	const getUrlPetitionId = () => {
		const qs = new URLSearchParams(window.location.search);
		return qs.get("petition") || qs.get("id") || null;
	};

	const updateGoButtonState = () => {
		if (!goBtn) return;
		const selectedId = picker.value || null;
		const currentId = getUrlPetitionId();
		const enable = !!selectedId && selectedId !== currentId;
		goBtn.disabled = !enable;
	};

	const populate = (items) => {
		items = items.filter(Boolean);
		items.sort((a, b) => (b.signatureCount || 0) - (a.signatureCount || 0));
		picker.innerHTML = "";
		const cur = getCurrentPetitionId();
		let hasCur = false;

		for (const p of items) {
			const opt = document.createElement("option");
			opt.value = p.id;
			opt.dataset.state = p.state || "";
			const sigs = Number(p.signatureCount || 0).toLocaleString("en-GB");
			opt.textContent = `${p.action} — ${sigs} (${p.state})`;
			if (cur && cur === p.id) {
				opt.selected = true;
				hasCur = true;
			}
			picker.appendChild(opt);
		}

		// If current petition isn't in this filtered list, show a placeholder prompting selection
		if (!hasCur) {
			const ph = document.createElement("option");
			ph.value = "";
			ph.disabled = true;
			ph.selected = true;
			ph.textContent = "Select a petition…";
			picker.insertBefore(ph, picker.firstChild);
		}

		updateGoButtonState();
	};

	picker.addEventListener("change", () => {
		updateGoButtonState();
	});

	if (goBtn) {
		goBtn.addEventListener("click", () => {
			const id = picker.value;
			if (!id) return;
			const qs = new URLSearchParams(window.location.search);
			qs.set("petition", id);
			window.location.search = qs.toString();
		});
	}

	const fetchAndPopulate = (state) => {
		const apiState = state === "both" ? "all" : state;
		const url = `https://petition.parliament.uk/petitions.json?page=1&state=${encodeURIComponent(
			apiState
		)}`;
		setLoading(true);
		fetch(url)
			.then((r) => r.json())
			.then((json) => {
				const raw = Array.isArray(json?.data)
					? json.data
					: Array.isArray(json?.petitions)
					? json.petitions
					: [];
				const items = raw.map(toPetitionMeta).filter(Boolean);
				if (items.length) populate(items);
				else picker.innerHTML = '<option value="">No petitions found</option>';
			})
			.catch((err) => {
				console.error("Failed to load petitions list:", err);
				picker.innerHTML = '<option value="">Failed to load</option>';
			});
	};

	// Initialize state controls from URL
	const initialState = getCurrentState();
	let found = false;
	stateInputs.forEach((input) => {
		if (input.value === initialState) {
			input.checked = true;
			found = true;
		}
		input.addEventListener("change", (e) => {
			if (!e.target.checked) return;
			const newState = e.target.value;
			setStateInUrl(newState);
			fetchAndPopulate(newState);
		});
	});
	if (!found) {
		const both = document.getElementById("filter-both");
		if (both) both.checked = true;
	}

	// Initial fetch; populate() will configure placeholder and Go button
	fetchAndPopulate(initialState);
})();
