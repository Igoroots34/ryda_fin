import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Paperclip } from "lucide-react";
import { Transaction, Category, Account, InsertTransaction } from "@shared/schema";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: InsertTransaction) => Promise<void>;
  editTransaction?: Transaction | null;
  categories: Category[];
  accounts: Account[];
  userId: string;
}

const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editTransaction,
  categories,
  accounts,
  userId,
}) => {
  const [transactionType, setTransactionType] = useState<"income" | "expense">("income");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [category, setCategory] = useState<string>("");
  const [account, setAccount] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Populate form when editing a transaction
  useEffect(() => {
    if (editTransaction) {
      setTransactionType(editTransaction.type as "income" | "expense");
      setDescription(editTransaction.description || "");
      setAmount(editTransaction.amount.toString());
      setDate(new Date(editTransaction.date));
      setCategory(editTransaction.categoryId.toString());
      setAccount(editTransaction.accountId?.toString() || "");
      setNotes(editTransaction.notes || "");
      setReceiptUrl(editTransaction.receiptUrl || "");
    }
  }, [editTransaction]);

  const resetForm = () => {
    setTransactionType("income");
    setDescription("");
    setAmount("");
    setDate(new Date());
    setCategory("");
    setAccount("");
    setNotes("");
    setReceiptFile(null);
    setReceiptUrl("");
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = "Valid amount is required";
    }

    if (!date) {
      newErrors.date = "Date is required";
    }

    if (!category) {
      newErrors.category = "Category is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const newTransaction: InsertTransaction = {
        description,
        amount: parseFloat(amount),
        date,
        type: transactionType,
        categoryId: parseInt(category),
        accountId: account ? parseInt(account) : undefined,
        notes: notes || undefined,
        receiptUrl: receiptUrl || undefined,
        status: "completed",
        userId,
      };

      await onSave(newTransaction);
      onClose();
    } catch (error) {
      console.error("Error saving transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  // Filter categories based on transaction type
  const filteredCategories = categories.filter(
    (cat) => cat.type === transactionType
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editTransaction ? "Edit Transaction" : "New Transaction"}
          </DialogTitle>
          <DialogDescription>
            {editTransaction
              ? "Update the details of your transaction"
              : "Add a new income or expense to your financial records"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Transaction Type Toggle */}
          <div className="flex border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden mb-4">
            <Button
              type="button"
              className={`flex-1 text-center py-2 rounded-none ${
                transactionType === "income"
                  ? "bg-primary text-white"
                  : "bg-white dark:bg-neutral-dark text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => setTransactionType("income")}
            >
              Income
            </Button>
            <Button
              type="button"
              className={`flex-1 text-center py-2 rounded-none ${
                transactionType === "expense"
                  ? "bg-primary text-white"
                  : "bg-white dark:bg-neutral-dark text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => setTransactionType("expense")}
            >
              Expense
            </Button>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Salary, Rent payment"
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <Input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`pl-8 ${errors.amount ? "border-red-500" : ""}`}
                placeholder="0.00"
              />
            </div>
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground",
                    errors.date ? "border-red-500" : ""
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <Select
              value={category}
              onValueChange={setCategory}
            >
              <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                <SelectValue placeholder="Select a category..." />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category}</p>
            )}
          </div>

          {/* Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Account
            </label>
            <Select
              value={account}
              onValueChange={setAccount}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an account..." />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id.toString()}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (Optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional information"
              rows={2}
            />
          </div>

          {/* Receipt Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Attach Receipt (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("receipt-upload")?.click()}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md"
              >
                <Paperclip className="mr-2 h-4 w-4" />
                Attach File
              </Button>
              <input
                id="receipt-upload"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                PNG, JPG, or PDF (max 5MB)
              </p>
              {receiptFile && (
                <p className="text-xs text-green-500 mt-1">{receiptFile.name}</p>
              )}
              {receiptUrl && !receiptFile && (
                <p className="text-xs text-green-500 mt-1">Receipt attached</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Transaction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewTransactionModal;
