import { DataTypes } from "sequelize";

export default (sequelize) => {
    return sequelize.define("TransactionStatus", {
        status_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        status_name: { type: DataTypes.STRING(50), allowNull: false, unique: true }
    }, { tableName: "transaction_status", timestamps: false });
};
