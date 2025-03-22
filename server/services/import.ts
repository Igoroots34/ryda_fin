import { storage } from "../storage";
import { Import, InsertImport, ImportResult, InsertTransaction } from "@shared/schema";
import axios from "axios";
import { parse as csvParse } from "csv-parse/sync";

// Process an import file
export async function processImport(importData: InsertImport, type: "bank_statement" | "credit_card"): Promise<ImportResult> {
  try {
    // First create the import record with processing status
    const importRecord = await storage.createImport({
      ...importData,
      status: "processing"
    });
    
    // Download the file from the provided URL
    const fileUrl = importData.filename;
    const fileResponse = await axios.get(fileUrl, { responseType: 'text' });
    const fileContent = fileResponse.data;
    
    // Parse the file based on type
    const parsedTransactions = type === "bank_statement"
      ? parseBankStatement(fileContent, importData.metadata?.bankType as string)
      : parseCreditCardStatement(fileContent, importData.metadata?.cardType as string);
    
    // Create transactions from parsed data
    const transactionIds: number[] = [];
    let duplicatesSkipped = 0;
    let errors: string[] = [];
    
    for (const transactionData of parsedTransactions) {
      try {
        // Check for duplicates
        const existingTransactions = await storage.getTransactions(importData.userId, {
          search: transactionData.description,
          dateRange: 'custom',
          startDate: new Date(transactionData.date),
          endDate: new Date(transactionData.date)
        });
        
        const isDuplicate = existingTransactions.some(t => 
          t.description === transactionData.description && 
          t.amount === transactionData.amount &&
          new Date(t.date).toDateString() === new Date(transactionData.date).toDateString()
        );
        
        if (isDuplicate) {
          duplicatesSkipped++;
          continue;
        }
        
        // Create the transaction
        const transaction = await storage.createTransaction({
          ...transactionData,
          userId: importData.userId
        });
        
        transactionIds.push(transaction.id);
      } catch (error) {
        console.error("Error creating transaction:", error);
        errors.push(`Error processing transaction: ${transactionData.description}`);
      }
    }
    
    // Update the import record with completion status and transaction count
    const updatedImport = await storage.updateImport(importRecord.id, {
      status: errors.length > 0 ? "completed_with_errors" : "completed",
      transactionCount: transactionIds.length,
      metadata: {
        ...importData.metadata,
        transactionIds,
        errors,
        duplicatesSkipped
      }
    }, importData.userId);
    
    return {
      importId: importRecord.id,
      transactionsImported: transactionIds.length,
      duplicatesSkipped,
      errors
    };
  } catch (error) {
    console.error("Import processing error:", error);
    
    // If we already created an import record, update it with failed status
    if (importData.id) {
      await storage.updateImport(importData.id, {
        status: "failed",
        metadata: {
          ...importData.metadata,
          error: (error as Error).message
        }
      }, importData.userId);
    }
    
    throw new Error(`Failed to process import: ${(error as Error).message}`);
  }
}

// Parse bank statement CSV
function parseBankStatement(content: string, bankType: string): Partial<InsertTransaction>[] {
  try {
    // Parse CSV content
    const records = csvParse(content, {
      columns: true,
      skip_empty_lines: true
    });
    
    // Map based on bank type
    switch (bankType) {
      case "bank-of-america":
        return records.map((record: any) => ({
          description: record.Description || record.Payee || "Unknown transaction",
          amount: parseFloat(record.Amount.replace(/[^\d.-]/g, '')),
          date: parseDate(record.Date || record["Transaction Date"]),
          type: parseFloat(record.Amount) > 0 ? "income" : "expense",
          categoryId: getCategoryIdByDescription(record.Description || ""),
          notes: `Imported from Bank of America - ${record.Type || ""}`,
          status: "completed"
        }));
      
      case "chase":
        return records.map((record: any) => ({
          description: record.Description || record.Merchant || "Unknown transaction",
          amount: Math.abs(parseFloat(record.Amount.replace(/[^\d.-]/g, ''))),
          date: parseDate(record.Date || record["Transaction Date"]),
          type: record.Type === "Credit" ? "income" : "expense",
          categoryId: getCategoryIdByDescription(record.Description || ""),
          notes: `Imported from Chase - ${record.Category || ""}`,
          status: "completed"
        }));
      
      // Add more bank formats as needed
      
      default:
        // Generic format
        return records.map((record: any) => ({
          description: record.Description || record.Payee || record.Merchant || "Unknown transaction",
          amount: Math.abs(parseFloat((record.Amount || record.Sum || "0").toString().replace(/[^\d.-]/g, ''))),
          date: parseDate(record.Date || record["Transaction Date"] || record.TransactionDate),
          type: determineTransactionType(record),
          categoryId: getCategoryIdByDescription(record.Description || ""),
          notes: `Imported from bank statement`,
          status: "completed"
        }));
    }
  } catch (error) {
    console.error("Error parsing bank statement:", error);
    throw new Error(`Failed to parse bank statement: ${(error as Error).message}`);
  }
}

