import { enumType, intArg, mutationField, nonNull, objectType } from "nexus";
import { isAuth } from "../../middleware/isAuth";

export const Vote = objectType({
  name: "Upvotes",
  definition(t) {
    t.model.post(),
      t.model.postId(),
      t.model.user(),
      t.model.userId(),
      t.model.value();
  },
});

export const VoteOptions = enumType({
  name: "VoteType",
  members: {
    upvote: 1,
    downvote: -1,
  },
});

export const mutations = mutationField((t) => {
  // upvotes or downvote posts
  t.field("votePost", {
    type: "Boolean",
    args: {
      postId: nonNull(intArg()),
      vote: nonNull(VoteOptions),
    },
    authorize: isAuth,
    resolve: async (parent, { postId, vote }, { prisma, req }) => {
      // check if the user already voted
      const voteCheck = await prisma.upvotes.findUnique({
        where: {
          userId_postId: {
            postId: postId,
            userId: req.session.userId,
          },
        },
      });

      // user already voted & new vote is same as last vote -> don't do anything
      if (voteCheck && voteCheck.value === vote) {
        return true;
      }

      // user already voted & changing their vote
      else if (voteCheck && voteCheck.value !== vote) {
        const upvoteUpdate = prisma.upvotes.update({
          data: {
            value: vote,
          },
          where: {
            userId_postId: {
              postId,
              userId: req.session.userId,
            },
          },
        });

        // update points on the post
        const updatePostPoint = prisma.post.update({
          where: {
            id: postId,
          },
          data: {
            points: {
              increment: vote,
            },
          },
        });

        // use transactions to successfully commit both writes or fail if one doesn't go well
        await prisma.$transaction([upvoteUpdate, updatePostPoint]);

        return true;
      }

      // has never voted before -> create a new record in upvotes table
      const upVoteWrite = prisma.upvotes.create({
        data: {
          value: vote,
          user: {
            connect: {
              id: req.session.userId,
            },
          },
          post: {
            connect: {
              id: postId,
            },
          },
        },
      });

      // update points on the post
      const updatePostPoint = prisma.post.update({
        where: {
          id: postId,
        },
        data: {
          points: {
            increment: vote,
          },
        },
      });

      // use transactions to successfully commit both writes or fail if one doesn't go well
      await prisma.$transaction([upVoteWrite, updatePostPoint]);

      return true;
    },
  });
});
