'use client';

import { useActionState } from 'react';
import { login } from '../actions/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Moon, Lock, Mail, ArrowRight } from 'lucide-react';

const initialState = {
  error: '',
};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md bg-surface/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="flex justify-center mb-8">
          <div className="p-3 bg-white/5 rounded-full border border-white/10">
            <Moon className="w-8 h-8 text-accent" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          Welcome Back
        </h1>
        <p className="text-center text-muted mb-8">
          Enter your dream world
        </p>

        <form action={formAction} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">Email</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-accent transition-colors" />
              <input
                name="email"
                type="email"
                required
                placeholder="dreamer@example.com"
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-accent transition-colors" />
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
              />
            </div>
          </div>

          {state?.error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-2"
            >
              {state.error}
            </motion.div>
          )}

          <button
            disabled={isPending}
            className="w-full bg-gradient-to-r from-accent to-indigo-600 hover:from-accent/90 hover:to-indigo-600/90 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
          >
            {isPending ? (
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-muted text-sm">
            Don't have an account?{' '}
            <Link href="/register" className="text-accent hover:text-accent/80 transition-colors font-medium">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

