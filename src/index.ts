import dotenv from "dotenv";
import app from "./api";
import { startBot } from "./bot";

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API działa na porcie ${PORT}`);
});

startBot();