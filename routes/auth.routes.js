import express from "express";
const router = express.Router();
import {
  signup,
  login,
  accessDashboard,
  refreshAcessToken,
  getAllCurrentlyLoggedInUsers,
  logout,
  changePassword,
} from "../controllers/auth.controller.js";
import validate_token from "../middlewares/validate_token_middleware.js";
import authorize_role from "../middlewares/authorize_role.middleware.js";

// sign up route
router.post("/signup", signup);

router.post("/login", login);

router.post("/refresh", refreshAcessToken);
router.get("/dashboard", validate_token, accessDashboard);
// now let's impliment these as well Alina
router.get(
  "/currentlyLoggedInUsers",
  validate_token,
  authorize_role,
  getAllCurrentlyLoggedInUsers
);

router.post("/logout", validate_token, logout);

router.patch("/change_password", validate_token, changePassword);

export { router };
