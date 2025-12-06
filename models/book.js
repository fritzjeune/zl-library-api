import { DataTypes } from "sequelize";

export default (sequelize) => {
    return sequelize.define("Book", {
        book_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        title: { type: DataTypes.STRING(255), allowNull: false },
        author: DataTypes.STRING(255),
        isbn: { type: DataTypes.STRING(20), unique: true },
        published_year: DataTypes.INTEGER,
        image_url: DataTypes.TEXT,
        available_copies: { type: DataTypes.INTEGER, defaultValue: 1 },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    }, { tableName: "books", timestamps: false });
};
