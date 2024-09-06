require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const express = require("express");
const { urlencoded, json } = require("body-parser");

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(json());
app.use(urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

//routes import
const userRouter = require("./routes/user.routes");
const commonRouter = require("./routes/common.routes");
const roleRouter = require("./routes/role.routes");

//routers declaration
app.use("/api/users", userRouter);
app.use("/api/view", commonRouter);
app.use("/api/roles", roleRouter);

module.exports = app;
