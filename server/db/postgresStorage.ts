import { IStorage } from '../storage';
import { query } from './postgres';
import { 
  User, 
  InsertUser, 
  Category, 
  InsertCategory, 
  Transaction, 
  InsertTransaction, 
  Account, 
  InsertAccount, 
  Import, 
  InsertImport, 
  DashboardSummary,
  TransactionFilters
} from '../../shared/schema';
import { log } from '../vite';

export class PostgresStorage implements IStorage {
  constructor() {
    // Inicializa as tabelas no banco de dados
    this.initializeTables().catch(err => {
      console.error('Erro ao inicializar tabelas:', err);
    });
  }

  private async initializeTables() {
    // Tabela de usuários
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        display_name TEXT,
        email TEXT,
        photo_url TEXT,
        uid TEXT UNIQUE
      )
    `);

    // Tabela de categorias
    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        icon TEXT,
        color TEXT,
        type VARCHAR(50) NOT NULL,
        user_id TEXT NOT NULL
      )
    `);

    // Tabela de contas
    await query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        balance DOUBLE PRECISION NOT NULL DEFAULT 0,
        user_id TEXT NOT NULL
      )
    `);

    // Tabela de transações
    await query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        description TEXT NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        date TIMESTAMP NOT NULL,
        type VARCHAR(50) NOT NULL,
        category_id INTEGER NOT NULL,
        account_id INTEGER,
        notes TEXT,
        receipt_url TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'completed',
        user_id TEXT NOT NULL
      )
    `);

    // Tabela de importações
    await query(`
      CREATE TABLE IF NOT EXISTS imports (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL,
        filesize INTEGER,
        type VARCHAR(50) NOT NULL,
        date_imported TIMESTAMP NOT NULL,
        transaction_count INTEGER DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'processing',
        user_id TEXT NOT NULL,
        metadata JSONB
      )
    `);

    // Verificando se já existe o usuário admin
    const adminCheckResult = await query('SELECT * FROM users WHERE username = $1', ['admin']);
    if (adminCheckResult.rows.length === 0) {
      // Criar usuário admin para desenvolvimento
      await query(`
        INSERT INTO users (username, password, display_name, email, uid) 
        VALUES ($1, $2, $3, $4, $5)
      `, ['admin', 'admin123', 'Administrador', 'admin@fintrack.com', 'admin-dev-uid']);
      
      log('Usuário admin criado com sucesso', 'postgres');
      
      // Criar categorias padrão para o usuário admin
      const defaultCategories = [
        { name: 'Salário', icon: 'briefcase', color: '#10b981', type: 'income' },
        { name: 'Investimentos', icon: 'trending-up', color: '#10b981', type: 'income' },
        { name: 'Freelance', icon: 'code', color: '#10b981', type: 'income' },
        { name: 'Presentes', icon: 'gift', color: '#10b981', type: 'income' },
        { name: 'Moradia', icon: 'home', color: '#3b82f6', type: 'expense' },
        { name: 'Alimentação', icon: 'utensils', color: '#f59e0b', type: 'expense' },
        { name: 'Transporte', icon: 'car', color: '#f59e0b', type: 'expense' },
        { name: 'Entretenimento', icon: 'film', color: '#8b5cf6', type: 'expense' },
        { name: 'Serviços', icon: 'zap', color: '#ef4444', type: 'expense' },
        { name: 'Saúde', icon: 'activity', color: '#ef4444', type: 'expense' },
        { name: 'Dívidas', icon: 'credit-card', color: '#ef4444', type: 'expense' },
      ];
      
      for (const category of defaultCategories) {
        await query(`
          INSERT INTO categories (name, icon, color, type, user_id)
          VALUES ($1, $2, $3, $4, $5)
        `, [category.name, category.icon, category.color, category.type, 'admin-dev-uid']);
      }
      
      log('Categorias padrão criadas para o usuário admin', 'postgres');
      
      // Criar uma conta padrão para o usuário admin
      await query(`
        INSERT INTO accounts (name, type, balance, user_id)
        VALUES ($1, $2, $3, $4)
      `, ['Conta Corrente', 'bank', 1000, 'admin-dev-uid']);
      
      log('Conta padrão criada para o usuário admin', 'postgres');
    }

    log('Tabelas do PostgreSQL inicializadas com sucesso', 'postgres');
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] as User | undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] as User | undefined;
  }

  async getUserByUid(uid: string): Promise<User | undefined> {
    const result = await query('SELECT * FROM users WHERE uid = $1', [uid]);
    return result.rows[0] as User | undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await query(
      'INSERT INTO users (username, password, display_name, email, photo_url, uid) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [user.username, user.password, user.displayName, user.email, user.photoURL, user.uid]
    );
    return result.rows[0] as User;
  }

  // Category operations
  async getCategories(userId: string): Promise<Category[]> {
    const result = await query('SELECT * FROM categories WHERE user_id = $1', [userId]);
    return result.rows as Category[];
  }

  async getCategoryById(id: number, userId: string): Promise<Category | undefined> {
    const result = await query('SELECT * FROM categories WHERE id = $1 AND user_id = $2', [id, userId]);
    return result.rows[0] as Category | undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await query(
      'INSERT INTO categories (name, icon, color, type, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [category.name, category.icon, category.color, category.type, category.userId]
    );
    return result.rows[0] as Category;
  }

  async updateCategory(id: number, category: InsertCategory, userId: string): Promise<Category> {
    const result = await query(
      'UPDATE categories SET name = $1, icon = $2, color = $3, type = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
      [category.name, category.icon, category.color, category.type, id, userId]
    );
    return result.rows[0] as Category;
  }

  async deleteCategory(id: number, userId: string): Promise<void> {
    await query('DELETE FROM categories WHERE id = $1 AND user_id = $2', [id, userId]);
  }

  // Transaction operations
  async getTransactions(userId: string, filters?: TransactionFilters): Promise<Transaction[]> {
    let queryText = 'SELECT * FROM transactions WHERE user_id = $1';
    const queryParams: any[] = [userId];
    let paramIndex = 2;

    if (filters) {
      if (filters.search) {
        queryText += ` AND description ILIKE $${paramIndex}`;
        queryParams.push(`%${filters.search}%`);
        paramIndex++;
      }

      if (filters.category !== undefined) {
        queryText += ` AND categoryId = $${paramIndex}`;
        queryParams.push(filters.category);
        paramIndex++;
      }

      if (filters.type) {
        queryText += ` AND type = $${paramIndex}`;
        queryParams.push(filters.type);
        paramIndex++;
      }

      if (filters.startDate) {
        queryText += ` AND date >= $${paramIndex}`;
        queryParams.push(filters.startDate);
        paramIndex++;
      }

      if (filters.endDate) {
        queryText += ` AND date <= $${paramIndex}`;
        queryParams.push(filters.endDate);
        paramIndex++;
      }

      if (filters.minAmount !== undefined) {
        queryText += ` AND amount >= $${paramIndex}`;
        queryParams.push(filters.minAmount);
        paramIndex++;
      }

      if (filters.maxAmount !== undefined) {
        queryText += ` AND amount <= $${paramIndex}`;
        queryParams.push(filters.maxAmount);
        paramIndex++;
      }

      if (filters.paymentMethod) {
        queryText += ` AND paymentMethod = $${paramIndex}`;
        queryParams.push(filters.paymentMethod);
        paramIndex++;
      }

      if (filters.status) {
        queryText += ` AND status = $${paramIndex}`;
        queryParams.push(filters.status);
        paramIndex++;
      }
    }

    queryText += ' ORDER BY date DESC';

    const result = await query(queryText, queryParams);
    return result.rows as Transaction[];
  }

  async getRecentTransactions(userId: string, timeRange: string, limit: number = 5): Promise<Transaction[]> {
    let startDate = new Date();
    const endDate = new Date();
    
    // Ajusta a data inicial com base no timeRange
    if (timeRange === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeRange === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (timeRange === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const result = await query(
      'SELECT * FROM transactions WHERE user_id = $1 AND date BETWEEN $2 AND $3 ORDER BY date DESC LIMIT $4',
      [userId, startDate, endDate, limit]
    );
    return result.rows as Transaction[];
  }

  async getTransactionById(id: number, userId: string): Promise<Transaction | undefined> {
    const result = await query('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
    return result.rows[0] as Transaction | undefined;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    // Primeiro, verificamos se a conta existe
    const accountResult = await query('SELECT * FROM accounts WHERE id = $1 AND user_id = $2', 
      [transaction.accountId, transaction.userId]);
    
    if (accountResult.rows.length === 0) {
      throw new Error('Account not found');
    }
    
    const account = accountResult.rows[0] as Account;
    
    // Calculamos o novo saldo da conta
    let newBalance = account.balance;
    if (transaction.type === 'income') {
      newBalance += Number(transaction.amount);
    } else {
      newBalance -= Number(transaction.amount);
    }
    
    // Iniciamos uma transação para garantir operações atômicas
    const client = await (await import('./postgres')).pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Inserimos a transação
      const transResult = await client.query(
        `INSERT INTO transactions 
        (description, amount, date, type, category_id, account_id, status, notes, receipt_url, user_id) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING *`,
        [
          transaction.description, 
          transaction.amount, 
          transaction.date, 
          transaction.type, 
          transaction.categoryId, 
          transaction.accountId, 
          transaction.status || 'completed', 
          transaction.notes, 
          transaction.receiptUrl, 
          transaction.userId
        ]
      );
      
      // Atualizamos o saldo da conta
      await client.query(
        'UPDATE accounts SET balance = $1 WHERE id = $2',
        [newBalance, transaction.accountId]
      );
      
      await client.query('COMMIT');
      return transResult.rows[0] as Transaction;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateTransaction(id: number, transaction: InsertTransaction, userId: string): Promise<Transaction> {
    // Primeiro, obtemos a transação original
    const originalTransResult = await query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (originalTransResult.rows.length === 0) {
      throw new Error('Transaction not found');
    }
    
    const originalTrans = originalTransResult.rows[0] as Transaction;
    
    // Verificamos se a conta mudou ou se o valor/tipo da transação mudou
    const accountChanged = originalTrans.accountId !== transaction.accountId;
    const amountChanged = originalTrans.amount !== transaction.amount;
    const typeChanged = originalTrans.type !== transaction.type;
    
    const client = await (await import('./postgres')).pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Se algo relevante para o saldo mudou, precisamos ajustar contas
      if (amountChanged || typeChanged || accountChanged) {
        // Restaurar saldo da conta original
        if (originalTrans.type === 'income') {
          await client.query(
            'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
            [originalTrans.amount, originalTrans.accountId]
          );
        } else {
          await client.query(
            'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
            [originalTrans.amount, originalTrans.accountId]
          );
        }
        
        // Aplicar novo valor à nova conta
        if (transaction.type === 'income') {
          await client.query(
            'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
            [transaction.amount, transaction.accountId]
          );
        } else {
          await client.query(
            'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
            [transaction.amount, transaction.accountId]
          );
        }
      }
      
      // Atualizamos a transação
      const result = await client.query(
        `UPDATE transactions SET 
        description = $1, amount = $2, date = $3, type = $4, category_id = $5, 
        account_id = $6, status = $7, notes = $8, receipt_url = $9
        WHERE id = $10 AND user_id = $11 
        RETURNING *`,
        [
          transaction.description, 
          transaction.amount, 
          transaction.date, 
          transaction.type, 
          transaction.categoryId, 
          transaction.accountId, 
          transaction.status || 'completed', 
          transaction.notes, 
          transaction.receiptUrl,
          id,
          userId
        ]
      );
      
      await client.query('COMMIT');
      return result.rows[0] as Transaction;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteTransaction(id: number, userId: string): Promise<void> {
    // Primeiro, obtemos a transação
    const transResult = await query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (transResult.rows.length === 0) {
      throw new Error('Transaction not found');
    }
    
    const transaction = transResult.rows[0] as Transaction;
    
    const client = await (await import('./postgres')).pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Restaurar saldo da conta
      if (transaction.type === 'income') {
        await client.query(
          'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
          [transaction.amount, transaction.accountId]
        );
      } else {
        await client.query(
          'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
          [transaction.amount, transaction.accountId]
        );
      }
      
      // Excluir a transação
      await client.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Account operations
  async getAccounts(userId: string): Promise<Account[]> {
    const result = await query('SELECT * FROM accounts WHERE user_id = $1', [userId]);
    return result.rows as Account[];
  }

  async getAccountById(id: number, userId: string): Promise<Account | undefined> {
    const result = await query('SELECT * FROM accounts WHERE id = $1 AND user_id = $2', [id, userId]);
    return result.rows[0] as Account | undefined;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    // Se esta é a primeira conta do usuário, definimos como padrão
    const userAccounts = await this.getAccounts(account.userId);
    
    // Na tabela accounts só temos os campos name, type, balance e user_id
    const result = await query(
      'INSERT INTO accounts (name, type, balance, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [account.name, account.type, account.balance || 0, account.userId]
    );
    return result.rows[0] as Account;
  }

  async updateAccount(id: number, account: InsertAccount, userId: string): Promise<Account> {
    const result = await query(
      'UPDATE accounts SET name = $1, type = $2, balance = $3 WHERE id = $4 AND user_id = $5 RETURNING *',
      [account.name, account.type, account.balance || 0, id, userId]
    );
    return result.rows[0] as Account;
  }

  async deleteAccount(id: number, userId: string): Promise<void> {
    // Verificamos se há transações associadas à conta
    const transResult = await query(
      'SELECT COUNT(*) FROM transactions WHERE account_id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (parseInt(transResult.rows[0].count) > 0) {
      throw new Error('Cannot delete account with associated transactions');
    }
    
    // Verificamos se a conta existe
    const accountResult = await query(
      'SELECT * FROM accounts WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (accountResult.rows.length === 0) {
      throw new Error('Account not found');
    }
    
    // Agora podemos excluir a conta
    await query('DELETE FROM accounts WHERE id = $1 AND user_id = $2', [id, userId]);
  }

  // Import operations
  async getImports(userId: string): Promise<Import[]> {
    const result = await query('SELECT * FROM imports WHERE user_id = $1 ORDER BY date_imported DESC', [userId]);
    return result.rows as Import[];
  }

  async getImportById(id: number, userId: string): Promise<Import | undefined> {
    const result = await query('SELECT * FROM imports WHERE id = $1 AND user_id = $2', [id, userId]);
    return result.rows[0] as Import | undefined;
  }

  async createImport(importData: InsertImport): Promise<Import> {
    const result = await query(
      'INSERT INTO imports (filename, type, date_imported, status, transaction_count, filesize, metadata, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [
        importData.filename, 
        importData.type, 
        importData.dateImported, 
        importData.status || 'processing', 
        importData.transactionCount || 0, 
        importData.filesize || 0, 
        importData.metadata || {}, 
        importData.userId
      ]
    );
    return result.rows[0] as Import;
  }

  async updateImport(id: number, importData: Partial<InsertImport>, userId: string): Promise<Import> {
    // Get the current import record
    const currentImport = await this.getImportById(id, userId);
    if (!currentImport) {
      throw new Error('Import record not found');
    }
    
    // Build the update query based on provided fields
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (importData.filename !== undefined) {
      fields.push(`filename = $${paramIndex++}`);
      values.push(importData.filename);
    }
    
    if (importData.type !== undefined) {
      fields.push(`type = $${paramIndex++}`);
      values.push(importData.type);
    }
    
    if (importData.dateImported !== undefined) {
      fields.push(`date_imported = $${paramIndex++}`);
      values.push(importData.dateImported);
    }
    
    if (importData.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(importData.status);
    }
    
    if (importData.transactionCount !== undefined) {
      fields.push(`transaction_count = $${paramIndex++}`);
      values.push(importData.transactionCount);
    }
    
    if (importData.filesize !== undefined) {
      fields.push(`filesize = $${paramIndex++}`);
      values.push(importData.filesize);
    }
    
    if (importData.metadata !== undefined) {
      fields.push(`metadata = $${paramIndex++}`);
      values.push(importData.metadata);
    }
    
    // Add final parameters for WHERE clause
    values.push(id);
    values.push(userId);
    
    // If no fields to update, return the current record
    if (fields.length === 0) {
      return currentImport;
    }
    
    const queryText = `UPDATE imports SET ${fields.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} RETURNING *`;
    const result = await query(queryText, values);
    return result.rows[0] as Import;
  }

  async deleteImport(id: number, userId: string): Promise<void> {
    // Verify if import exists
    const importRecord = await this.getImportById(id, userId);
    if (!importRecord) {
      throw new Error('Import record not found');
    }
    
    // Agora podemos excluir o registro de importação
    await query('DELETE FROM imports WHERE id = $1 AND user_id = $2', [id, userId]);
  }

  // Dashboard operations
  async getDashboardSummary(userId: string, timeRange: string): Promise<DashboardSummary> {
    // Define intervalos de data com base no timeRange
    let currentStartDate = new Date();
    let currentEndDate = new Date();
    let previousStartDate = new Date();
    let previousEndDate = new Date();
    
    if (timeRange === 'week') {
      currentStartDate.setDate(currentStartDate.getDate() - 7);
      previousStartDate.setDate(previousStartDate.getDate() - 14);
      previousEndDate.setDate(previousEndDate.getDate() - 7);
    } else if (timeRange === 'month') {
      currentStartDate.setMonth(currentStartDate.getMonth() - 1);
      previousStartDate.setMonth(previousStartDate.getMonth() - 2);
      previousEndDate.setMonth(previousEndDate.getMonth() - 1);
    } else if (timeRange === 'year') {
      currentStartDate.setFullYear(currentStartDate.getFullYear() - 1);
      previousStartDate.setFullYear(previousStartDate.getFullYear() - 2);
      previousEndDate.setFullYear(previousEndDate.getFullYear() - 1);
    }
    
    // Obter saldo total das contas
    const accountsResult = await query(
      'SELECT SUM(balance) as total FROM accounts WHERE user_id = $1',
      [userId]
    );
    const totalBalance = parseFloat(accountsResult.rows[0]?.total || '0');
    
    // Obter receitas e despesas do período atual
    const currentResult = await query(
      `SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
      FROM transactions 
      WHERE user_id = $1 AND date BETWEEN $2 AND $3`,
      [userId, currentStartDate, currentEndDate]
    );
    
    const income = parseFloat(currentResult.rows[0]?.income || '0');
    const expenses = parseFloat(currentResult.rows[0]?.expenses || '0');
    const savings = income - expenses;
    
    // Obter receitas e despesas do período anterior
    const previousResult = await query(
      `SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
      FROM transactions 
      WHERE user_id = $1 AND date BETWEEN $2 AND $3`,
      [userId, previousStartDate, previousEndDate]
    );
    
    const prevIncome = parseFloat(previousResult.rows[0]?.income || '0');
    const prevExpenses = parseFloat(previousResult.rows[0]?.expenses || '0');
    const prevSavings = prevIncome - prevExpenses;
    
    // Obter saldo do início do período
    const balanceStartResult = await query(
      `SELECT SUM(
        CASE 
          WHEN type = 'income' THEN amount 
          WHEN type = 'expense' THEN -amount
          ELSE 0 
        END
      ) as balance_change
      FROM transactions 
      WHERE user_id = $1 AND date < $2`,
      [userId, currentStartDate]
    );
    
    const prevAccountsResult = await query(
      'SELECT SUM(balance) as total FROM accounts WHERE user_id = $1',
      [userId]
    );
    
    const currentBalanceChange = parseFloat(balanceStartResult.rows[0]?.balance_change || '0');
    const prevTotalBalance = totalBalance - currentBalanceChange;
    
    return {
      totalBalance,
      income,
      expenses,
      savings,
      periodChange: {
        balance: prevTotalBalance !== 0 ? ((totalBalance - prevTotalBalance) / prevTotalBalance) * 100 : 0,
        income: prevIncome !== 0 ? ((income - prevIncome) / prevIncome) * 100 : 0,
        expenses: prevExpenses !== 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : 0,
        savings: prevSavings !== 0 ? ((savings - prevSavings) / prevSavings) * 100 : 0
      }
    };
  }
}