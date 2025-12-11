import express from "express";
const router = express.Router();
import {
    addBook,
    updateBook,
    deleteBook,
    getBook,
    getAllBooks, getAvailableBooks, getLastBorrowedBooks, getMostBorrowedBooks, borrowedBookByResident,
} from "../controllers/book.js";
import {borrowBook} from "../controllers/bookTransaction.js";
import authMiddleware from "../middlewares/auth.js";

// Routes
router.post("/", addBook);
router.put("/:id", updateBook);
router.post("/:book_id", authMiddleware, borrowBook);
router.delete("/:id", deleteBook);
router.get("/borrowed/:resident_id", borrowedBookByResident);
router.get("/common", getMostBorrowedBooks);
router.get("/recents", getLastBorrowedBooks);
router.get("/available", getAvailableBooks);
router.get("/:id", getBook);
router.get("/", getAllBooks);

export default router;
