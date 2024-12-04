import { CartDao } from '../dao/cartDao.js';
import Stripe from 'stripe';

const cartDao = new CartDao();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const cartController = {
  async getCart(req, res) {
    try {
      const cartItems = await cartDao.getCartItems(req.session.user.id);
      const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      
      res.render('cart/index', {
        title: 'Shopping Cart',
        cartItems,
        total,
        user: req.session.user
      });
    } catch (error) {
      console.error(error);
      res.status(500).render('error', { error: 'Failed to load cart' });
    }
  },

  async addToCart(req, res) {
    try {
      const { productId, size, color, quantity } = req.body;

      // Buscar la variante del producto en base al color y la talla
      const [variant] = await cartDao.getProductVariant(productId, size, color);

      if (!variant) {
        return res.status(404).render('error', { error: 'Product variant not found' });
      }

      // Obtener el variantId
      const variantId = variant.id;

      // Llamar a DAO para agregar al carrito
      await cartDao.addToCart(req.session.user.id, variantId, quantity);
      
      res.redirect('/cart');
    } catch (error) {
      console.error(error);
      res.status(500).render('error', { error: 'Failed to add item to cart' });
    }
  },
  
  async removeCartItem(req, res) {
    try {
      const { cartItemId } = req.params;
  
      // Verificar que el ítem pertenece al usuario autenticado
      const cartItem = await cartDao.findCartItemById(cartItemId);
      if (!cartItem) {
        return res.status(404).json({ success: false, message: 'Item not found in cart' });
      }
  
      if (cartItem.user_id !== req.session.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
  
      // Eliminar el ítem del carrito
      await cartDao.removeItem(cartItemId);
  
      req.flash('success', 'Item removed from cart successfully');
      res.redirect('/cart');
    } catch (error) {
      console.error(error);
      req.flash('error', 'Failed to remove item from cart');
      res.redirect('/cart');
    }
  },
  

  async createCheckoutSession(req, res) {
    try {
      const cartItems = await cartDao.getCartItems(req.session.user.id);
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: cartItems.map(item => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.name,
              images: [item.image_url]
            },
            unit_amount: Math.round(item.price * 100)
          },
          quantity: item.quantity
        })),
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}/cart/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get('host')}/cart`
      });

      res.json({ id: session.id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  }
};