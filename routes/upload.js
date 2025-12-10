import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// ensure upload dir exists
const uploadDir = "uploads/books";
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext);
        const safeName = base.replace(/\s+/g, "-").toLowerCase();
        cb(null, `${safeName}-${Date.now()}${ext}`);
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Only images allowed"));
        }
        cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

router.post("/", upload.single("image"), (req, res) => {
    console.log(req.file)
    if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
    }

    const relativePath = `/books/${req.file.filename}`;

    res.status(201).json({
        image_path: relativePath,
    });
});

export default router;
