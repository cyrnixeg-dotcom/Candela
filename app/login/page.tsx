"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/store/Navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/account";
  const authError = searchParams?.get("error");

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authError === "admin_required") {
      setError("Administrator privileges required. Please sign in with an Admin account to access the dashboard.");
    }
  }, [authError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isLogin) {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();
      const clean = trimmedEmail.toLowerCase();
      const isAdmin = clean === "admin@candela.store" || clean === "admin";

      // Clean target URL without stale error query params
      let target = "/account";
      if (callbackUrl && callbackUrl !== "/account") {
        try {
          const u = new URL(callbackUrl, window.location.origin);
          u.searchParams.delete("error");
          target = u.pathname + (u.search ? u.search : "");
        } catch {
          target = callbackUrl.split("?")[0];
        }
      } else if (isAdmin) {
        target = "/admin";
      }

      const res = await signIn("credentials", {
        redirect: false,
        email: trimmedEmail,
        password: trimmedPassword,
        callbackUrl: target,
      });

      // ONLY treat as error if the login response was actually rejected by the server
      if (!res || !res.ok || res.status === 401 || res.error === "CredentialsSignin") {
        setError("Invalid email, username, or password. Please try again.");
        setLoading(false);
      } else {
        window.location.href = target;
      }
    } else {
      if (!name.trim()) {
        setError("Please enter your full name.");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            name: name.trim(), 
            email: email.trim().toLowerCase(), 
            password 
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");

        // Automatically sign in the newly registered user
        const loginRes = await signIn("credentials", {
          redirect: false,
          email: email.trim().toLowerCase(),
          password: password.trim(),
          callbackUrl: "/account",
        });

        if (!loginRes || !loginRes.ok) {
          setError("Account created! Please sign in with your credentials.");
          setIsLogin(true);
          setLoading(false);
        } else {
          window.location.href = "/account";
        }
      } catch (err: any) {
        setError(err.message || "Failed to create account. Please try again.");
        setLoading(false);
      }
    }
  };

  return (
    <main className="min-h-screen bg-candela-cream">
      <Navigation />

      <div className="pt-36 pb-20 px-6 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white p-8 md:p-10 rounded-[32px] shadow-2xl border border-pink-50"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl text-candela-charcoal mb-2">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-gray-500 font-body text-xs md:text-sm leading-relaxed">
              {isLogin
                ? "Sign in with your email and password to view your orders."
                : "Join Candela to save your orders and track shipments."}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-gray-100 p-1.5 rounded-full mb-8">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError("");
              }}
              className={`flex-1 py-2.5 rounded-full text-xs font-body font-bold tracking-wider uppercase transition-all cursor-pointer ${
                isLogin
                  ? "bg-white text-candela-charcoal shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError("");
              }}
              className={`flex-1 py-2.5 rounded-full text-xs font-body font-bold tracking-wider uppercase transition-all cursor-pointer ${
                !isLogin
                  ? "bg-white text-candela-charcoal shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-2xl text-center leading-relaxed font-body"
              >
                {error}
              </motion.div>
            )}

            <AnimatePresence initial={false}>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <label className="block text-[11px] font-bold tracking-widest text-gray-500 uppercase mb-2 font-body">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sara Ahmed"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-body text-candela-charcoal placeholder-gray-400 focus:outline-none focus:border-candela-pink-deep focus:bg-white transition-colors mb-4"
                    required={!isLogin}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-[11px] font-bold tracking-widest text-gray-500 uppercase mb-2 font-body">
                {isLogin ? "Email Address or Username" : "Email Address"}
              </label>
              <input
                type={isLogin ? "text" : "email"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isLogin ? "admin@candela.store or email" : "name@example.com"}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-body text-candela-charcoal placeholder-gray-400 focus:outline-none focus:border-candela-pink-deep focus:bg-white transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold tracking-widest text-gray-500 uppercase mb-2 font-body">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 pr-14 text-sm font-body text-candela-charcoal placeholder-gray-400 focus:outline-none focus:border-candela-pink-deep focus:bg-white transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-body font-semibold px-1 py-0.5 cursor-pointer"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-candela-pink-deep text-white font-body font-bold text-xs tracking-[0.2em] uppercase py-4 rounded-full mt-6 hover:bg-candela-charcoal transition-all disabled:opacity-60 shadow-md hover:shadow-lg cursor-pointer"
            >
              {loading
                ? isLogin
                  ? "Signing in..."
                  : "Creating account..."
                : isLogin
                ? "Sign In"
                : "Create Account"}
            </button>
          </form>

          {/* Switcher link */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-xs text-candela-pink-deep font-body font-bold tracking-wider uppercase hover:text-candela-charcoal transition-colors cursor-pointer"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already registered? Sign in"}
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
