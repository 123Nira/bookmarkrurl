const crypto = require("crypto");

const algorithm = "aes-256-gcm";
const key = crypto
  .createHash("sha256")
  .update(process.env.BOOKMARK_ENCRYPTION_KEY || process.env.JWT_SECRET || "")
  .digest();
const prefix = "enc:v1:";

const encryptBookmarkPassword = (password) => {
  if (!password) return password;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(password, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${prefix}${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
};

const decryptBookmarkPassword = (password) => {
  if (!password || !password.startsWith(prefix)) return password;

  try {
    const [ivValue, authTagValue, encryptedValue] = password
      .slice(prefix.length)
      .split(":");
    const decipher = crypto.createDecipheriv(
      algorithm,
      key,
      Buffer.from(ivValue, "base64"),
    );
    decipher.setAuthTag(Buffer.from(authTagValue, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return "";
  }
};

const decryptBookmark = (bookmark) => {
  const plainBookmark = bookmark.toObject ? bookmark.toObject() : bookmark;
  return {
    ...plainBookmark,
    password: decryptBookmarkPassword(plainBookmark.password),
  };
};

module.exports = {
  decryptBookmark,
  encryptBookmarkPassword,
};
