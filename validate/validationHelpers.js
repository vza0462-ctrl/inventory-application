const { validationResult } = require("express-validator");

function getValidationState(req) {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return {
      errorList: [],
      errorsByField: {},
      hasErrors: false,
    };
  }

  const errorList = result.array();
  const errorsByField = {};

  for (const error of errorList) {
    if (!errorsByField[error.path]) {
      errorsByField[error.path] = error.msg;
    }
  }

  return {
    errorList,
    errorsByField,
    hasErrors: true,
  };
}

module.exports = {
  getValidationState,
  ensureValidIdParam(req, res, next) {
    const hasIdError = validationResult(req)
      .array()
      .some((error) => error.path === "id");

    if (hasIdError) {
      const notFoundError = new Error("The requested record id is invalid.");
      notFoundError.status = 404;
      return next(notFoundError);
    }

    return next();
  },
};
