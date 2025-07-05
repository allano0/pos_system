import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';




const app = express();
app.use(cors());
app.use(express.json());

const PORT =  5000;
const MONGODB_URI = 'mongodb+srv://allano2921:allano@cluster0.83ourjh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  price: Number,
  lastModified: Number,
});
const Product = mongoose.model('Product', productSchema);

const branchSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  location: String,
  lastModified: Number,
});
const Branch = mongoose.model('Branch', branchSchema);

const cashierSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  pin: String,
  branchId: String,
  lastModified: Number,
});
const Cashier = mongoose.model('Cashier', cashierSchema);

// Owner schema and model
const ownerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  pin: String,
  role: { type: String, default: 'owner' },
});
const Owner = mongoose.model('Owner', ownerSchema);

// Insert owner if not present
async function ensureOwner() {
  const existing = await Owner.findOne({ role: 'owner' });
  if (!existing) {
    await Owner.create({ id: 'owner-1', name: 'John Doe', pin: '5222', role: 'owner' });
    console.log('Owner user created: John Doe (PIN: 5222)');
  } else {
    console.log('Owner user already exists.');
  }
}
ensureOwner();

// Add Supplier schema/model if missing
const supplierSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  location: String,
  phone: String,
  email: String,
  category: String,
});
const Supplier = mongoose.model('Supplier', supplierSchema);

// Add Sales schema/model
const salesSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  items: [{
    id: String,
    name: String,
    price: Number,
    quantity: Number
  }],
  total: Number,
  paymentMethod: String,
  date: String,
  receiptNo: String,
  userName: String,
  lastModified: Number,
});
const Sales = mongoose.model('Sales', salesSchema);

