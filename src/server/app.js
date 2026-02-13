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

  app.use(express.json());

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
