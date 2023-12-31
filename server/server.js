import { ApolloServer } from "@apollo/server";
import { expressMiddleware as apolloMiddleware } from "@apollo/server/express4";
import cors from "cors";
import express from "express";
import { readFile } from "node:fs/promises";
import { authMiddleware, handleLogin } from "./auth.js";
import { resolvers } from "./resolvers.js";
import { WebSocketServer } from "ws";
import { createServer as createHttpServer } from "node:http";
import { useServer as useWsServer } from "graphql-ws/lib/use/ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
const PORT = 9000;

const app = express();
app.use(cors(), express.json());

app.post("/login", handleLogin);

function getContext({ req }) {
  if (req.auth) {
    return { user: req.auth.sub };
  }
  return {};
}

const typeDefs = await readFile("./schema.graphql", "utf8");
const schema = makeExecutableSchema({ typeDefs, resolvers });
const apolloServer = new ApolloServer({ schema });
// const apolloServer = new ApolloServer({ typeDefs, resolvers }); // { typeDefs, resolvers } will automatically combine to the schema. we can manually create it by makeExecutableSchema()
await apolloServer.start();

app.use(
  "/graphql",
  authMiddleware,
  apolloMiddleware(apolloServer, {
    context: getContext,
  })
);

const httpServer = createHttpServer(app); // httpServer will use express for process all request (we manually defined it because we want to use it on wsServer, before we can automatically create by app.listen)
const wsServer = new WebSocketServer({ server: httpServer, path: "/graphql" }); // ws started by making the http request, path mean what path we want to use ws
useWsServer({ schema }, wsServer);

// instead of app.lister, we will create httpServer manually
httpServer.listen({ port: PORT }, () => {
  // http server is created automatically after app.listen but we will manually create the http server to make ws use it
  console.log(`Server running on port ${PORT}`);
  console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
});
