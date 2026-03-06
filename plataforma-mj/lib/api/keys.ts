export const queryKeys = {
  all: ["api"] as const,
  admins: () => [...queryKeys.all, "admins"] as const,
  auth: {
    me: () => [...queryKeys.all, "auth", "me"] as const,
  },
} as const;
