import { createContext, useContext, useEffect, useState } from 'react';
const ThemeContext = createContext(null);
export function ThemeProvider({ children }) { const [theme, setTheme] = useState(() => localStorage.getItem('instant-mechanic-theme') || 'light'); useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); localStorage.setItem('instant-mechanic-theme', theme); }, [theme]); return <ThemeContext.Provider value={{ theme, toggleTheme: () => setTheme((current) => current === 'dark' ? 'light' : 'dark') }}>{children}</ThemeContext.Provider>; }
export const useTheme = () => useContext(ThemeContext);
