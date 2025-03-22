import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { User } from "@/lib/firebase";
import { 
  ChartPie, 
  ArrowUpDown, 
  Import, 
  Tags, 
  BarChart3, 
  User as UserIcon, 
  Settings,
  Wallet
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, user }) => {
  const [location] = useLocation();
  
  // Navigation items
  const navItems = [
    { 
      href: "/dashboard", 
      label: "Dashboard", 
      icon: <ChartPie className="w-5 h-5 mr-2" /> 
    },
    { 
      href: "/transactions", 
      label: "Transactions", 
      icon: <ArrowUpDown className="w-5 h-5 mr-2" /> 
    },
    { 
      href: "/import", 
      label: "Import Data", 
      icon: <Import className="w-5 h-5 mr-2" /> 
    },
    { 
      href: "/categories", 
      label: "Categories", 
      icon: <Tags className="w-5 h-5 mr-2" /> 
    },
    { 
      href: "/reports", 
      label: "Reports", 
      icon: <BarChart3 className="w-5 h-5 mr-2" /> 
    }
  ];
  
  const settingsItems = [
    { 
      href: "/profile", 
      label: "Profile", 
      icon: <UserIcon className="w-5 h-5 mr-2" /> 
    },
    { 
      href: "/preferences", 
      label: "Preferences", 
      icon: <Settings className="w-5 h-5 mr-2" /> 
    }
  ];
  
  return (
    <aside 
      className={cn(
        "w-64 fixed h-full bg-white dark:bg-neutral-dark shadow-md z-10 transition-all duration-300",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <h1 className="ml-2 text-lg font-bold font-heading">FinTrack</h1>
        </div>
        <button 
          className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="mt-5 px-4">
        <div className="space-y-1">
          {navItems.map(item => (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2.5 text-sm font-medium rounded-md",
                location === item.href 
                  ? "bg-primary/10 text-primary" 
                  : "text-gray-700 dark:text-gray-300 hover:bg-primary/10 hover:text-primary"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
        
        <div className="mt-8">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Settings</h3>
          <div className="mt-2 space-y-1">
            {settingsItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-md",
                  location === item.href 
                    ? "bg-primary/10 text-primary" 
                    : "text-gray-700 dark:text-gray-300 hover:bg-primary/10 hover:text-primary"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      
      {/* User Info */}
      {user && (
        <div className="absolute bottom-0 w-full border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <img 
              src={user.photoURL || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.displayName || "User")} 
              alt="User profile" 
              className="w-8 h-8 rounded-full"
            />
            <div className="ml-3">
              <p className="text-sm font-medium">{user.displayName || "User"}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
