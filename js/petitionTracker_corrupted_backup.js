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
				const el = document.querySelector('.history-chart');
				if (!el) return;
				if (!this.jumpHistory || this.jumpHistory.length < 2) { el.innerHTML = ''; return; }
				const data = this.jumpHistory.slice(-360);
				const maxJump = Math.max(...data.map(d=>d.total),0);
				if (maxJump > this.chartYMax) {
					if (maxJump <= 5) this.chartYMax = 5;
					else if (maxJump <= 10) this.chartYMax = 10;
					else if (maxJump < 100) this.chartYMax = Math.ceil(maxJump/10)*10;
					else this.chartYMax = Math.ceil(maxJump/50)*50;
				} else if (maxJump < this.chartYMax * 0.35) {
					let newMax;
					if (maxJump <= 1) newMax = 1; else if (maxJump <=5) newMax=5; else if (maxJump<=10) newMax=10; else if (maxJump<100) newMax=Math.ceil(maxJump/10)*10; else newMax=Math.ceil(maxJump/50)*50;
					const minFloor = maxJump <=2 ? 5 : 10;
					this.chartYMax = Math.max(minFloor, newMax);
				}
				const yAxisMax = this.chartYMax || 1;
				let width = Math.floor(el.getBoundingClientRect().width); if (!width || width<200) width=200; if (width>620) width=620;
				const height = 120; const padding = 20;
				let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">`;
				svg += `<rect width="${width}" height="${height}" fill="#f8f9fa" rx="4"/>`;
				for (let i=0;i<5;i++){ const label=(yAxisMax/4)*i; const y=height - padding - (label / yAxisMax) * (height - padding * 2); svg += `<text x="5" y="${y+3}" font-size="9" fill="#666">${Math.round(label)}</text>`; svg += `<line x1="25" y1="${y}" x2="${width-padding}" y2="${y}" stroke="#e9ecef" stroke-width="0.5"/>`; }
				if (data.length>1){ let path='M'; data.forEach((p,i)=>{ const x=padding + (i/(data.length-1))*(width-padding*2); const y=height - padding - (Math.min(p.total,yAxisMax)/yAxisMax)*(height-padding*2); path += `${i===0?'':'L'}${x},${y}`; }); svg += `<path d="${path}" stroke="#4caf50" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`; const zeroY=height - padding - (0 / yAxisMax)*(height-padding*2); data.forEach((p,i)=>{ const x=padding + (i/(data.length-1))*(width-padding*2); if (p.total>0){ const y=height - padding - (Math.min(p.total,yAxisMax)/yAxisMax)*(height-padding*2); const r = p.total > yAxisMax/2 ? 3 : p.total > yAxisMax/4 ? 2 : 1.5; svg += `<circle cx="${x}" cy="${y}" r="${r}" fill="#4caf50" opacity="0.85"/>`; } else { svg += `<circle cx="${x}" cy="${zeroY}" r="1.4" fill="#fff" stroke="#4caf50" stroke-width="1" opacity="0.55"/>`; } }); }
				const latest = data[data.length-1]; if (latest){ const currentX = width - padding - 60; const currentY = padding + 15; const peak = Math.max(...data.map(d=>d.total),0); svg += `<text x="${currentX}" y="${currentY}" font-size="11" fill="#333" font-weight="bold">Latest: +${latest.total}</text>`; svg += `<text x="${currentX}" y="${currentY+12}" font-size="10" fill="#555">Peak: +${peak}</text>`; }
				if (data.length){ let agoLabel='0s span'; if (data.length>1){ const spanMs = data[data.length-1].timestamp - data[0].timestamp; const secs = Math.max(0, Math.round(spanMs/1000)); if (secs<60) agoLabel = `${secs}s span`; else { const m=Math.floor(secs/60); const s=secs%60; agoLabel = s?`${m}m ${s}s span`:`${m}m span`; } } svg += `<text x="${padding}" y="${height-5}" font-size="9" fill="#666">${agoLabel}</text>`; const rightLabelX = Math.max(padding+40, width - padding - 30); svg += `<text x="${rightLabelX}" y="${height-5}" font-size="9" fill="#666">now</text>`; }
				svg += '</svg>';
				el.innerHTML = svg;
			}
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
			renderJumpsChart() {
				const el = document.querySelector('.history-chart');
				if (!el) return;
				if (!this.jumpHistory || this.jumpHistory.length < 2) {
					el.innerHTML = '';
					return;
				}
				const data = this.jumpHistory.slice(-360);
				const maxJump = Math.max(...data.map(d => d.total), 0);
				if (maxJump > this.chartYMax) {
					if (maxJump <= 5) this.chartYMax = 5;
					else if (maxJump <= 10) this.chartYMax = 10;
					else if (maxJump < 100) this.chartYMax = Math.ceil(maxJump / 10) * 10;
					else this.chartYMax = Math.ceil(maxJump / 50) * 50;
				} else if (maxJump < this.chartYMax * 0.35) {
					let newMax;
					if (maxJump <= 1) newMax = 1;
					else if (maxJump <= 5) newMax = 5;
					else if (maxJump <= 10) newMax = 10;
					else if (maxJump < 100) newMax = Math.ceil(maxJump / 10) * 10;
					else newMax = Math.ceil(maxJump / 50) * 50;
					const minFloor = maxJump <= 2 ? 5 : 10;
					this.chartYMax = Math.max(minFloor, newMax);
				}
				const yAxisMax = this.chartYMax || 1;
				let width = Math.floor(el.getBoundingClientRect().width);
				if (!width || width < 200) width = 200;
				if (width > 620) width = 620;
				const height = 120;
				const padding = 20;
				let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">`;
				svg += `<rect width="${width}" height="${height}" fill="#f8f9fa" rx="4"/>`;
				const yLabelCount = 5;
				for (let i = 0; i < yLabelCount; i++) {
					const label = (yAxisMax / (yLabelCount - 1)) * i;
					const y = height - padding - (label / yAxisMax) * (height - padding * 2);
					svg += `<text x="5" y="${y + 3}" font-size="9" fill="#666">${Math.round(label)}</text>`;
					svg += `<line x1="25" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#e9ecef" stroke-width="0.5"/>`;
				}
				if (data.length > 1) {
					let path = 'M';
					data.forEach((p,i)=>{
						const x = padding + (i / (data.length - 1)) * (width - padding * 2);
						const y = height - padding - (Math.min(p.total, yAxisMax)/yAxisMax)*(height - padding*2);
						path += `${i===0?'':'L'}${x},${y}`;
					});
					svg += `<path d="${path}" stroke="#4caf50" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
					const zeroY = height - padding - (0 / yAxisMax) * (height - padding * 2);
					data.forEach((p,i)=>{
						const x = padding + (i / (data.length - 1)) * (width - padding * 2);
						if (p.total > 0) {
							const y = height - padding - (Math.min(p.total, yAxisMax)/yAxisMax)*(height - padding*2);
							const r = p.total > yAxisMax/2 ? 3 : p.total > yAxisMax/4 ? 2 : 1.5;
							svg += `<circle cx="${x}" cy="${y}" r="${r}" fill="#4caf50" opacity="0.85"/>`;
						} else {
							svg += `<circle cx="${x}" cy="${zeroY}" r="1.4" fill="#fff" stroke="#4caf50" stroke-width="1" opacity="0.55"/>`;
						}
					});
				}
				const latest = data[data.length - 1];
				if (latest) {
					const currentX = width - padding - 60;
					const currentY = padding + 15;
					const peak = Math.max(...data.map(d=>d.total),0);
					const latestLabel = `Latest: +${latest.total}`;
					const peakLabel = `Peak: +${peak}`;
					svg += `<text x="${currentX}" y="${currentY}" font-size="11" fill="#333" font-weight="bold">${latestLabel}</text>`;
					svg += `<text x="${currentX}" y="${currentY + 12}" font-size="10" fill="#555">${peakLabel}</text>`;
				}
				if (data.length > 0) {
					let agoLabel = '0s span';
					if (data.length > 1) {
						const spanMs = data[data.length-1].timestamp - data[0].timestamp;
						const secs = Math.max(0, Math.round(spanMs/1000));
						if (secs < 60) agoLabel = `${secs}s span`;
						else {
							const m = Math.floor(secs/60); const s = secs % 60;
							agoLabel = s ? `${m}m ${s}s span` : `${m}m span`;
						}
					}
					svg += `<text x="${padding}" y="${height - 5}" font-size="9" fill="#666">${agoLabel}</text>`;
					const rightLabelX = Math.max(padding + 40, width - padding - 30);
					svg += `<text x="${rightLabelX}" y="${height - 5}" font-size="9" fill="#666">now</text>`;
				}
				svg += '</svg>';
				el.innerHTML = svg;
			}
				total: globalDelta,
				uk: ukDelta,
				nonUk: nonUkDelta,
			});
			if (this.jumpHistory.length > 360) {
				this.jumpHistory.splice(0, this.jumpHistory.length - 360);
			}
		}
		// Do NOT spawn aggregate UK / Non-UK flags here (handled per region/country in updateRegionalHistory)
		this.updateUI();
		// Do not display aggregate UK / Non-UK jump bubbles here (keep per-region logic only)
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
			// Immediate per-fetch display/spawn only when not using slot synchronization
			this.updateJumpElement(regionKey, jump);
			if (regionKey !== "uk") {
				if (regionKey === "nonUk") {
					const countryJumps = this.getCountryJumps();
					countryJumps.forEach((country) => {
						if (typeof window.spawnFlags === "function") {
							const flagUrl = `https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.3.0/flags/4x3/${country.code.toLowerCase()}.svg`;
							window.spawnFlags(flagUrl, country.jump, country.name);
						}
					});
				} else {
					const constituencyJumps = this.getConstituencyJumps(regionKey);
					if (constituencyJumps.length > 0) {
						const flagUrl = this.getRegionFlagUrl(regionKey);
						const spawnTotal = constituencyJumps.reduce(
							(sum, c) => sum + c.jump,
							0
						);
						const messages = constituencyJumps.map((c) => c.name);
						for (let i = 0; i < spawnTotal; i++) {
							if (typeof window.spawnFlags === "function") {
								window.spawnFlags(flagUrl, 1, messages[i % messages.length]);
							}
						}
					}
				}
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

	// Record timestamped region snapshots each fetch cycle for slot alignment
	_recordRegionSnapshots(ts) {
		["england", "scotland", "wales", "northernIreland", "nonUk", "uk"].forEach(
			(rk) => {
				const arr = this.regionHistoryData[rk];
				arr.push({ timestamp: ts, signatures: this.regions[rk].signatures });
				if (arr.length > this.maxHistoryEntries) {
					arr.splice(0, arr.length - this.maxHistoryEntries);
				}
			}
		);
	}

	_buildAlignedRegionSlots(regionKey) {
		const INTERVAL = 10000;
		const MAX_DURATION = 3600000;
		if (!this.historyStartTime) return [];
		const series = this.regionHistoryData[regionKey];
		if (!series || !series.length) return [];
		const lastTs = series[series.length - 1].timestamp;
		let span = lastTs - this.historyStartTime;
		if (span > MAX_DURATION) span = MAX_DURATION;
		let totalSlots = Math.floor(span / INTERVAL) + 1;
		if (totalSlots > 360) totalSlots = 360;
		let idx = 0;
		let lastVal = series[0].signatures;
		const slots = [];
		for (let i = 0; i < totalSlots; i++) {
			const slotTs = this.historyStartTime + i * INTERVAL;
			while (idx < series.length && series[idx].timestamp <= slotTs + 2) {
				lastVal = series[idx].signatures;
				idx++;
			}
			slots.push({ timestamp: slotTs, signatures: lastVal });
		}
		return slots;
	}

	_applyComputedRegionJumps() {
		Object.entries(this._latestRegionJumps).forEach(([rk, jumpVal]) => {
			const elId = this.getRegionElementId(rk);
			if (!elId) return;
			const el = document.getElementById(elId);
			if (!el) return;
			if (jumpVal > 0) {
				el.innerHTML = `+${jumpVal}`;
				el.style.opacity = 1;
			} else {
				el.innerHTML = "";
				el.style.opacity = 0;
			}
		});
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
		if (!jumpElement) return;
		// No initial suppression: show any positive jump immediately
		if (jumpSize > 0) {
			jumpElement.innerHTML = `+${jumpSize}`;
			jumpElement.style.opacity = 1;
			if (jumpElement._fadeTimer) clearTimeout(jumpElement._fadeTimer);
			const pollWindow = this.updateInterval || 10000;
			const visibleDuration = Math.max(0, pollWindow - 700);
			jumpElement._fadeTimer = setTimeout(() => {
				jumpElement.style.opacity = 0;
			}, visibleDuration);
		} else {
			jumpElement.innerHTML = "";
			jumpElement.style.opacity = 0;
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

		// Ensure non-UK jump element starts empty (prevent pre-populated appearance)
		if (!this.initialRampPlanned) {
			const nonUkJumpEl = document.getElementById("totalJumpNonUk");
			if (nonUkJumpEl) {
				nonUkJumpEl.innerHTML = "";
				nonUkJumpEl.style.opacity = 0;
			}
		}

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

	calculatePercentage(regionTotal) {
		if (!this.totalSignatures || this.totalSignatures === 0) return "0.00%";
		const pct = (regionTotal / this.totalSignatures) * 100;
		if (pct > 0 && pct < 0.01) return "< 0.01%";
		return pct.toFixed(2) + "%";
	}

	updateRegionDisplay(valueSelector, value, pctSelector, pctText) {
		const valueEl = document.querySelector(valueSelector);
		if (valueEl) valueEl.textContent = this.formatNumber(value);
		if (pctSelector) {
			const pctEl = document.querySelector(pctSelector);
			if (pctEl) pctEl.textContent = pctText;
		}
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
			timeElement.textContent = this.lastUpdate;
			timeElement.setAttribute("datetime", this.lastUpdate);
		}
	}

	updateSignatureJump() {
		const jumpElement = document.querySelector(".jump");
		if (!jumpElement) return;
		let latestJump = this._latestComputedJump;
		// Fallback if somehow not set yet (first load): treat as 0 / waiting
		if (latestJump === undefined) {
			latestJump = 0;
		}
		if (latestJump === null) {
			jumpElement.textContent = "Waiting for data...";
			jumpElement.style.color = "#666";
			return;
		}
		const colorClass = latestJump > 0 ? "green" : "grey";
		jumpElement.innerHTML = `Jump: <strong class="${colorClass}">+${latestJump}</strong> in the past 10 seconds`;
		jumpElement.style.color = latestJump > 0 ? "#2e7d32" : "#555";
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
