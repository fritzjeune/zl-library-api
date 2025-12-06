import { DataTypes } from "sequelize";

export default (sequelize) => {
    return sequelize.define("User", {
        user_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        first_name: { type: DataTypes.STRING(150), allowNull: false },
        last_name: { type: DataTypes.STRING(150), allowNull: false },
        email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
        password_hash: { type: DataTypes.TEXT, allowNull: false },
        role_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "roles",
                key: "role_id"
            }
        },
        user_type_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "user_types",
                key: "user_type_id"
            }
        },
        is_2fa_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
        two_fa_secret: DataTypes.TEXT,
        two_fa_backup_codes: DataTypes.ARRAY(DataTypes.TEXT),
        last_login: DataTypes.DATE,
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        status_id: {
            type: DataTypes.INTEGER,
            references: {
                model: "user_status",
                key: "status_id"
            },
            allowNull: true
        },
        auth_provider: {
            type: DataTypes.ENUM("local", "google", "microsoft"),
            defaultValue: "local",
        },
    }, {
        tableName: "users",
        timestamps: false,
        defaultScope: {
            attributes: { exclude: ["password_hash"] }
        },

        scopes: {
            withPassword: {
                attributes: {}
            }
        }
    });
};
