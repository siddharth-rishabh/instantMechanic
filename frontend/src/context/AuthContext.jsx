import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../services/resources';

const AuthContext = createContext(null);
export function AuthProvider({ children }) { const [user, setUser] = useState(null); const [loading, setLoading] = useState(true); const logout = () => { localStorage.removeItem('instant-mechanic-token'); setUser(null); }; useEffect(() => { const restore = async () => { if (!localStorage.getItem('instant-mechanic-token')) return setLoading(false); try { const { data } = await authApi.me(); setUser(data.user); } catch { logout(); } finally { setLoading(false); } }; restore(); window.addEventListener('auth:expired', logout); return () => window.removeEventListener('auth:expired', logout); }, []); const login = async (credentials) => { const { data } = await authApi.login(credentials); localStorage.setItem('instant-mechanic-token', data.token); setUser(data.user); return data; }; return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>; }
export const useAuth = () => useContext(AuthContext);
