import express from "express";
const router = express.Router();
import { getAllPaymentDetails } from "../controllers/payments.controller.js";
import authorize_role from "../middlewares/authorize_role.middleware.js";
import validate_token from "../middlewares/validate_token_middleware.js";

router.get(
  "/getAllPaymentDetails",
  validate_token,
  authorize_role,
  getAllPaymentDetails
);

export { router };
