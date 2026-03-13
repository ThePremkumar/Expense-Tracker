# CSV Import Testing Guide

## Issue Identified
The original test file only had 4 rows, not 30. I've created a new test file with 30 rows.

## New Test File
Use `test-import-30.csv` which contains 30 expense records covering all categories.

## Debug Information Added
Enhanced the `parseCSV` function with detailed console logging:
- Total lines detected
- Headers found
- Column indices identified  
- Lines processed vs skipped
- Final transaction count

## How to Test

1. **Open Browser Console**: Press F12 to open developer tools
2. **Import CSV**: Click "Import CSV" and select `test-import-30.csv`
3. **Check Console**: Look for these log messages:
   ```
   CSV Parsing - Total lines: 31
   CSV Parsing - Headers: ['date', 'title', 'category', 'amount', 'notes']
   CSV Parsing - Column indices: {dateIdx: 0, titleIdx: 1, categoryIdx: 2, amountIdx: 3, notesIdx: 4}
   CSV Parsing - Processed 30 lines, skipped 0 lines
   CSV Parsing - Final transactions count: 30
   ```

## Expected Result
All 30 transactions should appear in the import preview modal and be added to the app.

## Troubleshooting
If you still see only 2 transactions:
- Check the console logs for parsing errors
- Verify the CSV file format matches expected headers
- Check for empty lines or malformed data in the CSV
