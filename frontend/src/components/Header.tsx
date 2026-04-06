import { ShoppingCart, User, Moon, Sun,LogOut, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import logo from "../assets/Secondary_Logo.svg";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext"; 
import { useState } from "react";
import { AuthPage } from "./AuthPage";

interface HeaderProps {
  onOpenCart: () => void;  
}

export function Header({ onOpenCart }: HeaderProps) { 
  const { theme, toggleTheme } = useTheme();
  const [showAuth, setShowAuth] = useState(false);
   const { isAuthenticated, user, logout } = useAuth();
   const [showUserMenu, setShowUserMenu] = useState(false);

   // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return "U";
    const names = user.name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white/95 dark:bg-[#053641]/95 backdrop-blur-sm z-50 border-b border-gray-100 dark:border-gray-800 transition-colors">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
                <img
                  src={logo}
                  alt="Hricochets Logo"
                  className="h-12 w-auto" // adjust height to fit navbar
                />
                <h1 className="text-2xl text-[#053641] dark:text-white transition-colors"> Hricochets
                </h1>
              </div>

            {/* Right side - Theme Toggle, Cart and Sign In */}
            <div className="flex items-center gap-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors group"
                aria-label="Toggle theme"
              >
                {theme === "light" ? (
                  <Moon className="h-6 w-6 text-[#053641] dark:text-white group-hover:scale-110 transition-transform" />
                ) : (
                  <Sun className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
                )}
              </button>

              {/* Cart */}
              <button
                onClick={onOpenCart}   // ⬅️ TRIGGERS CART OPEN
                className="relative p-2 hover:bg-gray-100 border-0 dark:hover:bg-gray-800 rounded-full transition-colors group"
              >
                <ShoppingCart className="h-6 w-6 text-[#053641] dark:text-white group-hover:scale-110 transition-transform" />
              </button>

              {/* Sign In or User Profile */}
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-2 pr-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    {/* User Avatar */}
                    <div className="w-8 h-8 rounded-full bg-[#053641] dark:bg-white flex items-center justify-center text-white dark:text-[#053641] font-semibold text-sm">
                      {getUserInitials()}
                    </div>
                    <span className="text-sm text-[#053641] dark:text-white max-w-[100px] truncate hidden sm:block">
                      {user.name.split(" ")[0]}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-[#053641] dark:text-white transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#042830] rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-medium text-[#053641] dark:text-white truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Button
                  onClick={() => setShowAuth(true)}
                  variant="outline"
                  className="border-2 border-[#053641] dark:border-white text-[#053641] dark:text-white hover:bg-[#053641] hover:text-white dark:hover:bg-white dark:hover:text-[#053641] rounded-full px-6 transition-all"
                >
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      {showAuth && (
        <AuthPage onClose={() => setShowAuth(false)} />
      )}
    </>
  );
}