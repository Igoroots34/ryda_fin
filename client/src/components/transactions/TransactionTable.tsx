import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Transaction, Category, Account } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/utils";
import { 
  CreditCard, 
  Home, 
  Utensils, 
  Film, 
  Briefcase, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";

interface TransactionTableProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

const categoryIcons: Record<string, React.ReactElement> = {
  "Housing": <Home className="h-4 w-4" />,
  "Salary": <Briefcase className="h-4 w-4" />,
  "Food": <Utensils className="h-4 w-4" />,
  "Entertainment": <Film className="h-4 w-4" />,
  "Debt": <CreditCard className="h-4 w-4" />,
};

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  categories,
  accounts,
  onEdit,
  onDelete,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);
  const transactionsPerPage = 10;
  
  // Calculate pagination
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = transactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );
  
  // Get category by ID
  const getCategoryById = (categoryId: number) => {
    return categories.find(category => category.id === categoryId);
  };
  
  // Get account by ID
  const getAccountById = (accountId: number | undefined) => {
    if (!accountId) return undefined;
    return accounts.find(account => account.id === accountId);
  };
  
  // Get appropriate icon for category
  const getCategoryIcon = (categoryId: number) => {
    const category = getCategoryById(categoryId);
    if (!category) return null;
    
    return categoryIcons[category.name] || null;
  };
  
  const getCategoryBgColor = (categoryId: number) => {
    const category = getCategoryById(categoryId);
    if (!category) return "bg-gray-100 dark:bg-gray-800";
    
    switch (category.type) {
      case "income":
        return "bg-green-100 dark:bg-green-900/30";
      case "expense":
        // Different colors for different expense categories
        if (category.name === "Housing") return "bg-blue-100 dark:bg-blue-900/30";
        if (category.name === "Food") return "bg-amber-100 dark:bg-amber-900/30";
        if (category.name === "Entertainment") return "bg-purple-100 dark:bg-purple-900/30";
        if (category.name === "Debt") return "bg-red-100 dark:bg-red-900/30";
        return "bg-gray-100 dark:bg-gray-800";
      default:
        return "bg-gray-100 dark:bg-gray-800";
    }
  };
  
  const getCategoryTextColor = (categoryId: number) => {
    const category = getCategoryById(categoryId);
    if (!category) return "text-gray-600 dark:text-gray-300";
    
    switch (category.type) {
      case "income":
        return "text-green-600 dark:text-green-400";
      case "expense":
        if (category.name === "Housing") return "text-blue-600 dark:text-blue-400";
        if (category.name === "Food") return "text-amber-600 dark:text-amber-400";
        if (category.name === "Entertainment") return "text-purple-600 dark:text-purple-400";
        if (category.name === "Debt") return "text-red-600 dark:text-red-400";
        return "text-gray-600 dark:text-gray-300";
      default:
        return "text-gray-600 dark:text-gray-300";
    }
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400";
      case "cancelled":
        return "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300";
    }
  };
  
  const handleSelectAll = () => {
    if (selectedTransactions.length === currentTransactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(currentTransactions.map(t => t.id));
    }
  };
  
  const handleSelectTransaction = (id: number) => {
    if (selectedTransactions.includes(id)) {
      setSelectedTransactions(selectedTransactions.filter(transId => transId !== id));
    } else {
      setSelectedTransactions([...selectedTransactions, id]);
    }
  };
  
  return (
    <Card className="bg-white dark:bg-neutral-dark shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-full">
          <thead>
            <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
              <th className="px-5 py-3">
                <div className="flex items-center">
                  <Checkbox 
                    checked={selectedTransactions.length === currentTransactions.length && currentTransactions.length > 0}
                    onCheckedChange={handleSelectAll}
                    className="h-4 w-4"
                  />
                </div>
              </th>
              <th className="px-5 py-3">Description</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {currentTransactions.length > 0 ? (
              currentTransactions.map((transaction) => {
                const category = getCategoryById(transaction.categoryId);
                const account = getAccountById(transaction.accountId);
                
                return (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Checkbox 
                          checked={selectedTransactions.includes(transaction.id)}
                          onCheckedChange={() => handleSelectTransaction(transaction.id)}
                          className="h-4 w-4"
                        />
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`h-8 w-8 flex-shrink-0 rounded-full ${getCategoryBgColor(transaction.categoryId)} ${getCategoryTextColor(transaction.categoryId)} flex items-center justify-center`}>
                          {getCategoryIcon(transaction.categoryId)}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium">{transaction.description}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {account ? account.name : (transaction.notes?.substring(0, 20) || "N/A")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={`${getCategoryBgColor(transaction.categoryId)} ${getCategoryTextColor(transaction.categoryId)}`}
                      >
                        {category?.name || "Uncategorized"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={transaction.type === "income" ? "text-green-500" : "text-red-500"}>
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={getStatusBadgeVariant(transaction.status)}
                      >
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right text-sm">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(transaction)}
                        className="mr-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(transaction)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                  No transactions found matching your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="px-5 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {indexOfFirstTransaction + 1} to {Math.min(indexOfLastTransaction, transactions.length)} of {transactions.length} transactions
        </div>
        {totalPages > 1 && (
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              // Display page numbers centered around current page
              let pageNum = i + 1;
              if (totalPages > 5) {
                if (currentPage > 3) {
                  pageNum = i + currentPage - 2;
                  if (pageNum > totalPages - 4 && currentPage < totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  }
                }
                if (pageNum > totalPages) return null;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default TransactionTable;
