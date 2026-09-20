const express = require("express");
const ensureAuthenticated = require("../Middlewares/Auth");
const {
  createBookmark,
  getBookmarks,
  recordBookmarkClick,
  updateBookmark,
  deleteBookmark,
} = require("../Controllers/BookmarkController");

const router = express.Router();

router.use(ensureAuthenticated);
router.post("/", createBookmark);
router.get("/", getBookmarks);
router.post("/:id/click", recordBookmarkClick);
router.put("/:id", updateBookmark);
router.delete("/:id", deleteBookmark);

module.exports = router;
