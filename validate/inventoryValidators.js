const { body, param } = require("express-validator");

const idParamRules = [
  param("id")
    .trim()
    .isInt({ min: 1 })
    .withMessage("The requested record id is invalid.")
    .toInt(),
];

const categoryRules = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Category name must be between 2 and 100 characters."),
  body("description")
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("Category description must be between 10 and 500 characters."),
];

const userRules = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage("Staff username must be between 3 and 255 characters.")
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage("Staff username can only contain letters, numbers, dots, dashes, and underscores."),
];

const itemRules = [
  body("itemname")
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage("Item name must be between 2 and 255 characters."),
  body("description")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Item description must be between 10 and 1000 characters."),
  body("sku")
    .trim()
    .toUpperCase()
    .matches(/^[A-Z0-9-]{4,40}$/)
    .withMessage("SKU must be 4 to 40 characters using letters, numbers, or dashes."),
  body("price")
    .trim()
    .isFloat({ min: 0 })
    .withMessage("Price must be a number equal to or greater than 0.")
    .toFloat(),
  body("quantity")
    .trim()
    .isInt({ min: 0 })
    .withMessage("Quantity must be a whole number equal to or greater than 0.")
    .toInt(),
  body("category_id")
    .trim()
    .isInt({ min: 1 })
    .withMessage("Choose a valid category.")
    .toInt(),
  body("user_id")
    .trim()
    .isInt({ min: 1 })
    .withMessage("Choose a valid staff owner.")
    .toInt(),
];

module.exports = {
  categoryRules,
  idParamRules,
  itemRules,
  userRules,
};
