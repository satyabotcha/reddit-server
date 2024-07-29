import { nonNull, queryField } from "nexus";

export const Hello = queryField("hello", {
  type: nonNull("String"),
  resolve: () => "Hello, bye",
});
