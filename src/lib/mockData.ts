export type Product = {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  stock: number;
  price: number;
  status: "Active" | "Low Stock" | "Out of Stock";
  image: string;
};

export const products: Product[] = [
  {
    id: "1",
    name: "Ivory Silk Evening Gown",
    sku: "DR-EV-001",
    barcode: "8901234567890",
    category: "Evening Wear",
    stock: 12,
    price: 1289,
    status: "Active",
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400&h=500&fit=crop",
  },
  {
    id: "2",
    name: "Champagne Sequin Dress",
    sku: "DR-EV-002",
    barcode: "8901234567891",
    category: "Evening Wear",
    stock: 4,
    price: 1850,
    status: "Low Stock",
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=500&fit=crop",
  },
  {
    id: "3",
    name: "Black Velvet Midi",
    sku: "DR-CK-014",
    barcode: "8901234567892",
    category: "Cocktail",
    stock: 22,
    price: 720,
    status: "Active",
    image: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400&h=500&fit=crop",
  },
  {
    id: "4",
    name: "Blush Tulle Ball Gown",
    sku: "DR-BR-007",
    barcode: "8901234567893",
    category: "Bridal",
    stock: 0,
    price: 3299,
    status: "Out of Stock",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=500&fit=crop",
  },
  {
    id: "5",
    name: "Emerald Wrap Dress",
    sku: "DR-DY-021",
    barcode: "8901234567894",
    category: "Daywear",
    stock: 31,
    price: 480,
    status: "Active",
    image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=500&fit=crop",
  },
  {
    id: "6",
    name: "Pearl Embroidered Gown",
    sku: "DR-EV-009",
    barcode: "8901234567895",
    category: "Evening Wear",
    stock: 7,
    price: 2150,
    status: "Active",
    image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=500&fit=crop",
  },
  {
    id: "7",
    name: "Rose Chiffon Maxi",
    sku: "DR-DY-033",
    barcode: "8901234567896",
    category: "Daywear",
    stock: 18,
    price: 540,
    status: "Active",
    image: "https://images.unsplash.com/photo-1583496661160-fb5886a13d44?w=400&h=500&fit=crop",
  },
  {
    id: "8",
    name: "Sapphire Silk Slip",
    sku: "DR-CK-022",
    barcode: "8901234567897",
    category: "Cocktail",
    stock: 3,
    price: 890,
    status: "Low Stock",
    image: "https://images.unsplash.com/photo-1623609163859-ca93c959b98a?w=400&h=500&fit=crop",
  },
  {
    id: "9",
    name: "Ivory Lace Bridal",
    sku: "DR-BR-002",
    barcode: "8901234567898",
    category: "Bridal",
    stock: 5,
    price: 4500,
    status: "Active",
    image: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&h=500&fit=crop",
  },
  {
    id: "10",
    name: "Crimson Off-Shoulder",
    sku: "DR-EV-018",
    barcode: "8901234567899",
    category: "Evening Wear",
    stock: 9,
    price: 1320,
    status: "Active",
    image: "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&h=500&fit=crop",
  },
  {
    id: "11",
    name: "Linen Sundress",
    sku: "DR-DY-044",
    barcode: "8901234567800",
    category: "Daywear",
    stock: 24,
    price: 320,
    status: "Active",
    image: "https://images.unsplash.com/photo-1582142306909-195724d0a735?w=400&h=500&fit=crop",
  },
  {
    id: "12",
    name: "Gold Lamé Cocktail",
    sku: "DR-CK-031",
    barcode: "8901234567801",
    category: "Cocktail",
    stock: 6,
    price: 1100,
    status: "Active",
    image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&h=500&fit=crop",
  },
];

export const categories = ["All", "Evening Wear", "Cocktail", "Bridal", "Daywear"];

export const salesData = [
  { day: "Mon", sales: 4200, orders: 12 },
  { day: "Tue", sales: 5100, orders: 16 },
  { day: "Wed", sales: 4800, orders: 14 },
  { day: "Thu", sales: 7300, orders: 22 },
  { day: "Fri", sales: 9200, orders: 28 },
  { day: "Sat", sales: 12400, orders: 38 },
  { day: "Sun", sales: 8600, orders: 24 },
];

export const recentTransactions = [
  {
    id: "INV-10241",
    customer: "Isabella Romano",
    amount: 2150,
    items: 2,
    time: "2 min ago",
    status: "Paid",
  },
  {
    id: "INV-10240",
    customer: "Sophia Laurent",
    amount: 890,
    items: 1,
    time: "18 min ago",
    status: "Paid",
  },
  {
    id: "INV-10239",
    customer: "Amelia Chen",
    amount: 4500,
    items: 1,
    time: "42 min ago",
    status: "Paid",
  },
  {
    id: "INV-10238",
    customer: "Olivia Bennett",
    amount: 1320,
    items: 1,
    time: "1 hr ago",
    status: "Refunded",
  },
  {
    id: "INV-10237",
    customer: "Charlotte Vega",
    amount: 720,
    items: 1,
    time: "2 hr ago",
    status: "Paid",
  },
];

export const bestSellers = [
  { name: "Ivory Silk Evening Gown", sold: 48, revenue: 61872, image: products[0].image },
  { name: "Champagne Sequin Dress", sold: 32, revenue: 59200, image: products[1].image },
  { name: "Black Velvet Midi", sold: 41, revenue: 29520, image: products[2].image },
  { name: "Emerald Wrap Dress", sold: 38, revenue: 18240, image: products[4].image },
];

export const customers = [
  { id: "C-001", name: "Isabella Romano", email: "isabella@maisonr.com", phone: "+1 555 0142" },
  { id: "C-002", name: "Sophia Laurent", email: "sophia.l@bellecouture.com", phone: "+1 555 0188" },
  { id: "C-003", name: "Amelia Chen", email: "amelia@aurora.co", phone: "+1 555 0211" },
  { id: "Walk-in", name: "Walk-in Customer", email: "", phone: "" },
];
