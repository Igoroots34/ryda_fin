import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Building, CreditCard } from "lucide-react";
import { uploadFile } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { ImportResult } from "@shared/schema";

interface ImportOptionsProps {
  onImportSuccess: (importResult: ImportResult) => void;
}

const ImportOptions: React.FC<ImportOptionsProps> = ({ onImportSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [bankType, setBankType] = useState("");
  const [cardType, setCardType] = useState("");
  const [bankFile, setBankFile] = useState<File | null>(null);
  const [cardFile, setCardFile] = useState<File | null>(null);
  const [bankLoading, setBankLoading] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);
  
  const handleBankFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 10MB",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast({
          title: "Invalid file format",
          description: "Please upload CSV or Excel files only",
          variant: "destructive",
        });
        return;
      }
      
      setBankFile(file);
    }
  };
  
  const handleCardFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 10MB",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.pdf')) {
        toast({
          title: "Invalid file format",
          description: "Please upload CSV or PDF files only",
          variant: "destructive",
        });
        return;
      }
      
      setCardFile(file);
    }
  };
  
  const handleBankImport = async () => {
    if (!bankFile || !bankType || !user) {
      toast({
        title: "Missing information",
        description: "Please select a bank and upload a file",
        variant: "destructive",
      });
      return;
    }
    
    setBankLoading(true);
    
    try {
      // Upload file to Firebase Storage
      const fileName = `imports/${user.uid}/${Date.now()}_${bankFile.name}`;
      const fileUrl = await uploadFile(bankFile, fileName);
      
      // Send to backend for processing
      const res = await apiRequest('POST', '/api/import/bank-statement', {
        fileUrl,
        fileName: bankFile.name,
        fileSize: bankFile.size,
        bankType,
        userId: user.uid,
      });
      
      const importResult = await res.json();
      
      toast({
        title: "Import successful",
        description: `${importResult.transactionsImported} transactions imported`,
      });
      
      onImportSuccess(importResult);
      setBankFile(null);
      setBankType("");
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: "There was an error importing your bank statement",
        variant: "destructive",
      });
    } finally {
      setBankLoading(false);
    }
  };
  
  const handleCardImport = async () => {
    if (!cardFile || !cardType || !user) {
      toast({
        title: "Missing information",
        description: "Please select a card provider and upload a file",
        variant: "destructive",
      });
      return;
    }
    
    setCardLoading(true);
    
    try {
      // Upload file to Firebase Storage
      const fileName = `imports/${user.uid}/${Date.now()}_${cardFile.name}`;
      const fileUrl = await uploadFile(cardFile, fileName);
      
      // Send to backend for processing
      const res = await apiRequest('POST', '/api/import/credit-card', {
        fileUrl,
        fileName: cardFile.name,
        fileSize: cardFile.size,
        cardType,
        userId: user.uid,
      });
      
      const importResult = await res.json();
      
      toast({
        title: "Import successful",
        description: `${importResult.transactionsImported} transactions imported`,
      });
      
      onImportSuccess(importResult);
      setCardFile(null);
      setCardType("");
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: "There was an error importing your credit card statement",
        variant: "destructive",
      });
    } finally {
      setCardLoading(false);
    }
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Bank Statement Import */}
      <Card className="shadow-sm">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-lg font-semibold">Import Bank Statement</CardTitle>
            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Upload your bank statement CSV file to automatically import your transactions.
          </p>
        </CardHeader>
        
        <CardContent>
          {/* Supported Banks */}
          <div className="mb-4">
            <Label htmlFor="bank-select">Select Your Bank</Label>
            <Select value={bankType} onValueChange={setBankType}>
              <SelectTrigger id="bank-select">
                <SelectValue placeholder="Choose a bank..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank-of-america">Bank of America</SelectItem>
                <SelectItem value="chase">Chase</SelectItem>
                <SelectItem value="wells-fargo">Wells Fargo</SelectItem>
                <SelectItem value="citibank">Citibank</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
            <div className="mb-4 flex justify-center">
              <Upload className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium mb-2">Drag and drop your CSV or Excel file here</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">or</p>
            <Button 
              onClick={() => document.getElementById('bank-file-upload')?.click()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Browse Files
            </Button>
            <input 
              id="bank-file-upload" 
              type="file" 
              accept=".csv,.xlsx,.xls" 
              className="hidden" 
              onChange={handleBankFileChange}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Supported formats: .csv, .xlsx, .xls (max 10MB)</p>
            
            {bankFile && (
              <div className="mt-4">
                <p className="text-sm font-medium text-green-500">Selected: {bankFile.name}</p>
                <Button 
                  onClick={handleBankImport}
                  className="mt-2"
                  disabled={bankLoading}
                >
                  {bankLoading ? "Importing..." : "Import Transactions"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Credit Card Statement Import */}
      <Card className="shadow-sm">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-lg font-semibold">Import Credit Card Statement</CardTitle>
            <div className="h-10 w-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Upload your credit card statement PDF or CSV to import your expenses.
          </p>
        </CardHeader>
        
        <CardContent>
          {/* Supported Credit Cards */}
          <div className="mb-4">
            <Label htmlFor="card-select">Select Your Credit Card Provider</Label>
            <Select value={cardType} onValueChange={setCardType}>
              <SelectTrigger id="card-select">
                <SelectValue placeholder="Choose a provider..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visa">Visa</SelectItem>
                <SelectItem value="mastercard">Mastercard</SelectItem>
                <SelectItem value="amex">American Express</SelectItem>
                <SelectItem value="discover">Discover</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
            <div className="mb-4 flex justify-center">
              <Upload className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium mb-2">Drag and drop your PDF or CSV file here</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">or</p>
            <Button 
              onClick={() => document.getElementById('card-file-upload')?.click()}
              className="bg-red-600 hover:bg-red-700"
            >
              Browse Files
            </Button>
            <input 
              id="card-file-upload" 
              type="file" 
              accept=".pdf,.csv" 
              className="hidden" 
              onChange={handleCardFileChange}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Supported formats: .pdf, .csv (max 10MB)</p>
            
            {cardFile && (
              <div className="mt-4">
                <p className="text-sm font-medium text-green-500">Selected: {cardFile.name}</p>
                <Button 
                  onClick={handleCardImport}
                  className="mt-2"
                  disabled={cardLoading}
                >
                  {cardLoading ? "Importing..." : "Import Transactions"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportOptions;
