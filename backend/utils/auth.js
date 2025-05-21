const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cakeria-super-secret-key';

const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '2h';

exports.generateToken = user => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      type: user.type, 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
};

exports.verifyToken = token => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
