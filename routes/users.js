import express from "express";
import {
  createUser,
  loginUser,
  enable2FA,
  verify2FA,
  disable2FA,
  updateUser,
  disableUser,
  getAllUsers,
} from "../controllers/user.js";

import authMiddleware from "../middlewares/auth.js";

const router = express.Router();

/* -------------------------------------------
   AUTH & ACCOUNT CREATION
------------------------------------------- */

// Create account (local signup)
router.post("/signup", createUser);

// Login (local)
router.post("/login", loginUser);

/* -------------------------------------------
   2FA
------------------------------------------- */

// Start 2FA setup (requires authentication)
router.post("/2fa/setup", authMiddleware, enable2FA);

// Verify & enable 2FA
router.post("/2fa/verify", authMiddleware, verify2FA);

// Disable 2FA
router.post("/2fa/disable", authMiddleware, disable2FA);

/* -------------------------------------------
   USER MANAGEMENT
------------------------------------------- */

// Update user info
router.put("/:id", authMiddleware, updateUser);

// Soft delete user (disable)
router.delete("/:id", authMiddleware, disableUser);

// Get all users (filtered)
router.get("/", authMiddleware, getAllUsers);

// (Optional) Get one user
// router.get("/:id", authMiddleware, getUserById);

/* -------------------------------------------
   OAUTH ROUTES (placeholders)
------------------------------------------- */

// Google OAuth login
router.get("/auth/google", (req, res) => {
  res.json({ message: "Google OAuth not implemented yet" });
});

// Microsoft OAuth login
router.get("/auth/microsoft", (req, res) => {
  res.json({ message: "Microsoft OAuth not implemented yet" });
});

export default router;
