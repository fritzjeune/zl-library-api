import { DataTypes } from "sequelize";

export default (sequelize) => {
    return sequelize.define(
        "UserType",
        {
            user_type_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            type_name: {
                type: DataTypes.STRING(50),
                allowNull: false,
                unique: true
            },
            description: {
                type: DataTypes.TEXT
            }
        },
        {
            tableName: "user_types",
            schema: "zllibrary",
            timestamps: false
        }
    );
};
