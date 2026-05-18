const path = require("node:path");
const express = require("express");
const router = require("./routes");

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.locals.formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(Number(value ?? 0));

app.locals.formatDate = (value) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", router);

app.use((req, res) => {
  res.status(404).render("error", {
    error: { message: "Page not found.", status: 404 },
    title: "Not Found",
  });
});

app.use((error, req, res, next) => {
  const status = error.status ?? 500;

  if (res.headersSent) {
    return next(error);
  }

  res.status(status).render("error", {
    error: {
      message: error.message ?? "Something went wrong.",
      stack: process.env.NODE_ENV === "development" ? error.stack : null,
      status,
    },
    title: "Error",
  });
});

app.listen(port, () => {
  console.log(`Inventory app is listening on http://localhost:${port}`);
});
