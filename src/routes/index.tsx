import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Diamond, Sparkles, ArrowRight, Mail, Lock } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — Maison Couture POS" },
      {
        name: "description",
        content: "Premium boutique point-of-sale and billing for luxury fashion houses.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => navigate({ to: "/dashboard" }), 600);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div
        className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden text-white"
        style={{ background: "linear-gradient(135deg, #1F2937 0%, #2d3748 60%, #1a202c 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 10%, #D4AF37 0%, transparent 35%), radial-gradient(circle at 80% 90%, #B8860B 0%, transparent 40%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1400&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            mixBlendMode: "luminosity",
          }}
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="size-11 rounded-xl gold-gradient flex items-center justify-center shadow-luxury">
            <Diamond className="size-5 text-white" />
          </div>
          <div>
            <p className="font-display text-xl leading-none">Maison Couture</p>
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/60 mt-1">
              Boutique Operating System
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 max-w-md"
        >
          <Sparkles className="size-5 text-[#D4AF37] mb-6" />
          <h2 className="font-display text-5xl leading-[1.05] tracking-tight">
            The point of sale crafted for <em className="gold-text not-italic">luxury</em> fashion
            houses.
          </h2>
          <p className="mt-6 text-white/70 text-sm leading-relaxed">
            Inventory, clienteling, and billing — together in one elegant register, trusted by
            ateliers from Milan to Manhattan.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-6 border-t border-white/10 pt-6">
            <div>
              <p className="font-display text-2xl gold-text">240+</p>
              <p className="text-[11px] text-white/50 uppercase tracking-wider mt-1">Boutiques</p>
            </div>
            <div>
              <p className="font-display text-2xl gold-text">$48M</p>
              <p className="text-[11px] text-white/50 uppercase tracking-wider mt-1">GMV / yr</p>
            </div>
            <div>
              <p className="font-display text-2xl gold-text">99.9%</p>
              <p className="text-[11px] text-white/50 uppercase tracking-wider mt-1">Uptime</p>
            </div>
          </div>
        </motion.div>

        <p className="relative z-10 text-xs text-white/40">
          © 2026 Maison Couture · Crafted in New York
        </p>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="size-10 rounded-xl gold-gradient flex items-center justify-center">
              <Diamond className="size-5 text-white" />
            </div>
            <p className="font-display text-xl">Maison Couture</p>
          </div>

          <p className="text-[10px] uppercase tracking-[0.22em] text-[#B8860B]">Welcome back</p>
          <h1 className="font-display text-4xl mt-2">Sign in to your atelier</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Enter your credentials to access the register.
          </p>

          <form onSubmit={onSubmit} className="mt-10 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  defaultValue="eva@maisoncouture.com"
                  className="pl-10 h-12 rounded-xl bg-secondary/50 border-border/60"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-wider"
                >
                  Password
                </Label>
                <a className="text-xs text-[#B8860B] hover:underline cursor-pointer">Forgot?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  defaultValue="••••••••"
                  className="pl-10 h-12 rounded-xl bg-secondary/50 border-border/60"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="rem" defaultChecked />
              <Label htmlFor="rem" className="text-xs text-muted-foreground font-normal">
                Keep me signed in on this register
              </Label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl text-white border-0 shadow-luxury hover:opacity-95 group"
              style={{ background: "var(--gradient-gold)" }}
            >
              {loading ? (
                "Signing in…"
              ) : (
                <span className="flex items-center gap-2">
                  Enter atelier{" "}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <span className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="bg-background px-3 text-muted-foreground">Or</span>
              </span>
            </div>

            <Button
              variant="outline"
              type="button"
              className="w-full h-12 rounded-xl border-border/60"
            >
              Continue with SSO
            </Button>

            <p className="text-center text-xs text-muted-foreground pt-2">
              New boutique?{" "}
              <Link to="/dashboard" className="text-[#B8860B] font-semibold hover:underline">
                Request a demo
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
