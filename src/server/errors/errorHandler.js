const { HttpError } = require("./httpErrors");

function errorHandler(err, req, res, next) {
  const status = err instanceof HttpError ? err.status : 500;
  const code = err instanceof HttpError ? err.code : "INTERNAL_ERROR";
  const message =
    err instanceof HttpError
      ? err.message
      : "Internal Server Error";

  const payload = {
    error: {
      code,
      message,
    },
  };

  if (err instanceof HttpError && Array.isArray(err.fields) && err.fields.length > 0) {
    payload.error.fields = err.fields;
  }

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json(payload);
}

module.exports = {
  errorHandler,
};
