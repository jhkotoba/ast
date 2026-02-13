class HttpError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

class UnauthorizedError extends HttpError {
  constructor(message = "Unauthorized") {
    super(401, "UNAUTHORIZED", message);
  }
}

class NotFoundError extends HttpError {
  constructor(message = "Not Found") {
    super(404, "NOT_FOUND", message);
  }
}

class ValidationError extends HttpError {
  constructor(message = "Invalid request", fields = []) {
    super(400, "VALIDATION_ERROR", message, fields);
  }
}

module.exports = {
  HttpError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
};
