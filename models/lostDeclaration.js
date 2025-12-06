import { DataTypes } from "sequelize";

export default (sequelize) => {
    return sequelize.define("LostDeclaration", {
        declaration_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        declaration_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        description: DataTypes.TEXT,
        attachment_url: DataTypes.TEXT,
        status: { type: DataTypes.STRING(20), defaultValue: "pending" },
        processed_date: { type: DataTypes.DATE }
    }, { tableName: "lost_declarations", timestamps: false });
};
