import { useState } from "react";
import { LoginPage } from "./features/auth/LoginPage";
import { MainLayout } from "./components/layout/MainLayout";

interface AuthUser {
  email: string;
  role: string;
  branch: string;
}

export function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const handleLoginSuccess = (authToken: string, authUser: AuthUser) => {
    setToken(authToken);
    setUser(authUser);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
  };

  if (!token || !user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return <MainLayout user={user} onLogout={handleLogout} />;
}

export default App;
