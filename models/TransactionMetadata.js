import { DataTypes } from "sequelize";

export default (sequelize) => {
    return sequelize.define(
        "TransactionMetadata",
        {
            metadata_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            transaction_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "book_transactions",
                    key: "transaction_id"
                }
            },
            action: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: "transaction_status", key: "status_id" }
            },
            action_by: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: "User",
                    key: "user_id"
                }
            },
            action_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            },
            notes: {
                type: DataTypes.TEXT
            }
        },
        {
            tableName: "transaction_metadata",
            schema: "zllibrary",
            timestamps: false
        }
    );
};
