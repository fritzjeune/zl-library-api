import { DataTypes } from "sequelize";

export default (sequelize) => {
    return sequelize.define(
        "UserStatus",
        {
            status_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            status_name: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true
            }
        },
        {
            tableName: "user_status",
            schema: "zllibrary",
            timestamps: false
        }
    );
};
