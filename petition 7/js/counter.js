/**
 * Modern Counter Animation Utility
 * Provides smooth number counting animations for petition signature displays
 */

class CounterAnimator {
	/**
	 * Transform a number display element for animation
	 * @param {HTMLElement} selector - The element containing the number to animate
	 * @param {number} speed - Animation speed in milliseconds
	 * @param {string} mode - Animation mode ('fixed_width' or 'flex')
	 */
	static transformNumber(selector, speed = 50, mode = "fixed_width") {
		if (!selector) return;

		selector.classList.add("counter");
		const numberString = selector.textContent.replace(/\s/g, "");
		const numberArray = numberString
			.split("")
			.filter((char) => !isNaN(parseInt(char, 10)) || char === ".");

		// Create digit spans
		const digitSpans = numberArray.map((digit, index) => {
			const span = document.createElement("span");
			span.className = "dig";
			span.dataset.dig = index + 1;
			span.textContent = digit;
			return span;
		});

		selector.innerHTML = "";
		digitSpans.forEach((span) => selector.appendChild(span));

		this.animateCounter(selector, speed, mode);
	}

	/**
	 * Animate the counter digits
	 * @param {HTMLElement} counter - The counter element
	 * @param {number} speed - Animation speed
	 * @param {string} mode - Animation mode
	 */
	static animateCounter(counter, speed, mode) {
		const digits = counter.querySelectorAll(".dig");
		let digitCount = 0;

		// Initialize digits based on mode
		digits.forEach((digit) => {
			if (mode === "fixed_width") {
				digit.style.opacity = "0";
			} else if (mode === "flex") {
				digit.style.display = "none";
			}
			digitCount++;
		});

		let currentDigitIndex = digitCount;

		const animateDigit = () => {
			const currentDigit = counter.querySelector(
				`.dig[data-dig="${currentDigitIndex}"]`
			);
			if (!currentDigit) return;

			const originalValue = currentDigit.textContent;
			currentDigit.textContent = "0";

			// Animate digit counting up
			let currentCount = 0;
			const targetValue = parseInt(originalValue, 10);

			const countUp = () => {
				currentDigit.textContent = currentCount.toString();
				currentCount++;

				if (currentCount <= targetValue) {
					setTimeout(countUp, speed / 10);
				} else {
					currentDigit.textContent = originalValue;
				}
			};

			// Show the digit based on mode
			if (mode === "fixed_width") {
				currentDigit.style.opacity = "1";
			} else if (mode === "flex") {
				currentDigit.style.display = "inline";
			}

			countUp();

			currentDigitIndex--;

			if (currentDigitIndex >= 1) {
				setTimeout(animateDigit, speed);
			}
		};

		animateDigit();
	}
}

// Legacy jQuery compatibility (if jQuery is still needed elsewhere)
if (typeof jQuery !== "undefined") {
	jQuery.fn.transform_number = function (speed, mode) {
		return this.each(function () {
			CounterAnimator.transformNumber(this, speed, mode);
		});
	};

	jQuery.fn.counter = function (speed, mode) {
		return this.each(function () {
			CounterAnimator.animateCounter(this, speed, mode);
		});
	};
}

// Export for modern module systems
if (typeof module !== "undefined" && module.exports) {
	module.exports = CounterAnimator;
}
