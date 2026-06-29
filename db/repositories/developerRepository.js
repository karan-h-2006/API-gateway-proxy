const prisma = require('../prisma');

const developerSelect = {
  id: true,
  email: true,
  name: true,
  isActive: true,
  createdAt: true,
  updatedAt: true
};

const createDeveloper = (data) => {
  return prisma.developer.create({
    data,
    select: developerSelect
  });
};

const findDeveloperByEmail = (email) => {
  return prisma.developer.findUnique({
    where: { email }
  });
};

const findDeveloperById = (id) => {
  return prisma.developer.findUnique({
    where: { id },
    select: developerSelect
  });
};

module.exports = {
  createDeveloper,
  findDeveloperByEmail,
  findDeveloperById,
  developerSelect
};
