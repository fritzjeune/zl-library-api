import express from "express";
const router = express.Router();

import {
    addResident,
    updateResident,
    deleteResident,
    getResident,
    getAllResidents,
} from "../controllers/resident.js";

router.post("/", addResident);
router.put("/:id", updateResident);
router.delete("/:id", deleteResident);
router.get("/:id", getResident);
router.get("/", getAllResidents);

export default router;
