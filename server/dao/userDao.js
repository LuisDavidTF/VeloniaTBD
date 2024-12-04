import { pool } from '../config/database.js';

export class UserDao {
  async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  async create(userData) {
    const { username, email, password, full_name } = userData;
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)',
      [username, email, password, full_name]
    );
    return result.insertId;
  }

  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, username, email, full_name, address FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  async update(id, userData) {
    const { username, email, full_name, address } = userData;
    await pool.execute(
      'UPDATE users SET username = ?, email = ?, full_name = ?, address = ? WHERE id = ?',
      [username, email, full_name, address, id]
    );
  }

  async updatePassword(id, hashedPassword) {
    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
  }
}