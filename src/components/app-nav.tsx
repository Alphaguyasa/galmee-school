"use client";

import { useTranslations } from "next-intl";
import { CalendarCheck, HandCoins, Home, NotebookPen, Users } from "lucide-react";
import { BottomNav } from "@/components/galmee/bottom-nav";

const ITEMS = [
  { href: "/", key: "home", icon: Home },
  { href: "/students", key: "students", icon: Users },
  { href: "/fees", key: "fees", icon: HandCoins },
  { href: "/attendance", key: "attendance", icon: CalendarCheck },
  { href: "/marks", key: "marks", icon: NotebookPen },
] as const;

/** School's five destinations in the shared Galmee nav. */
export function AppNav({ variant }: { variant: "bottom" | "side" }) {
  const t = useTranslations("nav");
  return (
    <BottomNav
      variant={variant}
      menuLabel={t("menu")}
      items={ITEMS.map(({ href, key, icon }) => ({ href, label: t(key), icon }))}
    />
  );
}
