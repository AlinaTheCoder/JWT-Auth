import db from "../db/index.js";
import { usersTable, userSessionsTable } from "../models/index.js";
import { eq } from "drizzle-orm";
import { randomBytes, createHmac } from "node:crypto";
import jwt from "jsonwebtoken";

async function signup(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      error: `name , email and password are required to sign up!`,
    });
  }

  //   check if email already exists ok
  const [emailAlreadyExists] = await db
    .select({ email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (emailAlreadyExists) {
    return res.status(409).json({
      success: false,
      error: `${email} already taken!`,
    });
  }

  const salt = randomBytes(256).toString("hex");
  const hashedPassword = createHmac("sha256", salt)
    .update(password)
    .digest("hex");

  const [user] = await db
    .insert(usersTable)
    .values({
      name,
      email,
      password: hashedPassword,
      salt,
    })
    .returning({ user_id: usersTable.user_id });

  return res.status(201).json({
    success: true,
    message: `Sign Up successful with the user_id ${user.user_id}`,
  });
}
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required to login",
      });
    }

    // Fetch user (salt + password)
    const [user] = await db
      .select({
        user_id: usersTable.user_id,
        name: usersTable.name,
        email: usersTable.email,
        salt: usersTable.salt,
        password: usersTable.password,
      })
      .from(usersTable)
      .where(eq(usersTable.email, email));

    // If user not found
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Invalid email or password", // generic for security
      });
    }

    // Hash provided password with stored salt
    const hashedPassword = createHmac("sha256", user.salt)
      .update(password)
      .digest("hex");

    // Compare hashed passwords
    if (hashedPassword !== user.password) {
      return res.status(401).json({
        success: false,
        error: "Invalid password", // generic
      });
    }

    const payload = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
    };

    //  also impliment the refresh token stuff
    // generate the jwt token and return back that to the client
    const access_token = jwt.sign(payload, process.env.ACESS_TOKEN_SECRET_KEY, {
      expiresIn: "10m", // i'll set it for 20 minutes but let's say just for now for faster testing
    });
    const refresh_token = jwt.sign(
      payload,
      process.env.REFRESH_TOKEN_SECRET_KEY,
      {
        expiresIn: "7d",
      }
    );
    //  also store the refresh token in db in user_sessions table ok
    await db.insert(userSessionsTable).values({
      user_id: user.user_id,
      refresh_token: refresh_token,
    });

    res.json({
      success: true,
      access_token,
      refresh_token, // should be send in cookies but for now ok
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

async function accessDashboard(req, res) {
  try {
    const user = req.user;
    res.json({
      status: true,
      message: `Welcom ${user.name}`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error,
    });
  }
}

async function refreshAcessToken(req, res) {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        message: `Refresh Token is required for refreshing the Acess Token!`,
      });
    }
    //  validate the refresh token
    // 1. usign refresh token's secret key --> signature is not changed
    const user = jwt.verify(
      refresh_token,
      process.env.REFRESH_TOKEN_SECRET_KEY
    );

    //2. now verify the refresh_token against the db user_sessions refresh_token -> like if maybe revoked or invalidated from there you know
    const [refreshTokenInDB] = await db
      .select({ refresh_token: userSessionsTable.refresh_token })
      .from(userSessionsTable)
      .where(eq(userSessionsTable.user_id, user.user_id));

    if (!refreshTokenInDB || refreshTokenInDB.refresh_token !== refresh_token) {
      return res.status(401).json({
        success: false,
        message: `Invalid or Expired refresh token, Please Login again!`,
      });
    }

    // now create new access token and also update / rotate the the older refresh token in the db

    const payload = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
    };
    const new_access_token = jwt.sign(
      payload,
      process.env.ACESS_TOKEN_SECRET_KEY,
      {
        expiresIn: "10m",
      }
    );
    const new_refresh_token = jwt.sign(
      payload,
      process.env.REFRESH_TOKEN_SECRET_KEY,
      {
        expiresIn: "7d",
      }
    );
    //  also store the refresh token in db in user_sessions table ok
    await db
      .update(userSessionsTable)
      .set({
        refresh_token: new_refresh_token,
      })
      .where(eq(userSessionsTable.user_id, user.user_id));

    res.json({
      success: true,
      access_token: new_access_token,
      refresh_token: new_refresh_token, // should be send in cookies but for now ok
    });
  } catch (error) {
    console.log(`Error while refreshing the token: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error,
    });
  }
}
//  will see them later
async function getAllCurrentlyLoggedInUsers(req, res) {
  try {
    const user_id = req.user.user_id;

    const loggedInUsers = await db
      .select({
        user_id: userSessionsTable.user_id,
      })
      .from(userSessionsTable)
      .where(eq(userSessionsTable.user_id, user_id));

    if (loggedInUsers.length === 0) {
      return res.status(404).json({
        success: true,
        message: `No user is logged in!`,
      });
    }

    return res.json({
      success: true,
      loggedInUsers,
    });
  } catch (error) {
    console.log(`Error while getting all the users ${error.message}`);

    return res.status(500).json({
      success: false,
      error: error,
    });
  }
}

async function logout(req, res) {
  try {
    console.log(`i'm inside the logout function `);

    const user = req.user;
    console.log(user);

    // await db.delete(users).where(eq(users.name, 'Dan'));
    const [deletedUser] = await db
      .delete(userSessionsTable)
      .where(eq(userSessionsTable.user_id, user.user_id))
      .returning({ user_id: userSessionsTable.user_id });

    res.json({
      status: true,
      message: `Succesful Logout with the user_id ${deletedUser.user_id}`,
    });
  } catch (error) {
    console.log(`Error while logout: ${error.message}`);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

async function changePassword(req, res) {
  try {
    const { current_password,new_password } = req.body;
    const user_id = req.user.user_id;
    // Validate input
    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        error:
          "current password and new password are required to reset password",
      });
    }

    // Fetch user (salt + password)
    const [user] = await db
      .select({
        user_id: usersTable.user_id,
        email: usersTable.email,
        salt: usersTable.salt,
        password: usersTable.password,
      })
      .from(usersTable)
      .where(eq(usersTable.user_id, user_id));

    // If user not found
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Invalid email or password", // generic for security
      });
    }

    // Hash provided password with stored salt
    const hashedPassword = createHmac("sha256", user.salt)
      .update(current_password)
      .digest("hex");

    // Compare hashed passwords
    if (hashedPassword !== user.password) {
      return res.status(401).json({
        success: false,
        error: "Invalid password", // generic
      });
    }

    // now Hash new password with stored salt
    const newPassword = createHmac("sha256", user.salt)
      .update(new_password)
      .digest("hex");

    const [result] = await db
      .update(usersTable)
      .set({ password: newPassword })
      .where(eq(usersTable.user_id, user.user_id))
      .returning({ user_id: usersTable.user_id });

    return res.json({
      status: true,
      message: `Password updated successfuly for user: ${result.user_id}`,
    });
  } catch (error) {
    console.log(`Error while reseting password: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: `Internal Server Error`,
    });
  }
}

export {
  signup,
  login,
  accessDashboard,
  refreshAcessToken,
  getAllCurrentlyLoggedInUsers,
  logout,
  changePassword,
};
