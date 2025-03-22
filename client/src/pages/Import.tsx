import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ImportOptions from "@/components/import/ImportOptions";
import ImportHistory from "@/components/import/ImportHistory";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Import, ImportResult } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const ImportPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [importToDelete, setImportToDelete] = useState<Import | null>(null);
  const [viewImportOpen, setViewImportOpen] = useState(false);
  const [viewingImport, setViewingImport] = useState<Import | null>(null);
  
  // Get import history
  const { data: imports, isLoading: importsLoading } = useQuery<Import[]>({
    queryKey: ['/api/imports', user?.uid],
    enabled: !!user,
  });
  
  // Handle view import
  const handleViewImport = (importItem: Import) => {
    setViewingImport(importItem);
    setViewImportOpen(true);
  };
  
  // Handle delete import
  const handleDeleteImport = (importItem: Import) => {
    setImportToDelete(importItem);
    setDeleteConfirmOpen(true);
  };
  
  // Confirm delete import
  const confirmDeleteImport = async () => {
    if (!importToDelete) return;
    
    try {
      await apiRequest('DELETE', `/api/imports/${importToDelete.id}`, {
        userId: user?.uid
      });
      
      toast({
        title: "Import deleted",
        description: "The import has been successfully deleted",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/imports'] });
    } catch (error) {
      console.error("Error deleting import:", error);
      toast({
        title: "Error",
        description: "Failed to delete the import",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setImportToDelete(null);
    }
  };
  
  // Handle import success
  const handleImportSuccess = (importResult: ImportResult) => {
    queryClient.invalidateQueries({ queryKey: ['/api/imports'] });
    queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
  };
  
  // Loading state
  if (importsLoading || !user) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex justify-center items-center h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading">Import Statements</h1>
        <p className="text-gray-500 dark:text-gray-400">Import bank statements and credit card invoices to track your finances</p>
      </div>
      
      <ImportOptions onImportSuccess={handleImportSuccess} />
      
      <ImportHistory
        imports={imports || []}
        onView={handleViewImport}
        onDelete={handleDeleteImport}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this import and all associated transactions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteImport} className="bg-red-500 text-white hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* View Import Dialog */}
      <Dialog open={viewImportOpen} onOpenChange={setViewImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Details</DialogTitle>
            <DialogDescription>
              Details of the imported file and resulting transactions
            </DialogDescription>
          </DialogHeader>
          
          {viewingImport && (
            <div className="space-y-4 py-4">
              <div>
                <h4 className="text-sm font-medium mb-1">File Name</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">{viewingImport.filename}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Type</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {viewingImport.type === "bank_statement" ? "Bank Statement" : "Credit Card"}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Date Imported</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {new Date(viewingImport.dateImported).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Transactions Imported</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">{viewingImport.transactionCount} transactions</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Status</h4>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  viewingImport.status === 'completed' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : viewingImport.status === 'processing'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {viewingImport.status.charAt(0).toUpperCase() + viewingImport.status.slice(1)}
                </div>
              </div>
              
              {viewingImport.metadata && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Additional Information</h4>
                  <div className="text-sm text-gray-700 dark:text-gray-300 overflow-auto max-h-32 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    <pre>{JSON.stringify(viewingImport.metadata, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setViewImportOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImportPage;
