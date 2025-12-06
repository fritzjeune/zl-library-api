import { DataTypes } from "sequelize";

export default (sequelize) => {
    return sequelize.define("BookTransaction", {
        transaction_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        book_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "Book",
                key: "book_id"
            }
        },
        status_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "TransactionStatus",
                key: "status_id"
            }
        },
        due_date: { type: DataTypes.DATE, allowNull: false },
        returned_date: { type: DataTypes.DATE },
        notes: DataTypes.TEXT
    }, { tableName: "book_transactions", timestamps: false });
};
