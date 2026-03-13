# Testing Guide - Advanced Transactions Page

## Fixed Issues ✅
All Firebase permission errors should now be resolved with localStorage fallback.

## Features to Test:

### 1. **Basic Functionality**
- [ ] View transactions in the table
- [ ] Search transactions by title/notes
- [ ] Filter by category
- [ ] Add new expense (should work without errors)
- [ ] Edit existing expense (should work without errors)
- [ ] Delete expense (should work without errors)

### 2. **Advanced Filters**
- [ ] Click "Advanced Filters" to expand
- [ ] Date Range: Try "Today", "Last 7 Days", "Last 30 Days"
- [ ] Custom Date Range: Set start and end dates
- [ ] Amount Range: Set min/max amounts
- [ ] Sort Options: Sort by Date, Amount, Title
- [ ] Sort Order: Try Ascending/Descending

### 3. **CSV Import/Export**
- [ ] Import CSV using the test file
- [ ] Export filtered transactions

### 4. **UI Features**
- [ ] Results count shows "X of Y transactions"
- [ ] Clear All Filters button works
- [ ] Responsive design on mobile
- [ ] Empty states show appropriate messages

## Test Data:
Use the provided `test-import.csv` file for testing CSV import.

## Expected Behavior:
- No Firebase permission errors in console
- All operations work with localStorage fallback
- Data persists across page refreshes
- Filters work in combination

## Troubleshooting:
If you still see errors:
1. Clear browser localStorage: `localStorage.clear()`
2. Refresh the page
3. Check console for "Using local storage fallback" messages
