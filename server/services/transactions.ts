import { storage } from "../storage";
import { Transaction, InsertTransaction, TransactionFilters } from "@shared/schema";
import { getRelativeDateRange } from "../../client/src/lib/utils";

// Get all transactions with optional filters
export async function getTransactions(userId: string, filters?: TransactionFilters): Promise<Transaction[]> {
  return storage.getTransactions(userId, filters);
}

// Get recent transactions within a time range
export async function getRecentTransactions(userId: string, timeRange: string): Promise<Transaction[]> {
  return storage.getRecentTransactions(userId, timeRange);
}

// Add a new transaction
export async function addTransaction(transaction: InsertTransaction): Promise<Transaction> {
  // Update date field if it's a string
  if (typeof transaction.date === 'string') {
    transaction.date = new Date(transaction.date);
  }
  
  return storage.createTransaction(transaction);
}

// Update an existing transaction
export async function updateTransaction(id: number, transaction: InsertTransaction, userId: string): Promise<Transaction> {
  // Check if transaction exists and belongs to the user
  const existingTransaction = await storage.getTransactionById(id, userId);
  if (!existingTransaction) {
    throw new Error(`Transaction with ID ${id} not found or doesn't belong to the user`);
  }
  
  // Update date field if it's a string
  if (typeof transaction.date === 'string') {
    transaction.date = new Date(transaction.date);
  }
  
  return storage.updateTransaction(id, transaction, userId);
}

// Delete a transaction
export async function deleteTransaction(id: number, userId: string): Promise<void> {
  // Check if transaction exists and belongs to the user
  const existingTransaction = await storage.getTransactionById(id, userId);
  if (!existingTransaction) {
    throw new Error(`Transaction with ID ${id} not found or doesn't belong to the user`);
  }
  
  await storage.deleteTransaction(id, userId);
}

// Get transaction summary stats
export async function getTransactionStats(userId: string, timeRange: string) {
  const { startDate, endDate } = getRelativeDateRange(timeRange);
  
  // Get transactions in the time range
  const transactions = await storage.getTransactions(userId, {
    dateRange: 'custom',
    startDate,
    endDate
  });
  
  // Calculate income
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Calculate expenses
  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Calculate savings
  const savings = income - expenses;
  
  // Group expenses by category
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      if (!acc[t.categoryId]) {
        acc[t.categoryId] = 0;
      }
      acc[t.categoryId] += t.amount;
      return acc;
    }, {} as Record<number, number>);
  
  return {
    income,
    expenses,
    savings,
    expensesByCategory
  };
}
