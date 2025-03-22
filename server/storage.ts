import { 
  Category, 
  Transaction, 
  Account, 
  Import, 
  User, 
  InsertUser, 
  InsertCategory, 
  InsertTransaction, 
  InsertAccount, 
  InsertImport,
  DashboardSummary,
  TransactionFilters
} from "@shared/schema";
import { getRelativeDateRange, calculatePercentChange } from "../client/src/lib/utils";

// Interface for the storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByUid(uid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Category operations
  getCategories(userId: string): Promise<Category[]>;
  getCategoryById(id: number, userId: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: InsertCategory, userId: string): Promise<Category>;
  deleteCategory(id: number, userId: string): Promise<void>;
  
  // Transaction operations
  getTransactions(userId: string, filters?: TransactionFilters): Promise<Transaction[]>;
  getRecentTransactions(userId: string, timeRange: string, limit?: number): Promise<Transaction[]>;
  getTransactionById(id: number, userId: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: InsertTransaction, userId: string): Promise<Transaction>;
  deleteTransaction(id: number, userId: string): Promise<void>;
  
  // Account operations
  getAccounts(userId: string): Promise<Account[]>;
  getAccountById(id: number, userId: string): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, account: InsertAccount, userId: string): Promise<Account>;
  deleteAccount(id: number, userId: string): Promise<void>;
  
  // Import operations
  getImports(userId: string): Promise<Import[]>;
  getImportById(id: number, userId: string): Promise<Import | undefined>;
  createImport(importData: InsertImport): Promise<Import>;
  updateImport(id: number, importData: Partial<InsertImport>, userId: string): Promise<Import>;
  deleteImport(id: number, userId: string): Promise<void>;
  
  // Dashboard operations
  getDashboardSummary(userId: string, timeRange: string): Promise<DashboardSummary>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private transactions: Map<number, Transaction>;
  private accounts: Map<number, Account>;
  private imports: Map<number, Import>;
  
  private userId: number;
  private categoryId: number;
  private transactionId: number;
  private accountId: number;
  private importId: number;
  
  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.transactions = new Map();
    this.accounts = new Map();
    this.imports = new Map();
    
    this.userId = 1;
    this.categoryId = 1;
    this.transactionId = 1;
    this.accountId = 1;
    this.importId = 1;
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByUid(uid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.uid === uid
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Category operations
  async getCategories(userId: string): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(
      (category) => category.userId === userId
    );
  }
  
  async getCategoryById(id: number, userId: string): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (category && category.userId === userId) {
      return category;
    }
    return undefined;
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryId++;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }
  
  async updateCategory(id: number, category: InsertCategory, userId: string): Promise<Category> {
    const existingCategory = await this.getCategoryById(id, userId);
    if (!existingCategory) {
      throw new Error(`Category with ID ${id} not found or doesn't belong to user`);
    }
    
    const updatedCategory: Category = { ...category, id };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }
  
  async deleteCategory(id: number, userId: string): Promise<void> {
    const existingCategory = await this.getCategoryById(id, userId);
    if (!existingCategory) {
      throw new Error(`Category with ID ${id} not found or doesn't belong to user`);
    }
    
    this.categories.delete(id);
  }
  
  // Transaction operations
  async getTransactions(userId: string, filters?: TransactionFilters): Promise<Transaction[]> {
    let transactions = Array.from(this.transactions.values()).filter(
      (transaction) => transaction.userId === userId
    );
    
    // Apply filters if provided
    if (filters) {
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        transactions = transactions.filter(
          (transaction) => 
            transaction.description.toLowerCase().includes(searchTerm) ||
            (transaction.notes && transaction.notes.toLowerCase().includes(searchTerm))
        );
      }
      
      if (filters.category !== undefined) {
        transactions = transactions.filter(
          (transaction) => transaction.categoryId === filters.category
        );
      }
      
      if (filters.type) {
        transactions = transactions.filter(
          (transaction) => transaction.type === filters.type
        );
      }
      
      if (filters.dateRange) {
        const now = new Date();
        let startDate: Date | undefined;
        let endDate: Date = now;
        
        if (filters.startDate && filters.endDate) {
          startDate = new Date(filters.startDate);
          endDate = new Date(filters.endDate);
        } else {
          switch (filters.dateRange) {
            case 'last-30-days':
              startDate = new Date();
              startDate.setDate(now.getDate() - 30);
              break;
            case 'this-month':
              startDate = new Date(now.getFullYear(), now.getMonth(), 1);
              break;
            case 'last-month':
              startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              endDate = new Date(now.getFullYear(), now.getMonth(), 0);
              break;
            case 'this-year':
              startDate = new Date(now.getFullYear(), 0, 1);
              break;
          }
        }
        
        if (startDate) {
          transactions = transactions.filter(
            (transaction) => {
              const transactionDate = new Date(transaction.date);
              return transactionDate >= startDate! && transactionDate <= endDate;
            }
          );
        }
      }
      
      if (filters.minAmount !== undefined) {
        transactions = transactions.filter(
          (transaction) => transaction.amount >= filters.minAmount!
        );
      }
      
      if (filters.maxAmount !== undefined) {
        transactions = transactions.filter(
          (transaction) => transaction.amount <= filters.maxAmount!
        );
      }
      
      if (filters.status) {
        transactions = transactions.filter(
          (transaction) => transaction.status === filters.status
        );
      }
    }
    
    // Sort by date, newest first
    return transactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
  
  async getRecentTransactions(userId: string, timeRange: string, limit: number = 5): Promise<Transaction[]> {
    const { startDate, endDate } = getRelativeDateRange(timeRange);
    
    const transactions = Array.from(this.transactions.values())
      .filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return (
          transaction.userId === userId &&
          transactionDate >= startDate &&
          transactionDate <= endDate
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
    
    return transactions;
  }
  
  async getTransactionById(id: number, userId: string): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (transaction && transaction.userId === userId) {
      return transaction;
    }
    return undefined;
  }
  
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionId++;
    const newTransaction: Transaction = { ...transaction, id };
    this.transactions.set(id, newTransaction);
    
    // Update account balance if account is specified
    if (newTransaction.accountId) {
      const account = this.accounts.get(newTransaction.accountId);
      if (account) {
        const balanceChange = newTransaction.type === 'income' ? newTransaction.amount : -newTransaction.amount;
        const updatedAccount: Account = {
          ...account,
          balance: account.balance + balanceChange
        };
        this.accounts.set(account.id, updatedAccount);
      }
    }
    
    return newTransaction;
  }
  
  async updateTransaction(id: number, transaction: InsertTransaction, userId: string): Promise<Transaction> {
    const existingTransaction = await this.getTransactionById(id, userId);
    if (!existingTransaction) {
      throw new Error(`Transaction with ID ${id} not found or doesn't belong to user`);
    }
    
    // Revert the effect on account balance if needed
    if (existingTransaction.accountId) {
      const account = this.accounts.get(existingTransaction.accountId);
      if (account) {
        const oldBalanceChange = existingTransaction.type === 'income' ? existingTransaction.amount : -existingTransaction.amount;
        const updatedAccount: Account = {
          ...account,
          balance: account.balance - oldBalanceChange
        };
        this.accounts.set(account.id, updatedAccount);
      }
    }
    
    // Apply new transaction
    const updatedTransaction: Transaction = { ...transaction, id };
    this.transactions.set(id, updatedTransaction);
    
    // Update new account balance if needed
    if (updatedTransaction.accountId) {
      const account = this.accounts.get(updatedTransaction.accountId);
      if (account) {
        const newBalanceChange = updatedTransaction.type === 'income' ? updatedTransaction.amount : -updatedTransaction.amount;
        const updatedAccount: Account = {
          ...account,
          balance: account.balance + newBalanceChange
        };
        this.accounts.set(account.id, updatedAccount);
      }
    }
    
    return updatedTransaction;
  }
  
  async deleteTransaction(id: number, userId: string): Promise<void> {
    const existingTransaction = await this.getTransactionById(id, userId);
    if (!existingTransaction) {
      throw new Error(`Transaction with ID ${id} not found or doesn't belong to user`);
    }
    
    // Revert the effect on account balance if needed
    if (existingTransaction.accountId) {
      const account = this.accounts.get(existingTransaction.accountId);
      if (account) {
        const balanceChange = existingTransaction.type === 'income' ? existingTransaction.amount : -existingTransaction.amount;
        const updatedAccount: Account = {
          ...account,
          balance: account.balance - balanceChange
        };
        this.accounts.set(account.id, updatedAccount);
      }
    }
    
    this.transactions.delete(id);
  }
  
  // Account operations
  async getAccounts(userId: string): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter(
      (account) => account.userId === userId
    );
  }
  
  async getAccountById(id: number, userId: string): Promise<Account | undefined> {
    const account = this.accounts.get(id);
    if (account && account.userId === userId) {
      return account;
    }
    return undefined;
  }
  
  async createAccount(account: InsertAccount): Promise<Account> {
    const id = this.accountId++;
    const newAccount: Account = { ...account, id };
    this.accounts.set(id, newAccount);
    return newAccount;
  }
  
  async updateAccount(id: number, account: InsertAccount, userId: string): Promise<Account> {
    const existingAccount = await this.getAccountById(id, userId);
    if (!existingAccount) {
      throw new Error(`Account with ID ${id} not found or doesn't belong to user`);
    }
    
    const updatedAccount: Account = { ...account, id };
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }
  
  async deleteAccount(id: number, userId: string): Promise<void> {
    const existingAccount = await this.getAccountById(id, userId);
    if (!existingAccount) {
      throw new Error(`Account with ID ${id} not found or doesn't belong to user`);
    }
    
    // Check if there are any transactions associated with this account
    const associatedTransactions = Array.from(this.transactions.values()).some(
      (transaction) => transaction.accountId === id
    );
    
    if (associatedTransactions) {
      throw new Error(`Cannot delete account with ID ${id} because it has associated transactions`);
    }
    
    this.accounts.delete(id);
  }
  
  // Import operations
  async getImports(userId: string): Promise<Import[]> {
    return Array.from(this.imports.values())
      .filter((importItem) => importItem.userId === userId)
      .sort((a, b) => new Date(b.dateImported).getTime() - new Date(a.dateImported).getTime());
  }
  
  async getImportById(id: number, userId: string): Promise<Import | undefined> {
    const importItem = this.imports.get(id);
    if (importItem && importItem.userId === userId) {
      return importItem;
    }
    return undefined;
  }
  
  async createImport(importData: InsertImport): Promise<Import> {
    const id = this.importId++;
    const newImport: Import = { ...importData, id };
    this.imports.set(id, newImport);
    return newImport;
  }
  
  async updateImport(id: number, importData: Partial<InsertImport>, userId: string): Promise<Import> {
    const existingImport = await this.getImportById(id, userId);
    if (!existingImport) {
      throw new Error(`Import with ID ${id} not found or doesn't belong to user`);
    }
    
    const updatedImport: Import = { ...existingImport, ...importData, id };
    this.imports.set(id, updatedImport);
    return updatedImport;
  }
  
  async deleteImport(id: number, userId: string): Promise<void> {
    const existingImport = await this.getImportById(id, userId);
    if (!existingImport) {
      throw new Error(`Import with ID ${id} not found or doesn't belong to user`);
    }
    
    // Delete associated transactions if any (based on metadata)
    if (existingImport.metadata && existingImport.metadata.transactionIds) {
      const transactionIds = existingImport.metadata.transactionIds as number[];
      for (const transactionId of transactionIds) {
        try {
          await this.deleteTransaction(transactionId, userId);
        } catch (error) {
          console.error(`Error deleting transaction ${transactionId}:`, error);
        }
      }
    }
    
    this.imports.delete(id);
  }
  
  // Dashboard operations
  async getDashboardSummary(userId: string, timeRange: string): Promise<DashboardSummary> {
    const { startDate, endDate } = getRelativeDateRange(timeRange);
    
    // Calculate previous period for comparison
    const periodDuration = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodDuration);
    const prevEndDate = new Date(endDate.getTime() - periodDuration);
    
    // Get transactions for current period
    const currentTransactions = Array.from(this.transactions.values()).filter(
      (transaction) => {
        const transactionDate = new Date(transaction.date);
        return (
          transaction.userId === userId &&
          transactionDate >= startDate &&
          transactionDate <= endDate
        );
      }
    );
    
    // Get transactions for previous period
    const prevTransactions = Array.from(this.transactions.values()).filter(
      (transaction) => {
        const transactionDate = new Date(transaction.date);
        return (
          transaction.userId === userId &&
          transactionDate >= prevStartDate &&
          transactionDate <= prevEndDate
        );
      }
    );
    
    // Calculate current period metrics
    const currentIncome = currentTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const currentExpenses = currentTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const currentSavings = currentIncome - currentExpenses;
    
    // Calculate previous period metrics
    const prevIncome = prevTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const prevExpenses = prevTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const prevSavings = prevIncome - prevExpenses;
    
    // Calculate percentage changes
    const incomeChange = calculatePercentChange(currentIncome, prevIncome);
    const expensesChange = calculatePercentChange(currentExpenses, prevExpenses);
    const savingsChange = calculatePercentChange(currentSavings, prevSavings);
    
    // Calculate total balance (sum of all account balances)
    const accounts = await this.getAccounts(userId);
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
    
    // Calculate balance change
    // For simplicity, we'll use the change in savings as the balance change
    const balanceChange = savingsChange;
    
    return {
      totalBalance,
      income: currentIncome,
      expenses: currentExpenses,
      savings: currentSavings,
      periodChange: {
        balance: balanceChange,
        income: incomeChange,
        expenses: expensesChange,
        savings: savingsChange
      }
    };
  }
}

// Importando PostgresStorage
import { PostgresStorage } from './db/postgresStorage';

// Definindo qual armazenamento usar (PostgreSQL ou em memória)
const usePostgresStorage = process.env.DATABASE_URL ? true : false;

export const storage = usePostgresStorage 
  ? new PostgresStorage() 
  : new MemStorage();
