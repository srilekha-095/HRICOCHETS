import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, Mail, User, X, Phone, Loader2 } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext"; 
import light1 from "../assets/Eye1.svg";
import light2 from "../assets/Eye2.svg";
import light3 from "../assets/Eye3.svg";
import dark1 from "../assets/EyeDark1.svg";
import dark2 from "../assets/EyeDark2.svg";
import dark3 from "../assets/EyeDark3.svg";

// Simple standard UI components
const Input = React.forwardRef<HTMLInputElement, any>(({ className, icon, error, ...props }, ref) => (
  <div className="relative flex flex-col w-full">
    <div className="relative flex items-center w-full group">
      {icon && (
        <div className="absolute left-3 text-gray-400 transition-colors duration-200 group-focus-within:text-[#053641] dark:group-focus-within:text-white">
          {icon}
        </div>
      )}
      <input
        ref={ref}
        className={`flex h-12 w-full rounded-xl border ${
          error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
        } bg-white dark:bg-[#042830] px-4 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
          error ? 'focus:ring-red-500' : 'focus:ring-[#053641] dark:focus:ring-white'
        } focus:border-transparent transition-all duration-200 ${
          icon ? "pl-10" : ""
        } ${className}`}
        {...props}
      />
    </div>
    {error && <p className="text-red-500 text-xs mt-1 ml-1">{error}</p>}
  </div>
));
Input.displayName = "Input";

const Button = React.forwardRef<HTMLButtonElement, any>(({ className, loading, children, ...props }, ref) => (
  <button
    ref={ref}
    disabled={loading || props.disabled}
    className={`inline-flex items-center justify-center rounded-xl text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-[#053641] dark:bg-white text-white dark:text-[#053641] hover:bg-[#042830] dark:hover:bg-gray-100 hover:shadow-lg hover:-translate-y-0.5 h-12 px-8 py-2 w-full shadow-[0px_4px_10px_rgba(5,54,65,0.2)] active:translate-y-0 active:shadow-md ${className}`}
    {...props}
  >
    {loading ? (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {children}
      </>
    ) : (
      children
    )}
  </button>
));
Button.displayName = "Button";

const validateInstagram = (username: string) => {
  if (!username) return "Instagram username is required";
  const pattern = /^(?!.*\.\.)(?!.*\.$)[a-zA-Z0-9._]{1,30}$/;
  return pattern.test(username) ? null : "Invalid Instagram username format";
};

const validateEmail = (email: string) => {
  if (!email) return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? null : "Invalid email format";
};

const validatePassword = (password: string) => {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  return null;
};

const validateName = (name: string) => {
  if (!name) return "Name is required";
  if (name.trim().length < 2) return "Name must be at least 2 characters";
  return null;
};

const validatePhone = (phone: string) => {
  if (!phone) return null; // Phone is optional
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone) ? null : "Invalid phone number format";
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface AuthPageProps {
  onClose: () => void;
}

