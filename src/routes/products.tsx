import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Download,
  Pencil,
  Trash2,
  FileSpreadsheet,
  Upload,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Printer,
  Info,
} from "lucide-react";
import { useState, useMemo, useRef } from "react";
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
import { useStore, type Product } from "@/lib/store";
import { Barcode } from "@/components/ui/Barcode";
import { QrCode } from "@/components/ui/QrCode";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products & Inventory — Maison Couture" },
      {
        name: "description",
        content:
          "Atelier product catalog, bulk spreadsheets loader, and stock transactions ledger.",
      },
    ],
  }),
  component: ProductsPage,
});

interface BulkRow {
  "Product Name"?: string | number;
  name?: string | number;
  Category?: string | number;
  category?: string | number;
  "Purchase Price"?: string | number;
  purchasePrice?: string | number;
  "Selling Price"?: string | number;
  sellingPrice?: string | number;
  price?: string | number;
  Stock?: string | number;
  stock?: string | number;
  "Stock Quantity"?: string | number;
  GST?: string | number;
  gst?: string | number;
  Brand?: string | number;
  brand?: string | number;
  Size?: string | number;
  size?: string | number;
  Color?: string | number;
  color?: string | number;
  Supplier?: string | number;
  supplier?: string | number;
  "Product Image"?: string | number;
  image?: string | number;
}

interface ParsedBulkRow {
  name: string;
  category: string;
  brand: string;
  size: string;
  color: string;
  purchasePrice: number;
  sellingPrice: number;
  gst: number;
  stock: number;
  supplier: string;
  image: string;
  hasError: boolean;
  rawIndex: number;
}

type TabState = "catalog" | "inventory" | "bulk";

