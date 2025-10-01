// Petition Tracker Application
// Modernized and refactored for better maintainability

class PetitionTracker {
	constructor(petitionId = 730194) {
		this.petitionId = petitionId;
		this.tableData = [];
		this.tableDataIndy = [];
		this.signatureHistory = [];
		this.regions = {
			england: { signatures: 0, constituencies: 0, history: [] },
			scotland: { signatures: 0, constituencies: 0, history: [] },
			wales: { signatures: 0, constituencies: 0, history: [] },
			northernIreland: { signatures: 0, constituencies: 0, history: [] },
			uk: { signatures: 0, history: [] },
			nonUk: { signatures: 0, history: [] },
		};
		this.totalSignatures = 0;
		this.currentDisplayedTotal = 0; // Track the currently displayed total for smooth animation
		this.counterAnimationId = null; // Track the current animation timeout
		this.signatureHistoryData = []; // Store historical signature data for visualization
		// We want up to 1 hour at 10s resolution => 360 points; keep slight buffer
		this.maxHistoryEntries = 400; // internal raw samples (actual fetches + interpolation) before slotting
		this.historyStartTime = null; // timestamp of first recorded signature for slot alignment
		this.numberOfCountries = 0;
		this.lastUpdate = null;
		this.title = "";
		this.updateInterval = 10000; // 10 seconds
		this.initialRampPlanned = false; // track if first ramp custom duration is applied
		this.table = null;
		this.chartYMax = 100; // Initial Y-axis max for the history chart

		this.initialize();
	}

	initialize() {
		console.log("Petition Tracker initialized");
		this.loadSignatureHistory();
		this.setupLinks();
		this.setupResetButton();
		this.setupChartControls(); // Add this call
		this.setupResponsiveChart();
		this.initializeTable();
		this.updateHistoryChart(); // Show chart with existing history
		this.fetchData();
		this.startAutoUpdate();
	}

	setupResponsiveChart() {
		let resizeTimeout;
		window.addEventListener("resize", () => {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(() => this.updateHistoryChart(), 120);
		});
	}

	setupResetButton() {
		const resetBtn = document.getElementById("reset-graph-btn");
		if (resetBtn) {
			resetBtn.addEventListener("click", () => this.reset());
		}
	}

	reset() {
		console.log("Resetting petition tracker data...");

		// 1. Stop auto-updates
		if (this.updateIntervalId) {
			clearInterval(this.updateIntervalId);
			this.updateIntervalId = null;
		}

		// 2. Clear data arrays
		this.tableData = [];
		this.tableDataIndy = [];
		this.signatureHistory = [];
		this.signatureHistoryData = [];
		Object.keys(this.regions).forEach((key) => {
			this.regions[key].signatures = 0;
			this.regions[key].constituencies = 0;
			this.regions[key].history = [];
		});
		this.totalSignatures = 0;
		this.currentDisplayedTotal = 0;
		this.previousConstituencyData = [];
		this.previousCountryData = [];
		this.chartYMax = 20; // Reset Y-axis max to a lower default
		this.historyStartTime = null; // reset aligned history origin

		// 3. Clear local storage
		try {
			localStorage.removeItem("petitionSignatureHistory");
			localStorage.removeItem("chartMode");
		} catch (error) {
			console.warn("Failed to clear localStorage:", error);
		}

		// 4. Clear UI elements
		this.updateHistoryChart(); // This will clear the chart as data is empty
		if (this.table) {
			this.table.replaceData([]);
		}
		document
			.querySelectorAll(
				".totalSigs, .noOfCountries, .ukOnly, .ukOnlyPc, .englandOnly, .englandOnlyPc, .scotlandOnly, .scotlandOnlyPc, .walesOnly, .walesOnlyPc, .irelandOnly, .irelandOnlyPc, .nonukOnly, .nonukOnlyPc"
			)
			.forEach((el) => (el.textContent = "0"));
		const jumpEl = document.querySelector(".jump");
		if (jumpEl) jumpEl.textContent = "Reset";
		const timeElement = document.querySelector(".updatedAt");
		if (timeElement) timeElement.textContent = "just now";

		// 5. Re-initialize the tracker to fetch fresh data and restart updates
		console.log("Re-initializing tracker after reset.");
		this.startAutoUpdate();
		this.fetchData();
	}

	setupChartControls() {
		const chartModeSelect = document.getElementById("chart-mode");
		if (chartModeSelect) {
			// Restore previous value if any
			try {
				const saved = localStorage.getItem("chartMode");
				if (saved) chartModeSelect.value = saved;
			} catch (e) {
				console.warn("Failed to restore chart mode from localStorage", e);
			}

			chartModeSelect.addEventListener("change", (e) => {
				try {
					localStorage.setItem("chartMode", e.target.value);
				} catch (err) {
					console.warn("Failed to save chart mode to localStorage", err);
				}
				// Update the chart immediately on change
				this.updateHistoryChart();
			});
		}
	}

