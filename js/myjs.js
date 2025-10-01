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
		this.maxHistoryEntries = 50; // Keep last 50 entries (about 8 minutes of history)
		this.numberOfCountries = 0;
		this.lastUpdate = null;
		this.title = "";
		this.updateInterval = 10000; // 10 seconds

		this.initialize();
	}

	initialize() {
		console.log("Petition Tracker initialized");
		this.loadSignatureHistory();
		this.setupLinks();
		this.initializeTable();
		this.updateHistoryChart(); // Show chart with existing history
		this.fetchData();
		this.startAutoUpdate();
	}

	setupLinks() {
		const baseUrl = `https://petition.parliament.uk/petitions/${this.petitionId}`;

		document.querySelector(".plink").setAttribute("href", baseUrl);
		document.querySelector(".json").setAttribute("href", `${baseUrl}.json`);
		document
			.querySelector(".sign")
			.setAttribute("href", `${baseUrl}/signatures/new`);
	}

	loadSignatureHistory() {
		try {
			const stored = localStorage.getItem("petitionSignatureHistory");
			if (stored) {
				this.signatureHistoryData = JSON.parse(stored);
				// Filter out entries older than 24 hours
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
		this.signatureHistoryData.push({
			signatures: signatures,
			timestamp: timestamp,
		});

		// Keep only the most recent entries
		if (this.signatureHistoryData.length > this.maxHistoryEntries) {
			this.signatureHistoryData = this.signatureHistoryData.slice(
				-this.maxHistoryEntries
			);
		}

		this.saveSignatureHistory();
		this.updateHistoryChart();
	}

	updateHistoryChart() {
		const chartContainer = document.querySelector(".history-chart");
		if (!chartContainer || this.signatureHistoryData.length < 2) return;

		// Calculate jumps between consecutive data points
		const jumps = [];
		for (let i = 1; i < this.signatureHistoryData.length; i++) {
			const jump =
				this.signatureHistoryData[i].signatures -
				this.signatureHistoryData[i - 1].signatures;
			jumps.push({
				jump: Math.max(0, jump), // Only show positive jumps (negative would be errors)
				timestamp: this.signatureHistoryData[i].timestamp,
			});
		}

		if (jumps.length === 0) return;

		// Show last 360 jumps (1 hour at 10-second intervals)
		const displayData = jumps.slice(-360);
		const maxJump = Math.min(200, Math.max(...displayData.map((d) => d.jump))); // Cap at 200 for Y-axis

		// Create SVG line graph
		const width = 600;
		const height = 120;
		const padding = 20;

		let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;

		// Add background grid
		svg += `<rect width="${width}" height="${height}" fill="#f8f9fa" rx="4"/>`;

		// Add Y-axis labels (0, 50, 100, 150, 200)
		const yLabels = [0, 50, 100, 150, 200];
		yLabels.forEach((label) => {
			const y = height - padding - (label / 200) * (height - padding * 2);
			svg += `<text x="5" y="${
				y + 3
			}" font-size="9" fill="#666">${label}</text>`;
			svg += `<line x1="25" y1="${y}" x2="${
				width - padding
			}" y2="${y}" stroke="#e9ecef" stroke-width="0.5"/>`;
		});

		// Draw the jump line
		if (displayData.length > 1) {
			let path = "M";
			displayData.forEach((point, index) => {
				const x =
					padding + (index / (displayData.length - 1)) * (width - padding * 2);
				const y =
					height -
					padding -
					(Math.min(point.jump, 200) / 200) * (height - padding * 2);
				path += `${index === 0 ? "" : "L"}${x},${y}`;
			});
			svg += `<path d="${path}" stroke="#4caf50" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

			// Add data points
			displayData.forEach((point, index) => {
				if (point.jump > 0) {
					// Only show points for actual jumps
					const x =
						padding +
						(index / (displayData.length - 1)) * (width - padding * 2);
					const y =
						height -
						padding -
						(Math.min(point.jump, 200) / 200) * (height - padding * 2);
					const radius = point.jump > 100 ? 3 : point.jump > 50 ? 2 : 1.5;
					svg += `<circle cx="${x}" cy="${y}" r="${radius}" fill="#4caf50" opacity="0.8"/>`;
				}
			});
		}

		// Add current jump value
		const latestJump = displayData[displayData.length - 1];
		if (latestJump) {
			const currentX = width - padding - 60;
			const currentY = padding + 15;
			svg += `<text x="${currentX}" y="${currentY}" font-size="11" fill="#333" font-weight="bold">Latest: +${latestJump.jump}</text>`;
		}

		// Add time labels
		svg += `<text x="${padding}" y="${
			height - 5
		}" font-size="9" fill="#666">1hr ago</text>`;
		svg += `<text x="${width - padding - 30}" y="${
			height - 5
		}" font-size="9" fill="#666">now</text>`;

		svg += "</svg>";

		chartContainer.innerHTML = svg;
	}

	async fetchData() {
		try {
			// Show updating indicator
			this.showUpdatingIndicator();

			const response = await fetch(
				`https://petition.parliament.uk/petitions/${this.petitionId}.json`
			);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const data = await response.json();
			this.processData(data);
		} catch (error) {
			console.error("Failed to fetch petition data:", error);
			this.showError("Failed to load petition data. Please try again later.");
		} finally {
			// Hide updating indicator and then update jump info
			this.hideUpdatingIndicator();
			this.updateSignatureJump();
		}
	}

	processData(data) {
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
		this.updateTable();

		// Log successful update
		console.log(
			`Data updated at ${new Date(this.lastUpdate).toLocaleString()}`
		);
	}

	calculateRegionData() {
		// Reset region data
		Object.keys(this.regions).forEach((key) => {
			this.regions[key].signatures = 0;
			this.regions[key].constituencies = 0;
		});

		// Calculate constituency data
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

		// Calculate UK and non-UK totals
		const ukData = this.findByAttribute(this.tableData, "code", "GB");
		this.regions.uk.signatures = ukData ? ukData.signature_count : 0;

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

		// Update regional signature histories
		this.updateRegionalHistory("england", this.regions.england.signatures);
		this.updateRegionalHistory("scotland", this.regions.scotland.signatures);
		this.updateRegionalHistory("wales", this.regions.wales.signatures);
		this.updateRegionalHistory(
			"northernIreland",
			this.regions.northernIreland.signatures
		);
		this.updateRegionalHistory("nonUk", this.regions.nonUk.signatures);
		this.updateRegionalHistory("uk", this.regions.uk.signatures);
	}

	updateRegionalHistory(regionKey, currentValue) {
		const region = this.regions[regionKey];
		region.history.push(currentValue);
		if (region.history.length > 2) {
			region.history.shift();
		}

		// Check for jumps and show visual indicators
		if (region.history.length >= 2) {
			const jump = region.history[1] - region.history[0];
			const elementId = this.getRegionElementId(regionKey);

			// Diagnostic logging
			console.log(
				`[Region Update] Key: ${regionKey}, History: [${region.history.join(
					", "
				)}], Jump: ${jump}`
			);

			if (jump > 0) {
				// Directly call the global function that flags.js will wrap
				if (elementId && window.showJumpCount) {
					window.showJumpCount(elementId, jump);
				}
				this.updateJumpElement(regionKey, jump);
			} else {
				// Ensure the jump element is cleared if there's no jump
				const jumpElement = document.getElementById(elementId);
				if (jumpElement && jumpElement.innerHTML !== "") {
					// You might want to fade it out instead of clearing it abruptly
					// For now, we just clear it.
					// jumpElement.innerHTML = "";
				}
			}
		}
	}

	getRegionElementId(regionKey) {
		const regionMappings = {
			england: "totalJumpEng",
			scotland: "totalJumpSco",
			wales: "totalJumpWal",
			northernIreland: "totalJumpIre",
			uk: "totalJumpUk",
			nonUk: "totalJumpNonUk",
		};
		return regionMappings[regionKey];
	}

	updateJumpElement(regionKey, jumpSize) {
		const elementId = this.getRegionElementId(regionKey);
		const jumpElement = document.getElementById(elementId);
		if (jumpElement) {
			jumpElement.innerHTML = `+${jumpSize}`;
			// Note: The class change for color is handled by the old logic if present
		}
	}

	showSignatureJump(regionKey, jumpSize) {
		// This function is now primarily for compatibility if anything else calls it.
		// The main logic is now in updateRegionalHistory to ensure jumps are processed.
		const elementId = this.getRegionElementId(regionKey);
		if (elementId) {
			this.updateJumpElement(regionKey, jumpSize);
			if (window.showJumpCount) {
				window.showJumpCount(elementId, jumpSize);
			}
		}
	}

	animateCounter(targetValue) {
		if (this.counterAnimationId) {
			cancelAnimationFrame(this.counterAnimationId);
		}

		const counterElement = document.querySelector(".totalSigs");
		if (!counterElement) return;

		const startValue = this.currentDisplayedTotal;
		const duration = 500; // ms
		let startTime = null;

		const animation = (currentTime) => {
			if (startTime === null) startTime = currentTime;
			const elapsedTime = currentTime - startTime;
			const progress = Math.min(elapsedTime / duration, 1);
			const currentValue = Math.floor(
				startValue + (targetValue - startValue) * progress
			);

			counterElement.textContent = this.formatNumber(currentValue);

			if (progress < 1) {
				this.counterAnimationId = requestAnimationFrame(animation);
			} else {
				counterElement.textContent = this.formatNumber(targetValue);
				this.currentDisplayedTotal = targetValue;
			}
		};

		this.counterAnimationId = requestAnimationFrame(animation);
	}

	updateUI() {
		// Update title
		document.querySelector(".titleHeader").textContent = this.title;
		document.title = `${this.title} - Live Data`;

		// Update total signatures
		this.animateCounter(this.totalSignatures);

		// Update updated at time
		const updatedAtElement = document.querySelector(".updatedAt");
		if (updatedAtElement) {
			const d = new Date(this.lastUpdate);
			updatedAtElement.textContent = d.toLocaleString();
			updatedAtElement.setAttribute("datetime", d.toISOString());
		}

		// Update country count
		document.querySelector(".noOfCountries").textContent =
			this.numberOfCountries;

		// Update regional stats
		this.updateRegionStat(".ukOnly", this.regions.uk.signatures);
		this.updateRegionStat(".eng", this.regions.england.signatures);
		this.updateRegionStat(".sco", this.regions.scotland.signatures);
		this.updateRegionStat(".wal", this.regions.wales.signatures);
		this.updateRegionStat(".ire", this.regions.northernIreland.signatures);
		this.updateRegionStat(".nonUK", this.regions.nonUk.signatures);

		// Update percentages
		this.updateRegionPercentage(
			".ukOnlyPc",
			this.regions.uk.signatures,
			this.totalSignatures
		);
		this.updateRegionPercentage(
			".engPc",
			this.regions.england.signatures,
			this.regions.uk.signatures
		);
		this.updateRegionPercentage(
			".scoPc",
			this.regions.scotland.signatures,
			this.regions.uk.signatures
		);
		this.updateRegionPercentage(
			".walPc",
			this.regions.wales.signatures,
			this.regions.uk.signatures
		);
		this.updateRegionPercentage(
			".irePc",
			this.regions.northernIreland.signatures,
			this.regions.uk.signatures
		);
		this.updateRegionPercentage(
			".nonUkPc",
			this.regions.nonUk.signatures,
			this.totalSignatures
		);
	}

	updateRegionStat(selector, value) {
		const element = document.querySelector(selector);
		if (element) {
			element.textContent = this.formatNumber(value);
		}
	}

	updateRegionPercentage(selector, part, total) {
		const element = document.querySelector(selector);
		if (element) {
			const percentage = total > 0 ? ((part / total) * 100).toFixed(2) : 0;
			element.textContent = `${percentage}%`;
		}
	}

	updateSignatureJump() {
		const jumpElement = document.querySelector(".jump");
		if (jumpElement) {
			if (this.signatureHistory.length >= 2) {
				const jump = this.signatureHistory[1] - this.signatureHistory[0];
				if (jump > 0) {
					jumpElement.textContent = `+${jump}`;
					this.changeElementClassTemporarily("totalSigs", "green", 1000);
				} else if (jump < 0) {
					jumpElement.textContent = `${jump}`;
					this.changeElementClassTemporarily("totalSigs", "red", 1000);
				} else {
					jumpElement.textContent = "Updating...";
				}
			} else {
				jumpElement.textContent = "Updating...";
			}
		}
	}

	changeElementClassTemporarily(id, className, duration) {
		const element = document.getElementById(id);
		if (element) {
			element.classList.add(className);
			setTimeout(() => {
				element.classList.remove(className);
			}, duration);
		}
	}

	findByAttribute(array, attribute, value) {
		return array.find((item) => item[attribute] === value);
	}

	initializeTable() {
		this.table = new Tabulator("#example-table", {
			layout: "fitColumns",
			placeholder: "No Data Available",
			columns: [
				{ title: "Country", field: "name", width: 200 },
				{ title: "Signatures", field: "signature_count" },
			],
		});

		this.setupDownloadHandlers();
	}

	setupDownloadHandlers() {
		document
			.getElementById("download-csv")
			.addEventListener("click", () => this.table.download("csv", "data.csv"));
		document
			.getElementById("download-json")
			.addEventListener("click", () =>
				this.table.download("json", "data.json")
			);
		document
			.getElementById("download-xlsx")
			.addEventListener("click", () =>
				this.table.download("xlsx", "data.xlsx", { sheetName: "My Data" })
			);
		document.getElementById("download-pdf").addEventListener("click", () =>
			this.table.download("pdf", "data.pdf", {
				orientation: "portrait",
				title: "Petition Data",
			})
		);
	}

	updateTable() {
		if (this.table) {
			this.table.replaceData(this.tableData);
		}
	}

	showUpdatingIndicator() {
		const jumpElement = document.querySelector(".jump");
		if (jumpElement) {
			jumpElement.textContent = "Updating...";
		}
	}

	hideUpdatingIndicator() {
		// The jump text will be updated by updateSignatureJump after data processing
	}

	showError(message) {
		const jumpElement = document.querySelector(".jump");
		if (jumpElement) {
			jumpElement.textContent = message;
			jumpElement.style.color = "red";
		}
	}

	formatNumber(num) {
		return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
	}

	startAutoUpdate() {
		setInterval(() => this.fetchData(), this.updateInterval);
	}
}

// Set the name of the hidden property and the change event for visibility
var hidden, visibilityChange;
if (typeof document.hidden !== "undefined") {
	// Opera 12.10 and Firefox 18 and later support
	hidden = "hidden";
	visibilityChange = "visibilitychange";
} else if (typeof document.msHidden !== "undefined") {
	hidden = "msHidden";
	visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
	hidden = "webkitHidden";
	visibilityChange = "webkitvisibilitychange";
}

var lastVisibleTotal = 0;
var lastVisibleTime = 0;
var pollingInterval;

function handleVisibilityChange() {
	if (document[hidden]) {
		// Tab is hidden
		if (pollingInterval) {
			clearInterval(pollingInterval);
			pollingInterval = null;
		}
		lastVisibleTotal = totalSigs; // Assuming totalSigs is the global variable for signature count
		lastVisibleTime = Date.now();
		console.log("Tab hidden, polling stopped.");
	} else {
		// Tab is visible
		console.log("Tab visible, resuming polling and interpolating data.");
		if (lastVisibleTime > 0 && lastVisibleTotal > 0) {
			interpolateMissingData();
		} else {
			// If we don't have a previous state, just start fresh
			update();
			startPolling();
		}
	}
}

// Listen for visibility change
document.addEventListener(visibilityChange, handleVisibilityChange, false);

function interpolateMissingData() {
	$.getJSON(url, function (data) {
		var newTotal = data.data.attributes.signature_count;
		var timeDiff = Date.now() - lastVisibleTime;
		var sigsDiff = newTotal - lastVisibleTotal;
		var intervalsMissed = Math.round(timeDiff / 10000);

		if (intervalsMissed > 1 && sigsDiff > 0) {
			var avgIncrease = sigsDiff / intervalsMissed;
			console.log(
				`Interpolating ${sigsDiff} signatures over ${intervalsMissed} intervals.`
			);

			// Back-fill the graph data
			// This part is tricky and depends on how the graph is rendered.
			// Assuming 'signatureHistoryData' is the array for the chart.
			for (var i = 1; i < intervalsMissed; i++) {
				var interpolatedSigs = Math.round(lastVisibleTotal + avgIncrease * i);
				var interpolatedTime = lastVisibleTime + 10000 * i;
				// This function needs to exist or be adapted from the new code.
				// It adds data to the chart.
				addSignatureHistoryEntry(interpolatedSigs, interpolatedTime);
			}
		}

		// Process the final, real data
		processData(data);
		startPolling(); // Restart regular polling

		// Reset for next time
		lastVisibleTime = 0;
		lastVisibleTotal = 0;
	});
}

function startPolling() {
	if (!pollingInterval) {
		pollingInterval = setInterval(update, 10000);
	}
}

// Initial start
$(document).ready(function () {
	update(); // Initial fetch
	startPolling();
});

document.addEventListener("DOMContentLoaded", () => {
	const tracker = new PetitionTracker();

	// Expose a limited API to the window object for debugging and compatibility
	window.petitionTracker = tracker;

	// Compatibility wrapper for the older updateHistoryChart function
	window.updateHistoryChart = () => {
		tracker.updateHistoryChart();
	};

	// Compatibility for resetting graph data
	window.resetGraphData = () => {
		try {
			// Clear tracker's history
			tracker.signatureHistoryData = [];
			tracker.saveSignatureHistory();
			// Clear chart
			const chartContainer = document.querySelector(".history-chart");
			if (chartContainer) chartContainer.innerHTML = "";
			// Reset counters
			const totalEl = document.querySelector(".totalSigs");
			if (totalEl) totalEl.textContent = "0";
			const jumpEl = document.querySelector(".jump");
			if (jumpEl) jumpEl.textContent = "Reset";
			console.log("Graph data has been reset.");
		} catch (e) {
			console.warn("resetGraphData failed", e);
		}
	};

	// This is the critical part for flags.js to hook into.
	// The old app had a global showJumpCount, so we create one that maps
	// the old element IDs to the new tracker's region keys.
	window.showJumpCount = (id, jumpSize) => {
		const regionMap = {
			totalJumpEng: "england",
			totalJumpSco: "scotland",
			totalJumpWal: "wales",
			totalJumpIre: "northernIreland",
			totalJumpUk: "uk",
			totalJumpNonUk: "nonUk",
		};
		const regionKey = regionMap[id];
		if (regionKey) {
			// The tracker's showSignatureJump is what updates the UI text like "+5"
			// We don't need to call it again, as it's what calls us.
			// This function now primarily serves as a hook for js/flags.js
			console.log(
				`showJumpCount hook called for ID: ${id} (Region: ${regionKey}), Jump: ${jumpSize}`
			);
		}
	};
});
