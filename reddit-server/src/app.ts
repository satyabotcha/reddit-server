import { PrismaClient } from "@prisma/client";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { schema } from "./schema/indexSchema";

import redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

async function main() {
  // postgres connection
  const prisma = new PrismaClient({ log: ["query"] });

  const app = express();

  // redis
  let redisStore = connectRedis(session);
  let redisClient = new redis(process.env.REDIS_URL);

  // NGINX
  app.set("trust proxy", 1);

  // session
  app.use(
    session({
      name: "sid",
      store: new redisStore({ client: redisClient }),
      secret: process.env.SESSION_REDIS_KEY!,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365, //1 year
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", //only works in HTTPS in production
        sameSite: "lax", //CSRF
        domain:
          process.env.NODE_ENV === "production"
            ? ".satyabotcha.com"
            : undefined,
      },
      resave: false,
      saveUninitialized: false,
    })
  );

  app.use(
    cors({
      origin: process.env.CORS_ORGIN,
      credentials: true,
    })
  );

  const server = new ApolloServer({
    schema,
    context: ({ req, res }) => ({
      prisma,
      req,
      res,
      redis: redisClient,
    }),
  });

  server.applyMiddleware({ app, cors: false });

  app.listen(parseInt(process.env.PORT!), () =>
    console.log("Server started at http://localhost:4000")
  );
}

main().catch((e) => console.log(e));
