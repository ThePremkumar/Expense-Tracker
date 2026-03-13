const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const REGION = 'asia-south1';

// 1. Auto-add sample expenses for new user
exports.addSampleExpensesOnSignup = functions.region(REGION).auth.user().onCreate(async (user) => {
  const userId = user.uid;
  const db = admin.firestore();
  
  const samples = [
    { title: 'Breakfast', category: 'Food', amount: 40, date: new Date().toISOString().split('T')[0] },
    { title: 'Bus ticket', category: 'Travel', amount: 15, date: new Date().toISOString().split('T')[0] },
    { title: 'Tea', category: 'Food', amount: 10, date: new Date().toISOString().split('T')[0] },
    { title: 'Notes', category: 'Essentials', amount: 20, date: new Date().toISOString().split('T')[0] },
    { title: 'Internet Recharge', category: 'Utilities', amount: 199, date: new Date().toISOString().split('T')[0] },
  ];

  const batch = db.batch();
  samples.forEach(s => {
    const ref = db.collection('expenses').doc();
    batch.set(ref, {
      ...s,
      userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  batch.set(db.collection('users').doc(userId), {
    customCategories: [],
    budgets: {},
    recurringExpenses: [],
    appliedRecurringMonths: []
  });

  return batch.commit();
});

// 2. Budget exceed notifications (Mock implementation)
exports.sendBudgetAlert = functions.region(REGION).firestore
  .document('expenses/{expenseId}')
  .onCreate(async (snapshot, context) => {
    const expense = snapshot.data();
    const userId = expense.userId;
    const db = admin.firestore();
    
    // Get current month budget
    const month = expense.date.substring(0, 7);
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const budget = userData.budgets && userData.budgets[month];
    
    if (budget) {
      // Calculate total spent (Simplified)
      const expensesSnap = await db.collection('expenses')
        .where('userId', '==', userId)
        .where('date', '>=', month + '-01')
        .where('date', '<=', month + '-31')
        .get();
      
      let totalSpent = 0;
      expensesSnap.forEach(doc => totalSpent += doc.data().amount);
      
      if (totalSpent > budget.totalBudget) {
        console.log(`User ${userId} exceeded budget: ${totalSpent}/${budget.totalBudget}`);
        // Here you would send a FCM notification or Email
      }
    }
  });

// 3. Daily cleanup for invalid data
exports.cleanupInvalidExpenses = functions.region(REGION).pubsub.schedule('every 24 hours').onRun(async (context) => {
  const db = admin.firestore();
  const invalidSnap = await db.collection('expenses')
    .where('amount', '<=', 0)
    .get();
  
  const batch = db.batch();
  invalidSnap.forEach(doc => batch.delete(doc.ref));
  return batch.commit();
});

// 4. Monthly summary generator
exports.generateMonthlyReport = functions.region(REGION).pubsub.schedule('0 0 1 * *').onRun(async (context) => {
  // Logic to generate and save monthly reports for all users
  return null;
});