export function AuthPage({ onClose }: AuthPageProps) {
  const { login } = useAuth();

  const [isSignIn, setIsSignIn] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [instagram, setInstagram] = useState("");

  // Error states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");

  const { theme } = useTheme();

  // Decorative illustrations that transition based on theme
  const illustrationsLight = [light1, light2, light3];
  const illustrationsDark = [dark1, dark2, dark3];
  const illustrations = theme === "dark" ? illustrationsDark : illustrationsLight;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % illustrations.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [illustrations.length]);

  // Clear errors when switching modes
  useEffect(() => {
    setErrors({});
    setApiError("");
  }, [isSignIn]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Common validations
    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;

    // Sign up only validations
    if (!isSignIn) {
      const nameError = validateName(name);
      if (nameError) newErrors.name = nameError;

      const phoneError = validatePhone(phone);
      if (phoneError) newErrors.phone = phoneError;

      const instagramError = validateInstagram(instagram);
      if (instagramError) newErrors.instagram = instagramError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const url = isSignIn
        ? `${API_URL}/api/auth/login`
        : `${API_URL}/api/auth/signup`;

      const payload = isSignIn
        ? { email, password }
        : { name, email, phone, password, instagram };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.message || "Authentication failed. Please try again.");
        return;
      }

      // Success! Use the login function from context
      if (data.token && data.user) {
        login(data.token, data.user); // UPDATE: Use context login instead of localStorage directly
      }

      alert(isSignIn ? "Login successful!" : "Account created successfully!");
      onClose();

    } catch (err) {
      console.error("Auth error:", err);
      setApiError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleModeSwitch = () => {
    setIsSignIn(!isSignIn);
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setInstagram("");
    setErrors({});
    setApiError("");
    setShowPassword(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 z-50 animate-fade-in">
      <div className="flex w-full max-w-5xl bg-[#C6E7FF] dark:bg-[#053641] rounded-[30px] shadow-2xl overflow-hidden min-h-[600px] transition-all duration-500 ease-in-out relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>

        {/* Left Section - Illustration Area */}
        <div className="hidden md:flex w-1/2 relative items-center justify-center p-12 overflow-hidden">
          <div className="relative w-full aspect-square max-w-md z-10">
            {illustrations.map((src, index) => (
              <div
                key={index}
                className={`absolute inset-0 w-full h-full flex items-center justify-center transition-opacity duration-1000 ease-in-out ${
                  index === currentImage ? "opacity-100 z-10" : "opacity-0 z-0"
                }`}
              >
                <img
                  src={src}
                  alt={`Illustration ${index + 1}`}
                  className="w-full h-full object-contain opacity-60 dark:opacity-50"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right Section - Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-12 lg:p-16 relative">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-left space-y-2">
              <h1 className="text-4xl text-[#053641] dark:text-white tracking-tight transition-all duration-300 ease-in-out">
                {isSignIn ? "Welcome back" : "Create account"}
              </h1>
              <p className="text-[#053641]/70 dark:text-gray-300 text-lg transition-all duration-300 ease-in-out">
                {isSignIn ? "Log in to your account" : "Become a part of our community!"}
              </p>
            </div>

            {/* API Error Message */}
            {apiError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                {apiError}
              </div>
            )}

            <form className="space-y-4 mt-6" onSubmit={handleSubmit}>
              {/* Full Name - Sign Up Only */}
              {!isSignIn && (
                <Input
                  type="text"
                  placeholder="Full Name"
                  icon={<User size={20} />}
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  error={errors.name}
                  disabled={loading}
                />
              )}

              {/* Email */}
              <Input
                type="email"
                placeholder="What is your e-mail?"
                icon={<Mail size={20} />}
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                error={errors.email}
                disabled={loading}
              />

              {/* Phone - Sign Up Only */}
              {!isSignIn && (
                <Input
                  type="tel"
                  placeholder="Phone Number (optional)"
                  icon={<Phone size={20} />}
                  value={phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                  error={errors.phone}
                  disabled={loading}
                />
              )}

              {/* Password */}
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={isSignIn ? "Enter your password" : "Create a password"}
                  icon={<Lock size={20} />}
                  className="pr-10"
                  autoComplete={isSignIn ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  error={errors.password}
                  disabled={loading}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-[#053641] dark:hover:text-white transition-colors focus:outline-none p-1"
                  tabIndex={-1}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Instagram Username - Sign Up Only */}
              {!isSignIn && (
                <Input
                  type="text"
                  placeholder="Instagram Username"
                  icon={<User size={20} />}
                  value={instagram}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInstagram(e.target.value)}
                  error={errors.instagram}
                  disabled={loading}
                />
              )}

              <Button type="submit" className="text-base py-3 mt-4" loading={loading}>
                {loading ? (isSignIn ? "Logging in..." : "Creating account...") : (isSignIn ? "Log In" : "Sign Up")}
              </Button>
            </form>

            <p className="text-center text-[#053641]/70 dark:text-gray-300 mt-4">
              {isSignIn ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={handleModeSwitch}
                className="font-bold text-[#053641] dark:text-white hover:text-[#042830] dark:hover:text-gray-200 transition-colors hover:underline focus:outline-none"
                disabled={loading}
              >
                {isSignIn ? "Sign up" : "Log in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
