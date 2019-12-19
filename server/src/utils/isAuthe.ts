import { MiddlewareFn } from "type-graphql";
import { MyContext } from "src/interface/Context";
import { verify } from "jsonwebtoken";

export const isAuth: MiddlewareFn<MyContext> = ({ context }, next): any => {
  const authentication = context.req.headers["authorization"];
  if (!authentication) {
    return "Authorization header must not be empty";
  }
  const token = authentication.split(" ")[1];
  if (!token) {
    return `Autherization header type will be like 'bearer token'`;
  }
  const payload = verify(token, "myhiddenkey");
  if (!payload) {
    return "expire token";
  } else {
    context.payload = payload as any;
  }
  return next();
};
