const inventoryModel = require("../model/inventoryModel");
const { getValidationState } = require("../validate/validationHelpers");
const asyncHandler = require("./asyncHandler");

function makeNotFoundError(message) {
  const error = new Error(message);
  error.status = 404;
  return error;
}

async function renderUserForm(res, options) {
  res.render("usernames/form", {
    actionPath: options.actionPath,
    errorList: options.errorList,
    errorsByField: options.errorsByField,
    submitLabel: options.submitLabel,
    title: options.title,
    user: options.user,
  });
}

const listUsers = asyncHandler(async (req, res) => {
  const users = await inventoryModel.getUserList();

  res.render("usernames/list", {
    title: "Staff Owners",
    users,
  });
});

const userDetail = asyncHandler(async (req, res, next) => {
  const detail = await inventoryModel.getUserDetail(req.params.id);

  if (!detail) {
    return next(makeNotFoundError("Staff owner not found."));
  }

  res.render("usernames/detail", {
    items: detail.items,
    title: detail.user.username,
    user: detail.user,
  });
});

const createUserGet = asyncHandler(async (req, res) => {
  await renderUserForm(res, {
    actionPath: "/staff/new",
    errorList: [],
    errorsByField: {},
    submitLabel: "Create staff owner",
    title: "New Staff Owner",
    user: { username: "" },
  });
});

const createUserPost = [
  asyncHandler(async (req, res) => {
    const validation = getValidationState(req);
    const user = {
      username: req.body.username?.trim() ?? "",
    };

    if (validation.hasErrors) {
      return renderUserForm(res, {
        actionPath: "/staff/new",
        errorList: validation.errorList,
        errorsByField: validation.errorsByField,
        submitLabel: "Create staff owner",
        title: "New Staff Owner",
        user,
      });
    }

    try {
      const result = await inventoryModel.createUser(user);
      return res.redirect(`/staff/${result.id}`);
    } catch (error) {
      if (error.code === "23505") {
        return renderUserForm(res, {
          actionPath: "/staff/new",
          errorList: [{ msg: "Staff username must be unique." }],
          errorsByField: { username: "Staff username must be unique." },
          submitLabel: "Create staff owner",
          title: "New Staff Owner",
          user,
        });
      }

      throw error;
    }
  }),
];

const updateUserGet = asyncHandler(async (req, res, next) => {
  const user = await inventoryModel.getUserById(req.params.id);

  if (!user) {
    return next(makeNotFoundError("Staff owner not found."));
  }

  await renderUserForm(res, {
    actionPath: `/staff/${req.params.id}/edit`,
    errorList: [],
    errorsByField: {},
    submitLabel: "Save staff owner",
    title: `Edit ${user.username}`,
    user,
  });
});

const updateUserPost = [
  asyncHandler(async (req, res, next) => {
    const user = {
      username: req.body.username?.trim() ?? "",
    };
    const validation = getValidationState(req);

    if (validation.hasErrors) {
      return renderUserForm(res, {
        actionPath: `/staff/${req.params.id}/edit`,
        errorList: validation.errorList,
        errorsByField: validation.errorsByField,
        submitLabel: "Save staff owner",
        title: `Edit ${user.username || "Staff Owner"}`,
        user: { ...user, id: Number(req.params.id) },
      });
    }

    try {
      const result = await inventoryModel.updateUser(req.params.id, user);

      if (!result) {
        return next(makeNotFoundError("Staff owner not found."));
      }

      return res.redirect(`/staff/${result.id}`);
    } catch (error) {
      if (error.code === "23505") {
        return renderUserForm(res, {
          actionPath: `/staff/${req.params.id}/edit`,
          errorList: [{ msg: "Staff username must be unique." }],
          errorsByField: { username: "Staff username must be unique." },
          submitLabel: "Save staff owner",
          title: `Edit ${user.username || "Staff Owner"}`,
          user: { ...user, id: Number(req.params.id) },
        });
      }

      throw error;
    }
  }),
];

const deleteUserGet = asyncHandler(async (req, res, next) => {
  const detail = await inventoryModel.getUserDeleteData(req.params.id);

  if (!detail) {
    return next(makeNotFoundError("Staff owner not found."));
  }

  res.render("usernames/delete", {
    canDelete: detail.canDelete,
    items: detail.items,
    title: `Delete ${detail.user.username}`,
    user: detail.user,
  });
});

const deleteUserPost = asyncHandler(async (req, res, next) => {
  const detail = await inventoryModel.getUserDeleteData(req.params.id);

  if (!detail) {
    return next(makeNotFoundError("Staff owner not found."));
  }

  if (!detail.canDelete) {
    return res.render("usernames/delete", {
      canDelete: false,
      items: detail.items,
      title: `Delete ${detail.user.username}`,
      user: detail.user,
    });
  }

  await inventoryModel.deleteUser(req.params.id);
  res.redirect("/staff");
});

module.exports = {
  createUserGet,
  createUserPost,
  deleteUserGet,
  deleteUserPost,
  listUsers,
  updateUserGet,
  updateUserPost,
  userDetail,
};
