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
