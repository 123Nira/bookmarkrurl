const mongoose = require("mongoose");

const BookmarkSchema = new mongoose.Schema(
  {
    siteName: {
      type: String,
      required: true,
      trim: true,
    },
    siteUrl: {
      type: String,
      required: true,
      trim: true,
    },
    clickCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    loginId: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("bookmarks", BookmarkSchema);
