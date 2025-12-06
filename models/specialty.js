import { DataTypes } from "sequelize";

export default (sequelize) => {
    return sequelize.define("Specialty", {
        specialty_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        specialty_name: { type: DataTypes.STRING(100), allowNull: false, unique: true }
    }, { tableName: "specialty", timestamps: false });
};