// Parse credit card statement
function parseCreditCardStatement(content: string, cardType: string): Partial<InsertTransaction>[] {
  try {
    // Parse CSV content (for PDF, we'd need a more complex parser in a real app)
    const records = csvParse(content, {
      columns: true,
      skip_empty_lines: true
    });
    
    // Map based on card type
    switch (cardType) {
      case "amex":
        return records.map((record: any) => ({
          description: record.Description || record.Merchant || "Unknown transaction",
          amount: Math.abs(parseFloat(record.Amount.replace(/[^\d.-]/g, ''))),
          date: parseDate(record.Date),
          type: "expense",  // Credit card statements typically show expenses
          categoryId: getCategoryIdByDescription(record.Description || ""),
          notes: `Imported from American Express - ${record.Category || ""}`,
          status: "completed"
        }));
      
      case "visa":
      case "mastercard":
        return records.map((record: any) => ({
          description: record.Description || record.Merchant || "Unknown transaction",
          amount: Math.abs(parseFloat(record.Amount.replace(/[^\d.-]/g, ''))),
          date: parseDate(record.Date || record["Transaction Date"]),
          type: "expense",
          categoryId: getCategoryIdByDescription(record.Description || ""),
          notes: `Imported from ${cardType} - ${record.Category || ""}`,
          status: "completed"
        }));
      
      // Add more card formats as needed
      
      default:
        // Generic format
        return records.map((record: any) => ({
          description: record.Description || record.Payee || record.Merchant || "Unknown transaction",
          amount: Math.abs(parseFloat((record.Amount || record.Sum || "0").toString().replace(/[^\d.-]/g, ''))),
          date: parseDate(record.Date || record["Transaction Date"] || record.TransactionDate),
          type: "expense",
          categoryId: getCategoryIdByDescription(record.Description || ""),
          notes: `Imported from credit card statement`,
          status: "completed"
        }));
    }
  } catch (error) {
    console.error("Error parsing credit card statement:", error);
    throw new Error(`Failed to parse credit card statement: ${(error as Error).message}`);
  }
}

// Get imports for a user
export async function getImports(userId: string): Promise<Import[]> {
  return storage.getImports(userId);
}

// Get a specific import by ID
export async function getImport(id: number, userId: string): Promise<Import | undefined> {
  return storage.getImportById(id, userId);
}

// Delete an import and its associated transactions
export async function deleteImport(id: number, userId: string): Promise<void> {
  await storage.deleteImport(id, userId);
}

// Helper function to parse dates in various formats
function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  
  // Try different date formats
  const formats = [
    // MM/DD/YYYY
    (str: string) => {
      const parts = str.split('/');
      return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
    },
    // DD/MM/YYYY
    (str: string) => {
      const parts = str.split('/');
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    },
    // YYYY-MM-DD
    (str: string) => {
      const parts = str.split('-');
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    },
    // MM-DD-YYYY
    (str: string) => {
      const parts = str.split('-');
      return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
    }
  ];
  
  for (const format of formats) {
    try {
      const date = format(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch (e) {
      // Try next format
    }
  }
  
  // If all fails, try native Date parsing
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  // If still invalid, return current date
  return new Date();
}

// Determine transaction type based on record fields
function determineTransactionType(record: any): "income" | "expense" {
  // Look for type indicators
  if (record.Type && typeof record.Type === 'string') {
    const type = record.Type.toLowerCase();
    if (type.includes('credit') || type.includes('deposit')) {
      return "income";
    }
    if (type.includes('debit') || type.includes('withdrawal')) {
      return "expense";
    }
  }
  
  // Check amount (positive = income, negative = expense)
  const amount = parseFloat(record.Amount?.toString().replace(/[^\d.-]/g, '') || "0");
  return amount >= 0 ? "income" : "expense";
}

// Map description to a category (would need a more sophisticated algorithm in a real app)
function getCategoryIdByDescription(description: string): number {
  const lowerDesc = description.toLowerCase();
  
  // Simple keyword matching - in a real app, these would be dynamic based on user categories
  if (lowerDesc.includes('salary') || lowerDesc.includes('payroll') || lowerDesc.includes('deposit')) {
    return 1; // Income - Salary
  } else if (lowerDesc.includes('dividend') || lowerDesc.includes('interest')) {
    return 2; // Income - Investments
  } else if (lowerDesc.includes('rent') || lowerDesc.includes('mortgage')) {
    return 5; // Housing
  } else if (lowerDesc.includes('grocery') || lowerDesc.includes('food') || lowerDesc.includes('restaurant')) {
    return 6; // Food
  } else if (lowerDesc.includes('uber') || lowerDesc.includes('lyft') || lowerDesc.includes('gas') || lowerDesc.includes('transport')) {
    return 7; // Transportation
  } else if (lowerDesc.includes('movie') || lowerDesc.includes('entertainment') || lowerDesc.includes('game')) {
    return 8; // Entertainment
  } else if (lowerDesc.includes('electric') || lowerDesc.includes('water') || lowerDesc.includes('internet')) {
    return 9; // Utilities
  } else if (lowerDesc.includes('doctor') || lowerDesc.includes('pharmacy') || lowerDesc.includes('health')) {
    return 10; // Health
  } else if (lowerDesc.includes('credit card') || lowerDesc.includes('loan') || lowerDesc.includes('payment')) {
    return 11; // Debt
  }
  
  // Default to expense category if type can't be determined
  return 6; // Default to Food
}
