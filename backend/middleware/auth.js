const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }

    // Check if it's an API request or a page request
    if (req.path.startsWith('/api')) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    } else {
        return res.redirect('/');
    }
};

module.exports = isAuthenticated;
