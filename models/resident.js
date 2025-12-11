import { DataTypes } from "sequelize";

export default (sequelize) => {
    return sequelize.define("Resident", {
        resident_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        specialty_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "Specialty",
                key: "specialty_id"
            }
        },
        first_name: { type: DataTypes.STRING(100), allowNull: false },
        last_name: { type: DataTypes.STRING(100), allowNull: false },
        bio: { type: DataTypes.STRING(), allowNull: false },
        grade: { type: DataTypes.INTEGER, validate: { min: 1, max: 5 } },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    }, { tableName: "residents", timestamps: false });
};
