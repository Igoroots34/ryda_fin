import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction, Category } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Home, Briefcase, Utensils, CreditCard, Film, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface RecentTransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

const categoryIcons: Record<string, React.ReactElement> = {
  "Housing": <Home className="h-4 w-4" />,
  "Income": <Briefcase className="h-4 w-4" />,
  "Food": <Utensils className="h-4 w-4" />,
  "Debt": <CreditCard className="h-4 w-4" />,
  "Entertainment": <Film className="h-4 w-4" />,
};

const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  categories,
  onEdit,
  onDelete,
}) => {
  const [filter, setFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 5;
  
  // Filter transactions based on the selected filter
  const filteredTransactions = transactions.filter(transaction => {
    if (filter === "all") return true;
    return transaction.type === filter;
  });
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );
  
  // Get category by ID
  const getCategoryById = (categoryId: number) => {
    return categories.find(category => category.id === categoryId);
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
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="p-5 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base font-semibold mb-2 sm:mb-0">Recent Transactions</CardTitle>
        <div className="flex space-x-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className="text-sm"
          >
            All
          </Button>
          <Button
            variant={filter === "income" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("income")}
            className="text-sm"
          >
            Income
          </Button>
          <Button
            variant={filter === "expense" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("expense")}
            className="text-sm"
          >
            Expense
          </Button>
        </div>
      </CardHeader>
      
      <div className="overflow-x-auto">
        <table className="w-full min-w-full">
          <thead>
            <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th className="px-5 py-3">Description</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {currentTransactions.length > 0 ? (
              currentTransactions.map((transaction) => {
                const category = getCategoryById(transaction.categoryId);
                
                return (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`h-8 w-8 flex-shrink-0 rounded-full ${getCategoryBgColor(transaction.categoryId)} ${getCategoryTextColor(transaction.categoryId)} flex items-center justify-center`}>
                          {getCategoryIcon(transaction.categoryId)}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium">{transaction.description}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{transaction.notes?.substring(0, 20) || category?.name}</p>
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
                <td colSpan={5} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                  No transactions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <CardContent className="px-5 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {indexOfFirstTransaction + 1} to {Math.min(indexOfLastTransaction, filteredTransactions.length)} of {filteredTransactions.length} transactions
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
            
            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
              const pageNumber = i + 1;
              return (
                <Button
                  key={pageNumber}
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(pageNumber)}
                >
                  {pageNumber}
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
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;
