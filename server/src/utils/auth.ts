import { User } from "src/entity/User";
import { sign } from "jsonwebtoken";
import { oid } from "./helpers";

export const createAccessToken = (user: User) => {
  const userId = new oid(user.id);
  return sign({ userId }, "myhiddenkey", {
    expiresIn: "15m"
  });
};

export const createRefreshToken = (user: User) => {
  const userId = new oid(user.id);
  return sign({ userId, tokenVersion: user.tokenVersion }, "myhiddenkey", {
    expiresIn: "7d"
  });
};
