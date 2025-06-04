import dotenv from 'dotenv';
import mongoose from 'mongoose';
import slugify from 'slugify';
import Product from './models/product.js'; // Adjust path if needed
import rawProducts from '../src/data/products.js'; // Adjust path if needed

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('❌ MONGO_URI is not defined in .env file');
  process.exit(1);
}

// Generate cleaned product list with unique slugs
const slugMap = new Map();
const cleanedProducts = rawProducts.map((p, index) => {
  const product = { ...p };

  // Parse minOrderQty like "100 pieces"
  if (typeof product.minOrderQty === 'string') {
    const match = product.minOrderQty.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
    if (match) {
      product.minOrderQty = parseFloat(match[1]);
      product.unit = match[2] || '';
    } else {
      product.minOrderQty = 0;
      product.unit = '';
    }
  }

  // Generate a safe name and slug
  let safeName = product.name?.replace(/[／/]/g, '-') || `unnamed-${index}`;
safeName = safeName.replace(/EPS\/Thermocol/gi, 'eps-thermocol');
  
  let baseSlug = slugify(safeName, { lower: true, strict: true });

  // Ensure slug uniqueness
  let finalSlug = baseSlug;
  let count = 1;
  while (slugMap.has(finalSlug)) {
    finalSlug = `${baseSlug}-${count++}`;
  }
  slugMap.set(finalSlug, true);
  product.slug = finalSlug;

  return product;
});

mongoose
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('🚀 Connected to MongoDB');

    // Optional: clear existing products
    await Product.deleteMany({});

    try {
      const result = await Product.insertMany(cleanedProducts, { ordered: false });
      console.log(`✅ Inserted ${result.length} products.`);
    } catch (error) {
      console.error('❌ Insert error:', error.message);
      if (error.writeErrors) {
        error.writeErrors.forEach((e) => {
          console.error(`❌ Failed document with slug "${e.err.op?.slug}"`);
        });
      }
    } finally {
      mongoose.disconnect();
    }
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    mongoose.disconnect();
  });
