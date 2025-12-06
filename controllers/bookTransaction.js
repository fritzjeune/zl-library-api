import { Book, Resident, BookTransaction, TransactionStatus, TransactionMetadata, User, sequelize } from "../models/index.js";
import { Op } from "sequelize";

// Max books per resident
const MAX_BORROWED_BOOKS = 2;

// Helper: get status_id by name
// async function getStatusId(name) {
//     const status = await TransactionStatus.findOne({ where: { status_name: name } });
//     if (!status) throw new Error(`TransactionStatus '${name}' not found`);
//     return status.id;
// }

// Helper: create metadata entry
async function createMetadata(transactionId, status_id, staff_id, notes = null) {

    await TransactionMetadata.create({
        transaction_id: transactionId,
        action: status_id,
        action_by: staff_id,
        action_at: new Date(),
        notes
    });
}


// Borrow a book
export const borrowBook = async (req, res) => {
    console.log(req.user)
    const { book_id, resident_id, due_date } = req.body;
    const staff_id = req.user.user_id;

    try {
        const book = await Book.findByPk(book_id);
        if (!book) return res.status(404).json({ message: "Book not found" });
        if (book.available_copies < 1)
            return res.status(400).json({ message: "No available copies" });

        const borrowedCount = await BookTransaction.count({
            where: {
                resident_id,
                status_id: 1
            }
        });
        const borrowedCountSameBook = await BookTransaction.count({
            where: {
                resident_id,
                status_id: 1,
                book_id: book.book_id
            }
        });

        if (borrowedCount >= MAX_BORROWED_BOOKS)
            return res.status(400).json({ message: `Resident can borrow max ${MAX_BORROWED_BOOKS} books` });

        if (borrowedCountSameBook > 0)
            return res.status(400).json({ message: `Resident can't borrow the same books twice` });

        const transaction = (await BookTransaction.create({
            book_id,
            resident_id,
            due_date,
            status_id: 1
        })).toJSON();

        await book.decrement("available_copies", { by: 1 });
        await createMetadata(transaction.transaction_id, 1, staff_id);

        res.json({ message: "Book borrowed successfully", transaction });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error borrowing book", error: error.message });
    }
};

// Return a book
export const returnBook = async (req, res) => {
    const { transaction_id } = req.params;
    const staff_id = req.user.user_id;

    try {
        const transaction = await BookTransaction.findByPk(transaction_id, { include: Book });
        if (!transaction) return res.status(404).json({ message: "Transaction not found" });

        transaction.status_id = 2;
        await transaction.save();

        await transaction.Book.increment("available_copies", { by: 1 });
        await createMetadata(transaction.transaction_id, 2, staff_id);

        res.json({ message: "Book returned successfully", transaction });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error returning book", error: error.message });
    }
};

// Report lost book
export const reportLostBook = async (req, res) => {
    const { transaction_id, declaration_file } = req.body;
    const staff_id = req.user.user_id;

    try {
        const transaction = await BookTransaction.findByPk(transaction_id, { include: Book });
        if (!transaction) return res.status(404).json({ message: "Transaction not found" });

        transaction.status_id = await getStatusId("lost");
        transaction.handled_by = staff_id;
        await transaction.save();

        await createMetadata(transaction.id, 3, staff_id, declaration_file || null);

        res.json({ message: "Book marked as lost", transaction });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error reporting lost book", error: error.message });
    }
};

// Get all transactions with filters & pagination
export const getAllTransactions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { resident_id, book_id, status } = req.query;
        let whereClause = {};
        if (resident_id) whereClause.resident_id = resident_id;
        if (book_id) whereClause.book_id = book_id;
        if (status) whereClause.status_id = status;

        const { count, rows } = await BookTransaction.findAndCountAll({
            where: whereClause,
            include: [
                { model: Book },
                { model: Resident },
                { model: TransactionStatus },
                { model: TransactionMetadata, as: "metadata", include: [{ model: User, as: "handledBy" }] }
            ],
            limit,
            offset,
            order: [["transaction_id", "DESC"]]
        });

        res.json({
            page,
            limit,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            transactions: rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching transactions", error: error.message });
    }
};