// Unified sync endpoint for products, branches, and cashiers
app.post('/api/sync', async (req, res) => {
  try {
    // --- Products deletions ---
    const deletedProductIds = req.body.deletedProductIds || [];
    if (Array.isArray(deletedProductIds) && deletedProductIds.length > 0) {
      await Product.deleteMany({ id: { $in: deletedProductIds } });
    }
    // --- Branches deletions ---
    const deletedBranchIds = req.body.deletedBranchIds || [];
    if (Array.isArray(deletedBranchIds) && deletedBranchIds.length > 0) {
      await Branch.deleteMany({ id: { $in: deletedBranchIds } });
    }
    // --- Cashiers deletions ---
    const deletedCashierIds = req.body.deletedCashierIds || [];
    if (Array.isArray(deletedCashierIds) && deletedCashierIds.length > 0) {
      await Cashier.deleteMany({ id: { $in: deletedCashierIds } });
    }
    // --- Suppliers deletions ---
    const deletedSupplierIds = req.body.deletedSupplierIds || [];
    if (Array.isArray(deletedSupplierIds) && deletedSupplierIds.length > 0) {
      await Supplier.deleteMany({ id: { $in: deletedSupplierIds } });
    }
    // --- Products sync ---
    const localProducts = req.body.products || [];
    for (const local of localProducts) {
      const dbProduct = await Product.findOne({ id: local.id });
      if (!dbProduct) {
        await Product.create(local);
      } else if (local.lastModified > dbProduct.lastModified) {
        dbProduct.name = local.name;
        dbProduct.price = local.price;
        dbProduct.lastModified = local.lastModified;
        await dbProduct.save();
      }
    }
    const allProducts = await Product.find({});

    // --- Branches sync ---
    const localBranches = req.body.branches || [];
    for (const local of localBranches) {
      const dbBranch = await Branch.findOne({ id: local.id });
      if (!dbBranch) {
        await Branch.create(local);
      } else if (local.lastModified > dbBranch.lastModified) {
        dbBranch.name = local.name;
        dbBranch.location = local.location;
        dbBranch.lastModified = local.lastModified;
        await dbBranch.save();
      }
    }
    const allBranches = await Branch.find({});

    // --- Cashiers sync ---
    const localCashiers = req.body.cashiers || [];
    for (const local of localCashiers) {
      const dbCashier = await Cashier.findOne({ id: local.id });
      if (!dbCashier) {
        await Cashier.create(local);
      } else if (local.lastModified > dbCashier.lastModified) {
        dbCashier.name = local.name;
        dbCashier.pin = local.pin;
        dbCashier.branchId = local.branchId;
        dbCashier.lastModified = local.lastModified;
        await dbCashier.save();
      }
    }
    const allCashiers = await Cashier.find({});

    // --- Suppliers sync ---
    const localSuppliers = req.body.suppliers || [];
    for (const local of localSuppliers) {
      const dbSupplier = await Supplier.findOne({ id: local.id });
      if (!dbSupplier) {
        await Supplier.create(local);
      } else {
        // No lastModified for suppliers, so just update all fields
        dbSupplier.name = local.name;
        dbSupplier.location = local.location;
        dbSupplier.phone = local.phone;
        dbSupplier.email = local.email;
        dbSupplier.category = local.category;
        await dbSupplier.save();
      }
    }
    const allSuppliers = await Supplier.find({});

    // --- Sales sync ---
    const localSales = req.body.sales || [];
    for (const local of localSales) {
      const dbSale = await Sales.findOne({ id: local.id });
      if (!dbSale) {
        await Sales.create(local);
      } else if (local.lastModified > dbSale.lastModified) {
        dbSale.items = local.items;
        dbSale.total = local.total;
        dbSale.paymentMethod = local.paymentMethod;
        dbSale.date = local.date;
        dbSale.receiptNo = local.receiptNo;
        dbSale.userName = local.userName;
        dbSale.lastModified = local.lastModified;
        await dbSale.save();
      }
    }
    const allSales = await Sales.find({});

    res.json({ products: allProducts, branches: allBranches, cashiers: allCashiers, suppliers: allSuppliers, sales: allSales });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// GET /api/owner endpoint
app.get('/api/owner', async (req, res) => {
  try {
    const owner = await Owner.findOne({ role: 'owner' });
    if (owner) {
      res.json({ owner });
    } else {
      res.status(404).json({ error: 'Owner not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch owner' });
  }
});

// POST /api/cashiers/search endpoint
app.post('/api/cashiers/search', async (req, res) => {
  try {
    const { name, branchId } = req.body;
    const query = {};
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    if (branchId) {
      query.branchId = branchId;
    }
    const results = await Cashier.find(query);
    res.json({ cashiers: results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to search cashiers' });
  }
});

// POST /api/suppliers/search endpoint
app.post('/api/suppliers/search', async (req, res) => {
  try {
    const { name, category } = req.body;
    const query = {};
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    if (category) {
      query.category = category;
    }
    const results = await Supplier.find(query);
    res.json({ suppliers: results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to search suppliers' });
  }
});

// POST /api/branches/search endpoint
app.post('/api/branches/search', async (req, res) => {
  try {
    const { name, location } = req.body;
    const query = {};
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    const results = await Branch.find(query);
    res.json({ branches: results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to search branches' });
  }
});

// POST /api/products/search endpoint
app.post('/api/products/search', async (req, res) => {
  try {
    const { name, category, supplier } = req.body;
    const query = {};
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    if (category) {
      query.category = category;
    }
    if (supplier) {
      query.supplier = supplier;
    }
    const results = await Product.find(query);
    res.json({ products: results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to search products' });
  }
});

// POST /api/sales/search endpoint
app.post('/api/sales/search', async (req, res) => {
  try {
    const { receiptNo, userName, date } = req.body;
    const query = {};
    if (receiptNo) {
      query.receiptNo = { $regex: receiptNo, $options: 'i' };
    }
    if (userName) {
      query.userName = { $regex: userName, $options: 'i' };
    }
    if (date) {
      query.date = { $regex: date, $options: 'i' };
    }
    const results = await Sales.find(query).sort({ date: -1 });
    res.json({ sales: results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to search sales' });
  }
});

// --- Add after other model definitions ---
const customerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  phone: String,
  email: String,
  address: String,
});
const Customer = mongoose.model('Customer', customerSchema);

// --- Add after other search endpoints ---
// POST /api/customers/search endpoint
app.post('/api/customers/search', async (req, res) => {
  try {
    const { name } = req.body;
    const query = {};
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    const results = await Customer.find(query);
    res.json({ customers: results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to search customers' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 