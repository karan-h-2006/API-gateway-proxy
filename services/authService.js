const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Prisma } = require('@prisma/client');
const env = require('../config/env');
const developerRepository = require('../db/repositories/developerRepository');
const AppError = require('./appError');

const SALT_ROUNDS = 12;

const signToken = (developer) => {
  return jwt.sign(
    {
      email: developer.email
    },
    env.JWT_SECRET,
    {
      subject: developer.id,
      expiresIn: env.JWT_EXPIRES_IN
    }
  );
};

const toDeveloperResponse = (developer) => {
  return {
    id: developer.id,
    email: developer.email,
    name: developer.name,
    isActive: developer.isActive,
    createdAt: developer.createdAt,
    updatedAt: developer.updatedAt
  };
};

const registerDeveloper = async ({ name, email, password }) => {
  const existingDeveloper = await developerRepository.findDeveloperByEmail(email);

  if (existingDeveloper) {
    throw new AppError(409, 'A developer with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const developer = await developerRepository.createDeveloper({
      name,
      email,
      passwordHash
    });

    return {
      developer: toDeveloperResponse(developer),
      token: signToken(developer)
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(409, 'A developer with this email already exists.');
    }

    throw error;
  }
};

const loginDeveloper = async ({ email, password }) => {
  const developer = await developerRepository.findDeveloperByEmail(email);

  if (!developer) {
    throw new AppError(401, 'Invalid email or password.');
  }

  if (!developer.isActive) {
    throw new AppError(403, 'Developer account is inactive.');
  }

  const passwordMatches = await bcrypt.compare(password, developer.passwordHash);

  if (!passwordMatches) {
    throw new AppError(401, 'Invalid email or password.');
  }

  return {
    developer: toDeveloperResponse(developer),
    token: signToken(developer)
  };
};

const getCurrentDeveloper = async (developerId) => {
  const developer = await developerRepository.findDeveloperById(developerId);

  if (!developer) {
    throw new AppError(404, 'Developer account not found.');
  }

  if (!developer.isActive) {
    throw new AppError(403, 'Developer account is inactive.');
  }

  return toDeveloperResponse(developer);
};

module.exports = {
  registerDeveloper,
  loginDeveloper,
  getCurrentDeveloper
};
