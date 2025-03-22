import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Import } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { Eye, Trash2, FileText, FileSpreadsheet } from "lucide-react";
import { useState } from "react";

interface ImportHistoryProps {
  imports: Import[];
  onView: (importItem: Import) => void;
  onDelete: (importItem: Import) => void;
}

const ImportHistory: React.FC<ImportHistoryProps> = ({
  imports,
  onView,
  onDelete,
}) => {
  const [showAll, setShowAll] = useState(false);
  
  const displayImports = showAll ? imports : imports.slice(0, 3);
  
  const getFileIcon = (type: string, filename: string) => {
    if (filename.endsWith('.pdf')) {
      return <FileText className="text-red-600 dark:text-red-400" />;
    } else if (filename.endsWith('.csv') || filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      return <FileSpreadsheet className="text-blue-600 dark:text-blue-400" />;
    } else {
      return <FileText className="text-gray-600 dark:text-gray-400" />;
    }
  };
  
  const getFileBgColor = (filename: string) => {
    if (filename.endsWith('.pdf')) {
      return "bg-red-100 dark:bg-red-900/30";
    } else if (filename.endsWith('.csv') || filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      return "bg-blue-100 dark:bg-blue-900/30";
    } else {
      return "bg-gray-100 dark:bg-gray-800";
    }
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400";
      case "processing":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400";
      case "failed":
        return "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300";
    }
  };
  
  const formatFileSize = (size: number | undefined) => {
    if (!size) return "N/A";
    
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="p-5 border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-base font-semibold">Import History</CardTitle>
      </CardHeader>
      
      <div className="overflow-x-auto">
        <table className="w-full min-w-full">
          <thead>
            <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th className="px-5 py-3">File Name</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Date Imported</th>
              <th className="px-5 py-3">Transactions</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {displayImports.length > 0 ? (
              displayImports.map((importItem) => (
                <tr key={importItem.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`h-8 w-8 flex-shrink-0 rounded-full ${getFileBgColor(importItem.filename)} flex items-center justify-center`}>
                        {getFileIcon(importItem.type, importItem.filename)}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium">{importItem.filename}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(importItem.filesize)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {importItem.type === "bank_statement" ? "Bank Statement" : "Credit Card"}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(importItem.dateImported)}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {importItem.transactionCount} items
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <Badge
                      variant="outline"
                      className={getStatusBadgeVariant(importItem.status)}
                    >
                      {importItem.status.charAt(0).toUpperCase() + importItem.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right text-sm">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onView(importItem)}
                      className="mr-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(importItem)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                  No imports found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <CardContent className="px-5 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {displayImports.length} of {imports.length} imported files
        </div>
        {imports.length > 3 && (
          <Button
            variant="link"
            onClick={() => setShowAll(!showAll)}
            className="text-primary hover:text-primary-dark text-sm font-medium"
          >
            {showAll ? "Show Less" : "View All"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ImportHistory;
