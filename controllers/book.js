import {Book, Specialty, BookTransaction, TransactionMetadata} from "../models/index.js";
import { Op, Sequelize } from "sequelize";
import specialty from "../models/specialty.js";

/**
 * Add a new book
 */
export const addBook = async (req, res) => {
    try {
        const { title, author, isbn, published_year, specialty_id, available_copies, image_url, description } = req.body;

        // Validations
        if (!title || !author) {
            return res.status(400).json({ error: "Title and author are required" });
        }

        const book = await Book.create({
            title,
            author,
            isbn,
            description,
            published_year,
            specialty_id: specialty_id || null,
            available_copies: available_copies || 1,
            image_url,
        });

        res.status(201).json(book);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to add book" });
    }
};

/**
 * Update a book by ID
 */
export const updateBook = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, author, isbn, published_year, specialty_id, available_copies, image_url, description } = req.body;

        const book = await Book.findByPk(id);
        if (!book) return res.status(404).json({ error: "Book not found" });

        // Update fields
        await book.update({
            title: title ?? book.title,
            author: author ?? book.author,
            isbn: isbn ?? book.isbn,
            description: description ?? book.description,
            published_year: published_year ?? book.published_year,
            specialty_id: specialty_id ?? book.specialty_id,
            available_copies: available_copies ?? book.available_copies,
            image_url: image_url ?? book.image_url,
        });

        res.json(book);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update book" });
    }
};

/**
 * Delete a book by ID
 */
export const deleteBook = async (req, res) => {
    try {
        const { id } = req.params;

        const book = await Book.findByPk(id);
        if (!book) return res.status(404).json({ error: "Book not found" });

        await book.destroy();
        res.json({ message: "Book deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete book" });
    }
};

/**
 * Get a single book by ID
 */
export const getBook = async (req, res) => {
    try {
        const { id } = req.params;
        const book = await Book.findByPk(id, {
            include: [{ model: Specialty, as: "specialty",  attributes: ["specialty_name"] }],
        });
        if (!book) return res.status(404).json({ error: "Book not found" });

        res.json(book);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to get book" });
    }
};

/**
 * Get all books with filters, pagination, and sorting
 * Query params:
 *   - page (default 1)
 *   - limit (default 10)
 *   - title, author, specialty_id
 *   - sort (e.g., 'title', 'published_year')
 */
export const getAllBooks = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { title, author, specialty_id, sort = "title", order = "ASC" } = req.query;

        const where = {};
        if (title) where.title = { [Op.iLike]: `%${title}%` };
        if (author) where.author = { [Op.iLike]: `%${author}%` };
        if (specialty_id) where.specialty_id = specialty_id;

        const { rows, count } = await Book.findAndCountAll({
            where,
            include: [{ model: Specialty, as: "specialty", attributes: ["specialty_name"] }],
            limit,
            offset,
            order: [[sort, order.toUpperCase()]],
        });

        res.json({
            page,
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            items: rows,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch books" });
    }
};

export const getMostBorrowedBooks = async (req, res) => {
    try {
        const books = await Book.findAll({
            include: [
                {
                    model: BookTransaction,
                    as: "transactions",
                    attributes: [],
                    required: false,
                },
                {
                    model: Specialty,
                    as: "specialty",
                    attributes: ["specialty_name", "specialty_id"],
                    required: false,
                },
            ],
            attributes: [
                "book_id",
                "title",
                "author",
                "description",
                "image_url",
                "available_copies",
                [
                    Sequelize.literal(
                        'COUNT("transactions"."transaction_id")'
                    ),
                    "borrow_count",
                ],
            ],
            group: [
                '"Book"."book_id"',
                '"Book"."title"',
                '"Book"."author"',
                '"Book"."available_copies"',
                '"specialty.specialty_name"',
                '"specialty.specialty_id"'
            ],
            order: [[Sequelize.literal("borrow_count"), "DESC"]],
            limit: 10,
            subQuery: false,
        });

        res.json(books);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch most borrowed books" });
    }
};

export const getLastBorrowedBooks = async (req, res) => {
    try {
        let transactions = await BookTransaction.findAll({
            include: [
                {
                    model: Book,
                    as: "book",
                    attributes: ["book_id", "title", "author", "available_copies", "description"],
                    include: [
                        {
                            model: Specialty,
                            as: "specialty",
                            attributes: ["specialty_name", "specialty_id"],
                            required: false,
                        },
                    ]
                },
                {
                    model: TransactionMetadata,
                    as: "metadata",
                    attributes: ["metadata_id", "action_at"]
                },
            ],
            // order: [["metadata.action_at", "DESC"]],
            limit: 10
        });

        // transactions = transactions.map(t => t.book)
        transactions = [
            ...new Map(transactions.map(t => [t.book.book_id, t.book])).values()
        ];

        res.json(transactions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch last borrowed books" });
    }
};

export const borrowedBookByResident = async (req, res) => {
    try {
        const resident_id = req.params.resident_id;

        if (!resident_id) return res.status(400).json({ message : "A resident Id must be given"})
        let transactions = await BookTransaction.findAll({
            include: [
                {
                    model: Book,
                    as: "book",
                    required: false,
                    include : [
                        {
                            model: Specialty,
                            as: "specialty",
                            attributes: ["specialty_name", "specialty_id"],
                            required: false,
                        },
                    ]
                },
            ],
            where: {
                resident_id: {
                    [Op.eq]: resident_id
                },
                status_id: {
                    [Op.eq]: 1
                }
            },
        });

        transactions = [
            ...new Map(transactions.map(t => [t.book.book_id, t.book])).values()
        ];
        res.status(200).json(transactions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch available books by resident" });
    }
}

export const getAvailableBooks = async (req, res) => {
    try {
        const books = await Book.findAll({
            where: {
                available_copies: {
                    [Op.gt]: 0
                }
            },
            include: [
                {
                    model: Specialty,
                    as: "specialty",
                    attributes: ["specialty_name", "specialty_id"],
                    required: false,
                },
            ]
        });

        res.json(books);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch available books" });
    }
};


