
import { startStandaloneServer } from '@apollo/server/standalone';

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # This "Book" type defines the queryable fields for every book in our data source.
  type Book {
    title: String
    author: String
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).
  type Query {
    books: [Book]
  }
`;

const books = [
  {
    title: 'The Awakening',
    author: 'Kate Chopin',
  },
  {
    title: 'City of Glass',
    author: 'Paul Auster',
  },
];

// Resolvers define how to fetch the types defined in your schema.
// This resolver retrieves books from the "books" array above.
const resolvers = {
  Query: {
    books: () => books,
  },
};

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Passing an ApolloServer instance to the `startStandaloneServer` function:
//  1. creates an Express app
//  2. installs your ApolloServer instance as middleware
//  3. prepares your app to handle incoming requests
const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as SteamStrategy } from 'passport-steam';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { schema, GqlCtx } from './schema';
import { query, pool } from './db.js';

const PORT  = Number(process.env.PORT ?? 4000);
const BASE  = process.env.BASE_URL      ?? `http://localhost:${PORT}`;
const FRONT = process.env.FRONTEND_URL  ?? 'http://localhost:5173';

/* ---------------------------------------------------------------- *\
 *                    Express + Session middleware
\* ---------------------------------------------------------------- */

const app = express();

app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    saveUninitialized: false,
    resave: false,
  }),
);
app.use(passport.initialize());
app.use(passport.session());

/* ---------------------------------------------------------------- *\
 *                              Passport
\* ---------------------------------------------------------------- */

// 1. Steam strategy
passport.use(
  new SteamStrategy(
    {
      returnURL: `${BASE}/auth/steam/return`,
      realm: BASE,
      apiKey: process.env.STEAM_API_KEY!,
    },
    async (_id: string, profile: any, done: Function) => {
      try {
        // upsert into users table
        const [user] = await query(
          `INSERT INTO users (steam_id, display_name, avatar)
           VALUES ($1,$2,$3)
           ON CONFLICT (steam_id) DO
           UPDATE SET display_name = $2, avatar = $3
           RETURNING *`,
          [profile.id, profile.displayName, profile.photos[2].value],
        );
        done(null, user);
      } catch (err) {
        done(err);
      }
    },
  ),
);

// 2. (de)serialize user → just store numeric DB id in the cookie
passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: number, done) => {
  const [user] = await query('SELECT * FROM users WHERE id = $1', [id]);
  done(null, user || false);
});

/* ---------------------------------------------------------------- *\
 *                          Auth routes
\* ---------------------------------------------------------------- */

app.get('/auth/steam', passport.authenticate('steam', { session: true }));

app.get(
  '/auth/steam/return',
  passport.authenticate('steam', { session: true }),
  (_req, res) => {
    // back to SPA
    res.redirect(`${FRONT}/dashboard`);
  },
);

/* ---------------------------------------------------------------- *\
 *                             GraphQL
\* ---------------------------------------------------------------- */

const gql = new ApolloServer<GqlCtx>({ schema });
await gql.start();

app.use(
  '/graphql',
  express.json(),
  expressMiddleware(gql, {
    context: async ({ req }): Promise<GqlCtx> => ({
      userId: (req as any).user?.id as bigint | undefined,
    }),
  }),
);

/* ---------------------------------------------------------------- *\
 *                             Start
\* ---------------------------------------------------------------- */

app.listen(PORT, () =>
  console.log(`🚀  http://localhost:${PORT}/graphql`),
);
