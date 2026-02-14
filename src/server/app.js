const path = require("path");
const express = require("express");

const { createPrismaAccountStore } = require("./db/accountStore");
const { prisma } = require("./db/prisma");
const { errorHandler } = require("./errors/errorHandler");
const { NotFoundError } = require("./errors/httpErrors");
const { requireAuth } = require("./middlewares/requireAuth");
const createAccountsRouter = require("./routes/accounts");
const healthRouter = require("./routes/health");

function createApp(options = {}) {
  const app = express();
  const accountStore = options.accountStore || createPrismaAccountStore(prisma);
  const publicRoot = path.resolve(__dirname, "../public");

  app.use(express.json());

  app.use("/assets", express.static(path.join(publicRoot, "assets")));
  app.use("/script", express.static(path.join(publicRoot, "assets", "script")));
  app.use("/style", express.static(path.join(publicRoot, "assets", "style")));
  app.use("/view", express.static(path.join(publicRoot, "view")));

  app.get("/", (req, res) => {
    res.sendFile(path.join(publicRoot, "view", "index.html"));
  });

  app.get("/account/account", (req, res) => {
    res.sendFile(path.join(publicRoot, "view", "account", "account.html"));
  });

  app.use("/health", healthRouter);

  app.use("/api", requireAuth);
  app.use("/api/accounts", createAccountsRouter({ accountStore }));

  app.use((req, res, next) => {
    next(new NotFoundError("Not Found"));
  });

  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp,
};