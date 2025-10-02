Flag animation feature:
- Toggle switch added to index.html with id 'flag-toggle'
- Overlay container with id 'flag-overlay' added to body
- CSS classes '.flag-overlay' and '.falling-flag' added to css/style.css with @keyframes fall
-- JS methods now live in js/petitionTracker.js:
  - this.animationEnabled property (read from localStorage)
  - setupFlagAnimation() called from initialize()
  - spawnFlags(flagUrl, count, message) to create and animate balloon elements (flag + message) (caps to 100)
  - showSignatureJump() now calls spawnFlags for region jumps when enabled
Notes:
- Flags are chosen per-region using existing flag SVG URLs
- For large jumps, spawned flags capped at 100 to avoid DOM/CPU overload
- The overlay has pointer-events:none so it doesn't interfere with UI
- LocalStorage key: 'flagsAnimation' (string 'true'/'false')

To test:
1. Open http://localhost:8000
2. Toggle the "Falling flags" switch to ON
3. Wait for signature jumps; flags should fall for the corresponding region

If you want different cap or sizes, edit spawnFlags() in js/flags.js
Note: spawnFlags now accepts an optional message string which will be shown beside the flag inside a small message box (e.g., constituency or country name).
