const express = require("express");
const {body} = require("express-validator");

const authController = require("../controllers/auth");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.post("/signup", 
  [
    body("email").isEmail().trim().normalizeEmail(),
    body("name").not().isEmpty().trim(),
    body("password").isLength({min:5}).trim()
  ],
  authController.postSignup
);

router.post("/login",
  [
    body("email").trim().normalizeEmail(),
    body("name").trim(),
    body("password").trim()
  ],
  authController.postLogin
);

router.get("/status", isAuth, authController.getStatus);

router.put("/status", isAuth, authController.postStatus);

module.exports = router;