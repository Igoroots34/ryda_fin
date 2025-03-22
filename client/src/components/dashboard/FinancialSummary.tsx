import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { 
  Wallet, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  PiggyBank, 
  ArrowUp, 
  ArrowDown 
} from "lucide-react";

interface SummaryCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  iconBgClass: string;
  iconTextClass: string;
  change: number;
  amountClass?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  amount,
  icon,
  iconBgClass,
  iconTextClass,
  change,
  amountClass = "",
}) => {
  const isPositiveChange = change >= 0;

  return (
    <Card className="bg-white dark:bg-neutral-dark shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <h3 className={`text-2xl font-bold mt-1 ${amountClass}`}>{formatCurrency(amount)}</h3>
          </div>
          <div className={`w-12 h-12 ${iconBgClass} rounded-full flex items-center justify-center`}>
            {icon}
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <span className={`flex items-center text-sm font-medium ${isPositiveChange ? "text-green-500" : "text-red-500"}`}>
            {isPositiveChange ? (
              <ArrowUp className="mr-1 w-4 h-4" />
            ) : (
              <ArrowDown className="mr-1 w-4 h-4" />
            )}
            {Math.abs(change).toFixed(1)}%
          </span>
          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">from last period</span>
        </div>
      </CardContent>
    </Card>
  );
};

interface FinancialSummaryProps {
  totalBalance: number;
  income: number;
  expenses: number;
  savings: number;
  periodChange: {
    balance: number;
    income: number;
    expenses: number;
    savings: number;
  };
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  totalBalance,
  income,
  expenses,
  savings,
  periodChange,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <SummaryCard
        title="Total Balance"
        amount={totalBalance}
        icon={<Wallet className="text-blue-600 dark:text-blue-400" />}
        iconBgClass="bg-blue-100 dark:bg-blue-900/30"
        iconTextClass="text-blue-600 dark:text-blue-400"
        change={periodChange.balance}
      />
      
      <SummaryCard
        title="Income"
        amount={income}
        icon={<ArrowDownToLine className="text-primary" />}
        iconBgClass="bg-green-100 dark:bg-green-900/30"
        iconTextClass="text-primary"
        change={periodChange.income}
        amountClass="text-primary"
      />
      
      <SummaryCard
        title="Expenses"
        amount={expenses}
        icon={<ArrowUpFromLine className="text-red-500" />}
        iconBgClass="bg-red-100 dark:bg-red-900/30"
        iconTextClass="text-red-500"
        change={periodChange.expenses}
        amountClass="text-red-500"
      />
      
      <SummaryCard
        title="Savings"
        amount={savings}
        icon={<PiggyBank className="text-secondary" />}
        iconBgClass="bg-teal-100 dark:bg-teal-900/30"
        iconTextClass="text-secondary"
        change={periodChange.savings}
        amountClass="text-secondary"
      />
    </div>
  );
};

export default FinancialSummary;
