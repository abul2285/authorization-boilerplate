import {
  Resolver,
  Query,
  Mutation,
  Arg,
  ObjectType,
  Field,
  Ctx,
  UseMiddleware
} from "type-graphql";
import { User } from "../entity/User";
import bcrypt, { compare } from "bcryptjs";
import { MyContext } from "src/interface/Context";
import { createRefreshToken, createAccessToken } from "../utils/auth";
import { isAuth } from "../utils/isAuthe";
import { verify } from "jsonwebtoken";
import { oid, sendRefreshToken } from "../utils/helpers";

@ObjectType()
class LoginResponse {
  @Field()
  accessToken: string;

  @Field(() => User)
  user: User;
}

@Resolver()
export class UserResolver {
  @Query(() => String)
  async hello() {
    return "hi";
  }

  @Query(() => User, { nullable: true })
  me(@Ctx() context: MyContext) {
    const authorization = context.req.headers["authorization"];
    if (!authorization) {
      return null;
    }
    try {
      const token = authorization.split(" ")[1];
      const payload: any = verify(token, "myhiddenkey");
      return User.findOne({ where: { _id: new oid(payload.userId) } });
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  @Query(() => String)
  @UseMiddleware(isAuth)
  async bye(@Ctx() { payload }: MyContext) {
    return `Your User Id Is: ${payload!.userId}`;
  }

  @Query(() => [User])
  async users() {
    return User.find();
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { res }: MyContext) {
    sendRefreshToken(res, "");
    return true;
  }

  @Mutation(() => String, { nullable: true })
  async revokeRefreshToken(@Arg("email") email: string) {
    const user = await User.findOne({ email });
    user!.tokenVersion++;
    user!.save();
  }

  @Mutation(() => Boolean)
  async register(
    @Arg("email") email: string,
    @Arg("password") password: string
  ) {
    const hashPassword = await bcrypt.hash(password, 12);
    try {
      await User.insert({
        email,
        password: hashPassword
      });
    } catch (err) {
      console.log(err);
      return false;
    }
    return true;
  }

  @Mutation(() => LoginResponse)
  async login(
    @Arg("email") email: string,
    @Arg("password") password: string,
    @Ctx() { res }: MyContext
  ): Promise<LoginResponse> {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      throw new Error("User not found");
    }
    const valid = await compare(password, user.password);
    if (!valid) {
      throw new Error("Incorrect password");
    }

    res.cookie("jid", createRefreshToken(user), { httpOnly: true });
    return {
      accessToken: createAccessToken(user),
      user
    };
  }
}
