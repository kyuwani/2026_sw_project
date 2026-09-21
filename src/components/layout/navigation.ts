import {
  BarChart3,
  BookOpen,
  CheckSquare2,
  FolderKanban,
  LayoutDashboard,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navigationItems: NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Tasks", href: "/tasks", icon: CheckSquare2 },
  { label: "Learning", href: "/learning", icon: BookOpen },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Profile", href: "/profile", icon: UserRound },
];

export const pageTitles = Object.fromEntries(
  navigationItems.map((item) => [item.href, item.label]),
);
