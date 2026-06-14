import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingBag,
  ScanBarcode,
  Users,
  BarChart3,
  Settings,
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  Diamond,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: ShoppingBag },
  { to: "/pos", label: "Billing POS", icon: ScanBarcode },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="min-h-screen flex w-full">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border/60 bg-sidebar/80 backdrop-blur-xl">
        <div className="px-6 py-6 flex items-center gap-3 border-b border-border/60">
          <div className="size-10 rounded-xl gold-gradient flex items-center justify-center shadow-luxury">
            <Diamond className="size-5 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <p className="font-display text-lg leading-none">Maison</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
              Couture POS
            </p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          <p className="px-3 pb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Workspace
          </p>
          {navItems.map((item) => {
            const active =
              pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to} className="relative block">
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#F4E4BC]/60 to-transparent border border-[#D4AF37]/30"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className={`size-4 relative z-10 ${active ? "text-[#B8860B]" : ""}`} />
                  <span className="relative z-10">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/60">
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs font-semibold">Boutique Atelier</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">5th Avenue · NYC</p>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-muted-foreground">Register open</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top nav */}
        <header className="sticky top-0 z-40 h-16 border-b border-border/60 bg-background/70 backdrop-blur-xl">
          <div className="h-full px-6 flex items-center gap-4">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search products, customers, invoices…"
                className="pl-9 bg-secondary/60 border-border/60 h-10 rounded-xl focus-visible:ring-[#D4AF37]/40"
              />
              <kbd className="hidden md:inline-flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-background text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </div>

            <button
              onClick={() => setDark((d) => !d)}
              className="size-10 rounded-xl border border-border/60 bg-background/60 flex items-center justify-center hover:bg-secondary transition"
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            <button className="relative size-10 rounded-xl border border-border/60 bg-background/60 flex items-center justify-center hover:bg-secondary transition">
              <Bell className="size-4" />
              <span className="absolute top-2 right-2 size-2 rounded-full bg-[#D4AF37] ring-2 ring-background" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-3 pl-2 pr-3 h-10 rounded-xl border border-border/60 bg-background/60 hover:bg-secondary transition">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-gradient-to-br from-[#D4AF37] to-[#B8860B] text-white text-xs">
                    EV
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold leading-none">Eva Voss</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Boutique Manager</p>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Billing</DropdownMenuItem>
                <DropdownMenuItem>Team</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/" className="flex items-center gap-2 w-full">
                    <LogOut className="size-4" /> Sign out
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {title && (
          <div className="px-6 lg:px-10 pt-8 pb-2 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#B8860B]">
                Maison Couture
              </p>
              <h1 className="font-display text-3xl lg:text-4xl mt-1">{title}</h1>
            </div>
            <Badge
              variant="outline"
              className="hidden md:inline-flex luxury-border bg-[#F4E4BC]/30 text-[#B8860B] gap-1.5 py-1.5 px-3"
            >
              <span className="size-1.5 rounded-full bg-[#D4AF37]" />
              Live · Today
            </Badge>
          </div>
        )}

        <main className="flex-1 px-6 lg:px-10 py-6">{children}</main>
      </div>
    </div>
  );
}
