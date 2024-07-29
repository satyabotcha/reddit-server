import {
  intArg,
  list,
  mutationField,
  nonNull,
  objectType,
  queryField,
  stringArg,
} from "nexus";
import { isAuth } from "../../middleware/isAuth";

export const PaginatedPosts = objectType({
  name: "PaginatedPosts",
  definition(t) {
    t.field("hasMore", { type: "Boolean" });
    t.field("posts", { type: list("Post") });
  },
});

export const Post = objectType({
  name: "Post",
  definition(t) {
    t.model.id(),
      t.model.title(),
      t.model.createdAt(),
      t.model.updatedAt(),
      t.model.points(),
      t.model.userId(),
      t.model.User({ alias: "creator" }),
      t.field("voteStatus", {
        type: "Int",
        resolve: async ({ id }, args, { req, prisma }) => {
          console.log(req.session.userId);
          const result = await prisma.upvotes.findUnique({
            where: {
              userId_postId: {
                postId: id,
                userId: req.session.userId,
              },
            },
            select: {
              value: true,
            },
          });

          if (result) {
            return result.value;
          }

          return result;
        },
      }),
      t.model.content();
  },
});

export const query = queryField((t) => {
  t.field("PaginatedPosts", {
    type: "PaginatedPosts",
    args: {
      // how many posts to fetch
      take: nonNull(intArg()),
      cursor: intArg(),
    },
    resolve: async (parent, { take, cursor }, { prisma }) => {
      // if take > 50 -> cap it at 50 -> prevent from querying the entire database
      let takeLimit = Math.min(50, take);

      // fetch + 1 more post (pagination check)
      let takeLimitPlusOne = takeLimit + 1;

      // if cursor -> return posts after the cursor value
      if (cursor) {
        const posts = await prisma.post.findMany({
          take: takeLimitPlusOne,
          skip: 1, // Skip the cursor
          cursor: {
            id: cursor,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return {
          // if posts length is equal to TakeLimitPlusOne -> we have more posts to load -> or else false
          // user asks 20 -> we fetch 21 -> if we get back 21 posts from db -> we have more posts to load -> or else we don't have more posts
          hasMore: posts.length === takeLimitPlusOne,

          // slice the returned posts array to what the user asked for
          posts: posts.slice(0, takeLimit),
        };
      }

      const posts = await prisma.post.findMany({
        take: takeLimitPlusOne,
        orderBy: {
          createdAt: "desc",
        },
      });

      return {
        hasMore: posts.length === takeLimitPlusOne,
        posts: posts.slice(0, takeLimit),
      };
    },
  });
  t.field("post", {
    type: "Post",
    args: {
      id: nonNull(intArg()),
    },
    resolve: async (parent, { id }, { prisma }) => {
      return await prisma.post.findFirst({
        where: {
          id,
        },
      });
    },
  });
});

export const mutations = mutationField((t) => {
  t.field("createPost", {
    type: "Post",
    args: {
      title: nonNull(stringArg()),
      content: nonNull(stringArg()),
    },
    authorize: isAuth,
    resolve: async (parent, { title, content }, { prisma, req }) => {
      return await prisma.post.create({
        data: {
          title,
          content,
          User: {
            connect: {
              id: req.session.userId,
            },
          },
        },
      });
    },
  });
  t.field("updatePost", {
    type: "Post",
    args: {
      id: nonNull(intArg()),
      title: nonNull(stringArg()),
      content: nonNull(stringArg()),
    },
    authorize: isAuth,
    resolve: async (parent, { title, id, content }, { prisma, req }) => {
      // update if post exists

      const post = await prisma.post.findUnique({
        where: {
          id,
        },
      });

      if (!post) {
        // return null if post does not exist
        return null;
      }

      if (post.userId === req.session.userId) {
        // only update if you are the creator
        return await prisma.post.update({
          where: { id },
          data: { title, content },
        });
      }

      // return existing post
      return post;
    },
  });
  t.field("deletePost", {
    type: "Boolean",
    args: {
      id: nonNull(intArg()),
    },
    authorize: isAuth,
    resolve: async (parent, { id }, { prisma, req }) => {
      // delete if post exists
      try {
        // only delete post if you are the creator of it
        const post = await prisma.post.findUnique({
          where: {
            id,
          },
        });

        if (post?.userId === req.session.userId) {
          // delete from the upvotes table
          const deleteUpvotes = prisma.upvotes.deleteMany({
            where: {
              postId: id,
            },
          });

          // delete from the post table -> check for the creator now
          const deletePost = prisma.post.delete({
            where: { id },
          });

          await prisma.$transaction([deleteUpvotes, deletePost]);

          return true;
        }

        // you are not the creator of it
        return false;
      } catch (err) {
        console.log(err);
        // return false if post does not exist
        return false;
      }
    },
  });
});
