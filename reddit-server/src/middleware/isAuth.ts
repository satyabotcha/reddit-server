import { MyContext } from "../types";

export function isAuth(parent: any, args: any, { req }: MyContext) {
  if (!req.session.userId) {
    return false;
  }
  return true;
}