// Advanced: most borrowed books
export const getMostBorrowedBooks = async (req, res) => {
    try {
        const results = await BookTransaction.findAll({
            attributes: [
                "book_id",
                [sequelize.fn("COUNT", sequelize.col("book_id")), "borrow_count"]
            ],
            group: ["book_id"],
            order: [[sequelize.literal("borrow_count"), "DESC"]],
            include: [{ model: Book }]
        });
        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching most borrowed books", error: error.message });
    }
};

// Advanced: last borrowed books
export const getLastBorrowedBooks = async (req, res) => {
    try {
        const results = await BookTransaction.findAll({
            include: [{ model: Book }, { model: Resident }, { model: User, as: "handledBy" }],
            order: [["id", "DESC"]],
            limit: 10
        });
        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching last borrowed books", error: error.message });
    }
};

// Advanced: available books
export const getAvailableBooks = async (req, res) => {
    try {
        const books = await Book.findAll({
            where: { available_copies: { [Op.gt]: 0 } }
        });
        res.json(books);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching available books", error: error.message });
    }
};

export const getActiveBorrowedBooks = async (req, res) => {
    try {
        const transactions = await Transaction.findAll({
            where: { status_id: 1 }, // 1 = borrowed
            include: [
                { model: Book, attributes: ["id", "title", "available_copies"] },
                { model: Resident, attributes: ["id", "first_name", "last_name"] },
                {
                    model: TransactionMetadata,
                    where: { action: "borrow" },
                    required: false
                }
            ]
        });

        res.json({ success: true, count: transactions.length, transactions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getActiveResidents = async (req, res) => {
    try {
        const last30days = new Date();
        last30days.setDate(last30days.getDate() - 30);

        const activities = await TransactionMetadata.findAll({
            where: {
                action: "borrow",
                created_at: { [Op.gte]: last30days }
            },
            include: [{
                model: Transaction,
                include: [{ model: Resident }]
            }]
        });

        const uniqueResidents = [
            ...new Map(
                activities
                    .map(a => a.Transaction.Resident)
                    .map(r => [r.id, r])
            ).values()
        ];

        res.json({
            success: true,
            activeCount: uniqueResidents.length,
            residents: uniqueResidents
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getResidentBorrowHistory = async (req, res) => {
    try {
        const { resident_id } = req.params;

        const history = await Transaction.findAll({
            where: { resident_id },
            include: [
                { model: Book },
                { model: TransactionStatus },
                { model: TransactionMetadata }
            ],
            order: [["id", "DESC"]]
        });

        res.json({ success: true, count: history.length, history });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const extendBorrow = async (req, res) => {
    try {
        const { transaction_id } = req.params;
        const { extra_days } = req.body;

        if (!extra_days || extra_days < 1) {
            return res.status(400).json({ error: "extra_days must be >= 1" });
        }

        const tx = await Transaction.findByPk(transaction_id);
        if (!tx) return res.status(404).json({ error: "Transaction not found" });

        tx.due_date = new Date(new Date(tx.due_date).getTime() + extra_days * 86400000);
        await tx.save();

        await TransactionMetadata.create({
            transaction_id,
            action: "extend",
            performed_by: req.user.user_id,
            details: `Extended by ${extra_days} days`
        });

        res.json({ success: true, message: "Borrow extended", transaction: tx });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getTransactionById = async (req, res) => {
    try {
        const { transaction_id } = req.params;

        const tx = await Transaction.findByPk(transaction_id, {
            include: [
                { model: Book },
                { model: Resident },
                { model: TransactionStatus },
                { model: TransactionMetadata }
            ]
        });

        if (!tx) return res.status(404).json({ error: "Transaction not found" });

        res.json({ success: true, transaction: tx });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

