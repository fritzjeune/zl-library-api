import { DataTypes } from "sequelize";
export default (sequelize) => {
    return sequelize.define(
        "Role",
        {
            role_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            role_name: {
                type: DataTypes.STRING(50),
                allowNull: false,
                unique: true
            },
            description: {
                type: DataTypes.TEXT
            }
        },
        {
            tableName: "roles",
            schema: "zllibrary",
            timestamps: false
        }
    );
};
