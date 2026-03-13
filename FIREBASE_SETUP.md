# Firebase Setup Instructions

## Current Issue
The app is showing "Missing or insufficient permissions" error because the Firestore security rules haven't been deployed to Firebase.

## Solution Options

### Option 1: Deploy Rules via Firebase CLI (Recommended)
1. Install Firebase CLI (already done): `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Set project: `firebase use student-expense-tracker-4fd6f`
4. Deploy rules: `firebase deploy --only firestore:rules`

### Option 2: Deploy via Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `student-expense-tracker-4fd6f`
3. Navigate to Firestore Database → Rules
4. Replace the existing rules with the content from `firebase/firestore.rules`
5. Click "Publish"

### Current Rules (in firebase/firestore.rules)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read and write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Expenses rules - more permissive for development
    match /expenses/{expenseId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## After Deploying Rules
Once the rules are deployed, the permission errors should be resolved and the app should work normally for adding expenses and importing CSV files.
