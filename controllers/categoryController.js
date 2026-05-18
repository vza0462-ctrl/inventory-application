const inventoryModel = require("../model/inventoryModel");
const { getValidationState } = require("../validate/validationHelpers");
const asyncHandler = require("./asyncHandler");

function makeNotFoundError(message) {
  const error = new Error(message);
  error.status = 404;
  return error;
}

async function renderCategoryForm(res, options) {
  res.render("category/form", {
    actionPath: options.actionPath,
    category: options.category,
    errorList: options.errorList,
    errorsByField: options.errorsByField,
    submitLabel: options.submitLabel,
    title: options.title,
  });
}

const listCategories = asyncHandler(async (req, res) => {
  const categories = await inventoryModel.getCategoryList();

  res.render("category/list", {
    categories,
    title: "Categories",
  });
});

const categoryDetail = asyncHandler(async (req, res, next) => {
  const detail = await inventoryModel.getCategoryDetail(req.params.id);

  if (!detail) {
    return next(makeNotFoundError("Category not found."));
  }

  res.render("category/detail", {
    items: detail.items,
    category: detail.category,
    title: detail.category.name,
  });
});

const createCategoryGet = asyncHandler(async (req, res) => {
  await renderCategoryForm(res, {
    actionPath: "/categories/new",
    category: { description: "", name: "" },
    errorList: [],
    errorsByField: {},
    submitLabel: "Create category",
    title: "New Category",
  });
});

const createCategoryPost = [
  asyncHandler(async (req, res) => {
    const validation = getValidationState(req);
    const category = {
      description: req.body.description?.trim() ?? "",
      name: req.body.name?.trim() ?? "",
    };

    if (validation.hasErrors) {
      return renderCategoryForm(res, {
        actionPath: "/categories/new",
        category,
        errorList: validation.errorList,
        errorsByField: validation.errorsByField,
        submitLabel: "Create category",
        title: "New Category",
      });
    }

    try {
      const result = await inventoryModel.createCategory(category);
      return res.redirect(`/categories/${result.id}`);
    } catch (error) {
      if (error.code === "23505") {
        return renderCategoryForm(res, {
          actionPath: "/categories/new",
          category,
          errorList: [{ msg: "Category name must be unique." }],
          errorsByField: { name: "Category name must be unique." },
          submitLabel: "Create category",
          title: "New Category",
        });
      }

      throw error;
    }
  }),
];

const updateCategoryGet = asyncHandler(async (req, res, next) => {
  const category = await inventoryModel.getCategoryById(req.params.id);

  if (!category) {
    return next(makeNotFoundError("Category not found."));
  }

  await renderCategoryForm(res, {
    actionPath: `/categories/${req.params.id}/edit`,
    category,
    errorList: [],
    errorsByField: {},
    submitLabel: "Save category",
    title: `Edit ${category.name}`,
  });
});

const updateCategoryPost = [
  asyncHandler(async (req, res, next) => {
    const category = {
      description: req.body.description?.trim() ?? "",
      name: req.body.name?.trim() ?? "",
    };
    const validation = getValidationState(req);

    if (validation.hasErrors) {
      return renderCategoryForm(res, {
        actionPath: `/categories/${req.params.id}/edit`,
        category: { ...category, id: Number(req.params.id) },
        errorList: validation.errorList,
        errorsByField: validation.errorsByField,
        submitLabel: "Save category",
        title: `Edit ${category.name || "Category"}`,
      });
    }

    try {
      const result = await inventoryModel.updateCategory(req.params.id, category);

      if (!result) {
        return next(makeNotFoundError("Category not found."));
      }

      return res.redirect(`/categories/${result.id}`);
    } catch (error) {
      if (error.code === "23505") {
        return renderCategoryForm(res, {
          actionPath: `/categories/${req.params.id}/edit`,
          category: { ...category, id: Number(req.params.id) },
          errorList: [{ msg: "Category name must be unique." }],
          errorsByField: { name: "Category name must be unique." },
          submitLabel: "Save category",
          title: `Edit ${category.name || "Category"}`,
        });
      }

      throw error;
    }
  }),
];

const deleteCategoryGet = asyncHandler(async (req, res, next) => {
  const detail = await inventoryModel.getCategoryDeleteData(req.params.id);

  if (!detail) {
    return next(makeNotFoundError("Category not found."));
  }

  res.render("category/delete", {
    canDelete: detail.canDelete,
    category: detail.category,
    items: detail.items,
    title: `Delete ${detail.category.name}`,
  });
});

const deleteCategoryPost = asyncHandler(async (req, res, next) => {
  const detail = await inventoryModel.getCategoryDeleteData(req.params.id);

  if (!detail) {
    return next(makeNotFoundError("Category not found."));
  }

  if (!detail.canDelete) {
    return res.render("category/delete", {
      canDelete: false,
      category: detail.category,
      items: detail.items,
      title: `Delete ${detail.category.name}`,
    });
  }

  await inventoryModel.deleteCategory(req.params.id);
  res.redirect("/categories");
});

module.exports = {
  categoryDetail,
  createCategoryGet,
  createCategoryPost,
  deleteCategoryGet,
  deleteCategoryPost,
  listCategories,
  updateCategoryGet,
  updateCategoryPost,
};
