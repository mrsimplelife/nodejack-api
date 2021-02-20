const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(403).send("no loggedIn");
  }
};
exports.isNotLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    next();
  } else {
    const message = encodeURIComponent("you aleady logged in");
    res.redirect(`/?error=${message}`);
  }
};
exports.verifyToken = (req, res, next) => {
  try {
    req.decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(419).json({
        code: 419,
        message: "expired token",
      });
    }
    return res.status(401).json({
      code: 401,
      message: "invalid token",
    });
  }
};
exports.apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  // delayMs: 1000,
  handler(req, res) {
    res.status(this.statusCode).json({
      code: this.statusCode,
      message: "only 10 times in a minute",
    });
  },
});
exports.speedLimiter = slowDown({
  windowMs: 60 * 1000,
  delayAfter: 1,
  delayMs: 500,
});
exports.deprecated = (req, res) => {
  res.status(410).json({
    code: 410,
    message: "use new version",
  });
};
