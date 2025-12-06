import {BookTransaction, Resident, Specialty} from "../models/index.js";
import {Op, Sequelize} from "sequelize";
const ALLOWED_DOMAINS = ["pih.org"];

/**
 * Add a new resident
 */
export const addResident = async (req, res) => {
    try {
        const { first_name, last_name, email, phone, specialty_id, grade } = req.body;

        // Validations
        if (!first_name || !last_name || !email) {
            return res.status(400).json({ error: "First name, last name and email are required" });
        }

        if (email) {
            const emailDomain = email.split("@")[1]?.toLowerCase();
            if (!ALLOWED_DOMAINS.includes(emailDomain)) {
                return res.status(400).json({
                    error: `Email must be from one of the allowed domains: ${ALLOWED_DOMAINS.join(", ")}`,
                });
            }
        }

        if (grade && (grade < 1 || grade > 5)) {
            return res.status(400).json({ error: "Grade must be between 1 and 5" });
        }

        const exists = await Resident.findOne({ where: { email } });
        if (exists) {
            return res.status(400).json({ error: "Email already exists" });
        }

        const resident = await Resident.create({
            first_name,
            last_name,
            email,
            phone,
            specialty_id: specialty_id || null,
            grade: grade || null,
        });

        res.status(201).json(resident);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to add resident" });
    }
};

/**
 * Update resident by ID
 */
export const updateResident = async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, email, phone, specialty_id, grade } = req.body;

        const resident = await Resident.findByPk(id);
        if (!resident) return res.status(404).json({ error: "Resident not found" });

        if (grade && (grade < 1 || grade > 5)) {
            return res.status(400).json({ error: "Grade must be between 1 and 5" });
        }

        // Update fields
        await resident.update({
            first_name: first_name ?? resident.first_name,
            last_name: last_name ?? resident.last_name,
            // email: email ?? resident.email, // I dont want to allow changing of email
            phone: phone ?? resident.phone,
            specialty_id: specialty_id ?? resident.specialty_id,
            grade: grade ?? resident.grade,
        });

        res.json(resident);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update resident" });
    }
};

/**
 * Delete resident
 */
export const deleteResident = async (req, res) => {
    try {
        const { id } = req.params;

        const resident = await Resident.findByPk(id);
        if (!resident) return res.status(404).json({ error: "Resident not found" });

        await resident.destroy();

        res.json({ message: "Resident deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete resident" });
    }
};

/**
 * Get a single resident by ID
 */
export const getResident = async (req, res) => {
    try {
        const { id } = req.params;

        const resident = await Resident.findByPk(id, {
            include: [{ model: Specialty, attributes: ["specialty_name"] }],
        });

        if (!resident) return res.status(404).json({ error: "Resident not found" });

        res.json(resident);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to get resident" });
    }
};

/**
 * Get all residents with filters and pagination
 */
export const getAllResidents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const offset = (page - 1) * limit;

        const { name, email, specialty_id, grade, sort = "first_name", order = "ASC" } = req.query;

        const where = {};

        if (name) {
            where[Op.or] = [
                { first_name: { [Op.iLike]: `%${name}%` } },
                { last_name: { [Op.iLike]: `%${name}%` } },
            ];
        }

        if (email) where.email = { [Op.iLike]: `%${email}%` };
        if (specialty_id) where.specialty_id = specialty_id;
        if (grade) where.grade = grade;

        const { rows, count } = await Resident.findAndCountAll({
            where,
            include: [{ model: Specialty, attributes: ["specialty_name"] }],
            offset,
            limit,
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
        res.status(500).json({ error: "Failed to fetch residents" });
    }
};

export const getMostActiveResidents = async (req, res) => {
    try {
        const residents = await Resident.findAll({
            include: [
                {
                    model: BookTransaction,
                    as: "transactions",
                    attributes: []
                }
            ],
            attributes: [
                "id",
                "first_name",
                "last_name",
                "grade",
                "specialty_id",
                [
                    Sequelize.fn("COUNT", Sequelize.col("transactions.id")),
                    "borrow_count"
                ]
            ],
            group: ["Resident.id"],
            order: [[Sequelize.literal("borrow_count"), "DESC"]],
            limit: 10
        });

        res.json(residents);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch most active residents" });
    }
};

