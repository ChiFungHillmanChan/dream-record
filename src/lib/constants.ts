// Plan Constants
export const PLANS = {
  FREE: 'FREE',
  DEEP: 'DEEP',
} as const;

export type PlanType = typeof PLANS[keyof typeof PLANS];

// User Roles
export const ROLES = {
  USER: 'USER',
  SUPERADMIN: 'SUPERADMIN',
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

// Plan Pricing in HKD
export const PLAN_PRICING = {
  DEEP: {
    monthly: 29.99,
    yearly: 200, // HK$200/year (from HK$359.88)
    yearlyOriginal: 359.88, // 29.99 × 12
    discountPercent: 44, // ~44% off
    yearlyMonthly: 16.67, // Per month when paying yearly (200 ÷ 12)
  },
} as const;

// Plan Features
export const PLAN_FEATURES = {
  FREE: {
    name: '免費版',
    nameEn: 'Free Plan',
    features: [
      '基本夢境記錄',
      '標籤功能',
      '歷史查看',
    ],
    featuresEn: [
      'Basic dream recording',
      'Tag features',
      'History viewing',
    ],
  },
  DEEP: {
    name: '深度版',
    nameEn: 'Deep Plan',
    features: [
      '所有免費版功能',
      'AI 夢境解析（無限次）',
      '進階夢境分析報告',
      '夢境趨勢追蹤',
    ],
    featuresEn: [
      'All Free plan features',
      'AI Dream Analysis (unlimited)',
      'Advanced dream analysis reports',
      'Dream trend tracking',
    ],
  },
} as const;

