export const generateCrsfToken = () => {
    return crypto.randomBytes(32).toString('hex');
}

export const csrfProtection = (req, res, next) => {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const csrfToken = req.headers['x-csrf-token'];
      const sessionToken = req.session?.csrfToken;
      
      if (!csrfToken || csrfToken !== sessionToken) {
        return res.status(403).json({ message: 'Invalid CSRF token' });
      }
    }
    next();
  };