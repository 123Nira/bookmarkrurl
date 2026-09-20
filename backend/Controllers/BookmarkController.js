const BookmarkModel = require("../Models/Bookmark");

const normalizeUrl = (url) => url.toLowerCase().replace(/\/+$/, "");
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const exactMatch = (value) => new RegExp(`^${escapeRegex(value)}$`, "i");
const urlMatch = (value) =>
  new RegExp(`^${escapeRegex(normalizeUrl(value))}\\/*$`, "i");

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
      password,
      userId: req.user._id,
    });

    res.status(201).json({
      message: "Bookmark saved successfully",
      success: true,
      bookmark,
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
    const bookmarks = await BookmarkModel.find({ userId: req.user._id }).sort({
      clickCount: -1,
      createdAt: -1,
    });

    res.status(200).json(bookmarks);
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
    const siteName = req.body.siteName?.trim();
    const siteUrl = req.body.siteUrl?.trim();
    const { loginId, password } = req.body;

    if (!siteName || !siteUrl) {
      return res.status(400).json({
        message: "siteName and siteUrl are required",
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

    const bookmark = await BookmarkModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { siteName, siteUrl, loginId, password },
      { new: true, runValidators: true },
    );

    if (!bookmark) {
      return res.status(404).json({
        message: "Bookmark not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Bookmark updated successfully",
      success: true,
      bookmark,
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
