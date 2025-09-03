import express from "express";
const app = express();
import "dotenv/config";
import logger from "./middlewares/logger_middleware.js";
import { router as authRouter } from "./routes/auth.routes.js";
import { router as paymentRouter } from "./routes/payments.routes.js";
const PORT = process.env.PORT ?? 3000;

//  middlewares
app.use(express.json());
app.use(logger);

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: `Successfully Running Alina!`,
  });
});

app.use("/auth", authRouter);
app.use("/payment",paymentRouter)

app.listen(PORT, () => {
  console.log(`Server is Up and Running on the Port: ${PORT}`);
});