function ProductsPage() {
  const { products, stockLogs, addProduct, updateProduct, deleteProduct, addStockLog } = useStore();

  const [activeTab, setActiveTab] = useState<TabState>("catalog");
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Add/Edit Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Evening Wear");
  const [brand, setBrand] = useState("");
  const [size, setSize] = useState("M");
  const [color, setColor] = useState("");
  const [sku, setSku] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [gst, setGst] = useState("12");
  const [stock, setStock] = useState("10");
  const [supplier, setSupplier] = useState("");
  const [image, setImage] = useState("");
  const [barcodeType, setBarcodeType] = useState<"CODE128" | "EAN13" | "UPC" | "QR">("CODE128");

  // Barcode Print Dialog State
  const [printingProduct, setPrintingProduct] = useState<Product | null>(null);

  // Stock Adjustment States
  const [adjProductId, setAdjProductId] = useState("");
  const [adjType, setAdjType] = useState<"Stock In" | "Stock Out" | "Adjustment">("Stock In");
  const [adjQty, setAdjQty] = useState("");
  const [adjReason, setAdjReason] = useState("");

  // Bulk Upload States
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkData, setBulkData] = useState<ParsedBulkRow[]>([]);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    added: number;
    errorsCount: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return ["All", ...Array.from(set)];
  }, [products]);

  // Filter products
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

  // Alert products
  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stock > 0 && p.stock < 5),
    [products],
  );
  const outOfStockProducts = useMemo(() => products.filter((p) => p.stock === 0), [products]);

  // Save Add/Edit
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Auto generate barcode value
    const generatedBarcode = sku.trim() || `PRD${Math.floor(100000 + Math.random() * 900000)}`;
    const prodData = {
      name,
      category,
      brand: brand.trim() || "Maison Couture",
      size,
      color: color.trim() || "Ivory",
      sku: sku.trim() || generatedBarcode,
      barcode: generatedBarcode,
      barcodeType,
      purchasePrice: Number(purchasePrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      price: Number(sellingPrice) || 0,
      gst: Number(gst),
      stock: Number(stock) || 0,
      supplier: supplier.trim() || "Direct Atelier",
      image:
        image.trim() || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80",
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, prodData);
      toast.success("Product configuration updated successfully.");
      setEditingProduct(null);
    } else {
      addProduct(prodData);
      toast.success("New product created and synced with registry.");
      setIsAddOpen(false);
    }
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setCategory("Evening Wear");
    setBrand("");
    setSize("M");
    setColor("");
    setSku("");
    setPurchasePrice("");
    setSellingPrice("");
    setGst("12");
    setStock("10");
    setSupplier("");
    setImage("");
    setBarcodeType("CODE128");
  };

  const handleEditClick = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category);
    setBrand(p.brand);
    setSize(p.size);
    setColor(p.color);
    setSku(p.sku);
    setPurchasePrice(p.purchasePrice.toString());
    setSellingPrice(p.sellingPrice.toString());
    setGst(p.gst.toString());
    setStock(p.stock.toString());
    setSupplier(p.supplier);
    setImage(p.image);
    setBarcodeType(p.barcodeType);
  };

  // Stock adjustments
  const handleStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseInt(adjQty);
    if (!adjProductId || isNaN(qtyNum) || qtyNum <= 0) return;

    const prod = products.find((p) => p.id === adjProductId);
    if (!prod) return;

    let nextStock = prod.stock;
    const finalType = adjType === "Adjustment" ? "Adjustment" : adjType;

    if (adjType === "Stock In") {
      nextStock = prod.stock + qtyNum;
    } else if (adjType === "Stock Out") {
      nextStock = Math.max(0, prod.stock - qtyNum);
    }

    updateProduct(prod.id, { stock: nextStock });

    toast.success(`Inventory stock adjustment executed for SKU: ${prod.sku}`);
    setAdjProductId("");
    setAdjQty("");
    setAdjReason("");
  };

  // Bulk parser
  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkFile(file);
    setImportSummary(null);
    setBulkErrors([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);

        validateAndPreviewBulkRows(rows);
      } catch (err) {
        toast.error("Spreadsheet file reading failed. Confirm file format.");
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validateAndPreviewBulkRows = (rows: unknown[]) => {
    const typedRows = rows as BulkRow[];
    const parsed: ParsedBulkRow[] = [];
    const errors: string[] = [];

    typedRows.forEach((row, index) => {
      const rowNum = index + 2; // header is row 1
      const pName = String(row["Product Name"] || row["name"] || "").trim();
      const pCat = String(row["Category"] || row["category"] || "").trim();
      const pCost = parseFloat(String(row["Purchase Price"] || row["purchasePrice"] || "0"));
      const pPrice = parseFloat(
        String(row["Selling Price"] || row["sellingPrice"] || row["price"] || "0"),
      );
      const pStock = parseInt(
        String(row["Stock"] || row["stock"] || row["Stock Quantity"] || "0"),
        10,
      );
      const pGst = parseInt(String(row["GST"] || row["gst"] || "12"), 10);

      let rowHasError = false;
      if (!pName) {
        errors.push(`Row ${rowNum}: Product Name is missing.`);
        rowHasError = true;
      }
      if (!pCat) {
        errors.push(`Row ${rowNum}: Category is missing.`);
        rowHasError = true;
      }
      if (isNaN(pCost) || pCost < 0) {
        errors.push(`Row ${rowNum}: Invalid Purchase Price.`);
        rowHasError = true;
      }
      if (isNaN(pPrice) || pPrice < 0) {
        errors.push(`Row ${rowNum}: Invalid Selling Price.`);
        rowHasError = true;
      }

      parsed.push({
        name: pName || "Missing Name",
        category: pCat || "General",
        brand: String(row["Brand"] || row["brand"] || "Maison Couture"),
        size: String(row["Size"] || row["size"] || "M"),
        color: String(row["Color"] || row["color"] || "Ivory"),
        purchasePrice: isNaN(pCost) ? 0 : pCost,
        sellingPrice: isNaN(pPrice) ? 0 : pPrice,
        gst: isNaN(pGst) ? 12 : pGst,
        stock: isNaN(pStock) ? 0 : pStock,
        supplier: String(row["Supplier"] || row["supplier"] || "Importer Co."),
        image: String(
          row["Product Image"] ||
            row["image"] ||
            "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80",
        ),
        hasError: rowHasError,
        rawIndex: index,
      });
    });

    setBulkData(parsed);
    setBulkErrors(errors);
  };

  const triggerImport = () => {
    const cleanRows = bulkData.filter((r) => !r.hasError);
    if (cleanRows.length === 0) {
      toast.error("No valid entries to import. Resolve validation highlights.");
      return;
    }

    cleanRows.forEach((row) => {
      const skuVal = `SKU-${row.category.substring(0, 2).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`;
      addProduct({
        name: row.name,
        category: row.category,
        brand: row.brand,
        size: row.size,
        color: row.color,
        sku: skuVal,
        barcode: skuVal,
        barcodeType: "CODE128",
        purchasePrice: row.purchasePrice,
        sellingPrice: row.sellingPrice,
        price: row.sellingPrice,
        gst: row.gst,
        stock: row.stock,
        supplier: row.supplier,
        image: row.image,
      });
    });

    setImportSummary({
      total: bulkData.length,
      added: cleanRows.length,
      errorsCount: bulkErrors.length,
    });

    toast.success(`Bulk upload completed! Imported ${cleanRows.length} items.`);
    // Reset file state
    setBulkFile(null);
    setBulkData([]);
    setBulkErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadSampleTemplate = () => {
    const sampleHeaders = [
      [
        "Product Name",
        "Category",
        "Brand",
        "Size",
        "Color",
        "Purchase Price",
        "Selling Price",
        "GST",
        "Stock",
        "Supplier",
      ],
    ];
    const sampleRows = [
      [
        "Ivory Silk Gown",
        "Evening Wear",
        "Maison Couture",
        "S",
        "Ivory",
        320,
        890,
        12,
        10,
        "Milan Textiles",
      ],
      [
        "Black Velvet Midi",
        "Cocktail",
        "Luxe Threads",
        "M",
        "Black",
        180,
        520,
        18,
        5,
        "Broadway Garments",
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet([...sampleHeaders, ...sampleRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bulk Template");
    XLSX.writeFile(wb, "maison_couture_bulk_import_template.xlsx");
    toast.success("Excel template download triggered.");
  };

  // Helper for printing barcodes
  const handlePrintBarcodeAction = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !printingProduct) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode - ${printingProduct.name}</title>
          <style>
            body { font-family: monospace; text-align: center; padding: 20px; }
            .label { border: 1px dashed #ccc; padding: 15px; display: inline-block; width: 220px; }
            .name { font-size: 11px; font-weight: bold; margin-bottom: 5px; }
            .sku { font-size: 9px; color: #666; margin-bottom: 8px; }
            svg { stroke: #000; fill: #000; width: 100%; height: 60px; }
            .barcode-text { font-size: 10px; letter-spacing: 2px; margin-top: 4px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="label">
            <div class="name">${printingProduct.name}</div>
            <div class="sku">${printingProduct.brand} · ${printingProduct.size} · ${printingProduct.color}</div>
            <!-- Render dummy barcode using pre-generated path structure -->
            <div style="width: 200px; margin: 0 auto;">
              ${document.getElementById("barcode-preview-area")?.innerHTML || ""}
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <AppShell title="Product & Stock Catalog">
      {/* Tab Selectors */}
      <div className="flex border-b border-border/80 mb-6 gap-2">
        {[
          { id: "catalog", label: "Product Catalog" },
          { id: "inventory", label: "Inventory Ledger" },
          { id: "bulk", label: "Bulk Spreadsheet Upload" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabState)}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition duration-200 ${
              activeTab === tab.id
                ? "border-[#D4AF37] text-foreground font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Catalog Tab */}
        {activeTab === "catalog" && (
          <motion.div
            key="catalog-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {/* Catalog controls */}
            <div className="glass-card rounded-2xl p-5 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by name, SKU or barcode…"
                    className="pl-9 h-11 rounded-xl bg-secondary/60 border-border/60"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategoryFilter(c)}
                      className={`px-3.5 h-8 rounded-full text-xs font-medium transition ${
                        categoryFilter === c
                          ? "text-white shadow-luxury"
                          : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                      }`}
                      style={
                        categoryFilter === c ? { background: "var(--gradient-gold)" } : undefined
                      }
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 lg:ml-auto">
                  <Button
                    onClick={() => setIsAddOpen(true)}
                    className="h-11 rounded-xl gap-2 text-white border-0 shadow-luxury"
                    style={{ background: "var(--gradient-gold)" }}
                  >
                    <Plus className="size-4" /> Add Product
                  </Button>
                </div>
              </div>
            </div>

            {/* Catalog table */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-[#FAF9F6] to-transparent">
                    <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      <th className="px-6 py-4 font-medium">Product Details</th>
                      <th className="px-4 py-4 font-medium">SKU / Barcode</th>
                      <th className="px-4 py-4 font-medium">Category / Brand</th>
                      <th className="px-4 py-4 font-medium">Size / Color</th>
                      <th className="px-4 py-4 font-medium">Purchase / Retail</th>
                      <th className="px-4 py-4 font-medium">Stock</th>
                      <th className="px-4 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p, i) => (
                      <tr
                        key={p.id}
                        className="border-t border-border/40 hover:bg-[#F4E4BC]/10 transition group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-14 rounded-xl overflow-hidden ring-1 ring-border shrink-0 bg-secondary">
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-base leading-snug">{p.name}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Supplier: {p.supplier}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono text-xs space-y-1">
                          <p className="text-[#B8860B]">{p.sku}</p>
                          <p className="text-muted-foreground flex items-center gap-1 group">
                            <span>{p.barcode}</span>
                            <button
                              onClick={() => setPrintingProduct(p)}
                              className="size-5 rounded hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
                            >
                              <Printer className="size-3" />
                            </button>
                          </p>
                        </td>
                        <td className="px-4 py-4 space-y-1">
                          <Badge
                            variant="outline"
                            className="bg-secondary/60 text-xs border-border"
                          >
                            {p.category}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground pl-1">{p.brand}</p>
                        </td>
                        <td className="px-4 py-4 text-xs font-semibold">
                          <Badge variant="outline" className="mr-1 bg-white">
                            {p.size}
                          </Badge>
                          <span className="text-muted-foreground">{p.color}</span>
                        </td>
                        <td className="px-4 py-4 font-display text-xs space-y-0.5">
                          <p className="text-muted-foreground">Cost: ${p.purchasePrice}</p>
                          <p className="text-foreground font-bold text-sm">
                            Retail: ${p.sellingPrice}{" "}
                            <span className="text-[9px] text-[#B8860B] font-sans">
                              ({p.gst}% GST)
                            </span>
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`font-semibold ${p.stock === 0 ? "text-rose-600 font-bold" : p.stock < 5 ? "text-amber-600 font-bold" : ""}`}
                          >
                            {p.stock}
                          </span>
                          <span className="text-muted-foreground text-xs ml-1">pcs</span>
                        </td>
                        <td className="px-4 py-4">
                          <Badge
                            variant="outline"
                            className={
                              p.status === "Active"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : p.status === "Low Stock"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                            }
                          >
                            <span className="size-1.5 rounded-full bg-current mr-1.5" />
                            {p.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={() => handleEditClick(p)}
                              className="size-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              onClick={() => deleteProduct(p.id)}
                              className="size-8 rounded-lg hover:bg-rose-55 flex items-center justify-center text-muted-foreground hover:text-rose-600"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredProducts.length === 0 && (
                  <div className="py-20 text-center">
                    <p className="font-display text-xl">No items matches query</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Check filters or create a new catalog card.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Inventory Ledger Tab */}
        {activeTab === "inventory" && (
          <motion.div
            key="inventory-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Stock adjustment panels */}
            <div className="space-y-6">
              <div className="glass-card rounded-2xl p-5 border-amber-200/50 bg-amber-50/10">
                <div className="flex items-center gap-2 mb-4 text-amber-800">
                  <AlertCircle className="size-5" />
                  <h3 className="font-display text-lg font-bold">Boutique Inventory Alerts</h3>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {outOfStockProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between items-center text-xs p-2 rounded-lg bg-rose-50 border border-rose-200"
                    >
                      <span className="font-semibold text-rose-800 truncate max-w-[150px]">
                        {p.name}
                      </span>
                      <Badge className="bg-rose-600 border-0 text-[10px] text-white">
                        OUT OF STOCK
                      </Badge>
                    </div>
                  ))}
                  {lowStockProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between items-center text-xs p-2 rounded-lg bg-amber-50 border border-amber-200"
                    >
                      <span className="font-semibold text-amber-800 truncate max-w-[150px]">
                        {p.name}
                      </span>
                      <Badge className="bg-amber-600 border-0 text-[10px] text-white">
                        LOW STOCK: {p.stock} pcs
                      </Badge>
                    </div>
                  ))}
                  {lowStockProducts.length === 0 && outOfStockProducts.length === 0 && (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      Atelier stock counts healthy.
                    </p>
                  )}
                </div>
              </div>

              {/* Adjust Stock Form */}
              <div className="glass-card rounded-2xl p-5">
                <h3 className="font-display text-xl mb-4 border-b pb-2">
                  Manual Stock Transaction
                </h3>
                <form onSubmit={handleStockAdjustment} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Select Product
                    </label>
                    <select
                      required
                      value={adjProductId}
                      onChange={(e) => setAdjProductId(e.target.value)}
                      className="w-full h-10 rounded-xl bg-secondary/60 border border-border px-3 text-xs"
                    >
                      <option value="">-- Choose item --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) · Stock: {p.stock}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Action Type
                      </label>
                      <select
                        value={adjType}
                        onChange={(e) =>
                          setAdjType(e.target.value as "Stock In" | "Stock Out" | "Adjustment")
                        }
                        className="w-full h-10 rounded-xl bg-secondary/60 border border-border px-3 text-xs"
                      >
                        <option value="Stock In">Stock In (Deduction Return)</option>
                        <option value="Stock Out">Stock Out (Damaged / Transfer)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Units Qty
                      </label>
                      <Input
                        type="number"
                        required
                        value={adjQty}
                        onChange={(e) => setAdjQty(e.target.value)}
                        placeholder="pcs"
                        className="h-10 rounded-xl bg-secondary/60"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Audit Adjustment Notes
                    </label>
                    <Input
                      required
                      value={adjReason}
                      onChange={(e) => setAdjReason(e.target.value)}
                      placeholder="e.g. Returned from showroom, damaged fabric"
                      className="h-10 rounded-xl bg-secondary/60"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10 rounded-xl border-0 text-white"
                    style={{ background: "var(--gradient-gold)" }}
                  >
                    Log Stock Transaction
                  </Button>
                </form>
              </div>
            </div>

            {/* Logs audit table */}
            <div className="lg:col-span-2 glass-card rounded-2xl p-5 flex flex-col min-h-[400px]">
              <h3 className="font-display text-xl mb-4 border-b pb-2">
                Inventory Transaction History
              </h3>
              <div className="flex-1 overflow-y-auto max-h-[450px] pr-1">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#FAF9F6] sticky top-0 border-b">
                    <tr className="uppercase text-[9px] font-semibold tracking-wider text-muted-foreground">
                      <th className="p-3">Date</th>
                      <th className="p-3">Product / SKU</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Qty</th>
                      <th className="p-3">Reason</th>
                      <th className="p-3">User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockLogs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-secondary/20 transition">
                        <td className="p-3 text-muted-foreground">
                          {new Date(log.date).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <p className="font-semibold">{log.productName}</p>
                          <span className="text-[10px] font-mono text-muted-foreground uppercase">
                            {log.sku}
                          </span>
                        </td>
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className={
                              log.type === "Stock In"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : log.type === "Stock Out"
                                  ? "bg-rose-50 text-rose-800 border-rose-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                            }
                          >
                            {log.type}
                          </Badge>
                        </td>
                        <td className="p-3 font-semibold">{log.qty} pcs</td>
                        <td className="p-3 text-muted-foreground max-w-[140px] truncate">
                          {log.reason}
                        </td>
                        <td className="p-3 text-muted-foreground">{log.user}</td>
                      </tr>
                    ))}
                    {stockLogs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-20 text-center text-muted-foreground">
                          No stock activities logs captured yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Bulk Tab */}
        {activeTab === "bulk" && (
          <motion.div
            key="bulk-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* Instructions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card rounded-2xl p-5 md:col-span-2 space-y-4">
                <div className="flex items-center gap-2 border-b pb-2 text-[#B8860B]">
                  <FileSpreadsheet className="size-5" />
                  <h3 className="font-display text-lg">Bulk Products Spreadsheet Importer</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-normal">
                  Upload an Excel sheet (.xlsx) or CSV containing your boutique product catalog. The
                  parser automatically structures pricing matrices, validates columns, maps
                  categories, and auto-generates Code 128 vector barcodes/QR codes upon importing.
                </p>

                <div className="flex items-center gap-4 pt-2">
                  <div className="relative">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleBulkFileChange}
                      accept=".xlsx,.csv"
                      className="hidden"
                      id="bulk-excel-uploader-id"
                    />
                    <Button
                      asChild
                      className="rounded-xl h-11 text-white border-0 shadow-luxury"
                      style={{ background: "var(--gradient-gold)" }}
                    >
                      <label htmlFor="bulk-excel-uploader-id" className="cursor-pointer gap-2">
                        <Upload className="size-4" /> Choose Spreadsheet File
                      </label>
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    onClick={downloadSampleTemplate}
                    className="h-11 rounded-xl gap-2 border-[#D4AF37]/30 text-[#B8860B]"
                  >
                    <Download className="size-4" /> Download Excel Template
                  </Button>
                </div>
              </div>

              {/* Status Report */}
              <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
                <h4 className="font-display text-base border-b pb-2 flex items-center gap-1.5">
                  <Info className="size-4 text-[#B8860B]" /> Audit Summary
                </h4>
                <div className="my-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Rows Parsed</span>
                    <span className="font-semibold">{bulkData.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Validation Errors</span>
                    <span className="font-semibold text-rose-600">{bulkErrors.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valid Import Ready</span>
                    <span className="font-semibold text-emerald-600">
                      {bulkData.filter((r) => !r.hasError).length}
                    </span>
                  </div>
                </div>

                <Button
                  disabled={
                    bulkData.length === 0 || bulkData.filter((r) => !r.hasError).length === 0
                  }
                  onClick={triggerImport}
                  className="w-full h-11 rounded-xl text-white border-0 shadow-luxury disabled:opacity-50"
                  style={{ background: "var(--gradient-gold)" }}
                >
                  Confirm Import & Sync
                </Button>
              </div>
            </div>

            {/* Error notifications */}
            {bulkErrors.length > 0 && (
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 space-y-1">
                <p className="text-xs font-bold flex items-center gap-1.5">
                  <AlertCircle className="size-4 text-rose-600" /> Importer detected errors: (
                  {bulkErrors.length})
                </p>
                <div className="max-h-24 overflow-y-auto text-[11px] font-mono space-y-0.5 mt-1 list-disc pl-4">
                  {bulkErrors.map((err, idx) => (
                    <div key={idx}>• {err}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Sheet Table */}
            {bulkData.length > 0 && (
              <div className="glass-card rounded-2xl p-5">
                <h3 className="font-display text-lg mb-3">Pre-Import Data Matrix Review</h3>
                <div className="overflow-x-auto max-h-[300px] border border-border/80 rounded-xl">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-[#FAF9F6] sticky top-0 border-b">
                      <tr className="uppercase text-[9px] font-semibold text-muted-foreground">
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Brand</th>
                        <th className="p-3">Size</th>
                        <th className="p-3">Color</th>
                        <th className="p-3">Purchase</th>
                        <th className="p-3">Retail Price</th>
                        <th className="p-3">GST</th>
                        <th className="p-3">Stock</th>
                        <th className="p-3">Supplier</th>
                        <th className="p-3 text-right">Audit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkData.map((row, idx) => (
                        <tr
                          key={idx}
                          className={`border-b hover:bg-secondary/30 transition ${row.hasError ? "bg-rose-50/40" : ""}`}
                        >
                          <td className="p-3 font-semibold">{row.name}</td>
                          <td className="p-3">{row.category}</td>
                          <td className="p-3 text-muted-foreground">{row.brand}</td>
                          <td className="p-3 font-mono">{row.size}</td>
                          <td className="p-3 text-muted-foreground">{row.color}</td>
                          <td className="p-3 font-mono">${row.purchasePrice}</td>
                          <td className="p-3 font-mono font-bold">${row.sellingPrice}</td>
                          <td className="p-3 font-mono">{row.gst}%</td>
                          <td className="p-3 font-mono font-bold">{row.stock} pcs</td>
                          <td className="p-3 text-muted-foreground">{row.supplier}</td>
                          <td className="p-3 text-right">
                            {row.hasError ? (
                              <Badge className="bg-rose-600 text-white border-0 text-[9px]">
                                REJECTED
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-600 text-white border-0 text-[9px]">
                                VALID
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add / Edit Product Dialog */}
      <Dialog
        open={isAddOpen || editingProduct !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setEditingProduct(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl rounded-2xl border-[#D4AF37]/30 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {editingProduct
                ? `Edit Atelier Card: ${editingProduct.name}`
                : "Create Catalog Product"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Complete the catalog specifications. Barcodes & QR structures render automatically.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProduct} className="space-y-4 my-2 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Product Name
                </label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Silk Evening Dress"
                  className="h-10 rounded-xl bg-secondary/50 focus-visible:ring-[#D4AF37]/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 rounded-xl bg-secondary/50 border border-border/60 px-3 text-xs"
                >
                  <option value="Evening Wear">Evening Wear</option>
                  <option value="Cocktail">Cocktail</option>
                  <option value="Bridal">Bridal</option>
                  <option value="Daywear">Daywear</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Brand
                </label>
                <Input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Maison Couture"
                  className="h-10 rounded-xl bg-secondary/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Size
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full h-10 rounded-xl bg-secondary/50 border border-border/60 px-3 text-xs"
                >
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Color / Fabric
                </label>
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g. Royal Gold"
                  className="h-10 rounded-xl bg-secondary/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  SKU (Leave blank to auto-gen)
                </label>
                <Input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. DR-EV-001"
                  className="h-10 rounded-xl bg-secondary/50 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Barcode Stand
                </label>
                <select
                  value={barcodeType}
                  onChange={(e) => setBarcodeType(e.target.value as "CODE128" | "EAN13" | "UPC" | "QR")}
                  className="w-full h-10 rounded-xl bg-secondary/50 border border-border/60 px-3 text-xs"
                >
                  <option value="CODE128">Code 128 (Default)</option>
                  <option value="EAN13">EAN-13 (Numeric)</option>
                  <option value="UPC">UPC (12-Digit)</option>
                  <option value="QR">QR Code</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  GST Brackets (%)
                </label>
                <select
                  value={gst}
                  onChange={(e) => setGst(e.target.value)}
                  className="w-full h-10 rounded-xl bg-secondary/50 border border-border/60 px-3 text-xs"
                >
                  <option value="5">5% GST</option>
                  <option value="12">12% GST</option>
                  <option value="18">18% GST</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Purchase Cost ($)
                </label>
                <Input
                  required
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="0.00"
                  className="h-10 rounded-xl bg-secondary/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Selling Retail ($)
                </label>
                <Input
                  required
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  placeholder="0.00"
                  className="h-10 rounded-xl bg-secondary/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Initial Stock Count
                </label>
                <Input
                  required
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="Qty"
                  className="h-10 rounded-xl bg-secondary/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Supplier Name
                </label>
                <Input
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Textiles supplier"
                  className="h-10 rounded-xl bg-secondary/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Product Image URL
                </label>
                <Input
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://unsplash..."
                  className="h-10 rounded-xl bg-secondary/50"
                />
              </div>
            </div>

            {/* Live barcode display in edit dialog */}
            {editingProduct && (
              <div className="grid grid-cols-2 gap-4 border-t pt-4 bg-secondary/30 rounded-xl p-3">
                <div className="text-center p-2 bg-white rounded-lg border flex flex-col items-center justify-center">
                  <p className="text-[9px] text-muted-foreground uppercase mb-1">
                    Generated Barcode
                  </p>
                  <Barcode
                    value={editingProduct.barcode}
                    type={editingProduct.barcodeType === "QR" ? "CODE128" : editingProduct.barcodeType}
                    height={50}
                  />
                </div>
                <div className="text-center p-2 bg-white rounded-lg border flex flex-col items-center justify-center">
                  <p className="text-[9px] text-muted-foreground uppercase mb-1">
                    Generated QR Code
                  </p>
                  <QrCode value={editingProduct.barcode} size={60} />
                </div>
              </div>
            )}

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingProduct(null);
                  resetForm();
                }}
                className="rounded-xl h-11"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl h-11 text-white border-0 shadow-luxury"
                style={{ background: "var(--gradient-gold)" }}
              >
                {editingProduct ? "Update Catalog Item" : "Create Catalog Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Barcode Print Dialog Preview */}
      <Dialog
        open={printingProduct !== null}
        onOpenChange={(open) => !open && setPrintingProduct(null)}
      >
        <DialogContent className="max-w-md rounded-2xl border-[#D4AF37]/30">
          {printingProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl border-b pb-2">
                  Print SKU Tag Preview
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Thermal sticker layout for barcode scanning.
                </DialogDescription>
              </DialogHeader>

              <div className="my-6 flex flex-col items-center justify-center">
                <div className="border border-dashed p-6 text-center w-64 bg-white rounded-lg shadow-sm">
                  <p className="text-xs font-semibold uppercase">{printingProduct.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                    {printingProduct.sku}
                  </p>
                  <div id="barcode-preview-area" className="mt-4 w-full">
                    {printingProduct.barcodeType === "QR" ? (
                      <div className="flex justify-center">
                        <QrCode value={printingProduct.barcode} size={80} />
                      </div>
                    ) : (
                      <Barcode
                        value={printingProduct.barcode}
                        type={printingProduct.barcodeType}
                        height={50}
                        showText={false}
                      />
                    )}
                  </div>
                  <p className="text-[10px] font-mono tracking-widest mt-1 uppercase">
                    {printingProduct.barcode}
                  </p>

                  <div className="mt-4 border-t pt-3 flex justify-between text-[10px] text-muted-foreground">
                    <span>Size: {printingProduct.size}</span>
                    <span>Color: {printingProduct.color}</span>
                    <span className="font-semibold text-black font-display">
                      ${printingProduct.sellingPrice}
                    </span>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPrintingProduct(null)}
                  className="rounded-xl h-11"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePrintBarcodeAction}
                  className="rounded-xl h-11 text-white border-0"
                  style={{ background: "var(--gradient-gold)" }}
                >
                  <Printer className="size-4 mr-1.5" /> Print Tag
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
