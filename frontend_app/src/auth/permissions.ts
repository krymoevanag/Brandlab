import type { AuthUser } from "../App";

export const can = (user: Pick<AuthUser, "roles" | "permissions"> | null | undefined, permission: string) => {
  if (!user) return false;
  if (user.roles.includes("owner") || user.roles.includes("superadmin")) return true;
  return user.permissions.includes(permission);
};

export const canAny = (user: Pick<AuthUser, "roles" | "permissions"> | null | undefined, permissions: string[]) =>
  permissions.some((permission) => can(user, permission));
