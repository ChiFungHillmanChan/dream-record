'use client';

import { useState, useActionState, useEffect } from 'react';
import { updateSettings, deleteAccount, logout, setupSuperAdmin } from '../actions/auth';
import { createCheckoutSession, createCustomerPortalSession } from '../actions/stripe';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Save, Trash2, LogOut, Settings as SettingsIcon, ArrowLeft, Crown, Shield, Calendar, CreditCard, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PLANS, PLAN_FEATURES, PLAN_PRICING, ROLES } from '@/lib/constants';

const initialState = {
  message: '',
  error: '',
};

const deleteInitialState = {
  error: '',
};

interface UserWithPlan {
  name: string | null;
  email: string;
  role: string;
  plan: string;
  planExpiresAt: Date | null;
}

interface SettingsFormProps {
  user: UserWithPlan;
  showSuperAdminSetup?: boolean;
}

export default function SettingsForm({ user, showSuperAdminSetup = false }: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState(updateSettings, initialState);
  const [deleteState, deleteAction, isDeletePending] = useActionState(deleteAccount, deleteInitialState);
  const [isSettingUpAdmin, setIsSettingUpAdmin] = useState(false);
  const [adminSetupError, setAdminSetupError] = useState<string | null>(null);
  
  // Stripe checkout state
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  const searchParams = useSearchParams();
  
  // Handle URL params for success/canceled
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setTimeout(() => {
        setShowSuccessMessage(true);
        // Remove params from URL
        window.history.replaceState({}, '', '/settings');
      }, 0);
    }
    if (searchParams.get('canceled') === 'true') {
      setTimeout(() => {
        setCheckoutError('訂閱已取消');
        window.history.replaceState({}, '', '/settings');
      }, 0);
    }
  }, [searchParams]);
  
  const handleCheckout = async () => {
    setIsCheckingOut(true);
    setCheckoutError(null);
    
    // Use server action to get Payment Link URL with client_reference_id
    const result = await createCheckoutSession(billingPeriod);
    
    if (result.success && result.url) {
      window.location.href = result.url;
    } else {
      setCheckoutError(result.error ?? '無法創建結帳頁面');
      setIsCheckingOut(false);
    }
  };
  
  const handleManageSubscription = async () => {
    setIsCheckingOut(true);
    setCheckoutError(null);
    
    const result = await createCustomerPortalSession();
    
    if (result.success && result.url) {
      window.location.href = result.url;
    } else {
      setCheckoutError(result.error ?? '無法開啟訂閱管理頁面');
      setIsCheckingOut(false);
    }
  };
  
  const handleSetupSuperAdmin = async () => {
    if (!confirm('確定要將此帳號設為超級管理員嗎？這是一次性操作。')) return;
    
    setIsSettingUpAdmin(true);
    setAdminSetupError(null);
    
    const result = await setupSuperAdmin();
    
    if (result.success) {
      window.location.reload();
    } else {
      setAdminSetupError(result.error ?? '設定管理員失敗');
    }
    
    setIsSettingUpAdmin(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-0">
      <div className="mb-6 md:mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
            <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </Link>
            <h1 className="text-xl md:text-3xl font-bold text-white flex items-center gap-2 md:gap-3">
            <SettingsIcon className="w-6 h-6 md:w-8 md:h-8 text-accent" />
            設定
            </h1>
        </div>
        <form action={logout}>
            <button className="flex items-center gap-1.5 md:gap-2 text-red-400 hover:text-red-300 transition-colors px-3 py-2 md:px-4 rounded-lg hover:bg-red-500/10 text-sm md:text-base">
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden md:inline">登出</span>
            </button>
        </form>
      </div>

      {/* Superadmin Setup - Only shows when no superadmin exists */}
      {showSuperAdminSetup && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-500/20 to-amber-500/20 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 shadow-xl mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-xl shrink-0">
                <Crown className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">成為超級管理員</h3>
                <p className="text-sm text-gray-400">目前尚未設置超級管理員，你可以成為第一位</p>
              </div>
            </div>
            <button
              onClick={handleSetupSuperAdmin}
              disabled={isSettingUpAdmin}
              className="w-full md:w-auto justify-center px-4 py-2 bg-gradient-to-r from-purple-500 to-amber-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shrink-0"
            >
              {isSettingUpAdmin ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  設置中...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  成為管理員
                </>
              )}
            </button>
          </div>
          {adminSetupError && (
            <div className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
              {adminSetupError}
            </div>
          )}
        </motion.div>
      )}

      {/* Admin Link for Superadmins */}
      {user.role === ROLES.SUPERADMIN && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-6 shadow-xl mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-xl shrink-0">
                <Shield className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-amber-400">管理員權限</h3>
                <p className="text-sm text-gray-400">你擁有管理員權限，可以管理所有用戶</p>
              </div>
            </div>
            <Link
              href="/admin"
              className="w-full md:w-auto justify-center px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-xl transition-colors flex items-center gap-2 shrink-0"
            >
              <Shield className="w-4 h-4" />
              管理控制台
            </Link>
          </div>
        </motion.div>
      )}

      {/* Plan Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-surface/30 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl mb-6"
      >
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          {user.plan === PLANS.DEEP && <Crown className="w-5 h-5 text-amber-400" />}
          我的計劃
        </h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          {/* Current Plan */}
          <div className={`p-4 rounded-2xl border ${
            user.plan === PLANS.DEEP 
              ? 'bg-purple-500/10 border-purple-500/30' 
              : 'bg-gray-500/10 border-gray-500/30'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {user.plan === PLANS.DEEP ? (
                <Crown className="w-5 h-5 text-purple-400" />
              ) : (
                <User className="w-5 h-5 text-gray-400" />
              )}
              <span className="font-bold text-white">
                {user.plan === PLANS.DEEP ? PLAN_FEATURES.DEEP.name : PLAN_FEATURES.FREE.name}
              </span>
            </div>
            <ul className="space-y-1 text-sm text-gray-400">
              {(user.plan === PLANS.DEEP ? PLAN_FEATURES.DEEP.features : PLAN_FEATURES.FREE.features).map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-accent" />
                  {feature}
                </li>
              ))}
            </ul>
            {user.plan === PLANS.DEEP && user.planExpiresAt && (
              <div className="mt-3 pt-3 border-t border-purple-500/20 flex items-center gap-2 text-sm text-purple-400">
                <Calendar className="w-4 h-4" />
                到期日：{new Date(user.planExpiresAt).toLocaleDateString('zh-TW')}
              </div>
            )}
          </div>

          {/* Upgrade/Plan Info */}
          {user.plan === PLANS.FREE ? (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-accent/20 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-white">{PLAN_FEATURES.DEEP.name}</span>
              </div>
              
              {/* Billing Period Toggle */}
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setBillingPeriod('monthly')}
                  className={`flex-1 py-3 px-3 rounded-lg text-sm transition-all ${
                    billingPeriod === 'monthly'
                      ? 'bg-purple-500/30 text-white border border-purple-500/50'
                      : 'bg-black/20 text-gray-400 border border-white/10'
                  }`}
                >
                  月費 HK${PLAN_PRICING.DEEP.monthly}
                </button>
                <button
                  type="button"
                  onClick={() => setBillingPeriod('yearly')}
                  className={`flex-1 py-3 px-3 rounded-lg text-sm transition-all ${
                    billingPeriod === 'yearly'
                      ? 'bg-purple-500/30 text-white border border-purple-500/50'
                      : 'bg-black/20 text-gray-400 border border-white/10'
                  }`}
                >
                  <div className="flex flex-col">
                    <span>年費 HK${PLAN_PRICING.DEEP.yearly}</span>
                    <span className="text-green-400 text-xs">僅 HK${PLAN_PRICING.DEEP.yearlyMonthly}/月 · 省{PLAN_PRICING.DEEP.discountPercent}%</span>
                  </div>
                </button>
              </div>
              
              <ul className="space-y-1 text-sm text-gray-300 mb-4">
                {PLAN_FEATURES.DEEP.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-purple-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              {checkoutError && (
                <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                  {checkoutError}
                </div>
              )}
              
              {showSuccessMessage && (
                <div className="mb-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-400">
                  🎉 訂閱成功！請刷新頁面查看您的新計劃。
                </div>
              )}
              
              <button 
                type="button"
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full py-2 bg-gradient-to-r from-purple-500 to-accent text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCheckingOut ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    處理中...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    升級至深度版 ✨
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🎉</span>
                <span className="font-bold text-white">已解鎖所有功能</span>
              </div>
              <p className="text-sm text-gray-400 mb-3">
                感謝你支持深度版！你可以無限使用 AI 夢境解析功能。
              </p>
              <button
                type="button"
                onClick={handleManageSubscription}
                disabled={isCheckingOut}
                className="w-full py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isCheckingOut ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    處理中...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    管理訂閱
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-surface/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl"
      >
        <h2 className="text-xl font-semibold text-white mb-6 border-b border-white/10 pb-4">帳戶資訊</h2>
        
        <form action={formAction} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">全名</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-accent transition-colors" />
                <input
                  name="name"
                  type="text"
                  defaultValue={user.name || ''}
                  placeholder="你的名字"
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">電子郵件</label>
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
            <label className="text-sm font-medium text-gray-300 ml-1">新密碼 (選填)</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-accent transition-colors" />
              <input
                name="password"
                type="password"
                placeholder="留空以保留目前密碼"
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
                  儲存變更
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-12 pt-8 border-t border-white/10">
          <h3 className="text-lg font-semibold text-red-400 mb-4">危險區域</h3>
          <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-xl gap-4">
            <div>
              <p className="text-white font-medium mb-1">刪除帳號</p>
              <p className="text-sm text-gray-400">一旦你刪除帳號，將無法復原。請確定要執行此操作。</p>
            </div>
            <form action={deleteAction} className="w-full md:w-auto shrink-0">
                <button 
                    disabled={isDeletePending}
                    className="w-full md:w-auto justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                    onClick={(e) => {
                        if (!confirm('你確定要刪除帳號嗎？此操作無法復原。')) {
                            e.preventDefault();
                        }
                    }}
                >
                    {isDeletePending ? (
                         <span className="w-4 h-4 border-2 border-red-400/20 border-t-red-400 rounded-full animate-spin" />
                    ) : (
                        <>
                         <Trash2 className="w-4 h-4" />
                         刪除帳號
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
