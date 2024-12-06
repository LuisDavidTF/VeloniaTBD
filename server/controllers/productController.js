import { ProductDao } from '../dao/productDao.js';

const productDao = new ProductDao();

export const productController = {
  async getHome(req, res) {
    try {
      const products = await productDao.findAll();
      res.render('home', {
        title: 'Velonia - Home',
        products,
        user: req.session.user
      });
    } catch (error) {
      console.error(error);
      res.status(500).render('error', { 
        error: 'Failed to load products',
        user: req.session.user
      });
    }
  },

  async getProductsByCategory(req, res) {
    try {
      const { category } = req.params;
      const products = await productDao.findByCategory(category);
      res.render('products/category', {
        title: `${category.charAt(0).toUpperCase() + category.slice(1)} Products`,
        products,
        category,
        user: req.session.user
      });
    } catch (error) {
      console.error(error);
      res.status(500).render('error', { error: 'Failed to load products' });
    }
  },

  async getProduct(req, res) {
    try {
      const product = await productDao.findById(req.params.id);
      if (!product) {
        return res.status(404).render('error', { error: 'Product not found' });
      }
  
      const variants = await productDao.getAvailableVariants(req.params.id); // Obtener combinaciones
      const canEdit = req.session.user && product.seller_id === req.session.user.id;
  
      res.render('products/detail', {
        title: product.name,
        product,
        variants, // Pasar variantes disponibles
        canEdit,
        user: req.session.user
      });
    } catch (error) {
      console.error(error);
      res.status(500).render('error', { error: 'Failed to load product' });
    }
  },

  async getAddProduct(req, res) {
    try {
      res.render('products/add', {
        title: 'Add New Product',
        error: req.flash('error'),
        user: req.session.user
      });
    } catch (error) {
      console.error(error);
      res.status(500).render('error', { 
        error: 'Failed to load add product page',
        user: req.session.user
      });
    }
  },

  async addProduct(req, res) {
    try {
      const { name, description, price, category_id } = req.body;
      const sellerId = req.session.user.id;
      
      const productId = await productDao.create({
        name,
        description,
        price,
        category_id,
        seller_id: sellerId
      });

      // Handle image uploads
      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          const imageUrl = `/uploads/${req.files[i].filename}`;
          await productDao.addImage(productId, imageUrl, i === 0);
        }
      }

      res.redirect(`/products/${productId}/variants`);
    } catch (error) {
      console.error(error);
      req.flash('error', 'Failed to add product');
      res.redirect('/products/add');
    }
  },

  async getEditProduct(req, res) {
    try {
      const product = await productDao.findById(req.params.id);
      if (!product) {
        return res.status(404).render('error', { error: 'Product not found' });
      }

      if (product.seller_id !== req.session.user.id) {
        return res.status(403).render('error', { error: 'Unauthorized' });
      }

      const variants = await productDao.getProductVariants(req.params.id);
      
      res.render('products/edit', {
        title: 'Edit Product',
        product,
        variants,
        error: req.flash('error'),
        success: req.flash('success'),
        user: req.session.user
      });
    } catch (error) {
      console.error(error);
      res.status(500).render('error', { error: 'Failed to load product' });
    }
  },

  async updateProduct(req, res) {
    try {
      const product = await productDao.findById(req.params.id);
      if (!product || product.seller_id !== req.session.user.id) {
        return res.status(403).render('error', { error: 'Unauthorized' });
      }

      const { name, description, price, category_id } = req.body;
      await productDao.update(req.params.id, {
        name,
        description,
        price,
        category_id
      });

      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          const imageUrl = `/uploads/${req.files[i].filename}`;
          await productDao.addImage(req.params.id, imageUrl, i === 0);
        }
      }

      req.flash('success', 'Product updated successfully');
      res.redirect(`/product/${req.params.id}`);
    } catch (error) {
      console.error(error);
      req.flash('error', 'Failed to update product');
      res.redirect(`/products/${req.params.id}/edit`);
    }
  },

  async deleteImage(req, res) {
    try {
      const { imageUrl } = req.body;
      const product = await productDao.findById(req.params.id);
      
      if (!product || product.seller_id !== req.session.user.id) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
      }

      await productDao.deleteImage(req.params.id, imageUrl);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Failed to delete image' });
    }
  },

  async getAddVariants(req, res) {
    try {
      const product = await productDao.findById(req.params.id);
      if (!product || product.seller_id !== req.session.user.id) {
        return res.status(403).render('error', { 
          error: 'Unauthorized',
          user: req.session.user
        });
      }
      
      const variants = await productDao.getProductVariants(req.params.id);
      
      res.render('products/add-variants', {
        title: 'Add Product Variants',
        product,
        variants,
        user: req.session.user
      });
    } catch (error) {
      console.error(error);
      res.status(500).render('error', { error: 'Failed to load product' });
    }
  },

  async addVariant(req, res) {
    try {
      const { size, color, stock } = req.body;
      const productId = req.params.id;
      
      await productDao.addVariant(productId, {
        size,
        color,
        stock: parseInt(stock, 10)
      });

      req.flash('success', 'Variant added successfully');
      res.redirect(`/products/${productId}/variants`);
    } catch (error) {
      console.error(error);
      req.flash('error', 'Failed to add variant');
      res.redirect(`/products/${req.params.id}/variants`);
    }
  },

  async updateVariant(req, res) {
    try {
      const { size, color, stock } = req.body;
      const product = await productDao.findById(req.params.id);
      
      if (!product || product.seller_id !== req.session.user.id) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
      }

      await productDao.updateVariant(req.params.variantId, {
        size,
        color,
        stock: parseInt(stock, 10)
      });

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Failed to update variant' });
    }
  },

  async deleteVariant(req, res) {
    try {
      const product = await productDao.findById(req.params.id);
      
      if (!product || product.seller_id !== req.session.user.id) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
      }

      await productDao.deleteVariant(req.params.variantId);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Failed to delete variant' });
    }
  },

  async deleteProduct(req, res) {
    try {
      const product = await productDao.findById(req.params.id);
      if (!product) {
        return res.status(404).render('error', {
          error: 'Product not found',
          user: req.session.user
        });
      }
  
      if (product.seller_id !== req.session.user.id) {
        return res.status(403).render('error', {
          error: 'Unauthorized',
          user: req.session.user
        });
      }
  
      await productDao.delete(req.params.id);
  
      req.flash('success', 'Product deleted successfully');
      res.redirect('/profile');
    } catch (error) {
      console.error(error);
      req.flash('error', error.message || 'Failed to delete product');
      res.redirect(`/product/${req.params.id}`);
    }
  }
  
};