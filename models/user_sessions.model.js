import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import usersTable from "./users.model.js";

const user_sessions = pgTable("user_sessions", {
  session_id: uuid().primaryKey().defaultRandom(),
  user_id: uuid()
    .references(() => usersTable.user_id, { onDelete: "cascade" })
    .notNull(),
  refresh_token: text().notNull(),
});

export default user_sessions;
