import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  ScanBarcode,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  Receipt,
  User,
  Tag,
  ShoppingBag,
  PlusCircle,
  Printer,
  Download,
  Mail,
  ChevronRight,
  X,
} from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useStore, type Product, type Customer, type Invoice, type InvoiceItem } from "@/lib/store";
import { QrCode } from "@/components/ui/QrCode";
import { toast } from "sonner";

export const Route = createFileRoute("/pos")({
  head: () => ({
    meta: [
      { title: "POS Billing Register — Maison Couture" },
      {
        name: "description",
        content: "Interactive point-of-sale checkout register with client management.",
      },
    ],
  }),
  component: POSPage,
});

type CartItem = Product & {
  qty: number;
  customPrice: number; // allows over-riding price per sale
  customGst: number;
};

function POSPage() {
  const { products, customers, settings, createInvoice, addCustomer } = useStore();

  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);

  // Discount & Coupon State
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  // Customer State
  const [customerId, setCustomerId] = useState("Walk-in");
  const [isNewCustOpen, setIsNewCustOpen] = useState(false);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");

  // Split payment state
  const [paymentMethod, setPaymentMethod] = useState<
    "Cash" | "UPI" | "Credit Card" | "Debit Card" | "Net Banking" | "Split"
  >("Credit Card");
  const [cashSplit, setCashSplit] = useState("");
  const [upiSplit, setUpiSplit] = useState("");
  const [cardSplit, setCardSplit] = useState("");

  // Invoice / Receipt Drawer State
  const [finalizedInvoice, setFinalizedInvoice] = useState<Invoice | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [checkoutNotes, setCheckoutNotes] = useState("");

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return ["All", ...Array.from(set)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        (categoryFilter === "All" || p.category === categoryFilter) &&
        (q === "" ||
          p.name.toLowerCase().includes(q.toLowerCase()) ||
          p.sku.toLowerCase().includes(q.toLowerCase()) ||
          p.barcode.includes(q)),
    );
  }, [products, categoryFilter, q]);

  // Keyboard Scanner emulation listener
  useEffect(() => {
    let barcodeBuffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not intercept standard text boxes
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      ) {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 100) {
        barcodeBuffer = ""; // Clear stale characters
      }

      if (e.key === "Enter") {
        if (barcodeBuffer.length > 2) {
          const found = products.find(
            (p) => p.barcode === barcodeBuffer || p.sku === barcodeBuffer,
          );
          if (found) {
            addToCart(found);
            toast.success(`Scanned: ${found.name}`);
          } else {
            toast.error(`Barcode/SKU not detected: ${barcodeBuffer}`);
          }
          barcodeBuffer = "";
        }
      } else if (e.key.length === 1) {
        barcodeBuffer += e.key;
      }
      lastKeyTime = currentTime;
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [products]);

  // Cart operations
  const addToCart = (p: Product) => {
    if (p.stock <= 0) {
      toast.error("Product has 0 stock count. Cannot add to cart.");
      return;
    }
    setCart((curr) => {
      const existing = curr.find((item) => item.id === p.id);
      if (existing) {
        if (existing.qty >= p.stock) {
          toast.error(`Cannot exceed current available stock of ${p.stock} pcs.`);
          return curr;
        }
        return curr.map((item) => (item.id === p.id ? { ...item, qty: item.qty + 1 } : item));
      }
      return [...curr, { ...p, qty: 1, customPrice: p.sellingPrice, customGst: p.gst }];
    });
  };

  const updateCartQty = (id: string, newQty: number, maxStock: number) => {
    if (newQty > maxStock) {
      toast.error(`Cannot exceed current available stock of ${maxStock} pcs.`);
      return;
    }
    setCart((curr) =>
      newQty <= 0
        ? curr.filter((item) => item.id !== id)
        : curr.map((item) => (item.id === id ? { ...item, qty: newQty } : item)),
    );
  };

  const updateCartPrice = (id: string, price: number) => {
    setCart((curr) =>
      curr.map((item) => (item.id === id ? { ...item, customPrice: price } : item)),
    );
  };

  const updateCartGst = (id: string, rate: number) => {
    setCart((curr) => curr.map((item) => (item.id === id ? { ...item, customGst: rate } : item)));
  };

  const handleManualBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBarcode.trim()) return;

    const found = products.find(
      (p) => p.barcode === manualBarcode.trim() || p.sku === manualBarcode.trim(),
    );
    if (found) {
      addToCart(found);
      setManualBarcode("");
    } else {
      toast.error(`Barcode/SKU not found: ${manualBarcode}`);
    }
  };

  // Coupons logic
  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (code === "WELCOME10") {
      setDiscountPercent(10);
      setAppliedCoupon(code);
      toast.success("Coupon WELCOME10 applied (10% discount)");
    } else if (code === "SUMMER20") {
      setDiscountPercent(20);
      setAppliedCoupon(code);
      toast.success("Coupon SUMMER20 applied (20% discount)");
    } else {
      toast.error("Invalid coupon code.");
    }
    setCouponCode("");
  };

  const clearCoupon = () => {
    setDiscountPercent(0);
    setAppliedCoupon(null);
  };

  // Dynamic calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.customPrice * item.qty, 0);
  }, [cart]);

  const discountAmt = useMemo(() => {
    return (subtotal * discountPercent) / 100;
  }, [subtotal, discountPercent]);

  // GST Breakdown per item
  const gstBreakdown = useMemo(() => {
    let totalTax = 0;
    const ratesMap: Record<number, number> = {};

    cart.forEach((item) => {
      const itemNet = item.customPrice * item.qty * (1 - discountPercent / 100);
      const itemTax = itemNet * (item.customGst / 100);
      totalTax += itemTax;
      ratesMap[item.customGst] = (ratesMap[item.customGst] || 0) + itemTax;
    });

    return {
      totalTax,
      rates: Object.keys(ratesMap).map((rate) => ({
        rate: Number(rate),
        amount: ratesMap[Number(rate)],
      })),
    };
  }, [cart, discountPercent]);

  const total = subtotal - discountAmt + gstBreakdown.totalTax;

  const currentCustomer = useMemo(() => {
    return customers.find((c) => c.id === customerId);
  }, [customers, customerId]);

  // Create client profile
  const handleCreateCust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) return;

    const newCust = addCustomer({
      name: custName,
      phone: custPhone,
      email: custEmail,
      address: "Atelier Walk-in Suite",
    });

    setCustomerId(newCust.id);
    setCustName("");
    setCustPhone("");
    setCustEmail("");
    setIsNewCustOpen(false);
    toast.success("Client account added to POS.");
  };

  // Submit sale
  const handleFinalizeCheckout = () => {
    if (cart.length === 0) return;

    // Split calculations check
    if (paymentMethod === "Split") {
      const cash = parseFloat(cashSplit) || 0;
      const upi = parseFloat(upiSplit) || 0;
      const card = parseFloat(cardSplit) || 0;
      const totalEntered = cash + upi + card;
      if (Math.abs(totalEntered - total) > 0.05) {
        toast.error(
          `Split amounts ($${totalEntered.toFixed(2)}) must equal invoice total ($${total.toFixed(2)}).`,
        );
        return;
      }
    }

    const invoiceItems = cart.map((item) => ({
      productId: item.id,
      name: item.name,
      sku: item.sku,
      qty: item.qty,
      price: item.customPrice,
      gstRate: item.customGst,
      purchasePrice: item.purchasePrice,
    }));

    const invoice = createInvoice({
      customerId,
      customerName: currentCustomer?.name || "Walk-in Customer",
      customerPhone: currentCustomer?.phone,
      items: invoiceItems,
      subtotal,
      discountPercent,
      discountAmt,
      tax: gstBreakdown.totalTax,
      total,
      paymentMethod,
      splitDetails:
        paymentMethod === "Split"
          ? {
              cash: parseFloat(cashSplit) || 0,
              upi: parseFloat(upiSplit) || 0,
              card: parseFloat(cardSplit) || 0,
            }
          : undefined,
      notes: checkoutNotes,
    });

    setFinalizedInvoice(invoice);
    // Clear cart
    setCart([]);
    setDiscountPercent(0);
    setAppliedCoupon(null);
    setCheckoutNotes("");
    setCashSplit("");
    setUpiSplit("");
    setCardSplit("");
    toast.success("Checkout transaction complete.");
  };

  const handlePrintInvoice = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !finalizedInvoice) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${finalizedInvoice.id}</title>
          <style>
            body { font-family: sans-serif; font-size: 12px; line-height: 1.4; padding: 20px; color: #111; }
            .header { text-align: center; border-bottom: 2px double #ccc; padding-bottom: 12px; margin-bottom: 15px; }
            .logo { font-size: 18px; font-weight: bold; font-family: serif; letter-spacing: 2px; }
            .store-info { font-size: 10px; color: #555; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 11px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th { border-bottom: 1px solid #111; font-weight: bold; padding: 4px; text-align: left; }
            td { padding: 4px 0; border-bottom: 1px solid #eee; }
            .right { text-align: right; }
            .totals { font-size: 12px; font-weight: bold; width: 50%; margin-left: auto; }
            .totals div { display: flex; justify-content: space-between; padding: 2px 0; }
            .tax-box { font-size: 9px; color: #555; margin-top: 15px; border-top: 1px dashed #ccc; padding-top: 5px; }
            .footer { text-align: center; margin-top: 25px; font-size: 10px; border-top: 1px solid #eee; padding-top: 10px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">
            <div class="logo">${settings.storeName.toUpperCase()}</div>
            <div class="store-info">
              ${settings.storeAddress}<br>
              Phone: ${settings.storePhone} | GSTIN: ${settings.gstin}
            </div>
          </div>
          <div class="meta">
            <div>
              <strong>Bill To:</strong> ${finalizedInvoice.customerName}<br>
              ${finalizedInvoice.customerPhone ? `Phone: ${finalizedInvoice.customerPhone}` : ""}
            </div>
            <div>
              <strong>Invoice #:</strong> ${finalizedInvoice.id}<br>
              <strong>Date:</strong> ${new Date(finalizedInvoice.date).toLocaleDateString()}<br>
              <strong>Payment:</strong> ${finalizedInvoice.paymentMethod}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th class="right">Qty</th>
                <th class="right">Price</th>
                <th class="right">GST</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${finalizedInvoice.items
                .map(
                  (item: InvoiceItem) => `
                <tr>
                  <td>${item.name}<br><small style="color:#666">${item.sku}</small></td>
                  <td class="right">${item.qty}</td>
                  <td class="right">$${item.price.toFixed(2)}</td>
                  <td class="right">${item.gstRate}%</td>
                  <td class="right">$${(item.price * item.qty).toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>

          <div class="totals">
            <div><span>Subtotal:</span><span>$${finalizedInvoice.subtotal.toFixed(2)}</span></div>
            ${finalizedInvoice.discountAmt > 0 ? `<div><span>Discount (${finalizedInvoice.discountPercent}%):</span><span>-$${finalizedInvoice.discountAmt.toFixed(2)}</span></div>` : ""}
            <div><span>GST Tax:</span><span>$${finalizedInvoice.tax.toFixed(2)}</span></div>
            <div style="border-top:1px solid #111; padding-top:4px; font-size:14px;"><span>GRAND TOTAL:</span><span>$${finalizedInvoice.total.toFixed(2)}</span></div>
          </div>

          <div class="tax-box">
            <strong>GST Breakdown:</strong><br>
            GST tax included in billing matrix representing dynamic boutique categories.
          </div>

          <div class="footer">
            Thank you for shopping at Maison Couture.<br>
            Please note: No exchanges without a valid invoice document copy.
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <AppShell>
      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr_0.95fr] gap-5 h-[calc(100vh-6.5rem)]">
        {/* Left — products list */}
        <div className="glass-card rounded-2xl p-5 flex flex-col min-h-0">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#B8860B]">
                Atelier Showcase
              </p>
              <h2 className="font-display text-2xl">POS billing registry</h2>
            </div>
            <Badge
              variant="outline"
              className="text-[10px] uppercase tracking-wider luxury-border bg-[#F4E4BC]/20 text-[#B8860B]"
            >
              F5 SCANNER STANDBY
            </Badge>
          </div>

          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products by tag or code..."
                className="pl-9 h-11 rounded-xl bg-secondary/60 border-border/60"
              />
            </div>

            <form onSubmit={handleManualBarcodeSubmit} className="relative">
              <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#B8860B]" />
              <Input
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                placeholder="Manual Barcode/SKU scan..."
                className="pl-9 h-11 w-52 rounded-xl bg-[#F4E4BC]/20 border-[#D4AF37]/35 font-mono text-xs"
              />
            </form>
          </div>

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-3.5 h-8 rounded-full text-xs font-medium transition ${
                  categoryFilter === c
                    ? "text-white shadow-luxury"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                }`}
                style={categoryFilter === c ? { background: "var(--gradient-gold)" } : undefined}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto pr-1 -mr-1">
            {filteredProducts.map((p, i) => (
              <motion.button
                key={p.id}
                onClick={() => addToCart(p)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.01 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group text-left rounded-xl overflow-hidden bg-white/70 border border-border/60 hover:border-[#D4AF37]/50 hover:shadow-luxury transition flex flex-col justify-between"
              >
                <div className="aspect-[4/5] overflow-hidden bg-secondary relative shrink-0">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  {p.stock < 5 && p.stock > 0 && (
                    <Badge className="absolute top-2 left-2 bg-amber-500 text-white border-0 text-[10px]">
                      Low · {p.stock}
                    </Badge>
                  )}
                  {p.stock === 0 && (
                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                      <span className="text-white text-xs font-semibold uppercase tracking-wider">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-semibold line-clamp-1">{p.name}</p>
                    <p className="text-[9px] text-muted-foreground font-mono">{p.sku}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="font-display text-sm font-bold text-foreground">
                      ${p.sellingPrice}{" "}
                      <span className="text-[8px] text-muted-foreground font-sans">({p.gst}%)</span>
                    </p>
                    <div className="size-6 rounded-full gold-gradient flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <Plus className="size-3 text-white" />
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Center — cart details */}
        <div className="glass-card rounded-2xl p-5 flex flex-col min-h-0">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#B8860B]">
                Selected Order
              </p>
              <h2 className="font-display text-2xl">
                Cart Registry · {cart.reduce((s, i) => s + i.qty, 0)}
              </h2>
            </div>
            <button
              onClick={() => setCart([])}
              className="text-xs text-muted-foreground hover:text-rose-600 flex items-center gap-1.5"
            >
              <Trash2 className="size-3.5" /> Clear
            </button>
          </div>

          {/* Cart Items list */}
          <div className="mt-4 flex-1 overflow-y-auto -mr-1 pr-1 space-y-3">
            <AnimatePresence>
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <div className="size-16 rounded-full bg-[#F4E4BC]/30 flex items-center justify-center mb-4">
                    <ShoppingBag className="size-6 text-[#B8860B]" />
                  </div>
                  <p className="font-display text-lg">Your cart is empty</p>
                  <p className="text-xs text-muted-foreground max-w-[200px] mt-1">
                    Scan a barcode tag or click products from showcase.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 6 }}
                    className="p-3 rounded-xl bg-white border border-border/60 space-y-2.5 relative group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-12 rounded-lg overflow-hidden shrink-0 border bg-secondary">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{item.name}</p>
                        <p className="text-[9px] font-mono text-muted-foreground">{item.sku}</p>
                      </div>
                      <button
                        onClick={() => updateCartQty(item.id, 0, item.stock)}
                        className="size-7 rounded-lg hover:bg-rose-50 flex items-center justify-center text-muted-foreground hover:text-rose-600 opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>

                    {/* Quantity & Price Overwrite Controls */}
                    <div className="flex items-center justify-between border-t border-dashed pt-2 text-xs gap-3">
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => updateCartQty(item.id, item.qty - 1, item.stock)}
                          className="size-6 rounded border bg-secondary flex items-center justify-center"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-6 text-center font-bold">{item.qty}</span>
                        <button
                          onClick={() => updateCartQty(item.id, item.qty + 1, item.stock)}
                          className="size-6 rounded gold-gradient text-white flex items-center justify-center"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>

                      {/* Custom Price Overwrite */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">$</span>
                        <Input
                          type="number"
                          value={item.customPrice}
                          onChange={(e) => updateCartPrice(item.id, Number(e.target.value) || 0)}
                          className="h-7 w-20 px-1.5 text-center text-xs font-bold rounded-lg border-border/80"
                        />
                      </div>

                      {/* Custom GST Bracket */}
                      <select
                        value={item.customGst}
                        onChange={(e) => updateCartGst(item.id, Number(e.target.value))}
                        className="h-7 w-16 text-[10px] rounded-lg border border-border px-1"
                      >
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                      </select>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Pricing breakdown summary */}
          <div className="mt-4 pt-4 border-t border-border/60 space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Coupon code (e.g. WELCOME10)"
                  className="pl-9 h-10 rounded-xl bg-secondary/60 text-xs border-border/60"
                />
              </div>
              <Button
                onClick={handleApplyCoupon}
                variant="outline"
                className="h-10 rounded-xl text-xs"
              >
                Apply
              </Button>
            </div>

            {appliedCoupon && (
              <div className="flex items-center justify-between text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 p-2 rounded-xl">
                <span>
                  Code applied: <strong>{appliedCoupon}</strong> (-{discountPercent}%)
                </span>
                <button
                  onClick={clearCoupon}
                  className="text-muted-foreground hover:text-black font-semibold"
                >
                  <X className="size-3" />
                </button>
              </div>
            )}

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Retail Subtotal</span>
                <span className="font-semibold text-foreground">${subtotal.toFixed(2)}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon Discount</span>
                  <span>-${discountAmt.toFixed(2)}</span>
                </div>
              )}
              {/* GST Tax Rate list */}
              {gstBreakdown.rates.map((r) => (
                <div
                  key={r.rate}
                  className="flex justify-between text-[11px] text-muted-foreground pl-2 border-l border-border"
                >
                  <span>GST {r.rate}% Bracket</span>
                  <span>+${r.amount.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-sm pt-2 border-t">
                <span>Final Billing</span>
                <span className="gold-text font-display text-base">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — checkout payment methods */}
        <div className="glass-card rounded-2xl p-5 flex flex-col min-h-0 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 size-40 rounded-full opacity-10 blur-3xl gold-gradient" />

          <div className="border-b pb-2">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#B8860B]">
              Transaction Setup
            </p>
            <h2 className="font-display text-2xl">Finalize Register</h2>
          </div>

          <div className="mt-4 space-y-4 flex-1 overflow-y-auto pr-1 -mr-1">
            {/* Customer select */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <label className="font-semibold uppercase tracking-wider flex items-center gap-1">
                  <User className="size-3.5 text-[#B8860B]" /> Client Link
                </label>
                <button
                  onClick={() => setIsNewCustOpen(true)}
                  className="text-[#B8860B] font-bold hover:underline flex items-center gap-1"
                >
                  <PlusCircle className="size-3" /> Register New
                </button>
              </div>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full h-11 rounded-xl bg-secondary/60 border border-border px-3 text-xs"
              >
                <option value="Walk-in">Walk-in Customer (Guest Checkout)</option>
                {customers
                  .filter((c) => c.id !== "Walk-in")
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
              </select>
            </div>

            {/* Loyalty points info */}
            {currentCustomer && currentCustomer.id !== "Walk-in" && (
              <div className="p-3 rounded-xl border border-[#D4AF37]/30 bg-[#F4E4BC]/10 text-xs flex justify-between items-center text-[#B8860B]">
                <span>
                  Accumulated Rewards: <strong>{currentCustomer.loyaltyPoints} points</strong>
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold">
                  10% Award multiplier
                </span>
              </div>
            )}

            {/* Payment Modes */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                Billing Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "Credit Card", label: "Credit Card", icon: CreditCard },
                  { id: "Debit Card", label: "Debit Card", icon: CreditCard },
                  { id: "Cash", label: "Cash Box", icon: Banknote },
                  { id: "UPI", label: "UPI QR Scanner", icon: Smartphone },
                  { id: "Net Banking", label: "Net Bank", icon: Smartphone },
                  { id: "Split", label: "Split Billing", icon: Smartphone },
                ].map((m) => {
                  const active = paymentMethod === m.id;
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() =>
                        setPaymentMethod(
                          m.id as
                            | "Cash"
                            | "UPI"
                            | "Credit Card"
                            | "Debit Card"
                            | "Net Banking"
                            | "Split",
                        )
                      }
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold text-left transition ${
                        active
                          ? "border-[#D4AF37] bg-[#F4E4BC]/35 shadow-luxury"
                          : "border-border bg-white/50 hover:border-[#D4AF37]/40"
                      }`}
                    >
                      <Icon
                        className={`size-3.5 ${active ? "text-[#B8860B]" : "text-muted-foreground"}`}
                      />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Split checkout fields */}
            {paymentMethod === "Split" && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2 p-3 bg-secondary/50 rounded-xl border"
              >
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Enter split payment values
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="space-y-1">
                    <label className="text-[9px]">Cash ($)</label>
                    <Input
                      value={cashSplit}
                      onChange={(e) => setCashSplit(e.target.value)}
                      placeholder="0.00"
                      className="h-8 p-1.5 text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px]">UPI ($)</label>
                    <Input
                      value={upiSplit}
                      onChange={(e) => setUpiSplit(e.target.value)}
                      placeholder="0.00"
                      className="h-8 p-1.5 text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px]">Card ($)</label>
                    <Input
                      value={cardSplit}
                      onChange={(e) => setCardSplit(e.target.value)}
                      placeholder="0.00"
                      className="h-8 p-1.5 text-center"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Checkout notes */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                Order Remarks / Notes
              </label>
              <Input
                value={checkoutNotes}
                onChange={(e) => setCheckoutNotes(e.target.value)}
                placeholder="Gift wrap request, delivery date, custom fit..."
                className="h-10 rounded-xl bg-secondary/60 text-xs border-border/60"
              />
            </div>

            {/* Order Ledger card */}
            <div className="rounded-xl p-4 bg-gradient-to-br from-[#1F2937] to-slate-900 text-white relative overflow-hidden shrink-0 mt-3 shadow-md">
              <div className="absolute right-0 top-0 size-24 bg-gradient-to-bl from-[#D4AF37]/25 to-transparent blur-xl" />
              <div className="relative">
                <span className="text-[9px] uppercase tracking-[0.2em] text-[#D4AF37] font-semibold">
                  Total Payable Cash
                </span>
                <h3 className="font-display text-3xl font-semibold mt-1">${total.toFixed(2)}</h3>
                <div className="mt-3 flex justify-between text-[10px] text-white/60 pt-2 border-t border-white/10">
                  <span>
                    Selected Client: <strong>{currentCustomer?.name || "Walk-in"}</strong>
                  </span>
                  <span>
                    Items Count: <strong>{cart.reduce((s, i) => s + i.qty, 0)} pcs</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Button
            disabled={cart.length === 0}
            onClick={handleFinalizeCheckout}
            className="w-full h-14 rounded-xl text-white border-0 shadow-luxury text-base font-semibold disabled:opacity-50 mt-4"
            style={{ background: "var(--gradient-gold)" }}
          >
            <Receipt className="size-5 mr-2" /> Complete Registry Checkout
          </Button>
        </div>
      </div>

      {/* New Client Creation Dialog */}
      <Dialog open={isNewCustOpen} onOpenChange={setIsNewCustOpen}>
        <DialogContent className="max-w-md rounded-2xl border-[#D4AF37]/30">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Quick Client Registration</DialogTitle>
            <DialogDescription className="text-xs">
              Quickly record basic client contacts to attach to this billing register.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCust} className="space-y-4 my-2 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Name
              </label>
              <Input
                required
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                placeholder="Client Name"
                className="h-10 rounded-xl bg-secondary/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Phone
                </label>
                <Input
                  required
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="+1 555 0000"
                  className="h-10 rounded-xl bg-secondary/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Email
                </label>
                <Input
                  type="email"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  placeholder="email@luxe.com"
                  className="h-10 rounded-xl bg-secondary/50"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewCustOpen(false)}
                className="rounded-xl h-10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl h-10 text-white border-0"
                style={{ background: "var(--gradient-gold)" }}
              >
                Register Client
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Checkout Success Invoice Details Modal */}
      <Dialog
        open={finalizedInvoice !== null}
        onOpenChange={(open) => !open && setFinalizedInvoice(null)}
      >
        <DialogContent className="max-w-xl rounded-2xl border-[#D4AF37]/30 max-h-[90vh] overflow-y-auto">
          {finalizedInvoice && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl border-b pb-2">
                  Sale Complete · Receipt Generated
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Transaction log saved. You can now download, print, or email the client receipt.
                </DialogDescription>
              </DialogHeader>

              {/* Invoice slip layout */}
              <div className="border border-border/80 rounded-2xl p-5 bg-secondary/25 space-y-4 my-2 text-xs">
                <div className="flex justify-between items-start border-b pb-3">
                  <div>
                    <h4 className="font-display text-lg font-bold text-foreground">
                      {settings.storeName}
                    </h4>
                    <p className="text-[10px] text-muted-foreground leading-normal max-w-[200px] mt-1">
                      {settings.storeAddress}
                    </p>
                    <p className="text-[9px] text-[#B8860B] font-mono mt-1">
                      GSTIN: {settings.gstin}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#B8860B] font-mono text-sm">
                      {finalizedInvoice.id}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(finalizedInvoice.date).toLocaleDateString()}
                    </p>
                    <Badge
                      variant="outline"
                      className="mt-2 bg-emerald-50 text-emerald-800 border-emerald-200"
                    >
                      PAID
                    </Badge>
                  </div>
                </div>

                {/* Bill to */}
                <div className="grid grid-cols-2 gap-4 text-[10px] border-b pb-3 text-muted-foreground">
                  <div>
                    <span className="font-semibold uppercase block text-[9px] text-foreground">
                      Billed Client
                    </span>
                    <p className="text-foreground font-semibold mt-0.5 text-xs">
                      {finalizedInvoice.customerName}
                    </p>
                    {finalizedInvoice.customerPhone && (
                      <p className="mt-0.5">Phone: {finalizedInvoice.customerPhone}</p>
                    )}
                  </div>
                  <div>
                    <span className="font-semibold uppercase block text-[9px] text-foreground">
                      Payment Summary
                    </span>
                    <p className="text-foreground font-semibold mt-0.5">
                      Mode: {finalizedInvoice.paymentMethod}
                    </p>
                    {finalizedInvoice.splitDetails && (
                      <p className="text-[9px]">
                        Splits: Cash ${finalizedInvoice.splitDetails.cash || 0} | UPI $
                        {finalizedInvoice.splitDetails.upi || 0} | Card $
                        {finalizedInvoice.splitDetails.card || 0}
                      </p>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  <span className="font-semibold uppercase block text-[9px] text-muted-foreground">
                    Purchase pieces
                  </span>
                  <div className="max-h-36 overflow-y-auto pr-1">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b text-[9px] uppercase font-semibold text-muted-foreground">
                          <th className="pb-1.5">Piece</th>
                          <th className="pb-1.5 text-center">Qty</th>
                          <th className="pb-1.5 text-right">Price</th>
                          <th className="pb-1.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {finalizedInvoice.items.map((item, idx) => (
                          <tr key={idx} className="border-b border-border/30">
                            <td className="py-2">
                              <p className="font-semibold text-xs">{item.name}</p>
                              <span className="text-[9px] font-mono text-muted-foreground">
                                {item.sku} ({item.gstRate}% GST)
                              </span>
                            </td>
                            <td className="py-2 text-center font-bold">{item.qty}</td>
                            <td className="py-2 text-right">${item.price.toFixed(2)}</td>
                            <td className="py-2 text-right font-semibold">
                              ${(item.price * item.qty).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t pt-3 flex gap-4">
                  {/* Left: Dynamic payment QR Code */}
                  <div className="w-28 shrink-0 flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-border/80">
                    <QrCode
                      value={`upi://pay?pa=store@upi&pn=MaisonCouture&am=${finalizedInvoice.total.toFixed(2)}&cu=INR`}
                      size={70}
                    />
                    <span className="text-[8px] text-muted-foreground text-center font-bold tracking-wider mt-1.5">
                      SCAN & PAY UPI
                    </span>
                  </div>

                  {/* Right: Pricing numbers */}
                  <div className="flex-1 space-y-1.5 font-semibold text-right">
                    <div className="flex justify-between text-muted-foreground text-[10px]">
                      <span>Subtotal</span>
                      <span>${finalizedInvoice.subtotal.toFixed(2)}</span>
                    </div>
                    {finalizedInvoice.discountAmt > 0 && (
                      <div className="flex justify-between text-emerald-600 text-[10px]">
                        <span>Discount</span>
                        <span>-${finalizedInvoice.discountAmt.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-muted-foreground text-[10px]">
                      <span>GST Tax Pool</span>
                      <span>+${finalizedInvoice.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm border-t pt-1.5">
                      <span>BILL TOTAL</span>
                      <span className="gold-text font-display text-base">
                        ${finalizedInvoice.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => setFinalizedInvoice(null)}
                  className="rounded-xl h-11"
                >
                  Close Registry
                </Button>
                <Button
                  onClick={handlePrintInvoice}
                  className="rounded-xl h-11 text-white border-0 shadow-luxury"
                  style={{ background: "var(--gradient-gold)" }}
                >
                  <Printer className="size-4 mr-1.5" /> Print Thermal / A4
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
