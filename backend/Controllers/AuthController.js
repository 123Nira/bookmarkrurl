const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const UserModel = require("../Models/User");
const nodemailer = require("nodemailer");

const hashResetToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const sendResetEmail = async (user, resetUrl) => {
  if (!process.env.SMTP_HOST) return false;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: user.email,
    subject: "Reset your bookmarkr password",
    text: `Reset your password using this link. It expires in 15 minutes: ${resetUrl}`,
  });
  return true;
};

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (user) {
      return res.status(409).json({
        message: "User is already exist, you can login",
        success: false,
      });
    }
    const userModel = new UserModel({ name, email, password });
    userModel.password = await bcrypt.hash(password, 10);
    await userModel.save();
    res.status(201).json({
      message: "Signup successfully",
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server errror",
      success: false,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res
        .status(403)
        .json({ message: "Email is not registered", success: false });
    }
    const isPassEqual = await bcrypt.compare(password, user.password);
    if (!isPassEqual) {
      return res
        .status(403)
        .json({ message: "Password is incorrect", success: false });
    }
    const jwtToken = jwt.sign(
      { email: user.email, _id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "5m" },
    );

    res.status(200).json({
      message: "Login Success",
      success: true,
      jwtToken,
      email,
      name: user.name,
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server errror",
      success: false,
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const user = await UserModel.findOne({ email });
    const response = {
      message:
        "If an account exists for that email, reset instructions have been sent.",
      success: true,
    };

    if (!user) return res.status(200).json(response);

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordTokenHash = hashResetToken(resetToken);
    user.resetPasswordExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
    const emailSent = await sendResetEmail(user, resetUrl);

    if (!emailSent && process.env.NODE_ENV !== "production") {
      response.resetUrl = resetUrl;
    }

    return res.status(200).json(response);
  } catch (err) {
    return res.status(500).json({
      message: "Unable to process password reset request",
      success: false,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const password = req.body.password;
    const user = await UserModel.findOne({
      resetPasswordTokenHash: hashResetToken(token),
      resetPasswordExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "This password reset link is invalid or expired.",
        success: false,
      });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();

    return res.status(200).json({
      message: "Password reset successfully. You can now log in.",
      success: true,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Unable to reset password",
      success: false,
    });
  }
};

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
};
