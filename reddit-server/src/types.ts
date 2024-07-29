import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { Redis } from "ioredis";

export type MyContext = {
  prisma: PrismaClient;
  req: Request & { session: { userId: number } };
  res: Response;
  redis: Redis;
};
