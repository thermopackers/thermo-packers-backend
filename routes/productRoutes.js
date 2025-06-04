import express from 'express';
import products from '../../frontend/src/data/products.js';
import { getAllBackendProducts, getAllProducts, getProductById, getProductBySlug, getProductsByCategory, inventory, updateProductInventory } from '../controllers/productController.js';

// import { getProducts } from '../controllers/productController.js';
const router = express.Router();

// router.get('/', getProducts);
router.get('/product-sizes/:name', (req, res) => {
    try {
      const productName = decodeURIComponent(req.params.name);
      const product = products.find((p) => p.name === productName);
  
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      const sizes = [];
  
      if (product.size?.outer) sizes.push(`Outer: ${product.size.outer}`);
      if (product.size?.inner) sizes.push(`Inner: ${product.size.inner}`);
      if (product.outerDimensions) sizes.push(`Outer: ${product.outerDimensions}`);
      if (product.innerDimensions) sizes.push(`Inner: ${product.innerDimensions}`);
      if (product.thickness) sizes.push(`Thickness: ${product.thickness}`);
      if (product.sizesAvailable) sizes.push(`Sizes Available: ${product.sizesAvailable}`);
  
      return res.json({ sizes });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  
  
  // Get a product by slug
  router.get('/slug/:slug', getProductBySlug);
  
  // Get all products
router.get('/all-products', getAllProducts);
//
router.get("/category-products", getProductsByCategory);

  // Get all backend-products
router.get('/all-backend-products', getAllBackendProducts);

//
router.put("/:id",inventory);

//update
router.post('/update', updateProductInventory);

//
router.get('/:id', getProductById);




export default router;
