import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import FinancialSummary from "@/components/dashboard/FinancialSummary";
import ChartsSection from "@/components/dashboard/ChartsSection";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import NewTransactionModal from "@/components/transactions/NewTransactionModal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getRelativeDateRange, calculatePercentChange } from "@/lib/utils";
import { InsertTransaction, Transaction, Category, DashboardSummary } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [timeFilter, setTimeFilter] = useState<string>("month");
  const [isNewTransactionOpen, setIsNewTransactionOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  
  // Get dashboard data
  const { data: dashboardData, isLoading: dashboardLoading, refetch: refetchDashboard } = useQuery<DashboardSummary>({
    queryKey: ['/api/dashboard', timeFilter, user?.uid],
    enabled: !!user,
  });
  
  // Get transactions
  const { data: transactions, isLoading: transactionsLoading, refetch: refetchTransactions } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions/recent', timeFilter, user?.uid],
    enabled: !!user,
  });
  
  // Get categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories', user?.uid],
    enabled: !!user,
  });
  
  // Chart data preparation
  const prepareIncomeExpenseData = () => {
    if (!transactions) return [];
    
    const { startDate, endDate } = getRelativeDateRange(timeFilter);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    
    // Determine the interval based on the timeFilter
    let interval = 'day';
    if (timeFilter === 'year') {
      interval = 'month';
    } else if (timeFilter === 'month') {
      interval = 'week';
    }
    
    // Group the transactions by date interval
    const groupedData = new Map();
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      let key = '';
      
      if (interval === 'day') {
        key = date.toLocaleDateString();
      } else if (interval === 'week') {
        // Get the week number
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const weekNumber = Math.ceil(((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
        key = `Week ${weekNumber}`;
      } else if (interval === 'month') {
        key = date.toLocaleDateString('en-US', { month: 'short' });
      }
      
      if (!groupedData.has(key)) {
        groupedData.set(key, { name: key, income: 0, expenses: 0 });
      }
      
      const item = groupedData.get(key);
      if (transaction.type === 'income') {
        item.income += transaction.amount;
      } else {
        item.expenses += transaction.amount;
      }
    });
    
    return Array.from(groupedData.values());
  };
  
  const prepareCategoryData = () => {
    if (!transactions || !categories) return [];
    
    // Filter to expenses only
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    
    // Group by category
    const categoryMap = new Map();
    
    expenses.forEach(transaction => {
      const categoryId = transaction.categoryId;
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, 0);
      }
      categoryMap.set(categoryId, categoryMap.get(categoryId) + transaction.amount);
    });
    
    // Map to chart format
    const chartData = Array.from(categoryMap.entries()).map(([categoryId, amount]) => {
      const category = categories.find(c => c.id === categoryId);
      return {
        name: category?.name || 'Uncategorized',
        value: amount,
        color: category?.color || '#888888',
        percentage: Math.round((amount as number / totalExpenses) * 100)
      };
    });
    
    // Sort by value, descending
    return chartData.sort((a, b) => b.value - a.value);
  };
  
  // Handle filter change
  const handleFilterChange = (filter: string) => {
    setTimeFilter(filter);
  };
  
  // Handle edit transaction
  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsNewTransactionOpen(true);
  };
  
  // Handle delete transaction
  const handleDeleteTransaction = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setDeleteConfirmOpen(true);
  };
  
  // Confirm delete transaction
  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    
    try {
      await apiRequest('DELETE', `/api/transactions/${transactionToDelete.id}`, {
        userId: user?.uid
      });
      
      toast({
        title: "Transaction deleted",
        description: "The transaction has been successfully deleted",
      });
      
      // Refresh data
      refetchDashboard();
      refetchTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast({
        title: "Error",
        description: "Failed to delete the transaction",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setTransactionToDelete(null);
    }
  };
  
  // Handle save transaction
  const handleSaveTransaction = async (transaction: InsertTransaction) => {
    try {
      if (editingTransaction) {
        await apiRequest('PATCH', `/api/transactions/${editingTransaction.id}`, transaction);
        toast({
          title: "Transaction updated",
          description: "The transaction has been successfully updated",
        });
      } else {
        await apiRequest('POST', '/api/transactions', transaction);
        toast({
          title: "Transaction created",
          description: "The transaction has been successfully created",
        });
      }
      
      // Refresh data
      refetchDashboard();
      refetchTransactions();
    } catch (error) {
      console.error("Error saving transaction:", error);
      toast({
        title: "Error",
        description: "Failed to save the transaction",
        variant: "destructive",
      });
    } finally {
      setIsNewTransactionOpen(false);
      setEditingTransaction(null);
    }
  };
  
  // Loading state
  if (dashboardLoading || transactionsLoading || categoriesLoading || !user) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex justify-center items-center h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  const defaultSummary = {
    totalBalance: 0,
    income: 0,
    expenses: 0,
    savings: 0,
    periodChange: {
      balance: 0,
      income: 0,
      expenses: 0,
      savings: 0
    }
  };
  
  const summary = dashboardData || defaultSummary;
  const incomeExpenseData = prepareIncomeExpenseData();
  const categoryData = prepareCategoryData();
  
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <DashboardHeader
        title="Financial Dashboard"
        subtitle="Track your financial health and transactions"
        onFilterChange={handleFilterChange}
        currentFilter={timeFilter}
      />
      
      <FinancialSummary
        totalBalance={summary.totalBalance}
        income={summary.income}
        expenses={summary.expenses}
        savings={summary.savings}
        periodChange={summary.periodChange}
      />
      
      <ChartsSection
        incomeExpenseData={incomeExpenseData}
        categoryData={categoryData}
        timeRange={timeFilter}
      />
      
      <RecentTransactions
        transactions={transactions || []}
        categories={categories || []}
        onEdit={handleEditTransaction}
        onDelete={handleDeleteTransaction}
      />
      
      {/* New/Edit Transaction Modal */}
      {isNewTransactionOpen && (
        <NewTransactionModal
          isOpen={isNewTransactionOpen}
          onClose={() => {
            setIsNewTransactionOpen(false);
            setEditingTransaction(null);
          }}
          onSave={handleSaveTransaction}
          editTransaction={editingTransaction}
          categories={categories || []}
          accounts={[]}
          userId={user.uid}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this transaction. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTransaction} className="bg-red-500 text-white hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
