import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  TrendingUp,
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  DollarSign,
  Percent,
  Calculator,
  UserCheck,
} from "lucide-react";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Auditing — Maison Couture" },
      {
        name: "description",
        content: "Financial audits, GST breakdowns, stock reports, and customer metrics.",
      },
    ],
  }),
  component: ReportsPage,
});

type ReportTab = "sales" | "gst" | "inventory" | "products" | "customers";

function ReportsPage() {
  const { products, invoices, customers, stockLogs } = useStore();
  const [activeTab, setActiveTab] = useState<ReportTab>("sales");
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "year">("month");

  // Filter invoices based on date range
  const filteredInvoices = useMemo(() => {
    const now = new Date();
    return invoices.filter((inv) => {
      const invDate = new Date(inv.date);
      if (dateRange === "today") {
        return invDate.toDateString() === now.toDateString();
      }
      if (dateRange === "week") {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return invDate >= oneWeekAgo;
      }
      if (dateRange === "month") {
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return invDate >= oneMonthAgo;
      }
      if (dateRange === "year") {
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        return invDate >= oneYearAgo;
      }
      return true;
    });
  }, [invoices, dateRange]);

  // Compute Metrics
  const summary = useMemo(() => {
    let salesTotal = 0;
    let purchaseCost = 0;
    let taxTotal = 0;
    const invoiceCount = filteredInvoices.length;

    filteredInvoices.forEach((inv) => {
      if (inv.status === "Paid") {
        salesTotal += inv.subtotal - inv.discountAmt;
        taxTotal += inv.tax;
        inv.items.forEach((item) => {
          purchaseCost += item.purchasePrice * item.qty;
        });
      }
    });

    const profit = salesTotal - purchaseCost;
    const margin = salesTotal > 0 ? Math.round((profit / salesTotal) * 100) : 0;

    return {
      revenue: salesTotal + taxTotal, // Gross sales (total paid)
      tax: taxTotal,
      netRevenue: salesTotal,
      cost: purchaseCost,
      profit,
      margin,
      count: invoiceCount,
    };
  }, [filteredInvoices]);

  // Table Data Generators
  const salesReportData = useMemo(() => {
    return filteredInvoices.map((inv) => {
      const cost = inv.items.reduce((s, i) => s + i.purchasePrice * i.qty, 0);
      const net = inv.subtotal - inv.discountAmt;
      const profit = net - cost;
      return {
        "Invoice ID": inv.id,
        Date: new Date(inv.date).toLocaleDateString(),
        Customer: inv.customerName,
        "Items Qty": inv.items.reduce((s, i) => s + i.qty, 0),
        Subtotal: net,
        "GST Collected": inv.tax,
        "Total Bill": inv.total,
        "Payment Mode": inv.paymentMethod,
        "Cost of Goods": cost,
        "Net Profit": profit,
        Status: inv.status,
      };
    });
  }, [filteredInvoices]);

  const gstReportData = useMemo(() => {
    return filteredInvoices
      .filter((inv) => inv.status === "Paid")
      .map((inv) => {
        let gst5 = 0;
        let gst12 = 0;
        let gst18 = 0;

        inv.items.forEach((item) => {
          const itemNet = item.price * item.qty * (1 - inv.discountPercent / 100);
          const itemGst = itemNet * (item.gstRate / 100);
          if (item.gstRate === 5) gst5 += itemGst;
          else if (item.gstRate === 12) gst12 += itemGst;
          else if (item.gstRate === 18) gst18 += itemGst;
        });

        return {
          "Invoice ID": inv.id,
          Date: new Date(inv.date).toLocaleDateString(),
          "Net Amount": inv.subtotal - inv.discountAmt,
          "5% GST": gst5,
          "12% GST": gst12,
          "18% GST": gst18,
          "Total GST": inv.tax,
          "Total Invoice": inv.total,
        };
      });
  }, [filteredInvoices]);

  const inventoryReportData = useMemo(() => {
    return products.map((p) => {
      const stockCost = p.purchasePrice * p.stock;
      const stockVal = p.sellingPrice * p.stock;
      const potentialProfit = stockVal - stockCost;
      return {
        "Product ID": p.id,
        "Product Name": p.name,
        SKU: p.sku,
        Barcode: p.barcode,
        Category: p.category,
        Supplier: p.supplier,
        "Stock Count": p.stock,
        "Unit Cost": p.purchasePrice,
        "Unit Price": p.sellingPrice,
        "Total Cost Value": stockCost,
        "Total Retail Value": stockVal,
        "Est. Margin": potentialProfit,
        Status: p.status,
      };
    });
  }, [products]);

  const productPerformanceData = useMemo(() => {
    const perf: Record<
      string,
      { name: string; sku: string; sold: number; revenue: number; cost: number }
    > = {};

    // Seed performance metrics from products db
    products.forEach((p) => {
      perf[p.id] = { name: p.name, sku: p.sku, sold: 0, revenue: 0, cost: 0 };
    });

    // Accumulate sales
    invoices
      .filter((inv) => inv.status === "Paid")
      .forEach((inv) => {
        inv.items.forEach((item) => {
          if (!perf[item.productId]) {
            perf[item.productId] = { name: item.name, sku: item.sku, sold: 0, revenue: 0, cost: 0 };
          }
          const pNet = item.price * item.qty * (1 - inv.discountPercent / 100);
          const pCost = item.purchasePrice * item.qty;
          perf[item.productId].sold += item.qty;
          perf[item.productId].revenue += pNet;
          perf[item.productId].cost += pCost;
        });
      });

    return Object.keys(perf)
      .map((id) => {
        const p = perf[id];
        const profit = p.revenue - p.cost;
        return {
          "Product ID": id,
          "Product Name": p.name,
          SKU: p.sku,
          "Quantity Sold": p.sold,
          "Net Revenue": p.revenue,
          "Goods Cost": p.cost,
          "Margin Earned": profit,
          "Profit %": p.revenue > 0 ? Math.round((profit / p.revenue) * 100) : 0,
        };
      })
      .sort((a, b) => b["Quantity Sold"] - a["Quantity Sold"]);
  }, [products, invoices]);

  const customerReportData = useMemo(() => {
    return customers
      .filter((c) => c.id !== "Walk-in")
      .map((c) => {
        const totalSpend = c.purchaseHistory.reduce((s, h) => s + h.amount, 0);
        const avgTicket = c.purchaseHistory.length ? totalSpend / c.purchaseHistory.length : 0;
        return {
          "Customer ID": c.id,
          "Client Name": c.name,
          Phone: c.phone,
          Email: c.email,
          "Loyalty Points": c.loyaltyPoints,
          "Invoices Logged": c.purchaseHistory.length,
          "Total Spend": totalSpend,
          "Average Order Value": avgTicket,
        };
      })
      .sort((a, b) => b["Total Spend"] - a["Total Spend"]);
  }, [customers]);

  const activeReportData = useMemo(() => {
    if (activeTab === "sales") return salesReportData;
    if (activeTab === "gst") return gstReportData;
    if (activeTab === "inventory") return inventoryReportData;
    if (activeTab === "products") return productPerformanceData;
    return customerReportData;
  }, [
    activeTab,
    salesReportData,
    gstReportData,
    inventoryReportData,
    productPerformanceData,
    customerReportData,
  ]);

  // Exporters
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(activeReportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${activeTab.toUpperCase()} Report`);
    XLSX.writeFile(wb, `mc_${activeTab}_report_${dateRange}.xlsx`);
  };

  const exportCsv = () => {
    const headers = Object.keys(activeReportData[0] || {});
    const csvRows = [headers.join(",")];

    activeReportData.forEach((row) => {
      const values = headers.map((header) => {
        const val = (row as Record<string, unknown>)[header];
        const stringVal = val === null || val === undefined ? "" : String(val);
        // Escape quotes
        return `"${stringVal.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `mc_${activeTab}_report_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell title="Financials & Auditing">
      {/* Filters & Actions */}
      <div className="glass-card rounded-2xl p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-[#B8860B]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-2">
              Audit Window:
            </span>
            {(["today", "week", "month", "year"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                  dateRange === r
                    ? "bg-[#F4E4BC] text-[#B8860B] border border-[#D4AF37]/30"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={exportExcel}
              variant="outline"
              className="rounded-xl h-10 text-xs gap-1.5 border-emerald-600/30 text-emerald-800 hover:bg-emerald-50"
            >
              <FileSpreadsheet className="size-4" /> Export Excel
            </Button>
            <Button
              onClick={exportCsv}
              variant="outline"
              className="rounded-xl h-10 text-xs gap-1.5"
            >
              <Download className="size-4" /> Export CSV
            </Button>
            <Button
              onClick={handlePrint}
              className="rounded-xl h-10 text-xs gap-1.5 text-white border-0"
              style={{ background: "var(--gradient-gold)" }}
            >
              <Calculator className="size-4" /> Print PDF Report
            </Button>
          </div>
        </div>
      </div>

      {/* Summary KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          {
            label: "Gross Billing",
            value: `$${summary.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            icon: DollarSign,
            color: "text-[#B8860B]",
          },
          {
            label: "Net Revenue",
            value: `$${summary.netRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            icon: TrendingUp,
            color: "text-emerald-600",
          },
          {
            label: "Tax (GST)",
            value: `$${summary.tax.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            icon: Calculator,
            color: "text-amber-600",
          },
          {
            label: "Total Cost",
            value: `$${summary.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            icon: Layers,
            color: "text-slate-600",
          },
          {
            label: "Net Profit Margin",
            value: `$${summary.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${summary.margin}%)`,
            icon: Percent,
            color: "text-indigo-600",
          },
        ].map((m, i) => (
          <div
            key={m.label}
            className="glass-card rounded-xl p-4 flex flex-col justify-between relative overflow-hidden"
          >
            <div>
              <p className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">
                {m.label}
              </p>
              <h4 className={`font-display text-lg lg:text-xl mt-1 font-bold ${m.color}`}>
                {m.value}
              </h4>
            </div>
            <m.icon className="absolute right-3 bottom-3 size-4 opacity-20" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/80 mb-5 overflow-x-auto gap-2">
        {[
          { id: "sales", label: "Sales Log" },
          { id: "gst", label: "GST Audits" },
          { id: "inventory", label: "Stock Valuation" },
          { id: "products", label: "Product Performance" },
          { id: "customers", label: "Customer Valuations" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ReportTab)}
            className={`px-4 py-2 text-xs font-semibold tracking-wider uppercase border-b-2 transition duration-200 shrink-0 ${
              activeTab === tab.id
                ? "border-[#D4AF37] text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table report rendering */}
      <div className="glass-card rounded-2xl overflow-hidden print:shadow-none print:border-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FAF9F6] border-b border-border/80 font-semibold uppercase text-[9px] tracking-wider text-muted-foreground">
              <tr>
                {Object.keys(activeReportData[0] || {}).map((header) => (
                  <th key={header} className="px-5 py-4">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeReportData.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="border-b border-border/40 hover:bg-secondary/40 transition"
                >
                  {Object.values(row).map((val: unknown, cIdx) => {
                    const isMonetary = typeof val === "number" && (val > 100 || val < -1);
                    return (
                      <td key={cIdx} className="px-5 py-3.5 font-medium">
                        {isMonetary
                          ? `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : String(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {activeReportData.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-20 text-center text-sm text-muted-foreground">
                    No transactions or data points registered during this time window.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
