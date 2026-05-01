import app from "./app.js";
import dotenv from "dotenv";
import { connectDB } from "./utils/db.js";
import { connectKafka } from "./producer.js";

dotenv.config();

connectKafka();

connectDB().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(
      `Job service is running on http://localhost:${process.env.PORT}`
    );
  });
});
