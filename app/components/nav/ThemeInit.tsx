"use client";
import { useEffect } from "react";
import { applyStoredTheme } from "@/lib/theme";

export default function ThemeInit() {
  useEffect(() => {
    applyStoredTheme();
  }, []);
  return null;
}