	setupLinks() {
		const baseUrl = `https://petition.parliament.uk/petitions/${this.petitionId}`;
		const plink = document.querySelector(".plink");
		if (plink) plink.setAttribute("href", baseUrl);

		const jsonLink = document.querySelector(".json");
		if (jsonLink) jsonLink.setAttribute("href", `${baseUrl}.json`);

		const signLink = document.querySelector(".sign");
		if (signLink) signLink.setAttribute("href", `${baseUrl}/signatures/new`);
	}

	loadSignatureHistory() {
		try {
			const stored = localStorage.getItem("petitionSignatureHistory");
			if (stored) {
				this.signatureHistoryData = JSON.parse(stored);
				const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
				this.signatureHistoryData = this.signatureHistoryData.filter(
					(entry) => entry.timestamp > oneDayAgo
				);
			}
		} catch (error) {
			console.warn(
				"Failed to load signature history from localStorage:",
				error
			);
			this.signatureHistoryData = [];
		}
	}

	saveSignatureHistory() {
		try {
			localStorage.setItem(
				"petitionSignatureHistory",
				JSON.stringify(this.signatureHistoryData)
			);
		} catch (error) {
			console.warn("Failed to save signature history to localStorage:", error);
		}
	}

	addSignatureHistoryEntry(signatures, timestamp) {
		const last =
			this.signatureHistoryData[this.signatureHistoryData.length - 1];
		const intervalMs = this.updateInterval || 10000;
		if (!this.historyStartTime) {
			this.historyStartTime = timestamp; // establish origin at first real data point
		}
		if (last) {
			const gap = timestamp - last.timestamp;
			if (gap > intervalMs * 1.2) {
				const buckets = Math.floor(gap / intervalMs);
				const delta = signatures - last.signatures;
				if (delta > 0 && buckets > 0) {
					// Distribute remaining delta as integers (no fractions) using floor + remainder
					const base = Math.floor(delta / buckets);
					let remainder = delta - base * buckets;
					let cumulative = last.signatures;
					for (let i = 1; i < buckets; i++) {
						let increment = base;
						if (remainder > 0) {
							increment += 1;
							remainder--;
						}
						cumulative += increment;
						this.signatureHistoryData.push({
							signatures: cumulative,
							timestamp: last.timestamp + intervalMs * i,
							_interpolated: true,
						});
					}
				}
			}
		}
		// Actual point
		this.signatureHistoryData.push({ signatures, timestamp });
		if (this.signatureHistoryData.length > this.maxHistoryEntries) {
			this.signatureHistoryData = this.signatureHistoryData.slice(
				-this.maxHistoryEntries
			);
		}

		this.saveSignatureHistory();
		this.updateHistoryChart();
	}

	// Build aligned 10s slot series up to 1 hour (360 slots max). Includes zero-change slots.
	buildAlignedSlots() {
		const INTERVAL = 10000; // 10s
		const MAX_DURATION = 3600000; // 1h in ms
		if (!this.historyStartTime && this.signatureHistoryData.length) {
			this.historyStartTime = this.signatureHistoryData[0].timestamp;
		}
		if (!this.historyStartTime) return [];
		const lastDataTimestamp = this.signatureHistoryData.length
			? this.signatureHistoryData[this.signatureHistoryData.length - 1]
					.timestamp
			: this.historyStartTime;
		let span = lastDataTimestamp - this.historyStartTime;
		if (span > MAX_DURATION) {
			this.historyStartTime = lastDataTimestamp - MAX_DURATION;
			span = MAX_DURATION;
		}
		let totalSlots = Math.floor(span / INTERVAL) + 1; // include slot for last data point
		if (totalSlots > 360) totalSlots = 360;
		const data = this.signatureHistoryData;
		let dataIdx = 0;
		let lastValue = data.length ? data[0].signatures : 0;
		const slots = [];
		for (let i = 0; i < totalSlots; i++) {
			const slotTs = this.historyStartTime + i * INTERVAL;
			while (dataIdx < data.length && data[dataIdx].timestamp <= slotTs + 2) {
				lastValue = data[dataIdx].signatures;
				dataIdx++;
			}
			slots.push({ index: i, timestamp: slotTs, signatures: lastValue });
		}
		return slots;
	}

	updateHistoryChart() {
		const chartModeSelect = document.getElementById("chart-mode");
		const mode = chartModeSelect ? chartModeSelect.value : "jumps";

		// Recalculate immediately after potential layout changes (e.g., resize)
		// Ensures we always render at the current container width.

		if (mode === "raw") {
			this.renderRawChart();
		} else {
			this.renderJumpsChart();
		}
	}

