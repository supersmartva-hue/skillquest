/**
 * Prisma Singleton — shared across all route files
 * Prevents hundreds of connection pools from being created
 */
const { PrismaClient } = require('@prisma/client');

const prisma = global.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

module.exports = prisma;
