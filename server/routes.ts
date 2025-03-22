import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { verifyFirebaseToken } from "./firebase-admin";
import { getTransactions, getRecentTransactions, addTransaction, updateTransaction, deleteTransaction } from "./services/transactions";
import { processImport, getImports, getImport, deleteImport } from "./services/import";
import { z } from "zod";
import { insertTransactionSchema, insertImportSchema } from "@shared/schema";

// Estendendo o tipo Request para incluir usuário autenticado
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware to verify Firebase authentication
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Special case for dev token
    if (authHeader === "Bearer dev-token") {
      // Configurar um usuário para desenvolvimento
      req.user = { uid: "admin-dev-uid" };
      return next();
    }
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }
    
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await verifyFirebaseToken(token);
    
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  
  // Auth endpoint for development
  app.post("/api/auth/dev-login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Verificar se as credenciais são válidas
      if (username === 'admin' && password === 'admin123') {
        // Buscar o usuário pelo username
        const user = await storage.getUserByUsername(username);
        
        if (user) {
          // Retornar um mock de usuário Firebase com ID de usuário do banco
          res.json({
            user: {
              uid: user.uid,
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL
            },
            token: "dev-token" // Token fictício para desenvolvimento
          });
        } else {
          res.status(404).json({ message: "User not found" });
        }
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Dev login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  
  // Dashboard endpoints
  app.get("/api/dashboard", authMiddleware, async (req, res) => {
    try {
      const { timeRange = 'month' } = req.query;
      const userId = req.user.uid;
      
      // Get dashboard summary
      const dashboardData = await storage.getDashboardSummary(userId, timeRange as string);
      res.json(dashboardData);
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });
  
  // Transaction endpoints
  app.get("/api/transactions", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.uid;
      const filters = req.query;
      
      const transactions = await getTransactions(userId, filters);
      res.json(transactions);
    } catch (error) {
      console.error("Transactions error:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });
  
  app.get("/api/transactions/recent", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.uid;
      const { timeRange = 'month' } = req.query;
      
      const transactions = await getRecentTransactions(userId, timeRange as string);
      res.json(transactions);
    } catch (error) {
      console.error("Recent transactions error:", error);
      res.status(500).json({ message: "Failed to fetch recent transactions" });
    }
  });
  
  app.post("/api/transactions", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.uid;
      
      // Validate request body
      const validatedData = insertTransactionSchema.parse(req.body);
      
      // Ensure userId matches authenticated user
      if (validatedData.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized - User ID mismatch" });
      }
      
      const transaction = await addTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      
      console.error("Add transaction error:", error);
      res.status(500).json({ message: "Failed to add transaction" });
    }
  });
  
  app.patch("/api/transactions/:id", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.uid;
      const transactionId = parseInt(req.params.id);
      
      // Validate request body
      const validatedData = insertTransactionSchema.parse(req.body);
      
      // Ensure userId matches authenticated user
      if (validatedData.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized - User ID mismatch" });
      }
      
      const transaction = await updateTransaction(transactionId, validatedData, userId);
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      
      console.error("Update transaction error:", error);
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });
  
  app.delete("/api/transactions/:id", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.uid;
      const transactionId = parseInt(req.params.id);
      
      await deleteTransaction(transactionId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Delete transaction error:", error);
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });
  
  // Category endpoints
  app.get("/api/categories", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.uid;
      
      const categories = await storage.getCategories(userId);
      res.json(categories);
    } catch (error) {
      console.error("Categories error:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  
  // Account endpoints
  app.get("/api/accounts", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.uid;
      
      const accounts = await storage.getAccounts(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Accounts error:", error);
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });
  
  // Import endpoints
  app.post("/api/import/bank-statement", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.uid;
      
      // Validate request body
      const validatedData = insertImportSchema.parse({
        ...req.body,
        dateImported: new Date(),
        type: "bank_statement",
        userId
      });
      
      // Ensure userId matches authenticated user
      if (validatedData.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized - User ID mismatch" });
      }
      
      const importResult = await processImport(validatedData, "bank_statement");
      res.status(201).json(importResult);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid import data", errors: error.errors });
      }
      
      console.error("Bank statement import error:", error);
      res.status(500).json({ message: "Failed to import bank statement" });
    }
  });
  
  app.post("/api/import/credit-card", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.uid;
      
      // Validate request body
      const validatedData = insertImportSchema.parse({
        ...req.body,
        dateImported: new Date(),
        type: "credit_card",
        userId
      });
      
      // Ensure userId matches authenticated user
      if (validatedData.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized - User ID mismatch" });
      }
      
      const importResult = await processImport(validatedData, "credit_card");
      res.status(201).json(importResult);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid import data", errors: error.errors });
      }
      
      console.error("Credit card import error:", error);
      res.status(500).json({ message: "Failed to import credit card statement" });
    }
  });
  
  app.get("/api/imports", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.uid;
      
      const imports = await getImports(userId);
      res.json(imports);
    } catch (error) {
      console.error("Imports error:", error);
      res.status(500).json({ message: "Failed to fetch imports" });
    }
  });
  
  app.get("/api/imports/:id", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.uid;
      const importId = parseInt(req.params.id);
      
      const importData = await getImport(importId, userId);
      
      if (!importData) {
        return res.status(404).json({ message: "Import not found" });
      }
      
      res.json(importData);
    } catch (error) {
      console.error("Import detail error:", error);
      res.status(500).json({ message: "Failed to fetch import details" });
    }
  });
  
  app.delete("/api/imports/:id", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.uid;
      const importId = parseInt(req.params.id);
      
      await deleteImport(importId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Delete import error:", error);
      res.status(500).json({ message: "Failed to delete import" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
