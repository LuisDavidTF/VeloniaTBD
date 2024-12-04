export const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    req.flash('error', 'Please log in to continue');
    res.redirect('/auth/login');
  }
};