import { text, pgTable, varchar, uuid } from "drizzle-orm/pg-core";

const usersTable = pgTable("users", {
  user_id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: text().notNull(),
  salt: text().notNull(),
  role: text().notNull().default("user"),
});

export default usersTable;
