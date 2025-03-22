import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  onFilterChange: (filter: string) => void;
  currentFilter: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  onFilterChange,
  currentFilter,
}) => {
  const filters = ["week", "month", "year", "custom"];
  
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">{title}</h1>
        <p className="text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
      
      <div className="mt-4 lg:mt-0 flex items-center space-x-2 bg-white dark:bg-neutral-dark p-1 rounded-md shadow-sm">
        {filters.map((filter) => (
          <Button
            key={filter}
            variant="ghost"
            size="sm"
            onClick={() => onFilterChange(filter)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md",
              currentFilter === filter
                ? "bg-primary/10 text-primary"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default DashboardHeader;
