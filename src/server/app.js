const path = require("path");
const express = require("express");

const { createPrismaAccountStore } = require("./db/accountStore");
const { createPrismaTagStore } = require("./db/tagStore");
const { createPrismaTemplateStore } = require("./db/templateStore");
const { createPrismaTransactionStore } = require("./db/transactionStore");
const { createPrismaSubscriptionStore } = require("./db/subscriptionStore");
const { prisma } = require("./db/prisma");
const { errorHandler } = require("./errors/errorHandler");
const { NotFoundError } = require("./errors/httpErrors");
const { requireAuth } = require("./middlewares/requireAuth");
const createAccountsRouter = require("./routes/accounts");
const createSubscriptionsRouter = require("./routes/subscriptions");
const createTagsRouter = require("./routes/tags");
const createTemplatesRouter = require("./routes/templates");
const createTransactionsRouter = require("./routes/transactions");
const healthRouter = require("./routes/health");

function createApp(options = {}) {
  const app = express();
  const accountStore = options.accountStore || createPrismaAccountStore(prisma);
  const tagStore = options.tagStore || createPrismaTagStore(prisma);
  const templateStore = options.templateStore || createPrismaTemplateStore(prisma);
  const transactionStore = options.transactionStore || createPrismaTransactionStore(prisma);
  const subscriptionStore = options.subscriptionStore || createPrismaSubscriptionStore(prisma);
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

  app.get("/tag/tag", (req, res) => {
    res.sendFile(path.join(publicRoot, "view", "tag", "tag.html"));
  });

  app.get("/template/template", (req, res) => {
    res.sendFile(path.join(publicRoot, "view", "template", "template.html"));
  });

  app.get("/transaction/create-list", (req, res) => {
    res.sendFile(path.join(publicRoot, "view", "transaction", "create-list.html"));
  });

  app.get("/transaction/update-delete", (req, res) => {
    res.sendFile(path.join(publicRoot, "view", "transaction", "update-delete.html"));
  });

  app.get("/subscription/subscription", (req, res) => {
    res.sendFile(path.join(publicRoot, "view", "subscription", "subscription.html"));
  });

  app.use("/health", healthRouter);

  app.use("/api", requireAuth);
  app.use("/api/accounts", createAccountsRouter({ accountStore }));
  app.use("/api/tags", createTagsRouter({ tagStore }));
  app.use("/api/transaction_templates", createTemplatesRouter({ templateStore }));
  app.use("/api/transactions", createTransactionsRouter({ transactionStore }));
  app.use("/api/subscriptions", createSubscriptionsRouter({ subscriptionStore }));

  app.use((req, res, next) => {
    next(new NotFoundError("Not Found"));
  });

  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp,
};
