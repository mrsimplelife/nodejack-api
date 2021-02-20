const jwt = require("jsonwebtoken");
const { verifyToken, apiLimiter, speedLimiter } = require("./middlewares");
const { Domain, User, Post, Hashtag } = require("../models");
const router = require("express").Router();
const cors = require("cors");
const url = require("url");

router.use(async (req, res, next) => {
  const domain = await Domain.findOne({
    // where: { host: url.parse(req.get("origin"))?.host },
    where: { host: url.parse(req.get("origin")).host },
  });
  if (domain) {
    cors({
      origin: true,
      credentials: true,
    })(req, res, next);
  } else {
    next();
  }
});
router.use(speedLimiter);
router.use(apiLimiter);
router.post("/token", async (req, res) => {
  const { clientSecret } = req.body;
  try {
    const domain = await Domain.findOne({
      where: { clientSecret },
      include: {
        model: User,
        attribute: ["nick", "id"],
      },
    });
    if (!domain) {
      return res.status(401).json({
        code: 401,
        message: "등록되지 않은 도메인입니다. 먼저 도메인을 등록하세요",
      });
    }
    const token = jwt.sign(
      {
        id: domain.User.id,
        nick: domain.User.nick,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1m", // 1분
        issuer: "nodejack",
      }
    );
    return res.json({
      code: 200,
      message: "Issued Token",
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: "Server Error",
    });
  }
});

router.get("/test", verifyToken, (req, res) => {
  res.json(req.decoded);
});

router.get("/posts/my", verifyToken, (req, res) => {
  Post.findAll({
    where: { UserId: req.decoded.id },
  })
    .then((posts) => {
      return res.json({
        code: 200,
        payload: posts,
      });
    })
    .catch((error) => {
      console.log(error);
      return res.status(500).json({
        code: 500,
        message: "server error",
      });
    });
});
router.get("/posts/hashtag/:title", verifyToken, async (req, res) => {
  try {
    const hashtag = await Hashtag.findOne({
      where: { title: req.params.title },
    });
    if (!hashtag) {
      return res.status(404).json({
        code: 404,
        message: "no results",
      });
    }
    const posts = await hashtag.getPosts();
    return res.json({
      code: 200,
      payload: posts,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      code: 500,
    });
  }
});
module.exports = router;
