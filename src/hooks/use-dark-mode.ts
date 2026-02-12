import { useEffect, useState } from "react";

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("kervana-dark-mode") === "true";
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("kervana-dark-mode", String(isDark));
  }, [isDark]);

  return { isDark, toggle: () => setIsDark((prev) => !prev) };
}
