import "reflect-metadata";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
// import { UserResolver } from "./resolvers/UserResolver";
import { createConnection } from "typeorm";
import cookieParser from "cookie-parser";
import { verify } from "jsonwebtoken";
import cors from "cors";

import { User } from "./entity/User";
import { createAccessToken, createRefreshToken } from "./utils/auth";
import { oid } from "./utils/helpers";

(async () => {
  const app = express();
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true
    })
  );
  app.use(cookieParser());
  app.get("/", (_, res) => res.send("hello world"));
  app.post("/refresh_token", async (req, res) => {
    const token = req.cookies.jid;
    if (!token) {
      return res.send({ ok: false, accessToken: "" });
    }
    let payload: any = null;
    try {
      payload = verify(token, "myhiddenkey");
    } catch (err) {
      console.log(err);
      return res.send({ ok: false, accessToken: "" });
    }
    const id = new oid(payload.userId);
    const user = await User.findOne({ where: { _id: id } });
    if (!user) {
      return res.send({ ok: false, accessToken: "" });
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      return res.send({ ok: false, accessToken: "" });
    }
    res.cookie("jid", createRefreshToken(user), { httpOnly: true });
    return res.send({ ok: true, accessToken: createAccessToken(user) });
  });
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      // resolvers: [UserResolver]
      resolvers: [`${__dirname}/resolvers/*.ts`]
    }),
    context: ({ req, res }) => ({ req, res }),
    engine: {
      // The Graph Manager API key
      apiKey: "service:jwt-authentication:vrWk0YQWjhzTFP-zEORQQA",
      // A tag for this specific environment (e.g. `development` or `production`).
      // For more information on schema tags/variants, see
      // https://www.apollographql.com/docs/platform/schema-registry/#associating-metrics-with-a-variant
      schemaTag: "current"
    }
  });
  await createConnection();
  apolloServer.applyMiddleware({ app, cors: false });
  app.listen(4000, () => {
    console.log("server is running");
  });
})();

// import {createConnection} from "typeorm";
// import {User} from "./entity/User";

// createConnection().then(async connection => {

//     console.log("Inserting a new user into the database...");
//     const user = new User();
//     user.firstName = "Timber";
//     user.lastName = "Saw";
//     user.age = 25;
//     await connection.manager.save(user);
//     console.log("Saved a new user with id: " + user.id);

//     console.log("Loading users from the database...");
//     const users = await connection.manager.find(User);
//     console.log("Loaded users: ", users);

//     console.log("Here you can setup and run express/koa/any other framework.");

// }).catch(error => console.log(error));
