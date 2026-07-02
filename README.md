# Production Master Plan

Static GitHub Pages dashboard for the production planning master plan.

The live planning data remains in Google Sheets:

https://docs.google.com/spreadsheets/d/1gR-a77vkgVxDu0jdSZ9RPhnGLC5OabIRHSRGBN0hZ18/edit?gid=659565457#gid=659565457

## Files

- `index.html` - dashboard shell
- `plan-data.js` - exported planning snapshot used by GitHub Pages
- `styles.css` - layout and visual styling
- `app.js` - machine menu, monthly planning logic, editable order flow
- `tools/extract-plan-data.mjs` - rebuilds `plan-data.js` from an exported workbook

## Live Google Sheet updates

The dashboard tries to refresh directly from the Google Sheet every 60 seconds. On GitHub Pages this works only when the spreadsheet is readable by the browser, such as a published-to-web sheet or a public read-only Apps Script JSON endpoint. If Google blocks access, the dashboard keeps using `plan-data.js` and shows that it is waiting for live sheet access.
