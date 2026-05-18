const inventoryModel = require("../model/inventoryModel");
const { getValidationState } = require("../validate/validationHelpers");
const asyncHandler = require("./asyncHandler");

function makeNotFoundError(message) {
  const error = new Error(message);
  error.status = 404;
  return error;
}

async function renderItemForm(res, options) {
  const { categories, users } = await inventoryModel.getFormOptions();

  res.render("item/form", {
    actionPath: options.actionPath,
    categories,
    errorList: options.errorList,
    errorsByField: options.errorsByField,
    item: options.item,
    submitLabel: options.submitLabel,
    title: options.title,
    users,
  });
}

function getItemInput(req) {
  return {
    categoryId: Number(req.body.category_id),
    description: req.body.description?.trim() ?? "",
    itemname: req.body.itemname?.trim() ?? "",
    price: Number(req.body.price),
    quantity: Number(req.body.quantity),
    sku: req.body.sku?.trim().toUpperCase() ?? "",
    userId: Number(req.body.user_id),
  };
}

function getItemFormValues(req) {
  return {
    category_id: Number(req.body.category_id),
    description: req.body.description?.trim() ?? "",
    itemname: req.body.itemname?.trim() ?? "",
    price: req.body.price ?? "",
    quantity: req.body.quantity ?? "",
    sku: req.body.sku?.trim().toUpperCase() ?? "",
    user_id: Number(req.body.user_id),
  };
}

const listItems = asyncHandler(async (req, res) => {
  const search = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const items = await inventoryModel.getItemList(search);

  res.render("item/list", {
    items,
    search,
    title: "Items",
  });
});

const itemDetail = asyncHandler(async (req, res, next) => {
  const item = await inventoryModel.getItemById(req.params.id);

  if (!item) {
    return next(makeNotFoundError("Item not found."));
  }

  res.render("item/detail", {
    item,
    title: item.itemname,
  });
});

const createItemGet = asyncHandler(async (req, res) => {
  await renderItemForm(res, {
    actionPath: "/items/new",
    errorList: [],
    errorsByField: {},
    item: {
      category_id: "",
      description: "",
      itemname: "",
      price: "",
      quantity: "",
      sku: "",
      user_id: "",
    },
    submitLabel: "Create item",
    title: "New Item",
  });
});

const createItemPost = [
  asyncHandler(async (req, res) => {
    const validation = getValidationState(req);
    const itemInput = getItemInput(req);
    const itemFormValues = getItemFormValues(req);

    if (validation.hasErrors) {
      return renderItemForm(res, {
        actionPath: "/items/new",
        errorList: validation.errorList,
        errorsByField: validation.errorsByField,
        item: itemFormValues,
        submitLabel: "Create item",
        title: "New Item",
      });
    }

    try {
      const result = await inventoryModel.createItem(itemInput);
      return res.redirect(`/items/${result.id}`);
    } catch (error) {
      if (error.code === "23505") {
        return renderItemForm(res, {
          actionPath: "/items/new",
          errorList: [{ msg: "SKU must be unique." }],
          errorsByField: { sku: "SKU must be unique." },
          item: itemFormValues,
          submitLabel: "Create item",
          title: "New Item",
        });
      }

      throw error;
    }
  }),
];

const updateItemGet = asyncHandler(async (req, res, next) => {
  const item = await inventoryModel.getItemById(req.params.id);

  if (!item) {
    return next(makeNotFoundError("Item not found."));
  }

  await renderItemForm(res, {
    actionPath: `/items/${req.params.id}/edit`,
    errorList: [],
    errorsByField: {},
    item,
    submitLabel: "Save item",
    title: `Edit ${item.itemname}`,
  });
});

const updateItemPost = [
  asyncHandler(async (req, res, next) => {
    const validation = getValidationState(req);
    const itemInput = getItemInput(req);
    const itemFormValues = {
      ...getItemFormValues(req),
      id: Number(req.params.id),
    };

    if (validation.hasErrors) {
      return renderItemForm(res, {
        actionPath: `/items/${req.params.id}/edit`,
        errorList: validation.errorList,
        errorsByField: validation.errorsByField,
        item: itemFormValues,
        submitLabel: "Save item",
        title: `Edit ${itemFormValues.itemname || "Item"}`,
      });
    }

    try {
      const result = await inventoryModel.updateItem(req.params.id, itemInput);

      if (!result) {
        return next(makeNotFoundError("Item not found."));
      }

      return res.redirect(`/items/${result.id}`);
    } catch (error) {
      if (error.code === "23505") {
        return renderItemForm(res, {
          actionPath: `/items/${req.params.id}/edit`,
          errorList: [{ msg: "SKU must be unique." }],
          errorsByField: { sku: "SKU must be unique." },
          item: itemFormValues,
          submitLabel: "Save item",
          title: `Edit ${itemFormValues.itemname || "Item"}`,
        });
      }

      throw error;
    }
  }),
];

const deleteItemGet = asyncHandler(async (req, res, next) => {
  const item = await inventoryModel.getItemDeleteData(req.params.id);

  if (!item) {
    return next(makeNotFoundError("Item not found."));
  }

  res.render("item/delete", {
    item,
    title: `Delete ${item.itemname}`,
  });
});

const deleteItemPost = asyncHandler(async (req, res, next) => {
  const item = await inventoryModel.getItemDeleteData(req.params.id);

  if (!item) {
    return next(makeNotFoundError("Item not found."));
  }

  await inventoryModel.deleteItem(req.params.id);
  res.redirect("/items");
});

module.exports = {
  createItemGet,
  createItemPost,
  deleteItemGet,
  deleteItemPost,
  itemDetail,
  listItems,
  updateItemGet,
  updateItemPost,
};
