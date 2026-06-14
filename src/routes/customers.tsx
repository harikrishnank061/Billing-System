import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Users, Award, ShoppingBag, Eye, X, Phone, Mail, MapPin } from "lucide-react";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore, type Customer } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customers — Maison Couture" },
      { name: "description", content: "Premium customer clienteling and loyalty rewards tracker." },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const { customers, invoices, addCustomer } = useStore();
  const [q, setQ] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const filtered = useMemo(() => {
    return customers.filter(
      (c) =>
        c.id !== "Walk-in" &&
        (c.name.toLowerCase().includes(q.toLowerCase()) ||
          c.phone.includes(q) ||
          c.email.toLowerCase().includes(q.toLowerCase())),
    );
  }, [customers, q]);

  // Analytics
  const stats = useMemo(() => {
    const activeCustomers = customers.filter((c) => c.id !== "Walk-in");
    const repeatCustCount = activeCustomers.filter((c) => c.purchaseHistory.length > 1).length;
    const totalPoints = activeCustomers.reduce((acc, c) => acc + c.loyaltyPoints, 0);
    const topSpender = activeCustomers.reduce(
      (prev, current) => {
        const prevTotal = prev ? prev.purchaseHistory.reduce((s, h) => s + h.amount, 0) : 0;
        const curTotal = current.purchaseHistory.reduce((s, h) => s + h.amount, 0);
        return curTotal > prevTotal ? current : prev;
      },
      null as Customer | null,
    );

    return {
      total: activeCustomers.length,
      repeat: repeatCustCount,
      repeatRate: activeCustomers.length
        ? Math.round((repeatCustCount / activeCustomers.length) * 100)
        : 0,
      points: totalPoints,
      topSpender: topSpender
        ? `${topSpender.name} ($${topSpender.purchaseHistory.reduce((s, h) => s + h.amount, 0).toLocaleString()})`
        : "None",
    };
  }, [customers]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addCustomer({
      name,
      phone,
      email,
      address,
    });
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setIsAddOpen(false);
  };

  const getCustomerTotalSales = (c: Customer) => {
    return c.purchaseHistory.reduce((sum, item) => sum + item.amount, 0);
  };

  return (
    <AppShell title="Clientele Registry">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
        {[
          { label: "Active Clients", value: stats.total, icon: Users, sub: "Loyal subscribers" },
          {
            label: "Repeat Customers",
            value: `${stats.repeat} (${stats.repeatRate}%)`,
            icon: ShoppingBag,
            sub: "More than 1 purchase",
          },
          {
            label: "Total Reward Points",
            value: stats.points.toLocaleString(),
            icon: Award,
            sub: "Available points pool",
          },
          {
            label: "Top Spender Portfolio",
            value: stats.topSpender,
            icon: Award,
            sub: "Lifetime value leader",
          },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-2xl p-5 hover-lift relative overflow-hidden group"
          >
            <div className="absolute -right-8 -top-8 size-28 rounded-full opacity-10 blur-2xl gold-gradient" />
            <div className="flex items-center justify-between">
              <div className="size-10 rounded-xl bg-[#F4E4BC]/50 flex items-center justify-center">
                <m.icon className="size-5 text-[#B8860B]" />
              </div>
            </div>
            <p className="mt-4 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {m.label}
            </p>
            <p className="font-display text-xl lg:text-2xl mt-1 truncate">{m.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{m.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Control panel */}
      <div className="glass-card rounded-2xl p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search customers by name, phone or email…"
              className="pl-9 h-11 rounded-xl bg-secondary/60 border-border/60"
            />
          </div>

          <Button
            onClick={() => setIsAddOpen(true)}
            className="h-11 rounded-xl gap-2 text-white border-0 shadow-luxury md:ml-auto"
            style={{ background: "var(--gradient-gold)" }}
          >
            <Plus className="size-4" /> Add New Client
          </Button>
        </div>
      </div>

      {/* Table List */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-[#FAF9F6] to-transparent">
              <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <th className="px-6 py-4 font-medium">Customer Details</th>
                <th className="px-4 py-4 font-medium">Contact</th>
                <th className="px-4 py-4 font-medium">Address</th>
                <th className="px-4 py-4 font-medium">Reward Points</th>
                <th className="px-4 py-4 font-medium">Purchases</th>
                <th className="px-4 py-4 font-medium">Total Spend</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-t border-border/40 hover:bg-[#F4E4BC]/10 transition group"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-base">{c.name}</p>
                      <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">
                        {c.id}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs space-y-0.5">
                    <p className="flex items-center gap-1.5">
                      <Phone className="size-3 text-[#B8860B]" /> {c.phone}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Mail className="size-3 text-muted-foreground" /> {c.email}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-xs text-muted-foreground max-w-[180px] truncate">
                    <p className="flex items-center gap-1">
                      <MapPin className="size-3 text-muted-foreground" /> {c.address}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <Award className="size-4 text-[#D4AF37]" />
                      <span className="font-semibold text-[#B8860B]">{c.loyaltyPoints}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Badge variant="outline" className="bg-secondary/60 font-semibold">
                      {c.purchaseHistory.length}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 font-display font-medium text-base">
                    $
                    {getCustomerTotalSales(c).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedCust(c)}
                      className="h-9 px-3.5 rounded-xl border-[#D4AF37]/30 hover:bg-[#F4E4BC]/20 text-[#B8860B] text-xs gap-1.5"
                    >
                      <Eye className="size-3.5" /> Profile Log
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-20 text-center">
              <div className="mx-auto size-14 rounded-full bg-[#F4E4BC]/40 flex items-center justify-center">
                <Users className="size-5 text-[#B8860B]" />
              </div>
              <p className="font-display text-xl mt-4">No clients match query</p>
              <p className="text-sm text-muted-foreground mt-1">
                Check spelling or create a new client profile.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Add Client Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-2xl border-[#D4AF37]/30">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Register Atelier Client</DialogTitle>
            <DialogDescription className="text-xs">
              Create a profile to log purchase history and accumulate loyalty points.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAdd} className="space-y-4 my-2">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Full Name
              </label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Victoria Beckham"
                className="h-11 rounded-xl bg-secondary/50 focus-visible:ring-[#D4AF37]/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Phone Number
                </label>
                <Input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 0199"
                  className="h-11 rounded-xl bg-secondary/50 focus-visible:ring-[#D4AF37]/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@luxury.com"
                  className="h-11 rounded-xl bg-secondary/50 focus-visible:ring-[#D4AF37]/50"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Delivery / Billing Address
              </label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, City, Country"
                className="h-11 rounded-xl bg-secondary/50 focus-visible:ring-[#D4AF37]/50"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                className="rounded-xl h-11"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl h-11 text-white border-0"
                style={{ background: "var(--gradient-gold)" }}
              >
                Create Client Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Client Profile Details Drawer / Modal */}
      <Dialog open={selectedCust !== null} onOpenChange={(open) => !open && setSelectedCust(null)}>
        <DialogContent className="max-w-2xl rounded-2xl border-[#D4AF37]/30">
          {selectedCust && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-3xl border-b pb-3 flex items-center justify-between">
                  <span>{selectedCust.name}</span>
                  <Badge className="gold-gradient text-white text-xs py-1 px-3 border-0">
                    {selectedCust.loyaltyPoints} loyalty points
                  </Badge>
                </DialogTitle>
                <div className="grid grid-cols-3 gap-4 text-xs pt-3 text-muted-foreground">
                  <div>
                    <span className="font-semibold uppercase tracking-wider block text-[10px]">
                      Client ID
                    </span>
                    <span className="text-foreground font-mono">{selectedCust.id}</span>
                  </div>
                  <div>
                    <span className="font-semibold uppercase tracking-wider block text-[10px]">
                      Phone
                    </span>
                    <span className="text-foreground">{selectedCust.phone}</span>
                  </div>
                  <div>
                    <span className="font-semibold uppercase tracking-wider block text-[10px]">
                      Email
                    </span>
                    <span className="text-foreground break-all">{selectedCust.email}</span>
                  </div>
                </div>
                <div className="pt-3 border-t text-xs">
                  <span className="font-semibold uppercase tracking-wider block text-[10px] text-muted-foreground">
                    Address
                  </span>
                  <span className="text-foreground">{selectedCust.address}</span>
                </div>
              </DialogHeader>

              <div className="my-4">
                <h3 className="font-display text-lg mb-3">Purchase & Invoice Log</h3>
                <div className="max-h-60 overflow-y-auto border border-border/60 rounded-xl">
                  {selectedCust.purchaseHistory.length === 0 ? (
                    <p className="py-8 text-center text-xs text-muted-foreground">
                      No transactions logged yet.
                    </p>
                  ) : (
                    <table className="w-full text-xs text-left">
                      <thead className="bg-secondary/40 sticky top-0">
                        <tr className="uppercase tracking-wider text-muted-foreground border-b text-[9px] font-semibold">
                          <th className="p-3">Invoice ID</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Items</th>
                          <th className="p-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCust.purchaseHistory.map((h) => (
                          <tr
                            key={h.invoiceId}
                            className="border-b border-border/40 hover:bg-secondary/20 transition"
                          >
                            <td className="p-3 font-mono font-semibold text-[#B8860B]">
                              {h.invoiceId}
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {new Date(h.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="p-3">{h.itemsCount} pcs</td>
                            <td className="p-3 text-right font-semibold font-display text-sm">
                              ${h.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => setSelectedCust(null)}
                  className="rounded-xl h-11 border-0 text-white"
                  style={{ background: "var(--gradient-gold)" }}
                >
                  Done
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
