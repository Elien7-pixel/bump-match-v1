import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { cleanErrorMessage } from '../utils/errors';

const AUTH_TOKEN_KEY = 'bumpmatch_auth_token';

interface User {
  id: Id<"users">;
  email: string;
  firstName: string;
  surname: string;
  inviteCode: string;
  partnerId?: Id<"users">;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  /**
   * Account surname for name cards, resolved once here rather than per screen.
   * `user` is null on the first frames and whenever the Convex verifyToken
   * query re-subscribes; components reading `user?.surname` directly therefore
   * rendered bare names at random. This falls back to the offline profile
   * snapshot, which is hydrated before children mount and refreshed whenever
   * the server user resolves.
   */
  surname: string;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  surname: string;
  age: string;
  gender: 'mom' | 'dad' | 'partner';
  expecting?: 'boy' | 'girl' | 'unknown';
  status: string;
  /** Date-only "YYYY-MM-DD"; kept device-local (AsyncStorage), never sent to Convex. */
  dueDate?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cachedSurname, setCachedSurname] = useState('');

  const signUpMutation = useMutation(api.auth.signUp);
  const loginMutation = useMutation(api.auth.login);
  const logoutMutation = useMutation(api.auth.logout);

  // Load token on mount
  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (storedToken) {
        setToken(storedToken);
      }
      // Hydrate the display surname before the gate lifts, so the first frame
      // any screen paints already has it.
      const profileJson = await AsyncStorage.getItem('bumpmatch_user_profile');
      if (profileJson) {
        const cached = JSON.parse(profileJson)?.surname;
        if (cached) setCachedSurname(cached);
      }
    } catch (e) {
      console.error('Failed to load auth token', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify token and get user data
  const verifyResult = useQuery(
    api.auth.verifyToken,
    token ? { token } : "skip"
  );

  useEffect(() => {
    if (verifyResult === undefined) {
      // Still loading
      return;
    }

    if (verifyResult === null) {
      // Token invalid or expired
      setUser(null);
      if (token) {
        // Clear invalid token
        AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        setToken(null);
      }
    } else {
      // Valid token, set user
      setUser({
        id: verifyResult.userId,
        email: verifyResult.email,
        firstName: verifyResult.firstName,
        surname: verifyResult.surname,
        inviteCode: verifyResult.inviteCode,
        partnerId: verifyResult.partnerId,
      });

      setCachedSurname(verifyResult.surname || '');

      // Refresh the offline profile snapshot. Screens that display the account
      // name fall back to this while `user` is null — which happens on the
      // first frames and again whenever the Convex query re-subscribes — so a
      // stale snapshot is what makes the surname flicker or vanish on cards.
      AsyncStorage.getItem('bumpmatch_user_profile')
        .then((json) => {
          const profile = json ? JSON.parse(json) : {};
          return AsyncStorage.setItem('bumpmatch_user_profile', JSON.stringify({
            ...profile,
            firstName: verifyResult.firstName,
            surname: verifyResult.surname,
            email: verifyResult.email,
            inviteCode: verifyResult.inviteCode,
          }));
        })
        .catch(() => {});
    }
  }, [verifyResult, token]);

  const signUp = async (data: SignUpData): Promise<{ success: boolean; error?: string }> => {
    try {
      const { dueDate, ...convexData } = data;
      const result = await signUpMutation(convexData);

      await AsyncStorage.setItem(AUTH_TOKEN_KEY, result.token);
      setToken(result.token);

      // Also store profile in AsyncStorage for offline access
      await AsyncStorage.setItem('bumpmatch_user_profile', JSON.stringify({
        firstName: data.firstName,
        surname: data.surname,
        age: data.age,
        email: data.email,
        gender: data.gender,
        status: data.status,
        dueDate,
        inviteCode: result.inviteCode,
        createdAt: new Date().toISOString(),
      }));
      await AsyncStorage.setItem('bumpmatch_onboarding_completed', 'true');

      return { success: true };
    } catch (e: any) {
      console.error('Sign up error:', e);
      return { success: false, error: cleanErrorMessage(e, 'Could not create your account. Please try again.') };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await loginMutation({ email, password });

      await AsyncStorage.setItem(AUTH_TOKEN_KEY, result.token);
      setToken(result.token);
      await AsyncStorage.setItem('bumpmatch_onboarding_completed', 'true');

      return { success: true };
    } catch (e: any) {
      console.error('Login error:', e);
      return { success: false, error: cleanErrorMessage(e, 'Incorrect email or password.') };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await logoutMutation({ token });
      }
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem('bumpmatch_onboarding_completed');
      setToken(null);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    // Force re-query by toggling token
    if (token) {
      const currentToken = token;
      setToken(null);
      setTimeout(() => setToken(currentToken), 100);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        surname: (user?.surname || cachedSurname || '').replace(/^./, (c) => c.toUpperCase()),
        isLoading,
        isAuthenticated: !!user && !!token,
        signUp,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
