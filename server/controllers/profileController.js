import { UserDao } from '../dao/userDao.js';
import { ProductDao } from '../dao/productDao.js';
import bcrypt from 'bcryptjs';

const userDao = new UserDao();
const productDao = new ProductDao();

export const profileController = {
  async getProfile(req, res) {
    try {
      const user = await userDao.findById(req.session.user.id);
      const userProducts = await productDao.findByUser(req.session.user.id);
      
      res.render('profile/index', {
        title: 'My Profile',
        user,
        userProducts,
        error: req.flash('error'),
        success: req.flash('success')
      });
    } catch (error) {
      console.error(error);
      res.status(500).render('error', { 
        error: 'Failed to load profile',
        user: req.session.user
      });
    }
  },

  async getEditProfile(req, res) {
    try {
      const user = await userDao.findById(req.session.user.id);
      res.render('profile/edit', {
        title: 'Edit Profile',
        user,
        error: req.flash('error')
      });
    } catch (error) {
      console.error(error);
      res.status(500).render('error', { 
        error: 'Failed to load profile',
        user: req.session.user
      });
    }
  },

  async updateProfile(req, res) {
    try {
      const { username, email, full_name, address, current_password, new_password } = req.body;
      const userId = req.session.user.id;
      const user = await userDao.findById(userId);

      if (new_password) {
        const isValidPassword = await bcrypt.compare(current_password, user.password);
        if (!isValidPassword) {
          req.flash('error', 'Current password is incorrect');
          return res.redirect('/profile/edit');
        }
        const hashedPassword = await bcrypt.hash(new_password, 10);
        await userDao.updatePassword(userId, hashedPassword);
      }

      await userDao.update(userId, {
        username,
        email,
        full_name,
        address
      });

      req.flash('success', 'Profile updated successfully');
      res.redirect('/profile');
    } catch (error) {
      console.error(error);
      req.flash('error', 'Failed to update profile');
      res.redirect('/profile/edit');
    }
  }
};