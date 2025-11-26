'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Crown, Shield, ArrowLeft, Search, 
  Calendar, Mail, User as UserIcon, Sparkles,
  X, Check, Key, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { PLANS, PLAN_FEATURES, ROLES } from '@/lib/constants';
import { updateUserPlanWithExpiry, updateUserRole, resetUserPassword, type UserListItem } from '@/app/actions/admin';

interface AdminPageClientProps {
  users: UserListItem[];
  stats: {
    totalUsers: number;
    freeUsers: number;
    deepUsers: number;
    totalDreams: number;
  };
}

export default function AdminPageClient({ users: initialUsers, stats }: AdminPageClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [planDuration, setPlanDuration] = useState<'monthly' | 'yearly' | 'custom'>('monthly');
  const [customExpiryDate, setCustomExpiryDate] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openUserModal = (user: UserListItem) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowPasswordSuccess(false);
    setPlanDuration('monthly');
    setCustomExpiryDate('');
  };

  const closeUserModal = () => {
    setSelectedUser(null);
    setNewPassword('');
    setShowPasswordSuccess(false);
  };

  const handleUpdatePlan = async (userId: string, plan: 'FREE' | 'DEEP') => {
    setIsUpdating(true);
    
    let planExpiresAt: Date | null = null;
    
    if (plan === PLANS.DEEP) {
      if (planDuration === 'custom' && customExpiryDate) {
        planExpiresAt = new Date(customExpiryDate);
      } else if (planDuration === 'yearly') {
        planExpiresAt = new Date();
        planExpiresAt.setFullYear(planExpiresAt.getFullYear() + 1);
      } else {
        planExpiresAt = new Date();
        planExpiresAt.setMonth(planExpiresAt.getMonth() + 1);
      }
    }
    
    const result = await updateUserPlanWithExpiry(userId, plan, planExpiresAt);
    
    if (result.success) {
      // Update local state
      setUsers(prev => prev.map(u => {
        if (u.id === userId) {
          return { ...u, plan, planExpiresAt };
        }
        return u;
      }));
      closeUserModal();
    } else {
      alert(result.error ?? '更新計劃失敗');
    }
    setIsUpdating(false);
  };

  const handleResetPassword = async (userId: string) => {
    if (!newPassword || newPassword.length < 6) {
      alert('密碼必須至少 6 個字元');
      return;
    }
    
    setIsUpdating(true);
    const result = await resetUserPassword(userId, newPassword);
    
    if (result.success) {
      setNewPassword('');
      setShowPasswordSuccess(true);
      setTimeout(() => setShowPasswordSuccess(false), 3000);
    } else {
      alert(result.error ?? '重設密碼失敗');
    }
    setIsUpdating(false);
  };

  const handleUpdateRole = async (userId: string, role: 'USER' | 'SUPERADMIN') => {
    setIsUpdating(true);
    const result = await updateUserRole(userId, role);
    
    if (result.success) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } else {
      alert(result.error ?? '更新角色失敗');
    }
    setIsUpdating(false);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-0">
      {/* Header */}
      <div className="mb-6 md:mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </Link>
          <h1 className="text-xl md:text-3xl font-bold text-white flex items-center gap-2 md:gap-3">
            <Shield className="w-6 h-6 md:w-8 md:h-8 text-amber-400" />
            <span className="hidden sm:inline">管理員控制台</span>
            <span className="sm:hidden">管理</span>
          </h1>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
              <div className="text-xs text-gray-400">總用戶</div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-500/20 rounded-xl">
              <UserIcon className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.freeUsers}</div>
              <div className="text-xs text-gray-400">免費用戶</div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-xl">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.deepUsers}</div>
              <div className="text-xs text-gray-400">深度版用戶</div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-surface/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-xl">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.totalDreams}</div>
              <div className="text-xs text-gray-400">總夢境數</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Users List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-surface/30 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-white">用戶管理</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋用戶..."
              className="w-full md:w-64 bg-black/20 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-accent/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">用戶</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">計劃</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">到期日</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <motion.tr 
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-white font-bold">
                        {user.name?.[0] ?? user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-medium">{user.name ?? '未設定'}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {user.plan === PLANS.DEEP ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        <Crown className="w-3 h-3" />
                        深度版
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
                        免費版
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(user.planExpiresAt)}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => openUserModal(user)}
                      className="px-3 py-1.5 text-sm bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30 rounded-lg transition-colors"
                    >
                      編輯
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            沒有找到符合的用戶
          </div>
        )}
      </motion.div>

      {/* Edit User Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeUserModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1a2e] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">編輯用戶</h3>
                <button
                  onClick={closeUserModal}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                {/* User Info */}
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-white text-xl font-bold">
                    {selectedUser.name?.[0] ?? selectedUser.email[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white font-medium text-lg">{selectedUser.name ?? '未設定姓名'}</div>
                    <div className="text-sm text-gray-400">{selectedUser.email}</div>
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">角色</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleUpdateRole(selectedUser.id, ROLES.USER)}
                      disabled={isUpdating}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                        selectedUser.role === ROLES.USER
                          ? 'bg-gray-500/30 border-gray-500/50 text-white'
                          : 'border-white/10 text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      <UserIcon className="w-4 h-4" />
                      一般用戶
                      {selectedUser.role === ROLES.USER && <Check className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleUpdateRole(selectedUser.id, ROLES.SUPERADMIN)}
                      disabled={isUpdating}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                        selectedUser.role === ROLES.SUPERADMIN
                          ? 'bg-amber-500/30 border-amber-500/50 text-amber-400'
                          : 'border-white/10 text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      <Shield className="w-4 h-4" />
                      管理員
                      {selectedUser.role === ROLES.SUPERADMIN && <Check className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Reset */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">重設密碼</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="輸入新密碼（至少6位）"
                        className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-accent/50"
                      />
                    </div>
                    <button
                      onClick={() => handleResetPassword(selectedUser.id)}
                      disabled={isUpdating || newPassword.length < 6}
                      className="px-4 py-2.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
                      重設
                    </button>
                  </div>
                  {showPasswordSuccess && (
                    <div className="mt-2 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                      ✓ 密碼重設成功
                    </div>
                  )}
                </div>

                {/* Plan Selection */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">計劃</label>
                  
                  {/* Plan Duration Toggle */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setPlanDuration('monthly')}
                      className={`flex-1 py-2 px-2 rounded-lg text-xs transition-all ${
                        planDuration === 'monthly'
                          ? 'bg-accent/20 text-accent border border-accent/30'
                          : 'bg-white/5 text-gray-400 border border-white/10'
                      }`}
                    >
                      月費
                    </button>
                    <button
                      onClick={() => setPlanDuration('yearly')}
                      className={`flex-1 py-2 px-2 rounded-lg text-xs transition-all ${
                        planDuration === 'yearly'
                          ? 'bg-accent/20 text-accent border border-accent/30'
                          : 'bg-white/5 text-gray-400 border border-white/10'
                      }`}
                    >
                      年費
                    </button>
                    <button
                      onClick={() => setPlanDuration('custom')}
                      className={`flex-1 py-2 px-2 rounded-lg text-xs transition-all ${
                        planDuration === 'custom'
                          ? 'bg-accent/20 text-accent border border-accent/30'
                          : 'bg-white/5 text-gray-400 border border-white/10'
                      }`}
                    >
                      自訂日期
                    </button>
                  </div>
                  
                  {/* Custom Date Picker */}
                  {planDuration === 'custom' && (
                    <div className="mb-3">
                      <label className="text-xs text-gray-400 mb-1 block">到期日期</label>
                      <input
                        type="date"
                        value={customExpiryDate}
                        onChange={(e) => setCustomExpiryDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-accent/50"
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleUpdatePlan(selectedUser.id, PLANS.FREE)}
                      disabled={isUpdating}
                      className={`p-4 rounded-xl border transition-all ${
                        selectedUser.plan === PLANS.FREE
                          ? 'bg-gray-500/30 border-gray-500/50'
                          : 'border-white/10 hover:bg-white/5'
                      }`}
                    >
                      <div className="text-white font-medium mb-1">{PLAN_FEATURES.FREE.name}</div>
                      <div className="text-xs text-gray-400">基本功能</div>
                      {selectedUser.plan === PLANS.FREE && (
                        <div className="mt-2 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-400" />
                        </div>
                      )}
                    </button>
                    <button
                      onClick={() => handleUpdatePlan(selectedUser.id, PLANS.DEEP)}
                      disabled={isUpdating || (planDuration === 'custom' && !customExpiryDate)}
                      className={`p-4 rounded-xl border transition-all ${
                        selectedUser.plan === PLANS.DEEP
                          ? 'bg-purple-500/30 border-purple-500/50'
                          : 'border-white/10 hover:bg-white/5'
                      }`}
                    >
                      <div className="text-white font-medium mb-1 flex items-center justify-center gap-1">
                        <Crown className="w-4 h-4 text-amber-400" />
                        {PLAN_FEATURES.DEEP.name}
                      </div>
                      <div className="text-xs text-gray-400">AI 解析無限</div>
                      {selectedUser.plan === PLANS.DEEP && (
                        <div className="mt-2 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-400" />
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Current Plan Expiry */}
                {selectedUser.plan === PLANS.DEEP && selectedUser.planExpiresAt && (
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <div className="text-sm text-purple-400 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      計劃到期日：{formatDate(selectedUser.planExpiresAt)}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeUserModal}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  完成
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

