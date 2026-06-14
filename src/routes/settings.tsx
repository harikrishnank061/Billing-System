import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Save, Store, Shield, Printer, RotateCcw, AlertTriangle, Check } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Register Settings — Maison Couture" },
      {
        name: "description",
        content: "Configure boutique parameters, thermal printers, and tax rules.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings, updateSettings } = useStore();

  // Settings State
  const [storeName, setStoreName] = useState(settings.storeName);
  const [storeAddress, setStoreAddress] = useState(settings.storeAddress);
  const [storePhone, setStorePhone] = useState(settings.storePhone);
  const [storeEmail, setStoreEmail] = useState(settings.storeEmail);
  const [gstin, setGstin] = useState(settings.gstin);
  const [pointsRate, setPointsRate] = useState(settings.loyaltyPointsPerDollar);
  const [pointVal, setPointVal] = useState(settings.loyaltyPointValue);

  // Demo print format
  const [printFormat, setPrintFormat] = useState<"80mm" | "A4">("80mm");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      storeName,
      storeAddress,
      storePhone,
      storeEmail,
      gstin,
      loyaltyPointsPerDollar: Number(pointsRate),
      loyaltyPointValue: Number(pointVal),
    });
    toast.success("Register settings updated successfully.");
  };

  const handleReset = () => {
    if (
      confirm(
        "WARNING: This will wipe all current transactions, custom clients, and products and restore seed data. Proceed?",
      )
    ) {
      localStorage.clear();
      toast.success("Database restored to factory seeds. Reloading...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <AppShell title="Register Control Panel">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-6 border-b pb-3">
              <Store className="size-5 text-[#B8860B]" />
              <h3 className="font-display text-xl">Boutique Store Profile</h3>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Store / Boutique Name
                  </label>
                  <Input
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="h-11 rounded-xl bg-secondary/50 focus-visible:ring-[#D4AF37]/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    GSTIN (Tax Registration)
                  </label>
                  <Input
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="h-11 rounded-xl bg-secondary/50 focus-visible:ring-[#D4AF37]/50 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Atelier Physical Address
                </label>
                <Input
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  className="h-11 rounded-xl bg-secondary/50 focus-visible:ring-[#D4AF37]/50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Store Phone
                  </label>
                  <Input
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    className="h-11 rounded-xl bg-secondary/50 focus-visible:ring-[#D4AF37]/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Contact Email
                  </label>
                  <Input
                    type="email"
                    value={storeEmail}
                    onChange={(e) => setStoreEmail(e.target.value)}
                    className="h-11 rounded-xl bg-secondary/50 focus-visible:ring-[#D4AF37]/50"
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-6">
                <Button
                  type="submit"
                  className="h-11 rounded-xl gap-2 text-white border-0 shadow-luxury"
                  style={{ background: "var(--gradient-gold)" }}
                >
                  <Save className="size-4" /> Save Configuration
                </Button>
              </div>
            </form>
          </motion.div>

          {/* Invoice Printer details */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-6 border-b pb-3">
              <Printer className="size-5 text-[#B8860B]" />
              <h3 className="font-display text-xl">Hardware & Printing</h3>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                  Default Bill Format
                </span>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      id: "80mm",
                      label: "80mm Thermal Receipt (Standard POS)",
                      desc: "Optimized for continuous roll register printers",
                    },
                    {
                      id: "A4",
                      label: "A4 Full sheet Invoice (Atelier Slip)",
                      desc: "Formal luxury boutique folder invoice layout",
                    },
                  ].map((format) => {
                    const active = printFormat === format.id;
                    return (
                      <button
                        key={format.id}
                        onClick={() => setPrintFormat(format.id as "80mm" | "A4")}
                        className={`text-left p-4 rounded-xl border transition flex flex-col justify-between h-24 relative ${
                          active
                            ? "border-[#D4AF37] bg-[#F4E4BC]/20"
                            : "border-border bg-white hover:border-[#D4AF37]/40"
                        }`}
                      >
                        <div>
                          <p className="text-xs font-semibold">{format.label}</p>
                          <p className="text-[10px] text-muted-foreground mt-1 leading-normal">
                            {format.desc}
                          </p>
                        </div>
                        {active && (
                          <div className="absolute right-3 bottom-3 size-5 rounded-full gold-gradient flex items-center justify-center">
                            <Check className="size-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right col: Rules, Loyalty, Danger zone */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-6 border-b pb-3">
              <Shield className="size-5 text-[#B8860B]" />
              <h3 className="font-display text-xl">Loyalty Multipliers</h3>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Points per Dollar Spent
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={pointsRate}
                  onChange={(e) => setPointsRate(Number(e.target.value) || 0)}
                  className="h-11 rounded-xl bg-secondary/50 focus-visible:ring-[#D4AF37]/50"
                />
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  e.g. 0.1 means $10 spent yields 1 point.
                </span>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Points Cash Redemption Value ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={pointVal}
                  onChange={(e) => setPointVal(Number(e.target.value) || 0)}
                  className="h-11 rounded-xl bg-secondary/50 focus-visible:ring-[#D4AF37]/50"
                />
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  Value of 1 point during discount checkout.
                </span>
              </div>
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full h-11 rounded-xl border-[#D4AF37]/30 text-[#B8860B]"
                >
                  Update Multipliers
                </Button>
              </div>
            </form>
          </motion.div>

          {/* Danger zone */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-6 border-rose-200/50 bg-rose-50/20"
          >
            <div className="flex items-center gap-2 mb-4 border-b border-rose-100 pb-3 text-rose-800">
              <AlertTriangle className="size-5" />
              <h3 className="font-display text-xl">Danger Registry Zone</h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Clearing the database restores default boutique inventory catalogs, invoices logs, and
              default settings. All custom client adjustments will be lost.
            </p>

            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full h-11 rounded-xl border-rose-600/30 text-rose-700 hover:bg-rose-50 gap-2"
            >
              <RotateCcw className="size-4" /> Reset POS Database
            </Button>
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
