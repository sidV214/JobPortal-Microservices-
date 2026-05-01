import express from "express";
import paymentRoutes from "./routes/payment.js";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/payment", paymentRoutes);

export default app;
