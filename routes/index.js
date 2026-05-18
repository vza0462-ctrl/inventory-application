const express = require("express");
const { categoryRules, idParamRules, itemRules, userRules } = require("../validate/inventoryValidators");
const { ensureValidIdParam } = require("../validate/validationHelpers");
const categoryController = require("../controllers/categoryController");
const indexController = require("../controllers/indexController");
const itemController = require("../controllers/itemController");
const userController = require("../controllers/userController");

const router = express.Router();

router.get("/", indexController.homePage);

router.get("/categories", categoryController.listCategories);
router.get("/categories/new", categoryController.createCategoryGet);
router.post("/categories/new", categoryRules, categoryController.createCategoryPost);
router.get("/categories/:id", idParamRules, ensureValidIdParam, categoryController.categoryDetail);
router.get("/categories/:id/edit", idParamRules, ensureValidIdParam, categoryController.updateCategoryGet);
router.post("/categories/:id/edit", [...idParamRules, ensureValidIdParam, ...categoryRules], categoryController.updateCategoryPost);
router.get("/categories/:id/delete", idParamRules, ensureValidIdParam, categoryController.deleteCategoryGet);
router.post("/categories/:id/delete", idParamRules, ensureValidIdParam, categoryController.deleteCategoryPost);

router.get("/items", itemController.listItems);
router.get("/items/new", itemController.createItemGet);
router.post("/items/new", itemRules, itemController.createItemPost);
router.get("/items/:id", idParamRules, ensureValidIdParam, itemController.itemDetail);
router.get("/items/:id/edit", idParamRules, ensureValidIdParam, itemController.updateItemGet);
router.post("/items/:id/edit", [...idParamRules, ensureValidIdParam, ...itemRules], itemController.updateItemPost);
router.get("/items/:id/delete", idParamRules, ensureValidIdParam, itemController.deleteItemGet);
router.post("/items/:id/delete", idParamRules, ensureValidIdParam, itemController.deleteItemPost);

router.get("/staff", userController.listUsers);
router.get("/staff/new", userController.createUserGet);
router.post("/staff/new", userRules, userController.createUserPost);
router.get("/staff/:id", idParamRules, ensureValidIdParam, userController.userDetail);
router.get("/staff/:id/edit", idParamRules, ensureValidIdParam, userController.updateUserGet);
router.post("/staff/:id/edit", [...idParamRules, ensureValidIdParam, ...userRules], userController.updateUserPost);
router.get("/staff/:id/delete", idParamRules, ensureValidIdParam, userController.deleteUserGet);
router.post("/staff/:id/delete", idParamRules, ensureValidIdParam, userController.deleteUserPost);

module.exports = router;
