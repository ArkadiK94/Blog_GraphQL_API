const express = require("express");
const {body} = require("express-validator");

const feedControllers = require("../controllers/feed");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get("/posts", feedControllers.getPosts);

router.post("/post",isAuth,
  [
    body("title").isLength({min:5}).trim(),
    body("content").isLength({min:5}).trim()
  ]
  , feedControllers.createPost
);

router.get("/post/:postId",isAuth, feedControllers.getPost);

router.put("/post/:postId",isAuth,
  [
    body("title").isLength({min:5}).trim(),
    body("content").isLength({min:5}).trim()
  ]
  , feedControllers.editPost
);

router.delete("/post/:postId", isAuth, feedControllers.deletePost);


module.exports = router;