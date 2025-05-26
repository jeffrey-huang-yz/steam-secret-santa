import { makeExecutableSchema } from '@graphql-tools/schema';
import { GraphQLError } from 'graphql';
import { query } from './db.js';
import { generateMatches } from './util/matches.js';

export interface GqlCtx {
  userId?: bigint;           // stub for auth – currently unused
}

const typeDefs = /* GraphQL */ `
  scalar DateTime

  type User {
    id: ID!
    steamId: String!
    displayName: String!
    avatar: String!
  }

  type Event {
    id: ID!
    name: String!
    budgetCents: Int!
    signupClose: DateTime!
    revealDate: DateTime!
    matchesRunAt: DateTime
    participants: [Participant!]!
  }

  type Participant {
    id: ID!
    user: User!
    matchedTo: Participant
    giftScheduledAt: DateTime
  }

  type Query {
    me: User
    event(id: ID!): Event
    myEvents: [Event!]!
  }

  input CreateEventInput {
    name: String!
    budgetCents: Int!
    signupClose: DateTime!
    revealDate: DateTime!
  }

  type Mutation {
    createEvent(input: CreateEventInput!): Event!
    joinEvent(eventId: ID!): Participant!
    runDraw(eventId: ID!): Event!
    confirmGiftScheduled(participantId: ID!, scheduledAt: DateTime!): Participant!
  }
`;

const resolvers = {
  Query: {
    me: async (_: any, __: any, ctx: GqlCtx) => {
      if (!ctx.userId) return null;
      return (
        await query(
          `SELECT id,
                  steam_id     AS "steamId",
                  display_name AS "displayName",
                  avatar
           FROM users WHERE id = $1`,
          [ctx.userId],
        )
      )[0];
    },

    event: async (_: any, { id }: any) => {
      const [ev] = await query(
        `SELECT id, name, budget_cents AS "budgetCents",
                signup_close AS "signupClose",
                reveal_date  AS "revealDate",
                matches_run_at AS "matchesRunAt"
         FROM events WHERE id = $1`,
        [id],
      );
      if (!ev) return null;

      const parts = await query(
        `SELECT p.id,
                p.matched_to        AS "matchedTo",
                p.gift_scheduled_at AS "giftScheduledAt",
                json_build_object(
                  'id', u.id,
                  'steamId', u.steam_id,
                  'displayName', u.display_name,
                  'avatar', u.avatar
                )               AS user
         FROM participants p
         JOIN users u ON u.id = p.user_id
         WHERE p.event_id = $1`,
        [id],
      );
      return { ...ev, participants: parts };
    },

    myEvents: async (_: any, __: any, ctx: GqlCtx) => {
      if (!ctx.userId) return [];
      return query(
        `SELECT e.id, e.name, e.reveal_date AS "revealDate"
         FROM events e
         JOIN participants p ON p.event_id = e.id
         WHERE p.user_id = $1`,
        [ctx.userId],
      );
    },
  },

  Mutation: {
    createEvent: async (_: any, { input }: any, ctx: GqlCtx) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated');

      const [ev] = await query(
        `INSERT INTO events (name, budget_cents, signup_close, reveal_date)
         VALUES ($1,$2,$3,$4) RETURNING *`,
        [input.name, input.budgetCents, input.signupClose, input.revealDate],
      );

      await query(
        `INSERT INTO participants (user_id, event_id) VALUES ($1,$2)`,
        [ctx.userId, ev.id],
      );
      return ev;
    },

    joinEvent: async (_: any, { eventId }: any, ctx: GqlCtx) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated');
      return (
        await query(
          `INSERT INTO participants (user_id, event_id)
           VALUES ($1,$2)
           ON CONFLICT DO NOTHING
           RETURNING *`,
          [ctx.userId, eventId],
        )
      )[0];
    },

    runDraw: async (_: any, { eventId }: any) => {
      const parts = await query<{ id: number }>(
        `SELECT id FROM participants WHERE event_id = $1`,
        [eventId],
      );
      if (parts.length < 2)
        throw new GraphQLError('Need at least 2 participants');

      const matches = generateMatches(parts.map((p) => p.id));

      const { pool } = await import('./db.js');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (const { giver, receiver } of matches) {
          await client.query(
            `UPDATE participants SET matched_to = $1 WHERE id = $2`,
            [receiver, giver],
          );
        }
        await client.query(
          `UPDATE events SET matches_run_at = NOW() WHERE id = $1`,
          [eventId],
        );
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
      return (await query(`SELECT * FROM events WHERE id = $1`, [eventId]))[0];
    },

    confirmGiftScheduled: async (_: any, { participantId, scheduledAt }: any) =>
      (
        await query(
          `UPDATE participants
           SET gift_scheduled_at = $1
           WHERE id = $2
           RETURNING *`,
          [scheduledAt, participantId],
        )
      )[0],
  },
};

export const schema = makeExecutableSchema({ typeDefs, resolvers });
