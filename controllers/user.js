import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

import {User, Resident, Specialty, UserRole, UserType, UserStatus} from "../models/index.js";

const JWT_SECRET = process.env.JWT_SECRET;
const ALLOWED_EMAIL_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || "pih.org";

/* -------------------------------------------------------
   Helper: generate JWT
------------------------------------------------------- */
function generateToken(user) {
    console.log(user)
    return jwt.sign(
        {
            id: user.user_id,
            email: user.email,
            role: user.role_id,
            user_type: user.user_type_id,
            resident_id: user.resident?.resident_id
        },
        JWT_SECRET,
        { expiresIn: "7d" }
    );
}

/* -------------------------------------------------------
   Create User (Local Signup)
------------------------------------------------------- */
export const createUser = async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            password,
            user_type,
            role,
            phone,
            specialty_id,
            status_id,
            grade,
        } = req.body;

        // Validate email domain if staff login uses company domain
        const domain = email.split("@")[1];
        if (domain !== ALLOWED_EMAIL_DOMAIN) {
            return res.status(400).json({
                error: `Staff email must be from domain ${ALLOWED_EMAIL_DOMAIN}`,
            });
        }

        // Check if user already exists
        const existing = await User.findOne({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: "Email already registered" });
        }

        // Hash password
        const hashed = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            first_name,
            last_name,
            email,
            status_id: status_id || 1,
            password_hash: hashed,
            user_type_id: user_type || 1,
            role_id: role || 1,
            auth_provider: "local",
        });

        // If user is a resident → create Resident profile
        if (user.toJSON().user_type_id === 1) {
            await Resident.create({
                user_id: user.toJSON().user_id,
                first_name,
                last_name,
                phone: phone || null,
                specialty_id: specialty_id || null,
                grade: grade || 1,
            });
        }

        return res.status(201).json({ message: "User created", user });
    } catch (err) {
        console.error("createUser error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/* -------------------------------------------------------
   Login (Local)
------------------------------------------------------- */
export const loginUser = async (req, res) => {
    try {
        const { email, password, two_factor_token } = req.body;

        const user = await User.scope("withPassword").findOne({ where: { email }, include: [{ model: Resident, as: "resident", attributes: ["resident_id"]}] });

        if (!user || user.is_disabled) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // If 2FA enabled → verify TOTP
        if (user.two_factor_enabled) {
            if (!two_factor_token) {
                return res.status(401).json({ error: "2FA token required" });
            }

            const verified = speakeasy.totp.verify({
                secret: user.two_factor_secret,
                encoding: "base32",
                token: two_factor_token,
            });

            if (!verified) {
                return res.status(401).json({ error: "Invalid 2FA code" });
            }
        }

        // Update last login
        user.last_login = new Date();
        await user.save();

        const token = generateToken(user);
        const safeUser = user.toJSON();
        delete safeUser.password_hash;

        return res.json({ token, safeUser });
    } catch (err) {
        console.error("loginUser error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};


   // Start 2FA Setup (Generate QR Code)

export const enable2FA = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);

        if (!user) return res.status(404).json({ error: "User not found" });

        const secret = speakeasy.generateSecret({
            name: `ZLLibrary (${user.email})`,
        });

        // Save secret temporarily — 2FA not enabled until verified
        user.two_factor_secret = secret.base32;
        await user.save();

        const qrImage = await QRCode.toDataURL(secret.otpauth_url);

        return res.json({
            message: "Scan this QR code with Google Authenticator",
            qrImage,
            secret: secret.base32,
        });
    } catch (err) {
        console.error("enable2FA error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/* -------------------------------------------------------
   Verify 2FA Code — Finish Setup
------------------------------------------------------- */
export const verify2FA = async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findByPk(req.user.id);

        const verified = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            token,
            encoding: "base32",
        });

        if (!verified) {
            return res.status(400).json({ error: "Invalid 2FA token" });
        }

        user.two_factor_enabled = true;
        await user.save();

        return res.json({ message: "2FA enabled successfully" });
    } catch (err) {
        console.error("verify2FA error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/* -------------------------------------------------------
   Disable 2FA
------------------------------------------------------- */
export const disable2FA = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        user.two_factor_enabled = false;
        user.two_factor_secret = null;
        await user.save();

        return res.json({ message: "2FA disabled" });
    } catch (err) {
        console.error("disable2FA error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/* -------------------------------------------------------
   Update User (name, role, password, etc.)
------------------------------------------------------- */
export const updateUser = async (req, res) => {
    try {
        const { first_name, last_name, role, password } = req.body;

        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        if (first_name) user.first_name = first_name;
        if (last_name) user.last_name = last_name;
        if (role) user.role = role;

        if (password) {
            user.password_hash = await bcrypt.hash(password, 10);
        }

        await user.save();
        return res.json({ message: "User updated", user });
    } catch (err) {
        console.error("updateUser error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/* -------------------------------------------------------
   Soft Delete User (disable login)
------------------------------------------------------- */
export const disableUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) return res.status(404).json({ error: "User not found" });

        user.is_disabled = true;
        await user.save();

        return res.json({ message: "User disabled" });
    } catch (err) {
        console.error("disableUser error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/* -------------------------------------------------------
   Get All Users (with optional filters)
------------------------------------------------------- */

export const getAllUsers = async (req, res) => {
    try {
        // Parse pagination parameters from query
        let page = parseInt(req.query.page) || 1;    // default page 1
        let limit = parseInt(req.query.limit) || 10; // default 10 per page
        let offset = (page - 1) * limit;

        // Optional filters
        const { role_id, status_id, user_type_id } = req.query;
        let whereClause = {};
        if (role_id) whereClause.role_id = role_id;
        if (status_id) whereClause.status_id = status_id;
        if (user_type_id) whereClause.user_type_id = user_type_id;

        // Fetch users with pagination and associations
        const { count, rows } = await User.findAndCountAll({
            where: whereClause,
            include: [
                { model: UserRole, as: "role" },
                { model: UserStatus, as: "status" },
                { model: UserType, as: "userType" },
                { model: Resident, as: "resident", include: [{ model: Specialty }] }
            ],
            limit,
            offset,
            order: [["created_at", "DESC"]]
        });

        // Total pages
        const totalPages = Math.ceil(count / limit);

        res.json({
            page,
            limit,
            totalItems: count,
            totalPages,
            users: rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching users", error: error.message });
    }
};

