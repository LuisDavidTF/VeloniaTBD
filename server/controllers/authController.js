import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserDao } from '../dao/userDao.js';

const userDao = new UserDao();

export const authController = {
  getLogin: (req, res) => {
    res.render('auth/login', { 
      title: 'Login',
      error: req.flash('error')
    });
  },

  getRegister: (req, res) => {
    res.render('auth/register', { 
      title: 'Register',
      error: req.flash('error')
    });
  },

  async postLogin(req, res) {
    try {
      const { email, password } = req.body;
      const user = await userDao.findByEmail(email);

      if (!user || !(await bcrypt.compare(password, user.password))) {
        req.flash('error', 'Invalid credentials');
        return res.redirect('/auth/login');
      }

      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email
      };
      
      res.redirect('/');
    } catch (error) {
      console.error(error);
      req.flash('error', 'An error occurred');
      res.redirect('/auth/login');
    }
  },

  async postRegister(req, res) {
    try {
      const { username, email, password, full_name } = req.body;
      const existingUser = await userDao.findByEmail(email);

      if (existingUser) {
        req.flash('error', 'Email already registered');
        return res.redirect('/auth/register');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await userDao.create({
        username,
        email,
        password: hashedPassword,
        full_name
      });

      res.redirect('/auth/login');
    } catch (error) {
      console.error(error);
      req.flash('error', 'Registration failed');
      res.redirect('/auth/register');
    }
  },

  logout(req, res) {
    req.session.destroy();
    res.redirect('/');
  }
};