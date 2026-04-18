import app from "./app.js";
import { env } from "./config/env.js";

if (!process.env.VERCEL) {
  app.listen(env.PORT, () => {
    console.log(`Backend listening on :${env.PORT}`);
  });
}

export default app;
