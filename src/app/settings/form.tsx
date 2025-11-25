'use client';

import { useActionState } from 'react';
import { updateSettings, deleteAccount, logout } from '../actions/auth';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Save, Trash2, LogOut, Settings as SettingsIcon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const initialState = {
  message: '',
  error: '',
};

const deleteInitialState = {
  error: '',
};

export default function SettingsForm({ user }: { user: { name: string | null, email: string } }) {
  const [state, formAction, isPending] = useActionState(updateSettings, initialState);
  const [deleteState, deleteAction, isDeletePending] = useActionState(deleteAccount, deleteInitialState);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <ArrowLeft className="w-6 h-6 text-white" />
            </Link>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-accent" />
            Settings
            </h1>
        </div>
        <form action={logout}>
            <button className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors px-4 py-2 rounded-lg hover:bg-red-500/10">
                <LogOut className="w-5 h-5" />
                Logout
            </button>
        </form>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl"
      >
        <h2 className="text-xl font-semibold text-white mb-6 border-b border-white/10 pb-4">Account Information</h2>
        
        <form action={formAction} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-accent transition-colors" />
                <input
                  name="name"
                  type="text"
                  defaultValue={user.name || ''}
                  placeholder="Your Name"
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-accent transition-colors" />
                <input
                  name="email"
                  type="email"
                  defaultValue={user.email}
                  placeholder="email@example.com"
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">New Password (optional)</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-accent transition-colors" />
              <input
                name="password"
                type="password"
                placeholder="Leave empty to keep current password"
                minLength={6}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
              />
            </div>
          </div>

          {state?.success && (
            <div className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              {state.success}
            </div>
          )}
          
          {state?.error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              {state.error}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              disabled={isPending}
              className="bg-accent hover:bg-accent/90 text-white font-medium px-6 py-3 rounded-xl transition-all shadow-lg shadow-accent/20 disabled:opacity-50 flex items-center gap-2"
            >
              {isPending ? (
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-12 pt-8 border-t border-white/10">
          <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
          <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
            <div>
              <p className="text-white font-medium">Delete Account</p>
              <p className="text-sm text-gray-400">Once you delete your account, there is no going back. Please be certain.</p>
            </div>
            <form action={deleteAction}>
                <button 
                    disabled={isDeletePending}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                    onClick={(e) => {
                        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                            e.preventDefault();
                        }
                    }}
                >
                    {isDeletePending ? (
                         <span className="w-4 h-4 border-2 border-red-400/20 border-t-red-400 rounded-full animate-spin" />
                    ) : (
                        <>
                         <Trash2 className="w-4 h-4" />
                         Delete Account
                        </>
                    )}
                </button>
                {deleteState?.error && (
                    <p className="text-red-400 text-xs mt-2">{deleteState.error}</p>
                )}
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
