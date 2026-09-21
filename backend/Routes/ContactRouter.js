const express = require("express");
const { sendContactMessage } = require("../Controllers/ContactController");
const { contactValidation } = require("../Middlewares/AuthValidation");

const router = express.Router();

router.post("/", contactValidation, sendContactMessage);

module.exports = router;
