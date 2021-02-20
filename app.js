const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const morgan = require("morgan");
const session = require("express-session");
const nunjucks = require("nunjucks");
const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config();

const indexRouter = require("./routes");
const authRouter = require("./routes/auth");
const v1Router = require("./routes/v1");
const v2Router = require("./routes/v2");

const { sequelize } = require("./models");
const passportConfig = require("./passport");

const app = express();
passportConfig();

app.set("port", process.env.PORT || 3001);
app.set("view engine", "html");
nunjucks.configure("views", { express: app, watch: true });

sequelize
  .sync({ force: false })
  .then(() => {
    console.log("connected");
  })
  .catch((err) => {
    console.error(err);
  });

app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
      httpOnly: true,
      secure: false,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/v1", v1Router);
app.use("/v2", v2Router);

app.use((req, res, next) => {
  const err = new Error(`${req.method} ${req.url}라우터가 없습니다.`);
  err.status = 404;
  next(err);
});
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== "production" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});
app.listen(app.get("port"), () => {
  console.log(`http://localhost:${app.get("port")}`);
});
