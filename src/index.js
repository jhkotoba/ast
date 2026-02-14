const dotenv = require("dotenv");

dotenv.config({ path: process.argv[2] === "dev" ? ".env.dev" : ".env" });
const { createApp } = require("./server/app");

const host = process.env.HOST_NAME || "localhost";
const port = Number(process.env.PORT) || 9001;

const app = createApp();

app.listen(port, () => {
  console.log(`Server running at http://${host}:${port}/`);
});