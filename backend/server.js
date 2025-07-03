import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

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

// Bidirectional sync endpoint
app.post('/api/products/sync', async (req, res) => {
  try {
    const localProducts = req.body.products || [];
    // 1. Upsert local products into DB if they are newer
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
    // 2. Get all products from DB
    const allProducts = await Product.find({});
    // 3. If DB has newer products, client will update localStorage
    res.json({ products: allProducts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 