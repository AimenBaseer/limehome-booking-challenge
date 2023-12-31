import { PrismaClient } from '@prisma/client';
import { middlewares } from './prisma/middlewares';

const prisma = new PrismaClient();

middlewares.forEach((middleware) => prisma.$use(middleware));
export default prisma;
