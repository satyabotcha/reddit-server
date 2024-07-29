import {
  mutationField,
  nonNull,
  objectType,
  queryField,
  stringArg,
} from "nexus";
import argon2 from "argon2";
import { v4 as uuid } from "uuid";
import { sendEmail } from "../../utils/sendEmail";

export const user = objectType({
  name: "User",
  definition(t) {
    t.model.id(),
      t.model.username(),
      t.model.email(),
      t.model.createdAt(),
      t.model.updatedAt(),
      t.model.posts();
  },
});

export const errors = objectType({
  name: "FieldError",
  definition(t) {
    t.string("field"), t.string("message");
  },
});

export const userResponse = objectType({
  name: "UserResponse",
  definition(t) {
    t.field("errors", { type: "FieldError" });
    t.field("user", { type: "User" });
  },
});

export const query = queryField((t) => {
  t.field("me", {
    type: "User",
    resolve: async (parent, args, { prisma, req }) => {
      // you are not logged in
      if (!req.session.userId) {
        return null;
      }

      // logged in -> return user
      const user = await prisma.user.findFirst({
        where: { id: req.session.userId },
      });
      return user;
    },
  });
});

export const mutations = mutationField((t) => {
  // create user
  t.field("createUser", {
    type: "UserResponse",
    args: {
      email: nonNull(stringArg()),
      username: nonNull(stringArg()),
      password: nonNull(stringArg()),
    },
    resolve: async (parent, { username, password, email }, { prisma }) => {
      // return error if email does not include '@'
      if (!email.includes("@")) {
        return {
          errors: {
            field: "email",
            message: "invalid email address",
          },
        };
      }

      // return error if username is too short
      if (username.length <= 2) {
        return {
          errors: {
            field: "username",
            message: "username is too short",
          },
        };
      }

      // return error if password is too short
      if (password.length <= 2) {
        return {
          errors: {
            field: "password",
            message: "password is too short",
          },
        };
      }

      try {
        // create new user they don't exist

        const hashedPassword = await argon2.hash(password);

        const user = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            username: username.toLowerCase(),
            password: hashedPassword,
          },
        });
        return { user };
      } catch (err) {
        if (err.code === "P2002") {
          return {
            errors: {
              field: "email",
              message: "email already registered",
            },
          };
        }
        return {
          errors: {
            field: "server",
            message: "something went wrong with server",
          },
        };
      }
    },
  });
  // login user
  t.field("loginUser", {
    type: "UserResponse",
    args: {
      email: nonNull(stringArg()),
      password: nonNull(stringArg()),
    },
    resolve: async (parent, { email, password }, { prisma, req }) => {
      const user = await prisma.user.findFirst({
        where: { email: email.toLowerCase() },
      });
      // user does not exist
      if (!user) {
        return {
          errors: {
            field: "email",
            message: "email does not exist",
          },
        };
      }

      const valid = await argon2.verify(user.password, password);
      // password invalid
      if (!valid) {
        return {
          errors: {
            field: "password",
            message: "password is incorrect",
          },
        };
      }

      // add userId to request.session -> they successfully logged in

      req.session.userId = user.id;

      // email & password matched
      return { user };
    },
  });
  // logout
  t.field("logoutUser", {
    type: "Boolean",
    resolve: (parent, args, { res, req }) => {
      return new Promise((resolve) => {
        // destroy session on Redis
        req.session.destroy((err) => {
          if (err) {
            // cookie failed to destroy
            console.log(err);
            resolve(false);
          }
          // delete cookie on browser
          res.clearCookie("sid");
          resolve(true);
        });
      });
    },
  });
  // forgot password
  t.field("forgotPassword", {
    type: "Boolean",
    args: {
      email: nonNull(stringArg()),
    },
    resolve: async (parent, { email }, { prisma, redis }) => {
      const user = await prisma.user.findFirst({
        where: { email: email.toLowerCase() },
      });
      // user does not exist
      if (!user) {
        // to avoid phising for information -> don't want people to see who is registered
        return true;
      }

      // process to reset password

      // 1) user requests reset email on client
      // 2) server generates token
      // 3) server stores the token in Redis for 30 min -> and then destroys it -> to avoid resetting the password forever
      // 4) client gets an email with the link to reset -> once reset -> destroy the token

      // generated a random token
      const token = uuid();

      // store token in redis
      await redis.set(
        `forgot-password:${token}`,
        user.id,
        "EX",
        1000 * 60 * 30
      ); //30 minutes expiry

      // http://localhost.com/forgot-password/1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed (random token)

      const resetLink = `<a href=http://localhost:3000/forgot-password/${token}>Reset Password</a>`;

      await sendEmail(email, resetLink);
      return true;
    },
  });
  // Reset password
  t.field("resetPassword", {
    type: "UserResponse",
    args: {
      token: nonNull(stringArg()),
      newPassword: nonNull(stringArg()),
    },
    resolve: async (parent, { token, newPassword }, { prisma, redis }) => {
      // return error is new password is too short
      if (newPassword.length <= 2) {
        return {
          errors: {
            field: "password",
            message: "New password is too short",
          },
        };
      }

      // key stored in redis
      const key = `forgot-password:${token}`;

      // check if the token exists in redis -> return associated userId
      const userId = await redis.get(key);

      // if token expired/not found -> return error
      if (!userId) {
        return {
          errors: {
            field: "password",
            message: "password link expired",
          },
        };
      }

      // check if user with userId exists
      const user = await prisma.user.findFirst({
        where: {
          id: +userId,
        },
      });

      // if for some reason user id could not be found
      if (!user) {
        return {
          errors: {
            field: "token",
            message: "user no longer exists",
          },
        };
      }

      const hashedPassword = await argon2.hash(newPassword);

      const updatedUser = await prisma.user.update({
        where: { id: +userId },
        data: {
          password: hashedPassword,
        },
      });

      // destroy token in redis

      await redis.del(key);

      return {
        user: updatedUser,
      };
    },
  });
});
