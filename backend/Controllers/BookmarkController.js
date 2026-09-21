const BookmarkModel = require("../Models/Bookmark");
const {
  decryptBookmark,
  encryptBookmarkPassword,
} = require("../utils/bookmarkPassword");

const normalizeUrl = (url) => url.toLowerCase().replace(/\/+$/, "");
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const exactMatch = (value) => new RegExp(`^${escapeRegex(value)}$`, "i");
const urlMatch = (value) =>
  new RegExp(`^${escapeRegex(normalizeUrl(value))}\\/*$`, "i");
const defaultBookmarks = [
  { siteName: "Google", siteUrl: "https://www.google.com" },
  { siteName: "YouTube", siteUrl: "https://www.youtube.com" },
  { siteName: "GitHub", siteUrl: "https://github.com" },
  { siteName: "ChatGPT", siteUrl: "https://chatgpt.com" },
  { siteName: "Gmail", siteUrl: "https://mail.google.com" },
];

const findDuplicate = (userId, siteName, siteUrl, excludeId) => {
  const query = {
    userId,
    $or: [{ siteName: exactMatch(siteName) }, { siteUrl: urlMatch(siteUrl) }],
  };

  if (excludeId) query._id = { $ne: excludeId };
  return BookmarkModel.findOne(query);
};

const createBookmark = async (req, res) => {
  try {
    const siteName = req.body.siteName?.trim();
    const siteUrl = req.body.siteUrl?.trim();
    const { loginId, password } = req.body;

    if (!siteName || !siteUrl) {
      return res.status(400).json({
        message: "siteName and siteUrl are required",
        success: false,
      });
    }

    const duplicate = await findDuplicate(req.user._id, siteName, siteUrl);
    if (duplicate) {
      return res.status(409).json({
        message:
          duplicate.siteUrl.toLowerCase().replace(/\/+$/, "") ===
          normalizeUrl(siteUrl)
            ? "This URL already exists"
            : "This site name already exists",
        success: false,
      });
    }

    const bookmark = await BookmarkModel.create({
      siteName,
      siteUrl,
      loginId,
      password: encryptBookmarkPassword(password),
      userId: req.user._id,
    });

    await BookmarkModel.deleteMany({
      userId: req.user._id,
      isDefault: true,
    });

    res.status(201).json({
      message: "Bookmark saved successfully",
      success: true,
      bookmark: decryptBookmark(bookmark),
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const getBookmarks = async (req, res) => {
  try {
    let bookmarks = await BookmarkModel.find({ userId: req.user._id }).sort({
      clickCount: -1,
      createdAt: -1,
    });

    if (!bookmarks.length) {
      await BookmarkModel.insertMany(
        defaultBookmarks.map((bookmark) => ({
          ...bookmark,
          isDefault: true,
          userId: req.user._id,
        })),
      );
      bookmarks = await BookmarkModel.find({ userId: req.user._id }).sort({
        clickCount: -1,
        createdAt: -1,
      });
    }

    res.status(200).json(bookmarks.map(decryptBookmark));
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const recordBookmarkClick = async (req, res) => {
  try {
    const bookmark = await BookmarkModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $inc: { clickCount: 1 } },
      { new: true, runValidators: true },
    );

    if (!bookmark) {
      return res.status(404).json({
        message: "Bookmark not found",
        success: false,
      });
    }

    res.status(200).json({ bookmark, success: true });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const updateBookmark = async (req, res) => {
  try {
    const currentBookmark = await BookmarkModel.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!currentBookmark) {
      return res.status(404).json({
        message: "Bookmark not found",
        success: false,
      });
    }

    const siteName = Object.prototype.hasOwnProperty.call(req.body, "siteName")
      ? req.body.siteName?.trim()
      : currentBookmark.siteName;
    const siteUrl = Object.prototype.hasOwnProperty.call(req.body, "siteUrl")
      ? req.body.siteUrl?.trim()
      : currentBookmark.siteUrl;

    if (!siteName || !siteUrl) {
      return res.status(400).json({
        message: "A bookmark must have a site name and site URL",
        success: false,
      });
    }

    const duplicate = await findDuplicate(
      req.user._id,
      siteName,
      siteUrl,
      req.params.id,
    );
    if (duplicate) {
      return res.status(409).json({
        message:
          duplicate.siteUrl.toLowerCase().replace(/\/+$/, "") ===
          normalizeUrl(siteUrl)
            ? "This URL already exists"
            : "This site name already exists",
        success: false,
      });
    }

    const updates = { siteName, siteUrl };
    if (Object.prototype.hasOwnProperty.call(req.body, "loginId")) {
      updates.loginId = req.body.loginId;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "password")) {
      updates.password = encryptBookmarkPassword(req.body.password);
    }

    Object.assign(currentBookmark, updates);
    const bookmark = await currentBookmark.save();

    res.status(200).json({
      message: "Bookmark updated successfully",
      success: true,
      bookmark: decryptBookmark(bookmark),
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const deleteBookmark = async (req, res) => {
  try {
    const bookmark = await BookmarkModel.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!bookmark) {
      return res.status(404).json({
        message: "Bookmark not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Bookmark deleted successfully",
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

module.exports = {
  createBookmark,
  getBookmarks,
  recordBookmarkClick,
  updateBookmark,
  deleteBookmark,
};
