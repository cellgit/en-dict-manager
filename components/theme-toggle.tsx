"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const themeOptions = [
  { key: "system" as const, label: "跟随系统", Icon: Laptop },
  { key: "light" as const, label: "日间模式", Icon: Sun },
  { key: "dark" as const, label: "夜间模式", Icon: Moon }
];

export function ThemeToggle() {
  const { setTheme, resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeKey = useMemo(() => {
    if (!mounted) {
      return "system" as const;
    }
    if (theme === "system") {
      return "system" as const;
    }
    return (resolvedTheme ?? "light") as "light" | "dark" | "system";
  }, [mounted, resolvedTheme, theme]);

  const ActiveIcon = useMemo(() => {
    switch (activeKey) {
      case "dark":
        return Moon;
      case "light":
        return Sun;
      default:
        return Laptop;
    }
  }, [activeKey]);

  const menuValue = mounted ? theme ?? "system" : "system";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-9 w-9 overflow-hidden"
          aria-label="切换主题"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuRadioGroup value={menuValue} onValueChange={setTheme}>
          {themeOptions.map(({ key, label, Icon }) => (
            <DropdownMenuRadioItem key={key} value={key} className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span className="flex-1 text-sm">{label}</span>
              {activeKey === key ? <ActiveIcon className="h-3 w-3 text-primary" /> : null}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
