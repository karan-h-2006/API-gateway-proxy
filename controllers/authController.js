const { z } = require('zod');
const authService = require('../services/authService');

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(128)
});

const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(128)
});

const register = async (req, res) => {
  const payload = registerSchema.parse(req.body);
  const result = await authService.registerDeveloper(payload);

  res.status(201).json(result);
};

const login = async (req, res) => {
  const payload = loginSchema.parse(req.body);
  const result = await authService.loginDeveloper(payload);

  res.status(200).json(result);
};

const getMe = async (req, res) => {
  const developer = await authService.getCurrentDeveloper(req.user.id);

  res.status(200).json({ developer });
};

module.exports = {
  register,
  login,
  getMe
};