	renderRawChart() {
		const chartContainer = document.querySelector(".history-chart");
		if (!chartContainer) return;

		const displayData = this.buildAlignedSlots();
		if (displayData.length < 1) {
			chartContainer.innerHTML = "";
			return;
		}
		// Responsive width: use actual container width (capped for readability)
		let width = Math.floor(chartContainer.getBoundingClientRect().width);
		if (!width || width < 200) width = 200; // sensible minimum
		if (width > 620) width = 620; // cap similar to container max
		const height = 120;
		const padding = 20;

		const signatures = displayData.map((d) => d.signatures);
		const minSig = Math.min(...signatures);
		const maxSig = Math.max(...signatures);

		// Dynamic Y-axis for raw totals
		const yRange = maxSig - minSig;
		const yAxisMin = Math.floor(minSig / 100) * 100;
		const yAxisMax = Math.ceil(maxSig / 100) * 100;

		let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">`;
		svg += `<rect width="${width}" height="${height}" fill="#f8f9fa" rx="4"/>`;

		// Y-axis labels
		const yLabelCount = 3;
		for (let i = 0; i < yLabelCount; i++) {
			const labelValue = yAxisMin + (yRange / (yLabelCount - 1)) * i;
			const y =
				height -
				padding -
				((labelValue - yAxisMin) / (yAxisMax - yAxisMin)) *
					(height - padding * 2);
			svg += `<text x="5" y="${
				y + 3
			}" font-size="9" fill="#666">${this.formatNumber(
				Math.round(labelValue)
			)}</text>`;
			svg += `<line x1="50" y1="${y}" x2="${
				width - padding
			}" y2="${y}" stroke="#e9ecef" stroke-width="0.5"/>`;
		}

		// Path for signature growth
		let path = "M";
		displayData.forEach((point, index) => {
			if (displayData.length === 1) {
				// single point: both x extremes same
				const xSingle = padding;
				const ySingle =
					height -
					padding -
					((point.signatures - yAxisMin) / (yAxisMax - yAxisMin)) *
						(height - padding * 2);
				path += `${xSingle},${ySingle}`;
				return;
			}
			const x =
				padding + (index / (displayData.length - 1)) * (width - padding * 2);
			const y =
				height -
				padding -
				((point.signatures - yAxisMin) / (yAxisMax - yAxisMin)) *
					(height - padding * 2);
			path += `${index === 0 ? "" : "L"}${x},${y}`;
		});
		svg += `<path d="${path}" stroke="#007bff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

		// X-axis labels
		// X-axis labels: elapsed span and now
		const firstTimestamp = displayData[0].timestamp;
		const lastTimestamp = displayData[displayData.length - 1].timestamp;
		const spanSecs = Math.max(
			0,
			Math.round((lastTimestamp - firstTimestamp) / 1000)
		);
		let spanLabel;
		if (spanSecs < 60) spanLabel = `${spanSecs}s span`;
		else {
			const m = Math.floor(spanSecs / 60);
			const s = spanSecs % 60;
			spanLabel = s ? `${m}m ${s}s span` : `${m}m span`;
		}
		svg += `<text x="${padding}" y="${
			height - 5
		}" font-size="9" fill="#666">${spanLabel}</text>`;
		const rightLabelX = Math.max(padding + 40, width - padding - 30);
		svg += `<text x="${rightLabelX}" y="${
			height - 5
		}" font-size="9" fill="#666">now</text>`;
		svg += "</svg>";

