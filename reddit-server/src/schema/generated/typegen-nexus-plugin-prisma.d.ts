import * as Typegen from 'nexus-plugin-prisma/typegen'
import * as Prisma from '@prisma/client';

// Pagination type
type Pagination = {
  first?: boolean
  last?: boolean
  before?: boolean
  after?: boolean
}

// Prisma custom scalar names
type CustomScalars = 'DateTime'

// Prisma model type definitions
interface PrismaModels {
  User: Prisma.User
  Post: Prisma.Post
  Upvotes: Prisma.Upvotes
}

// Prisma input types metadata
interface NexusPrismaInputs {
  Query: {
    users: {
      filtering: 'AND' | 'OR' | 'NOT' | 'id' | 'username' | 'email' | 'password' | 'createdAt' | 'updatedAt' | 'posts' | 'Upvotes'
      ordering: 'id' | 'username' | 'email' | 'password' | 'createdAt' | 'updatedAt'
    }
    posts: {
      filtering: 'AND' | 'OR' | 'NOT' | 'id' | 'title' | 'content' | 'points' | 'createdAt' | 'updatedAt' | 'userId' | 'User' | 'Upvotes'
      ordering: 'id' | 'title' | 'content' | 'points' | 'createdAt' | 'updatedAt' | 'userId'
    }
    upvotes: {
      filtering: 'AND' | 'OR' | 'NOT' | 'userId' | 'postId' | 'value' | 'post' | 'user'
      ordering: 'userId' | 'postId' | 'value'
    }
  },
  User: {
    posts: {
      filtering: 'AND' | 'OR' | 'NOT' | 'id' | 'title' | 'content' | 'points' | 'createdAt' | 'updatedAt' | 'userId' | 'User' | 'Upvotes'
      ordering: 'id' | 'title' | 'content' | 'points' | 'createdAt' | 'updatedAt' | 'userId'
    }
    Upvotes: {
      filtering: 'AND' | 'OR' | 'NOT' | 'userId' | 'postId' | 'value' | 'post' | 'user'
      ordering: 'userId' | 'postId' | 'value'
    }
  }
  Post: {
    Upvotes: {
      filtering: 'AND' | 'OR' | 'NOT' | 'userId' | 'postId' | 'value' | 'post' | 'user'
      ordering: 'userId' | 'postId' | 'value'
    }
  }
  Upvotes: {

  }
}

// Prisma output types metadata
interface NexusPrismaOutputs {
  Query: {
    user: 'User'
    users: 'User'
    post: 'Post'
    posts: 'Post'
    upvotes: 'Upvotes'
    upvotes: 'Upvotes'
  },
  Mutation: {
    createOneUser: 'User'
    updateOneUser: 'User'
    updateManyUser: 'BatchPayload'
    deleteOneUser: 'User'
    deleteManyUser: 'BatchPayload'
    upsertOneUser: 'User'
    createOnePost: 'Post'
    updateOnePost: 'Post'
    updateManyPost: 'BatchPayload'
    deleteOnePost: 'Post'
    deleteManyPost: 'BatchPayload'
    upsertOnePost: 'Post'
    createOneUpvotes: 'Upvotes'
    updateOneUpvotes: 'Upvotes'
    updateManyUpvotes: 'BatchPayload'
    deleteOneUpvotes: 'Upvotes'
    deleteManyUpvotes: 'BatchPayload'
    upsertOneUpvotes: 'Upvotes'
  },
  User: {
    id: 'Int'
    username: 'String'
    email: 'String'
    password: 'String'
    createdAt: 'DateTime'
    updatedAt: 'DateTime'
    posts: 'Post'
    Upvotes: 'Upvotes'
  }
  Post: {
    id: 'Int'
    title: 'String'
    content: 'String'
    points: 'Int'
    createdAt: 'DateTime'
    updatedAt: 'DateTime'
    userId: 'Int'
    User: 'User'
    Upvotes: 'Upvotes'
  }
  Upvotes: {
    userId: 'Int'
    postId: 'Int'
    value: 'Int'
    post: 'Post'
    user: 'User'
  }
}

// Helper to gather all methods relative to a model
interface NexusPrismaMethods {
  User: Typegen.NexusPrismaFields<'User'>
  Post: Typegen.NexusPrismaFields<'Post'>
  Upvotes: Typegen.NexusPrismaFields<'Upvotes'>
  Query: Typegen.NexusPrismaFields<'Query'>
  Mutation: Typegen.NexusPrismaFields<'Mutation'>
}

interface NexusPrismaGenTypes {
  inputs: NexusPrismaInputs
  outputs: NexusPrismaOutputs
  methods: NexusPrismaMethods
  models: PrismaModels
  pagination: Pagination
  scalars: CustomScalars
}

declare global {
  interface NexusPrismaGen extends NexusPrismaGenTypes {}

  type NexusPrisma<
    TypeName extends string,
    ModelOrCrud extends 'model' | 'crud'
  > = Typegen.GetNexusPrisma<TypeName, ModelOrCrud>;
}
  