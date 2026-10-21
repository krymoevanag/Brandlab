import { useEffect, useState } from "react";
import { LoginPage } from "./features/auth/LoginPage";
import { MainLayout } from "./components/layout/MainLayout";
import { apiClient, type AuthSession } from "./api/client";

export interface AuthUser {
  email: string;
  roles: string[];
  branch: string;
  branchId: number;
  permissions: string[];
  isSuperuser: boolean;
}

function profileToAuthUser(profile: {
  email: string;
  roles?: string[];
  permissions?: string[];
  is_superuser?: boolean;
  default_branch?: { id?: number; code?: string } | null;
}): AuthUser {
  return {
    email: profile.email,
    roles: Array.isArray(profile.roles) ? profile.roles : [],
    permissions: Array.isArray(profile.permissions) ? profile.permissions : [],
    branch: profile.default_branch?.code || "NBI",
    branchId: profile.default_branch?.id || 0,
    isSuperuser: Boolean(profile.is_superuser),
  };
}

export function App() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    apiClient.configureAuth({ session, onSessionChange: setSession });
  }, [session]);

  useEffect(() => {
    if (!session) return;
    let active = true;
    const refreshProfile = async () => {
      try {
        const profile = await apiClient.request<Parameters<typeof profileToAuthUser>[0]>("/v1/auth/me/");
        if (active) {
          setUser((currentUser) => {
            const refreshedUser = profileToAuthUser(profile);
            const canSwitchBranch = Boolean(
              refreshedUser.isSuperuser ||
              refreshedUser.roles.includes("owner") ||
              refreshedUser.roles.includes("superadmin"),
            );

            // The selected login branch is the active branch for ordinary users.
            // Owners and administrators may change it during the session.
            if (currentUser && !canSwitchBranch) {
              refreshedUser.branch = currentUser.branch;
              refreshedUser.branchId = currentUser.branchId;
            }
            return refreshedUser;
          });
        }
      } catch {
        // The API client clears the session when token refresh fails.
      }
    };
    void refreshProfile();
    const interval = window.setInterval(() => void refreshProfile(), 60_000);
    window.addEventListener("focus", refreshProfile);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshProfile);
    };
  }, [session?.access]);

  const handleLoginSuccess = (authSession: AuthSession, authUser: AuthUser) => {
    setSession(authSession);
    setUser(authUser);
  };

  const handleLogout = () => {
    setSession(null);
    setUser(null);
  };

  if (!session || !user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return <MainLayout user={user} token={session.access} onLogout={handleLogout} />;
}

export default App;
