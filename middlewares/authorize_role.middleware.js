import db from "../db/index.js";
import { usersTable } from "../models/index.js";
import { eq } from "drizzle-orm";

async function authorize_role(req, res, next) {
  try {
    console.log(`i'm inside the authorize role middleware`);

    // now authorize the role only admin are allowed
    const { user_id } = req.user;
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: `user id is required`,
      });
    }
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.user_id, user_id));
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User with the id ${user.user_id} doesn't exist in db!`,
      });
    }

    //  now let's check for the role Alina if the user is an admin
    if (user.role === "admin") {
      // allowed pass the user to the next function
      req.user = user;
      next();
      return;
    }

    return res.status(403).json({
      success: false,
      message: `Unauthorized to access this resourse!`,
    });
  } catch (error) {
    console.log(`Error while Authorizing the role! ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export default authorize_role;
