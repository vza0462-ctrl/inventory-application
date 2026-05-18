const inventoryModel = require("../model/inventoryModel");
const asyncHandler = require("./asyncHandler");

const homePage = asyncHandler(async (req, res) => {
  const { summary, recentItems } = await inventoryModel.getDashboardSummary();

  res.render("index", {
    recentItems,
    summary,
    title: "Inventory Dashboard",
  });
});

module.exports = {
  homePage,
};
