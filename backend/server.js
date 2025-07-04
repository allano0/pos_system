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

// Unified sync endpoint for products, branches, and cashiers
app.post('/api/sync', async (req, res) => {
  try {
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

    res.json({ products: allProducts, branches: allBranches, cashiers: allCashiers });
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 