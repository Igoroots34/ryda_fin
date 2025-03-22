import { pgTable, text, serial, integer, boolean, doublePrecision, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define user schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  email: text("email"),
  photoURL: text("photo_url"),
  uid: text("uid").unique(),
});

// Define category schema
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon"),
  color: text("color"),
  type: text("type").notNull(), // income, expense
  userId: text("user_id").notNull()
});

// Define transaction schema
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: doublePrecision("amount").notNull(),
  date: timestamp("date").notNull(),
  type: text("type").notNull(), // income, expense
  categoryId: integer("category_id").notNull(),
  accountId: integer("account_id"),
  notes: text("notes"),
  receiptUrl: text("receipt_url"),
  status: text("status").notNull().default("completed"),
  userId: text("user_id").notNull()
});

// Define account schema
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // checking, savings, credit_card, cash
  balance: doublePrecision("balance").notNull().default(0),
  userId: text("user_id").notNull()
});

// Define import history schema
export const imports = pgTable("imports", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  filesize: integer("filesize"),
  type: text("type").notNull(), // bank_statement, credit_card
  dateImported: timestamp("date_imported").notNull(),
  transactionCount: integer("transaction_count").default(0),
  status: text("status").notNull().default("processing"), // processing, completed, failed
  userId: text("user_id").notNull(),
  metadata: jsonb("metadata")
});

// Create Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  email: true,
  photoURL: true,
  uid: true,
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  icon: true,
  color: true,
  type: true,
  userId: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  description: true,
  amount: true,
  date: true,
  type: true,
  categoryId: true,
  accountId: true,
  notes: true,
  receiptUrl: true,
  status: true,
  userId: true,
});

export const insertAccountSchema = createInsertSchema(accounts).pick({
  name: true,
  type: true,
  balance: true,
  userId: true,
});

export const insertImportSchema = createInsertSchema(imports).pick({
  filename: true,
  filesize: true,
  type: true,
  dateImported: true,
  transactionCount: true,
  status: true,
  userId: true,
  metadata: true,
});

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

export type Import = typeof imports.$inferSelect;
export type InsertImport = z.infer<typeof insertImportSchema>;

// Define dashboard summary type
export interface DashboardSummary {
  totalBalance: number;
  income: number;
  expenses: number;
  savings: number;
  periodChange: {
    balance: number;
    income: number;
    expenses: number;
    savings: number;
  };
}

// Define transaction filters type
export interface TransactionFilters {
  search?: string;
  category?: number;
  type?: string;
  dateRange?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: string;
  status?: string;
}

// Define import result type
export interface ImportResult {
  importId: number;
  transactionsImported: number;
  duplicatesSkipped: number;
  errors: string[];
}
