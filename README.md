# Petition Tracker

Live petition statistics tracker with animated counters, regional breakdown, and history chart.

## What's New (2025-11-03)

- Petition selector and URL support: choose from petitions via the dropdown; supports `?petition=` or `?id=` in the URL. App starts blank until a petition is selected.
- Closed-mode awareness: when viewing a closed petition, live polling and realtime UI are disabled automatically.
- Settings improvements:
	- Falling flags toggle is immediate and now hard-stops any in-flight animations when turned off.
	- Animation modes: Drop, Stream, and March.
- One-off Constituency & Non‑UK March (Settings button):
	- Shows one flag per UK constituency and one per non‑UK country, sized proportionally to total signatures.
	- Labels include constituency/country name plus a bold, blue total (thousands separated).
	- Runs as a one-off that overrides other animations and restores state when finished.
	- Live progress: settings button displays a running countdown of remaining flags.
	- UX polish: wider row spacing, larger horizontal gap, and constrained label width to reduce overlap and keep text legible.

## Features

- 10s polling with interpolation to smooth missed intervals
- Dual time labels and peak jump metric on jumps chart
- Dynamic initial signature ramp animation
- Regional statistics grid with aligned numeric columns
- Flag animations
- Export / print friendly formatting (Tabulator + jsPDF support)

## Local Development

Open `index.html` in a browser. No build step required.

## GitHub Pages

Once pushed to GitHub, enable GitHub Pages (Settings -> Pages) and select the `main` branch root to host.

## Structure

```
index.html
css/
js/
img/
```

## License

Choose a license (e.g. MIT) and add a LICENSE file.
