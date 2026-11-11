export const PLANS = {
  free: {
    name: "Free",
    maxProjects: 2,
    maxMembers: 2,
    maxStorageBytes: 100 * 1024 * 1024,
  },

  pro: {
    name: "Pro",
    maxProjects: 20,
    maxMembers: 10,
    maxStorageBytes: 5 * 1024 * 1024 * 1024,
  },

  business: {
    name: "Business",
    maxProjects: Infinity,
    maxMembers: Infinity,
    maxStorageBytes: 50 * 1024 * 1024 * 1024,
  },
} as const;

export type PlanName = keyof typeof PLANS;