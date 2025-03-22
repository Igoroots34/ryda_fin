import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import TransactionFilters from "@/components/transactions/TransactionFilters";
import TransactionTable from "@/components/transactions/TransactionTable";
import NewTransactionModal from "@/components/transactions/NewTransactionModal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Plus } from "lucide-react";
import { Transaction, Category, Account, InsertTransaction, TransactionFilters as FiltersType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

const Transactions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState<FiltersType>({});
  const [isNewTransactionOpen, setIsNewTransactionOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  
  // Get transactions with filters
  const { data: transactions, isLoading: transactionsLoading, refetch: refetchTransactions } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', filters, user?.uid],
    enabled: !!user,
  });
  
  // Get categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories', user?.uid],
    enabled: !!user,
  });
  
  // Get accounts
  const { data: accounts, isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ['/api/accounts', user?.uid],
    enabled: !!user,
  });
  
  // Handle filters
  const handleApplyFilters = (newFilters: FiltersType) => {
    setFilters(newFilters);
  };
  
  const handleResetFilters = () => {
    setFilters({});
  };
  
  // Handle new transaction
  const handleNewTransaction = () => {
    setEditingTransaction(null);
    setIsNewTransactionOpen(true);
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
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
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
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
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
  if (transactionsLoading || categoriesLoading || accountsLoading || !user) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex justify-center items-center h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">Transactions</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage and track all your financial transactions</p>
        </div>
        
        <div className="mt-4 lg:mt-0">
          <Button onClick={handleNewTransaction} className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium">
            <Plus className="mr-2 h-4 w-4" />
            New Transaction
          </Button>
        </div>
      </div>
      
      <TransactionFilters
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        categories={categories || []}
      />
      
      <TransactionTable
        transactions={transactions || []}
        categories={categories || []}
        accounts={accounts || []}
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
          accounts={accounts || []}
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

export default Transactions;
