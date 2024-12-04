CREATE DATABASE velonia;
USE velonia;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name ENUM('man', 'woman', 'boy', 'girl') NOT NULL
);

CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    seller_id INT NOT NULL,
    category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE product_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE product_variants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    size VARCHAR(10) NOT NULL,
    color VARCHAR(50) NOT NULL,
    stock INT NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE cart_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_variant_id INT NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
);

CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_variant_id INT NOT NULL,
    quantity INT NOT NULL,
    price_at_time DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
);

-- Stored Procedures

DELIMITER //

CREATE PROCEDURE sp_create_product(
    IN p_seller_id INT,
    IN p_category_id INT,
    IN p_name VARCHAR(100),
    IN p_description TEXT,
    IN p_price DECIMAL(10, 2),
    IN p_stock INT
)
BEGIN
    INSERT INTO products (seller_id, category_id, name, description, price, stock)
    VALUES (p_seller_id, p_category_id, p_name, p_description, p_price, p_stock);
    SELECT LAST_INSERT_ID() as product_id;
END //

CREATE PROCEDURE sp_get_product_details(
    IN p_product_id INT
)
BEGIN
    SELECT 
        p.*,
        u.username as seller_name,
        c.name as category_name,
        GROUP_CONCAT(DISTINCT pi.image_url) as images,
        GROUP_CONCAT(DISTINCT CONCAT(pv.size, ':', pv.color, ':', pv.stock)) as variants
    FROM products p
    JOIN users u ON p.seller_id = u.id
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN product_images pi ON p.id = pi.product_id
    LEFT JOIN product_variants pv ON p.id = pv.product_id
    WHERE p.id = p_product_id
    GROUP BY p.id;
END //

CREATE PROCEDURE sp_add_to_cart(
    IN p_user_id INT,
    IN p_product_variant_id INT,
    IN p_quantity INT
)
BEGIN
    INSERT INTO cart_items (user_id, product_variant_id, quantity)
    VALUES (p_user_id, p_product_variant_id, p_quantity)
    ON DUPLICATE KEY UPDATE quantity = quantity + p_quantity;
END //

DELIMITER ;

-- Insert initial categories
INSERT INTO categories (name) VALUES ('man'), ('woman'), ('boy'), ('girl');