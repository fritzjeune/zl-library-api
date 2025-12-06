import express from "express";
const router = express.Router();
import {
    addBook,
    updateBook,
    deleteBook,
    getBook,
    getAllBooks,
} from "../controllers/book.js";

// Routes
router.post("/", addBook);
router.put("/:id", updateBook);
router.delete("/:id", deleteBook);
router.get("/:id", getBook);
router.get("/", getAllBooks);

export default router;
