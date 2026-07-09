# Production Master Plan

Static GitHub Pages dashboard for the production planning master plan.

The live planning data remains in Google Sheets:

https://docs.google.com/spreadsheets/d/1gR-a77vkgVxDu0jdSZ9RPhnGLC5OabIRHSRGBN0hZ18/edit?gid=659565457#gid=659565457

## Files

- `index.html` - dashboard shell
- `plan-data.js` - exported planning snapshot used by GitHub Pages
- `capacity-data.js` - exported production capacity snapshot used for Part No. based scheduling
- `styles.css` - layout and visual styling
- `app.js` - machine menu, monthly planning logic, editable order flow
- `tools/extract-plan-data.mjs` - rebuilds `plan-data.js` from an exported workbook
- `tools/extract-capacity-data.py` - rebuilds `capacity-data.js` from `Production Capacity.xlsx`

## Live Google Sheet updates

The dashboard refreshes through the read-only Apps Script endpoint configured in `app.js` (`action=productionPlan`) every 60 seconds. If that endpoint is unavailable, it falls back to direct Google Sheet JSONP and then to the exported `plan-data.js` snapshot.
