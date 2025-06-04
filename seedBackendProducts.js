import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from './models/BackendProducts.js';
import backendProducts from '../src/data/backendProducts.js';

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

const uri = process.env.MONGO_URI;

// Validate required fields only, allow sizes to be empty or missing
function validateProducts(products) {
  const invalidProducts = products.filter(p => 
    !p.name || !p.name.trim() || 
    !p.unit || !p.unit.trim()
  );

  if (invalidProducts.length) {
    console.error('Validation failed for these products:');
    invalidProducts.forEach(p => 
      console.error(`- ${p.name || '[No Name]'} | unit: '${p.unit || '[No Unit]'}'`)
    );
    process.exit(1);
  }
}

async function seed() {
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected.');

    console.log(`Total products in backendProducts: ${backendProducts.length}`);
    validateProducts(backendProducts);

    await Product.deleteMany({});
    console.log('Existing products cleared.');

    // Remove _id field to avoid duplicate key errors during insert
    backendProducts.forEach(p => {
      if (p._id) delete p._id;
    });

    const insertedDocs = await Product.insertMany(backendProducts, { ordered: false });
    console.log(`Products seeded successfully! Total products added: ${insertedDocs.length}`);

    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  } catch (err) {
    console.error('Error seeding products:', err);

    if (err.writeErrors) {
      err.writeErrors.forEach((e, i) => {
        console.error(`Write error #${i + 1}:`, e);
        if (e.getOperation) {
          console.error('Failed document:', e.getOperation());
        }
        if (e.errmsg) console.error('errmsg:', e.errmsg);
        if (e.message) console.error('message:', e.message);
        if (e.code) console.error('code:', e.code);
        if (e.errInfo) console.error('errInfo:', e.errInfo);
      });
    } else {
      console.error('Full error:', err);
    }

    try {
      await mongoose.disconnect();
      console.log('MongoDB disconnected after error.');
    } catch (disconnectErr) {
      console.error('Error disconnecting after failure:', disconnectErr);
    }

    process.exit(1);
  }
}

seed();
