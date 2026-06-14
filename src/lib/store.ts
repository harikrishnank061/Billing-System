import { useState, useEffect } from "react";
import { products as baseProducts, customers as baseCustomers } from "./mockData";

export type Product = {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  barcodeType: "CODE128" | "EAN13" | "UPC" | "QR";
  category: string;
  brand: string;
  size: string;
  color: string;
  purchasePrice: number;
  sellingPrice: number;
  price: number; // compatible with existing template references
  gst: number;
  stock: number;
  supplier: string;
  image: string;
  status: "Active" | "Low Stock" | "Out of Stock";
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  loyaltyPoints: number;
  purchaseHistory: Array<{
    invoiceId: string;
    amount: number;
    itemsCount: number;
    date: string;
  }>;
};

export type StockLog = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: "Stock In" | "Stock Out" | "Adjustment" | "Transfer";
  qty: number;
  date: string;
  reason: string;
  user: string;
};

export type InvoiceItem = {
  productId: string;
  name: string;
  sku: string;
  qty: number;
  price: number; // selling price at time of sale
  gstRate: number; // e.g. 5, 12, 18
  purchasePrice: number; // at time of sale, for profit calculation
};

export type Invoice = {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  items: InvoiceItem[];
  subtotal: number;
  discountPercent: number;
  discountAmt: number;
  tax: number; // total GST
  total: number;
  paymentMethod: "Cash" | "UPI" | "Credit Card" | "Debit Card" | "Net Banking" | "Split";
  splitDetails?: {
    cash?: number;
    upi?: number;
    card?: number;
  };
  notes?: string;
  date: string;
  status: "Paid" | "Refunded";
};

export type StoreSettings = {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  gstin: string;
  logoUrl: string;
  loyaltyPointsPerDollar: number; // e.g. 1 point per $10 spent
  loyaltyPointValue: number; // e.g. $0.50 per point
};

// Initial database seeds with expanded fields
const SEED_PRODUCTS: Product[] = baseProducts.map((p, idx) => {
  const brands = ["Maison Zara", "Couture Milan", "Luxe Threads", "Atelier Paris"];
  const sizes = ["XS", "S", "M", "L", "XL"];
  const colors = ["Ivory", "Midnight Black", "Emerald", "Crimson", "Rose Gold", "Sapphire"];
  const suppliers = ["Milano Textiles", "Broadway Garment Co.", "Silk Route Importers"];

  const purchasePrice = Math.round(p.price * 0.45); // 55% profit margin

  return {
    ...p,
    barcodeType: "CODE128",
    brand: brands[idx % brands.length],
    size: sizes[idx % sizes.length],
    color: colors[idx % colors.length],
    purchasePrice,
    sellingPrice: p.price,
    gst: idx % 3 === 0 ? 5 : idx % 3 === 1 ? 12 : 18,
    supplier: suppliers[idx % suppliers.length],
    status: p.stock === 0 ? "Out of Stock" : p.stock < 5 ? "Low Stock" : "Active",
  };
});

const SEED_CUSTOMERS: Customer[] = baseCustomers.map((c, idx) => ({
  id: c.id,
  name: c.name,
  phone: c.phone || `+1 555 010${idx + 1}`,
  email: c.email || `${c.name.toLowerCase().replace(/\s/g, "")}@luxe.com`,
  address: "Manhattan, New York City, NY",
  loyaltyPoints: idx === 0 ? 120 : idx === 1 ? 340 : idx === 2 ? 80 : 0,
  purchaseHistory:
    idx < 3
      ? [
          {
            invoiceId: `INV-102${40 - idx}`,
            amount: idx === 0 ? 2150 : idx === 1 ? 890 : 4500,
            itemsCount: idx === 0 ? 2 : 1,
            date: new Date(Date.now() - idx * 24 * 3600 * 1000).toISOString(),
          },
        ]
      : [],
}));

