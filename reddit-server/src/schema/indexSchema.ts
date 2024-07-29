import { makeSchema, fieldAuthorizePlugin } from "nexus";
import { join } from "path";
import { nexusPrisma } from "nexus-plugin-prisma";
import { Hello } from "./entities/Hello";
import * as postTypes from "./entities/Post";
import * as userTypes from "./entities/User";
import * as voteTypes from "./entities/Vote";
import { DateTimeResolver } from "graphql-scalars";

export const schema = makeSchema({
  types: [Hello, postTypes, userTypes, voteTypes],
  plugins: [
    nexusPrisma({
      scalars: {
        DateTime: DateTimeResolver,
      },
      outputs: {
        typegen: __dirname + "/generated/typegen-nexus-plugin-prisma.d.ts",
      },
    }),
    fieldAuthorizePlugin(),
  ],
  outputs: {
    typegen: join(__dirname, "/generated", "nexus-types.ts"),
    schema: join(__dirname, "/generated", "schema.graphql"),
  },
  contextType: {
    module: join(__dirname, "../types.ts"),
    export: "MyContext",
  },
});
