import { pool } from '../config/database.js';

export class ProductDao {
  async findAll(category = null) {
    let query = `
      SELECT p.*, pi.image_url, c.name as category_name, u.username as seller_name
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.seller_id = u.id
    `;
    
    if (category) {
      query += ' WHERE c.name = ?';
      const [rows] = await pool.execute(query, [category]);
      return rows;
    }
    
    const [rows] = await pool.execute(query);
    return rows;
  }

  async findByCategory(category) {
    const [rows] = await pool.execute(
      `SELECT p.*, pi.image_url, u.username as seller_name
       FROM products p
       LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
       JOIN categories c ON p.category_id = c.id
       JOIN users u ON p.seller_id = u.id
       WHERE c.name = ?`,
      [category]
    );
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT p.*, 
        GROUP_CONCAT(DISTINCT pi.image_url) as images,
        c.name as category_name,
        u.username as seller_name,
        u.id as seller_id
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.seller_id = u.id
      WHERE p.id = ?
      GROUP BY p.id`,
      [id]
    );
    return rows[0];
  }

  async getProductVariants(productId) {
    const [rows] = await pool.execute(
      'SELECT * FROM product_variants WHERE product_id = ?',
      [productId]
    );
    return rows;
  }
  
  async getAvailableColors(productId) {
    const [rows] = await pool.execute(
      'SELECT DISTINCT color FROM product_variants WHERE product_id = ?',
      [productId]
    );
    return rows.map(row => row.color); // Devuelve solo la lista de colores
  }

  async getAvailableVariants(productId) {
    const [rows] = await pool.execute(
      'SELECT DISTINCT size, color FROM product_variants WHERE product_id = ?',
      [productId]
    );
    return rows; // Devolverá un arreglo con todas las combinaciones disponibles
  }
  
  

  async create(productData) {
    const { name, description, price, category_id, seller_id } = productData;
    const [result] = await pool.execute(
      'CALL sp_create_product(?, ?, ?, ?, ?, ?)',
      [seller_id, category_id, name, description, price, 0]
    );
    return result[0][0].product_id;
  }

  async update(id, productData) {
    const { name, description, price, category_id } = productData;
    await pool.execute(
      'UPDATE products SET name = ?, description = ?, price = ?, category_id = ? WHERE id = ?',
      [name, description, price, category_id, id]
    );
  }

  async addImage(productId, imageUrl, isPrimary = false) {
    await pool.execute(
      'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)',
      [productId, imageUrl, isPrimary]
    );
  }

  async deleteImage(productId, imageUrl) {
    await pool.execute(
      'DELETE FROM product_images WHERE product_id = ? AND image_url = ?',
      [productId, imageUrl]
    );
  }

  async addVariant(productId, variantData) {
    const { size, color, stock } = variantData;
    await pool.execute(
      'INSERT INTO product_variants (product_id, size, color, stock) VALUES (?, ?, ?, ?)',
      [productId, size, color, stock]
    );
  }

  async updateVariant(variantId, variantData) {
    const { size, color, stock } = variantData;
    await pool.execute(
      'UPDATE product_variants SET size = ?, color = ?, stock = ? WHERE id = ?',
      [size, color, stock, variantId]
    );
  }
  
  async deleteVariant(variantId) {
    await pool.execute('DELETE FROM product_variants WHERE id = ?', [variantId]);
  }

  async delete(id) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
  
      // Verificar si el producto está en un carrito
      const [cartItems] = await connection.execute(
        `SELECT COUNT(*) AS count
         FROM cart_items ci
         JOIN product_variants pv ON ci.product_variant_id = pv.id
         WHERE pv.product_id = ?`,
        [id]
      );
  
      if (cartItems[0].count > 0) {
        throw new Error('Cannot delete product: it is in a user\'s cart');
      }
  
      // Eliminar variantes asociadas al producto
      await connection.execute('DELETE FROM product_variants WHERE product_id = ?', [id]);
  
      // Eliminar imágenes asociadas al producto
      await connection.execute('DELETE FROM product_images WHERE product_id = ?', [id]);
  
      // Eliminar el producto
      await connection.execute('DELETE FROM products WHERE id = ?', [id]);
  
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async findByUser(userId) {
    const [rows] = await pool.execute(
      `SELECT p.*, pi.image_url
       FROM products p
       LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
       WHERE p.seller_id = ?`,
      [userId]
    );
    return rows;
  }
}