const SEED_STOCK_LOGS: StockLog[] = SEED_PRODUCTS.map((p) => ({
  id: `SL-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
  productId: p.id,
  productName: p.name,
  sku: p.sku,
  type: "Stock In",
  qty: p.stock + 10,
  date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  reason: "Initial catalog import",
  user: "Eva Voss",
}));

const SEED_INVOICES: Invoice[] = [
  {
    id: "INV-10241",
    customerId: "C-001",
    customerName: "Isabella Romano",
    customerPhone: "+1 555 0142",
    items: [
      {
        productId: "6",
        name: "Pearl Embroidered Gown",
        sku: "DR-EV-009",
        qty: 1,
        price: 2150,
        gstRate: 12,
        purchasePrice: 968,
      },
    ],
    subtotal: 2150,
    discountPercent: 0,
    discountAmt: 0,
    tax: 258,
    total: 2408,
    paymentMethod: "Credit Card",
    date: new Date(Date.now() - 30 * 60000).toISOString(),
    status: "Paid",
  },
  {
    id: "INV-10240",
    customerId: "C-002",
    customerName: "Sophia Laurent",
    customerPhone: "+1 555 0188",
    items: [
      {
        productId: "8",
        name: "Sapphire Silk Slip",
        sku: "DR-CK-022",
        qty: 1,
        price: 890,
        gstRate: 18,
        purchasePrice: 400,
      },
    ],
    subtotal: 890,
    discountPercent: 10,
    discountAmt: 89,
    tax: 144.18,
    total: 945.18,
    paymentMethod: "UPI",
    date: new Date(Date.now() - 120 * 60000).toISOString(),
    status: "Paid",
  },
  {
    id: "INV-10239",
    customerId: "C-003",
    customerName: "Amelia Chen",
    customerPhone: "+1 555 0211",
    items: [
      {
        productId: "9",
        name: "Ivory Lace Bridal",
        sku: "DR-BR-002",
        qty: 1,
        price: 4500,
        gstRate: 5,
        purchasePrice: 2025,
      },
    ],
    subtotal: 4500,
    discountPercent: 5,
    discountAmt: 225,
    tax: 213.75,
    total: 4488.75,
    paymentMethod: "Split",
    splitDetails: { cash: 2000, upi: 2488.75 },
    date: new Date(Date.now() - 180 * 60000).toISOString(),
    status: "Paid",
  },
];

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Maison Couture Dress Boutique",
  storeAddress: "724 Fifth Avenue, New York, NY 10019",
  storePhone: "+1 (212) 555-8900",
  storeEmail: "register@maisoncouture.com",
  gstin: "22AAAAA0000A1Z5",
  logoUrl: "",
  loyaltyPointsPerDollar: 0.1, // 1 point per $10 spent
  loyaltyPointValue: 0.5, // Each point is worth $0.50
};

// Global vanilla variables with observers
let productsDb: Product[] = [];
let customersDb: Customer[] = [];
let stockLogsDb: StockLog[] = [];
let invoicesDb: Invoice[] = [];
let settingsDb: StoreSettings = DEFAULT_SETTINGS;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

// Browser-safe local storage hydration
function isClient() {
  return typeof window !== "undefined";
}

export function initStore() {
  if (!isClient()) return;

  const savedProducts = localStorage.getItem("mc_products");
  const savedCustomers = localStorage.getItem("mc_customers");
  const savedLogs = localStorage.getItem("mc_stock_logs");
  const savedInvoices = localStorage.getItem("mc_invoices");
  const savedSettings = localStorage.getItem("mc_settings");

  productsDb = savedProducts ? JSON.parse(savedProducts) : SEED_PRODUCTS;
  customersDb = savedCustomers ? JSON.parse(savedCustomers) : SEED_CUSTOMERS;
  stockLogsDb = savedLogs ? JSON.parse(savedLogs) : SEED_STOCK_LOGS;
  invoicesDb = savedInvoices ? JSON.parse(savedInvoices) : SEED_INVOICES;
  settingsDb = savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS;

  // Sync back to make sure they exist
  saveToLocalStorage();
}

function saveToLocalStorage() {
  if (!isClient()) return;
  localStorage.setItem("mc_products", JSON.stringify(productsDb));
  localStorage.setItem("mc_customers", JSON.stringify(customersDb));
  localStorage.setItem("mc_stock_logs", JSON.stringify(stockLogsDb));
  localStorage.setItem("mc_invoices", JSON.stringify(invoicesDb));
  localStorage.setItem("mc_settings", JSON.stringify(settingsDb));
}

// Actions
export const actions = {
  // Products
  addProduct(product: Omit<Product, "id" | "status">) {
    const nextId = (Math.max(...productsDb.map((p) => parseInt(p.id) || 0), 0) + 1).toString();
    const status =
      product.stock === 0 ? "Out of Stock" : product.stock < 5 ? "Low Stock" : "Active";
    const newProduct: Product = {
      ...product,
      id: nextId,
      status,
    };
    productsDb.unshift(newProduct);
    saveToLocalStorage();

    // Add stock log
    actions.addStockLog({
      productId: newProduct.id,
      productName: newProduct.name,
      sku: newProduct.sku,
      type: "Stock In",
      qty: newProduct.stock,
      reason: "Initial product creation",
      user: "Eva Voss",
    });

    notify();
    return newProduct;
  },

  updateProduct(id: string, updates: Partial<Product>) {
    productsDb = productsDb.map((p) => {
      if (p.id === id) {
        const merged = { ...p, ...updates };
        merged.status =
          merged.stock === 0 ? "Out of Stock" : merged.stock < 5 ? "Low Stock" : "Active";

        // Log stock difference if stock changed
        if (updates.stock !== undefined && updates.stock !== p.stock) {
          const diff = updates.stock - p.stock;
          actions.addStockLog({
            productId: p.id,
            productName: p.name,
            sku: p.sku,
            type: diff > 0 ? "Stock In" : "Stock Out",
            qty: Math.abs(diff),
            reason: updates.stock > p.stock ? "Manual Stock Addition" : "Manual Stock Reduction",
            user: "Eva Voss",
          });
        }
        return merged;
      }
      return p;
    });
    saveToLocalStorage();
    notify();
  },

  deleteProduct(id: string) {
    productsDb = productsDb.filter((p) => p.id !== id);
    saveToLocalStorage();
    notify();
  },

  // Customers
  addCustomer(customer: Omit<Customer, "id" | "loyaltyPoints" | "purchaseHistory">) {
    const nextId = `C-${(customersDb.length + 1).toString().padStart(3, "0")}`;
    const newCustomer: Customer = {
      ...customer,
      id: nextId,
      loyaltyPoints: 0,
      purchaseHistory: [],
    };
    customersDb.unshift(newCustomer);
    saveToLocalStorage();
    notify();
    return newCustomer;
  },

  updateCustomer(id: string, updates: Partial<Customer>) {
    customersDb = customersDb.map((c) => (c.id === id ? { ...c, ...updates } : c));
    saveToLocalStorage();
    notify();
  },

  // Invoices & Sales
  createInvoice(invoice: Omit<Invoice, "id" | "date" | "status">) {
    const nextNum =
      Math.max(...invoicesDb.map((inv) => parseInt(inv.id.replace("INV-", "")) || 0), 10241) + 1;
    const id = `INV-${nextNum}`;

    const newInvoice: Invoice = {
      ...invoice,
      id,
      date: new Date().toISOString(),
      status: "Paid",
    };

    invoicesDb.unshift(newInvoice);

    // 1. Deduct Inventory Stock
    newInvoice.items.forEach((item) => {
      const prod = productsDb.find((p) => p.id === item.productId);
      if (prod) {
        const nextStock = Math.max(0, prod.stock - item.qty);
        productsDb = productsDb.map((p) =>
          p.id === prod.id
            ? {
                ...p,
                stock: nextStock,
                status: nextStock === 0 ? "Out of Stock" : nextStock < 5 ? "Low Stock" : "Active",
              }
            : p,
        );

        // Add inventory log
        actions.addStockLog({
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          type: "Stock Out",
          qty: item.qty,
          reason: `Sale ${id}`,
          user: "Eva Voss",
        });
      }
    });

    // 2. Award Loyalty Points
    if (newInvoice.customerId !== "Walk-in") {
      const awardPoints = Math.floor(newInvoice.total * settingsDb.loyaltyPointsPerDollar);
      customersDb = customersDb.map((cust) => {
        if (cust.id === newInvoice.customerId) {
          return {
            ...cust,
            loyaltyPoints: cust.loyaltyPoints + awardPoints,
            purchaseHistory: [
              {
                invoiceId: id,
                amount: newInvoice.total,
                itemsCount: newInvoice.items.reduce((acc, i) => acc + i.qty, 0),
                date: newInvoice.date,
              },
              ...cust.purchaseHistory,
            ],
          };
        }
        return cust;
      });
    }

    saveToLocalStorage();
    notify();
    return newInvoice;
  },

  refundInvoice(id: string) {
    invoicesDb = invoicesDb.map((inv) => {
      if (inv.id === id && inv.status === "Paid") {
        // Return stock
        inv.items.forEach((item) => {
          const prod = productsDb.find((p) => p.id === item.productId);
          if (prod) {
            const nextStock = prod.stock + item.qty;
            productsDb = productsDb.map((p) =>
              p.id === prod.id
                ? {
                    ...p,
                    stock: nextStock,
                    status:
                      nextStock === 0 ? "Out of Stock" : nextStock < 5 ? "Low Stock" : "Active",
                  }
                : p,
            );

            this.addStockLog({
              productId: prod.id,
              productName: prod.name,
              sku: prod.sku,
              type: "Stock In",
              qty: item.qty,
              reason: `Refund for ${id}`,
              user: "Eva Voss",
            });
          }
        });

        // Deduct points
        if (inv.customerId !== "Walk-in") {
          const pointsToDeduct = Math.floor(inv.total * settingsDb.loyaltyPointsPerDollar);
          customersDb = customersDb.map((c) => {
            if (c.id === inv.customerId) {
              return {
                ...c,
                loyaltyPoints: Math.max(0, c.loyaltyPoints - pointsToDeduct),
              };
            }
            return c;
          });
        }

        return { ...inv, status: "Refunded" as const };
      }
      return inv;
    });

    saveToLocalStorage();
    notify();
  },

  // Stock Log
  addStockLog(log: Omit<StockLog, "id" | "date">) {
    const newLog: StockLog = {
      ...log,
      id: `SL-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      date: new Date().toISOString(),
    };
    stockLogsDb.unshift(newLog);
    saveToLocalStorage();
    notify();
  },

  // Settings
  updateSettings(updates: Partial<StoreSettings>) {
    settingsDb = { ...settingsDb, ...updates };
    saveToLocalStorage();
    notify();
  },
};

// React Subscription Hook
export function useStore() {
  const [state, setState] = useState(() => {
    // If during SSR or initialization before client-hydration
    if (productsDb.length === 0 && isClient()) {
      initStore();
    }
    return {
      products: productsDb,
      customers: customersDb,
      stockLogs: stockLogsDb,
      invoices: invoicesDb,
      settings: settingsDb,
    };
  });

  useEffect(() => {
    if (productsDb.length === 0) {
      initStore();
    }

    // Set initial hydrated values
    setState({
      products: productsDb,
      customers: customersDb,
      stockLogs: stockLogsDb,
      invoices: invoicesDb,
      settings: settingsDb,
    });

    const handler = () => {
      setState({
        products: productsDb,
        customers: customersDb,
        stockLogs: stockLogsDb,
        invoices: invoicesDb,
        settings: settingsDb,
      });
    };

    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return {
    ...state,
    ...actions,
  };
}