		chartContainer.innerHTML = svg;
	}

	renderJumpsChart() {
		const chartContainer = document.querySelector(".history-chart");
		if (!chartContainer) {
			console.warn("History chart container not found.");
			return;
		}

		// If no data, clear the chart
		let slots = this.buildAlignedSlots();
		// Remove trailing slot if it corresponds to the currently in-progress (not yet completed) 10s interval
		if (slots.length > 1) {
			const INTERVAL = 10000;
			const nowTs = Date.now();
			const lastSlot = slots[slots.length - 1];
			// If we are still within the interval (less than INTERVAL since slot timestamp) and no newer real datapoint landed after slot creation
			if (nowTs - lastSlot.timestamp < INTERVAL) {
				// Keep it only if a real data sample matched that timestamp (i.e., actual signature point recorded exactly at slot boundary)
				const hasExactPoint = this.signatureHistoryData.some(
					(p) => p.timestamp === lastSlot.timestamp
				);
				if (!hasExactPoint) {
					slots = slots.slice(0, -1);
				}
			}
		}
		if (slots.length < 2) {
			chartContainer.innerHTML = "";
			return;
		}
		const jumps = [];
		for (let i = 1; i < slots.length; i++) {
			const rawDelta = slots[i].signatures - slots[i - 1].signatures;
			const jumpVal = Math.max(0, Math.round(rawDelta));
			jumps.push({ jump: jumpVal, timestamp: slots[i].timestamp });
		}

		// --- Dynamic Y-axis Logic ---
		const maxJump = Math.max(...jumps.map((j) => j.jump), 0);

		// Adjust Y-axis max. Allow very small scales (down to 5 then 1) for low activity.
		if (maxJump > this.chartYMax) {
			// Round up to a "nice" number (e.g., 5, 10, 20, 50, 100, 150)
			if (maxJump <= 5) {
				this.chartYMax = 5; // micro scale
			} else if (maxJump <= 10) {
				this.chartYMax = 10;
			} else if (maxJump < 100) {
				this.chartYMax = Math.ceil(maxJump / 10) * 10;
			} else {
				this.chartYMax = Math.ceil(maxJump / 50) * 50;
			}
		} else if (maxJump < this.chartYMax * 0.35) {
			// Scale down more responsively for low ranges
			let newMax;
			if (maxJump <= 1) {
				newMax = 1;
			} else if (maxJump <= 5) {
				newMax = 5;
			} else if (maxJump <= 10) {
				newMax = 10;
			} else if (maxJump < 100) {
				newMax = Math.ceil(maxJump / 10) * 10;
			} else {
				newMax = Math.ceil(maxJump / 50) * 50;
			}
			// Minimum now adaptive: if there was literally only 1 or 2 jumps, show fine granularity.
			const minFloor = maxJump <= 2 ? 5 : 10; // allow small scale visibility
			this.chartYMax = Math.max(minFloor, newMax);
		}
		const yAxisMax = this.chartYMax;
		// --- End Dynamic Y-axis Logic ---

		const displayData = jumps.slice(-360); // already at 10s spacing
		let width = Math.floor(chartContainer.getBoundingClientRect().width);
		if (!width || width < 200) width = 200;
		if (width > 620) width = 620;
		const height = 120;
		const padding = 20;

		let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">`;
		svg += `<rect width="${width}" height="${height}" fill="#f8f9fa" rx="4"/>`;

		// Generate dynamic Y-axis labels
		const yLabelCount = 5;
		const yLabels = Array.from(
			{ length: yLabelCount },
			(_, i) => (yAxisMax / (yLabelCount - 1)) * i
		);

		yLabels.forEach((label) => {
			const y = height - padding - (label / yAxisMax) * (height - padding * 2);
			svg += `<text x="5" y="${y + 3}" font-size="9" fill="#666">${Math.round(
				label
			)}</text>`;
			svg += `<line x1="25" y1="${y}" x2="${
				width - padding
			}" y2="${y}" stroke="#e9ecef" stroke-width="0.5"/>`;
		});

		if (displayData.length > 1) {
			let path = "M";
			displayData.forEach((point, index) => {
				const x =
					padding + (index / (displayData.length - 1)) * (width - padding * 2);
				const y =
					height -
					padding -
					(Math.min(point.jump, yAxisMax) / yAxisMax) * (height - padding * 2);
				path += `${index === 0 ? "" : "L"}${x},${y}`;
			});
			svg += `<path d="${path}" stroke="#4caf50" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

			const zeroY = height - padding - (0 / yAxisMax) * (height - padding * 2);
			// Plot every point, differentiate zero vs non-zero
			displayData.forEach((point, index) => {
				const x =
					padding + (index / (displayData.length - 1)) * (width - padding * 2);
				const y =
					height -
					padding -
					(Math.min(point.jump, yAxisMax) / yAxisMax) * (height - padding * 2);
				if (point.jump > 0) {
					const radius =
						point.jump > yAxisMax / 2 ? 3 : point.jump > yAxisMax / 4 ? 2 : 1.5;
					svg += `<circle cx="${x}" cy="${y}" r="${radius}" fill="#4caf50" opacity="0.85"/>`;
				} else {
					// zero jump: small hollow marker on zero line
					svg += `<circle cx="${x}" cy="${zeroY}" r="1.4" fill="#fff" stroke="#4caf50" stroke-width="1" opacity="0.55"/>`;
				}
			});
		}

		const latestJump = displayData[displayData.length - 1];
		if (latestJump) {
			const currentX = width - padding - 60;
			const currentY = padding + 15;
			const peakJump = Math.max(...displayData.map((p) => p.jump));
			svg += `<text x="${currentX}" y="${currentY}" font-size="11" fill="#333" font-weight="bold">Latest: +${latestJump.jump}</text>`;
			svg += `<text x="${currentX}" y="${
				currentY + 12
			}" font-size="10" fill="#555">Peak: +${peakJump}</text>`;
		}

		// --- Dual X-axis Labels (left elapsed span ago, right now) ---
		if (displayData.length > 0) {
			let agoLabel = "0s span";
			if (displayData.length > 1) {
				const spanMs =
					displayData[displayData.length - 1].timestamp -
					displayData[0].timestamp;
				const secs = Math.max(0, Math.round(spanMs / 1000));
				if (secs < 60) agoLabel = `${secs}s span`;
				else {
					const m = Math.floor(secs / 60);
					const s = secs % 60;
					agoLabel = s ? `${m}m ${s}s span` : `${m}m span`;
				}
			}
			// left label
			svg += `<text x="${padding}" y="${
				height - 5
			}" font-size="9" fill="#666">${agoLabel}</text>`;
			// right label (now)
			const rightLabelX = Math.max(padding + 40, width - padding - 30);
			svg += `<text x="${rightLabelX}" y="${
				height - 5
			}" font-size="9" fill="#666">now</text>`;
		}
		// --- End Dual X-axis Labels ---
		svg += "</svg>";

		chartContainer.innerHTML = svg;
	}

	async fetchData() {
		try {
			this.showUpdatingIndicator();
			const cacheBuster = `_=${new Date().getTime()}`;
			const response = await fetch(
				`https://petition.parliament.uk/petitions/${this.petitionId}.json?${cacheBuster}`
			);
			if (!response.ok) {
				throw new Error(
					`HTTP error! Status: ${response.status} ${response.statusText}`
				);
			}
			const data = await response.json();
			this.processData(data);
		} catch (error) {
			console.error("Failed to fetch petition data:", error);
			this.showError(`Data Error: ${error.message}. Please try again later.`);
		} finally {
			this.hideUpdatingIndicator();
		}
	}

	processData(data) {
		this.previousConstituencyData = this.tableDataIndy
			? JSON.parse(JSON.stringify(this.tableDataIndy))
			: [];
		this.previousCountryData = this.tableData
			? JSON.parse(JSON.stringify(this.tableData))
			: [];
		this.tableData = data.data.attributes.signatures_by_country;
		this.tableDataIndy = data.data.attributes.signatures_by_constituency;
		this.totalSignatures = data.data.attributes.signature_count;
		this.lastUpdate = data.data.attributes.updated_at;
		this.title = data.data.attributes.action;

		this.calculateRegionData();
		this.updateSignatureHistory();
		this.addSignatureHistoryEntry(
			this.totalSignatures,
			new Date(this.lastUpdate).getTime()
		);
		this.updateUI();
		// After first successful data fetch, mark initial ramp planning if not yet set
		if (!this.initialRampPlanned) {
			this.initialRampPlanned = true;
		}
		this.updateTable();

		console.log(
			`Data updated at ${new Date(this.lastUpdate).toLocaleString()}`
		);
	}

	calculateRegionData() {
		Object.keys(this.regions).forEach((key) => {
			this.regions[key].signatures = 0;
			this.regions[key].constituencies = 0;
		});

		if (this.tableDataIndy) {
			this.tableDataIndy.forEach((constituency) => {
				const code = constituency.ons_code.charAt(0);
				const count = constituency.signature_count;

				switch (code) {
					case "E":
						this.regions.england.signatures += count;
						this.regions.england.constituencies++;
						break;
					case "S":
						this.regions.scotland.signatures += count;
						this.regions.scotland.constituencies++;
						break;
					case "W":
						this.regions.wales.signatures += count;
						this.regions.wales.constituencies++;
						break;
					case "N":
						this.regions.northernIreland.signatures += count;
						this.regions.northernIreland.constituencies++;
						break;
				}
			});
		}

		const ukData = this.findByAttribute(this.tableData, "code", "GB");
		// this.regions.uk.signatures = ukData ? ukData.signature_count : 0; // This is the old, incorrect way
		this.regions.uk.signatures =
			this.regions.england.signatures +
			this.regions.scotland.signatures +
			this.regions.wales.signatures +
			this.regions.northernIreland.signatures;
		this.regions.uk.constituencies =
			this.regions.england.constituencies +
			this.regions.scotland.constituencies +
			this.regions.wales.constituencies +
			this.regions.northernIreland.constituencies;

		const totalGlobal = this.tableData.reduce(
			(sum, country) => sum + country.signature_count,
			0
		);
		this.regions.nonUk.signatures = totalGlobal - this.regions.uk.signatures;
		this.numberOfCountries = this.tableData.length;
	}

	updateSignatureHistory() {
		this.signatureHistory.push(this.totalSignatures);
		if (this.signatureHistory.length > 2) {
			this.signatureHistory.shift();
		}

		this.updateRegionalHistory("england", this.regions.england.signatures);
		this.updateRegionalHistory("scotland", this.regions.scotland.signatures);
		this.updateRegionalHistory("wales", this.regions.wales.signatures);
		this.updateRegionalHistory(
			"northernIreland",
			this.regions.northernIreland.signatures
		);
		this.updateRegionalHistory("uk", this.regions.uk.signatures);
		this.updateRegionalHistory("nonUk", this.regions.nonUk.signatures);
	}

	updateRegionalHistory(regionKey, currentValue) {
		const region = this.regions[regionKey];
		const previousValue =
			region.history.length > 0
				? region.history[region.history.length - 1]
				: currentValue;

		region.history.push(currentValue);
		if (region.history.length > 2) {
			region.history.shift();
		}

		const jump = currentValue - previousValue;

		if (jump > 0) {
			this.updateJumpElement(regionKey, jump);

			// UK-wide jumps are represented by constituency-specific flags,
			// so we don't need to spawn a generic "UK" flag here.
			if (regionKey === "uk") {
				return;
			}

			if (regionKey === "nonUk") {
				const countryJumps = this.getCountryJumps();
				countryJumps.forEach((country) => {
					if (typeof window.spawnFlags === "function") {
						const flagUrl = `https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.3.0/flags/4x3/${country.code.toLowerCase()}.svg`;
						window.spawnFlags(flagUrl, country.jump, country.name);
					}
				});
			} else {
				// Find the corresponding constituency jumps for UK regions
				const constituencyJumps = this.getConstituencyJumps(regionKey);
				if (constituencyJumps.length > 0) {
					const flagUrl = this.getRegionFlagUrl(regionKey);
					// Spawn one flag for each new constituency signature, up to a limit
					const spawnCount = Math.min(
						constituencyJumps.reduce((sum, c) => sum + c.jump, 0),
						20
					); // Limit to 20 flags per region per update
					const messages = constituencyJumps.map((c) => c.name);

					for (let i = 0; i < spawnCount; i++) {
						if (typeof window.spawnFlags === "function") {
							window.spawnFlags(flagUrl, 1, messages[i % messages.length]);
						}
					}
				}
				// No fallback else, as we don't want generic region flags
			}
		}
	}

	getCountryJumps() {
		if (!this.previousCountryData || !this.tableData) {
			return [];
		}
		return this.tableData
			.map((current) => {
				// Exclude the main UK entry
				if (current.code === "GB") {
					return { name: current.name, jump: 0, code: current.code };
				}
				const previous = this.previousCountryData.find(
					(p) => p.code === current.code
				);
				const jump =
					current.signature_count - (previous ? previous.signature_count : 0);
				return {
					name: current.name,
					jump: jump,
					code: current.code,
				};
			})
			.filter((c) => c.jump > 0);
	}

	getConstituencyJumps(regionKey) {
		if (!this.previousConstituencyData || !this.tableDataIndy) {
			return [];
		}

		const regionCode = {
			england: "E",
			scotland: "S",
			wales: "W",
			northernIreland: "N",
		}[regionKey];

		if (!regionCode) return [];

		return this.tableDataIndy
			.map((current) => {
				const previous = this.previousConstituencyData.find(
					(p) => p.ons_code === current.ons_code
				);
				const jump =
					current.signature_count - (previous ? previous.signature_count : 0);
				return {
					name: current.name,
					jump: jump,
					code: current.ons_code,
				};
			})
			.filter((c) => c.jump > 0 && c.code.startsWith(regionCode));
	}

	getRegionFlagUrl(regionKey) {
		const flagUrls = {
			england:
				"https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.3.0/flags/4x3/gb-eng.svg",
			scotland:
				"https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.3.0/flags/4x3/gb-sct.svg",
			wales:
				"https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.3.0/flags/4x3/gb-wls.svg",
			northernIreland:
				"https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.3.0/flags/4x3/gb-nir.svg",
			uk: "https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.3.0/flags/4x3/gb.svg",
			nonUk: "img/splash.jpg",
		};
		return flagUrls[regionKey] || "img/splash.jpg";
	}

	getRegionElementId(regionKey) {
		const regionMappings = {
			england: "totalJumpEngland",
			scotland: "totalJumpScotland",
			wales: "totalJumpWales",
			northernIreland: "totalJumpIreland",
			uk: "totalJumpUk",
			nonUk: "totalJumpNonUk",
		};
		return regionMappings[regionKey];
	}

	updateJumpElement(regionKey, jumpSize) {
		const elementId = this.getRegionElementId(regionKey);
		if (!elementId) return;
		const jumpElement = document.getElementById(elementId);
		if (jumpElement) {
			// Update text and make visible
			jumpElement.innerHTML = `+${jumpSize}`;
			jumpElement.style.opacity = 1;
			// Clear any previous fade timer so rapid successive jumps don't cause early fade
			if (jumpElement._fadeTimer) {
				clearTimeout(jumpElement._fadeTimer);
			}
			// Keep visible for almost the full polling window (leave a short gap before next cycle)
			const pollWindow =
				this && this.updateInterval ? this.updateInterval : 10000; // default 10s
			const gapBeforeNext = 700; // ms gap so new value change is noticeable
			const visibleDuration = Math.max(0, pollWindow - gapBeforeNext);
			jumpElement._fadeTimer = setTimeout(() => {
				jumpElement.style.opacity = 0;
			}, visibleDuration);
		}
	}

	showSignatureJump(regionKey, jumpSize) {
		const mapping = {
			england: { elementId: "totalJumpEngland", blinkClass: "blink-region" },
			scotland: { elementId: "totalJumpScotland", blinkClass: "blink-region" },
			wales: { elementId: "totalJumpWales", blinkClass: "blink-region" },
			northernIreland: {
				elementId: "totalJumpIreland",
				blinkClass: "blink-region",
			},
			uk: { elementId: "totalJumpUk", blinkClass: "blink-uk" },
			nonUk: { elementId: "totalJumpNonUk", blinkClass: "blink-non-uk" },
		}[regionKey];

		if (!mapping) return;

		this.updateJumpElement(regionKey, jumpSize);
		this.changeElementClassTemporarily(
			mapping.elementId,
			mapping.blinkClass,
			1500
		);
	}

	changeElementClassTemporarily(elementId, className, duration) {
		const element = document.getElementById(elementId);
		if (!element || !element.parentElement) return;

		const parentBox = element.parentElement;

		parentBox.classList.add(className);

		setTimeout(() => {
			parentBox.classList.remove(className);
		}, duration);
	}

	updateUI() {
		document.title = this.title;
		const titleHeader = document.querySelector(".titleHeader");
		if (titleHeader) titleHeader.textContent = this.title;

		this.updateTimestampDisplay();

		// Compute an animation duration that ends shortly (e.g., 600ms) before the next update
		let rampDuration = 5000; // fallback
		if (!this.initialRampPlanned) {
			// We haven't yet flagged post-first-fetch; assume first fetch just ran and next scheduled update is in updateInterval
			// Keep a buffer so final number settles before new jump animations (flags/spawns) land.
			const bufferBeforeNext = 600; // ms pause before next polling cycle
			const candidate = this.updateInterval - bufferBeforeNext;
			// Clamp to sensible bounds (min 1500ms, max updateInterval-200ms)
			rampDuration = Math.max(
				1500,
				Math.min(candidate, this.updateInterval - 200)
			);
		} else {
			// Subsequent UI updates: shorter ramp for responsiveness
			rampDuration = 3500;
		}
		this.animateCounter(".totalSigs", this.totalSignatures, {
			duration: rampDuration,
		});
		const noOfCountries = document.querySelector(".noOfCountries");
		if (noOfCountries) noOfCountries.textContent = this.numberOfCountries;

		this.updateRegionDisplay(
			".ukOnly",
			this.regions.uk.signatures,
			".ukOnlyPc",
			this.calculatePercentage(this.regions.uk.signatures)
		);
		this.updateRegionDisplay(
			".englandOnly",
			this.regions.england.signatures,
			".englandOnlyPc",
			this.calculatePercentage(this.regions.england.signatures)
		);
		this.updateRegionDisplay(
			".scotlandOnly",
			this.regions.scotland.signatures,
			".scotlandOnlyPc",
			this.calculatePercentage(this.regions.scotland.signatures)
		);
		this.updateRegionDisplay(
			".walesOnly",
			this.regions.wales.signatures,
			".walesOnlyPc",
			this.calculatePercentage(this.regions.wales.signatures)
		);
		this.updateRegionDisplay(
			".irelandOnly",
			this.regions.northernIreland.signatures,
			".irelandOnlyPc",
			this.calculatePercentage(this.regions.northernIreland.signatures)
		);
		this.updateRegionDisplay(
			".nonukOnly",
			this.regions.nonUk.signatures,
			".nonukOnlyPc",
			this.calculatePercentage(this.regions.nonUk.signatures)
		);

		this.updateSignatureJump();
	}

	updateTimestampDisplay() {
		const timeElement = document.querySelector(".updatedAt");
		if (!timeElement || !this.lastUpdate) return;

		try {
			const timestamp = new Date(this.lastUpdate);
			timeElement.setAttribute("datetime", timestamp.toISOString());

			const ukOptions = {
				timeZone: "Europe/London",
				year: "numeric",
				month: "short",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
				hour12: false,
			};
			const ukFormattedTime = timestamp.toLocaleString("en-GB", ukOptions);
			timeElement.textContent = ukFormattedTime;

			const now = new Date();
			const diffMs = now - timestamp;
			const diffMinutes = Math.floor(diffMs / (1000 * 60));

			let relativeText;
			if (diffMinutes < 1) {
				relativeText = "just now";
			} else if (diffMinutes < 60) {
				relativeText = `${diffMinutes} minute${
					diffMinutes !== 1 ? "s" : ""
				} ago`;
			} else {
				const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
				relativeText = `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
			}
			timeElement.setAttribute(
				"title",
				`Updated ${relativeText} - Exact time: ${timestamp.toLocaleString()}`
			);
		} catch (error) {
			console.warn("Failed to parse timestamp:", this.lastUpdate, error);
			if (timeElement) {
				timeElement.textContent = this.lastUpdate;
				timeElement.setAttribute("datetime", this.lastUpdate);
			}
		}
	}

	updateRegionDisplay(countSelector, count, percentSelector, percentage) {
		const countEl = document.querySelector(countSelector);
		if (countEl) countEl.textContent = this.formatNumber(count);

		const percentEl = document.querySelector(percentSelector);
		if (percentEl) percentEl.textContent = `(${percentage}%)`;
	}

	calculatePercentage(value) {
		if (!this.tableData || this.tableData.length === 0) return "0.00";
		const total = this.tableData.reduce(
			(sum, country) => sum + country.signature_count,
			0
		);
		return total > 0 ? ((value / total) * 100).toFixed(2) : "0.00";
	}

	updateSignatureJump() {
		const jumpElement = document.querySelector(".jump");
		if (!jumpElement) return;

		if (this.signatureHistory.length < 2) {
			jumpElement.textContent = "Updated successfully";
			jumpElement.style.color = "#4caf50";
			return;
		}

		const jump = this.signatureHistory[1] - this.signatureHistory[0];
		if (jump === 0) {
			jumpElement.textContent = "No new signatures in the past 10 seconds";
			jumpElement.style.color = "#666";
		} else {
			const jumpText = jump >= 0 ? `+${jump}` : jump.toString();
			const colorClass = jump >= 0 ? "green" : "red";
			jumpElement.innerHTML = `Jump: <strong class="${colorClass}">${jumpText}</strong> in the past 10 seconds`;
		}
	}

	animateCounter(selector, targetValue, opts = {}) {
		const element = document.querySelector(selector);
		if (!element) return;

		if (this.counterAnimationId) {
			clearTimeout(this.counterAnimationId);
			this.counterAnimationId = null;
		}

		const startValue = this.currentDisplayedTotal;
		const difference = targetValue - startValue;

		if (difference === 0) {
			element.textContent = this.formatNumber(targetValue);
			this.currentDisplayedTotal = targetValue;
			return;
		}

		// Use shorter 5s ramp for better initial UX; allow override via opts.duration
		const duration = typeof opts.duration === "number" ? opts.duration : 5000;
		const steps = 100;
		const increment = difference / steps;
		const stepDuration = duration / steps;
		let currentStep = 0;

		const animate = () => {
			currentStep++;
			const currentValue = Math.round(startValue + increment * currentStep);
			element.textContent = this.formatNumber(currentValue);
			this.currentDisplayedTotal = currentValue;

			if (currentStep < steps) {
				this.counterAnimationId = setTimeout(animate, stepDuration);
			} else {
				element.textContent = this.formatNumber(targetValue);
				this.currentDisplayedTotal = targetValue;
				this.counterAnimationId = null;
			}
		};
		animate();
	}

	initializeTable() {
		if (document.getElementById("example-table")) {
			this.table = new Tabulator("#example-table", {
				height: 450,
				resizableColumns: "header",
				selectable: false,
				layout: "fitColumns",
				data: this.tableData,
				columns: [
					{ title: "Country", field: "name", widthGrow: 3 },
					{
						title: "Count",
						field: "signature_count",
						formatter: "money",
						formatterParams: { precision: false },
						widthGrow: 2,
						sorter: "number",
					},
					{
						title: "%",
						width: 75,
						field: "signature_count",
						download: false,
						widthGrow: 1,
						formatter: (cell) => {
							const value = cell.getValue();
							if (!this.tableData || this.tableData.length === 0)
								return "0.00%";
							const total = this.tableData.reduce(
								(sum, country) => sum + country.signature_count,
								0
							);
							const percentage =
								total > 0 ? ((value / total) * 100).toFixed(2) : "0.00";
							return percentage < 0.01 ? "< 0.01%" : `${percentage}%`;
						},
						sorter: "number",
					},
				],
			});
			this.setupDownloadHandlers();
			this.table.setSort("signature_count", "desc");
		}
	}

	updateTable() {
		if (this.table) {
			this.table.replaceData(this.tableData);
		}
	}

	setupDownloadHandlers() {
		const setup = (id, format, options) => {
			const button = document.getElementById(id);
			if (button) {
				button.addEventListener("click", () => {
					if (!this.table) return;
					const fileName = `petition_data_by_country_${
						new Date().toISOString().split("T")[0]
					}.${format}`;
					this.table.download(format, fileName, options);
				});
			}
		};
		setup("download-csv", "csv");
		setup("download-json", "json");
		setup("download-xlsx", "xlsx", { sheetName: "Petition Data" });
		setup("download-pdf", "pdf", {
			orientation: "portrait",
			title: `Petition Data - ${new Date().toLocaleDateString()}`,
		});
	}

	startAutoUpdate() {
		// Clear any existing interval before starting a new one
		if (this.updateIntervalId) {
			clearInterval(this.updateIntervalId);
		}
		this.updateIntervalId = setInterval(
			() => this.fetchData(),
			this.updateInterval
		);
	}

	findByAttribute(array, attribute, value) {
		return array.find((item) => item[attribute] === value) || null;
	}

	formatNumber(number) {
		return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}

	showError(message) {
		console.error(message);
		const errorElement = document.querySelector(".jump");
		if (errorElement) {
			errorElement.innerHTML = `<strong style="color: red;">${message}</strong>`;
		}
		const banner = document.createElement("div");
		banner.className = "error-banner";
		banner.textContent = message;
		banner.style.cssText =
			"background-color: #ff5252; color: white; text-align: center; padding: 15px; font-size: 1.2em; position: fixed; top: 0; left: 0; width: 100%; z-index: 10000;";

		if (document.body.firstChild) {
			document.body.insertBefore(banner, document.body.firstChild);
		} else {
			document.body.appendChild(banner);
		}

		setTimeout(() => banner.remove(), 8000);
	}

	showUpdatingIndicator() {
		const jumpElement = document.querySelector(".jump");
		if (jumpElement) {
			jumpElement.textContent = "Updating...";
			jumpElement.style.color = "#ffa000";
		}
	}

	hideUpdatingIndicator() {
		this.updateSignatureJump();
	}
}

document.addEventListener("DOMContentLoaded", () => {
	const tracker = new PetitionTracker();
	window.petitionTracker = tracker;

	window.showJumpCount = function (id, jumpSize) {
		console.log(
			`%c[Wrapper] window.showJumpCount called with ID: ${id}, Jump: ${jumpSize}`,
			"color: blue; font-weight: bold;"
		);
		const map = {
			totalJumpEng: "england",
			totalJumpSco: "scotland",
			totalJumpWal: "wales",
			totalJumpIre: "northernIreland",
			totalJumpUk: "uk",
			totalJumpNonUk: "nonUk",
		};
		const regionKey = map[id];
		if (
			regionKey &&
			tracker &&
			typeof tracker.showSignatureJump === "function"
		) {
			tracker.showSignatureJump(regionKey, jumpSize);
		} else {
			console.warn(
				`[Wrapper] showJumpCount called with unknown ID or missing tracker: ${id}`
			);
		}
	};
});
