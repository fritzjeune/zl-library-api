import express from "express";
import {
    borrowBook ,
    returnBook,
    reportLostBook,
    extendBorrow,
    getTransactionById,
    getAllTransactions,
    getActiveBorrowedBooks,
    getResidentBorrowHistory,
    getMostBorrowedBooks,
    getLastBorrowedBooks,
    getAvailableBooks,
    getActiveResidents
} from "../controllers/bookTransaction.js";

import authMiddleware from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

/**
 * STAFF / ADMIN ONLY ROUTES
 * These routes modify transactions (borrow, return, lost, extend)
 */

// Borrow a book
router.post(
    "/borrow",
    authMiddleware,
    // authorize(["admin", "super_admin", "librarian", "staff"]),
    borrowBook
);

// Return a book
router.post(
    "/return/:transaction_id",
    authMiddleware,
    // authorize(["admin", "super_admin", "librarian", "staff"]),
    returnBook
);

// Mark a book as lost
router.post(
    "/lost/:transaction_id",
    authMiddleware,
    authorize(["admin", "super_admin"]),
    reportLostBook
);

// Extend borrowing period
router.post(
    "/extend/:transaction_id",
    authMiddleware,
    authorize(["admin", "super_admin", "librarian", "staff"]),
    extendBorrow
);

/**
 * PUBLIC (Authenticated) FETCH ROUTES
 * These allow staff or residents to view data.
 */

// Get single transaction
router.get(
    "/:transaction_id",
    authMiddleware,
    getTransactionById
);

// Get all transactions with filters + pagination
router.get(
    "/",
    authMiddleware,
    getAllTransactions
);

// Get all currently borrowed books (active)
router.get(
    "/stats/active-borrows",
    authMiddleware,
    authorize(["admin", "super_admin", "librarian", "staff"]),
    getActiveBorrowedBooks
);

// Get borrow history of a specific resident
router.get(
    "/residents/:resident_id/history",
    authMiddleware,
    getResidentBorrowHistory
);

// Most borrowed books (top statistics)
router.get(
    "/stats/most-borrowed",
    authMiddleware,
    getMostBorrowedBooks
);

// Recently borrowed books
router.get(
    "/stats/last-borrowed",
    authMiddleware,
    getLastBorrowedBooks
);

// Books available right now (not borrowed)
router.get(
    "/stats/available-books",
    authMiddleware,
    getAvailableBooks
);

// Get active residents (those that borrowed in the last X days)
router.get(
    "/stats/active-residents",
    authMiddleware,
    getActiveResidents
);

export default router;
