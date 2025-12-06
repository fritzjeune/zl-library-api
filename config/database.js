import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config(); // Load .env variables

// Create the Sequelize instance
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: process.env.DB_DIALECT || "postgres",
        logging: false, // Set to console.log for debugging
        define: {
            schema: process.env.DB_SCHEMA || "zllibrary", // 👈 default schema here
        },
    }
);

// Test the connection
(async () => {
    try {
        await sequelize.authenticate();
        console.log("✅ Database connected successfully!");
    } catch (error) {
        console.error("❌ Unable to connect to the database:", error);
    }
})();

export default sequelize;
