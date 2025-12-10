// models/index.js
import sequelize from "../config/database.js";
import ResidentModel from "./resident.js";
import SpecialtyModel from "./specialty.js";
import BookModel from "./book.js";
import TransactionStatusModel from "./transactionStatus.js";
import BookTransactionModel from "./bookTransaction.js";
import LostDeclarationModel from "./lostDeclaration.js";
import UserModel from "./user.js";
import UserStatusModel from "./userStatus.js";
import UserRoleModel from "./userRole.js";
import UserTypeModel from "./userType.js";
import TransactionMetadataModel from "./TransactionMetadata.js";

// Initialize models
const Resident = ResidentModel(sequelize);
const Specialty = SpecialtyModel(sequelize);
const Book = BookModel(sequelize);
const TransactionStatus = TransactionStatusModel(sequelize);
const BookTransaction = BookTransactionModel(sequelize);
const LostDeclaration = LostDeclarationModel(sequelize);
const User = UserModel(sequelize);
const UserStatus = UserStatusModel(sequelize);
const UserRole = UserRoleModel(sequelize);
const UserType = UserTypeModel(sequelize);
const TransactionMetadata = TransactionMetadataModel(sequelize)

// ----------------------
// ✅ Associations
// ----------------------

// Specialty -> Resident
Specialty.hasMany(Resident, { foreignKey: "specialty_id" });
Resident.belongsTo(Specialty, { foreignKey: "specialty_id" });

// User -> Resident (1:1)
User.hasOne(Resident, {
    foreignKey: "user_id",
    as: "resident",     // Use this alias when including
    onDelete: "CASCADE"
});

Resident.belongsTo(User, {
    foreignKey: "user_id",
    as: "user"
});

// Specialty -> Book
Specialty.hasMany(Book, { foreignKey: "specialty_id", as: "specialty" });
Book.belongsTo(Specialty, { foreignKey: "specialty_id", as: "specialty" });

// Resident -> BookTransaction
Resident.hasMany(BookTransaction, { foreignKey: "resident_id" });
BookTransaction.belongsTo(Resident, { foreignKey: "resident_id" });

// Book -> BookTransaction
Book.hasMany(BookTransaction, { foreignKey: "book_id", as: "transactions"  });
BookTransaction.belongsTo(Book, { foreignKey: "book_id", as: "book" });

// TransactionStatus -> BookTransaction
TransactionStatus.hasMany(BookTransaction, { foreignKey: "status_id" });
BookTransaction.belongsTo(TransactionStatus, { foreignKey: "status_id" });

// BookTransaction -> LostDeclaration
BookTransaction.hasOne(LostDeclaration, { foreignKey: "transaction_id" });
LostDeclaration.belongsTo(BookTransaction, { foreignKey: "transaction_id" });

// Resident -> LostDeclaration
Resident.hasMany(LostDeclaration, { foreignKey: "resident_id" });
LostDeclaration.belongsTo(Resident, { foreignKey: "resident_id" });

// Book -> LostDeclaration
Book.hasMany(LostDeclaration, { foreignKey: "book_id" });
LostDeclaration.belongsTo(Book, { foreignKey: "book_id" });

// User -> LostDeclaration (processed_by)
User.hasMany(LostDeclaration, { foreignKey: "processed_by" });
LostDeclaration.belongsTo(User, { foreignKey: "processed_by" });

User.belongsTo(UserStatus, {
    foreignKey: "status_id",
    as: "status"
});

UserStatus.hasMany(User, {
    foreignKey: "status_id",
    as: "users"
});

// User → Role
User.belongsTo(UserRole, { foreignKey: "role_id", as: "role" });
UserRole.hasMany(User, { foreignKey: "role_id", as: "users" });

// User → UserType
User.belongsTo(UserType, { foreignKey: "user_type_id", as: "userType" });
UserType.hasMany(User, { foreignKey: "user_type_id", as: "users" });

// BookTransaction -> TransactionMetadata
BookTransaction.hasMany(TransactionMetadata, { foreignKey: "transaction_id", as: "metadata" });
TransactionMetadata.belongsTo(BookTransaction, { foreignKey: "transaction_id", as: "transaction" });

// BookTransaction -> TransactionStatus
BookTransaction.belongsTo(TransactionStatus, { foreignKey: "status_id" });
TransactionStatus.hasMany(BookTransaction, { foreignKey: "status_id" });

// TransactionMetadata -> User (who performed the action)
TransactionMetadata.belongsTo(User, { foreignKey: "action_by", as: "handledBy" });
User.hasMany(TransactionMetadata, { foreignKey: "action_by", as: "performedActions" });

// ----------------------
// Export models and sequelize
// ----------------------
export {
    sequelize,
    Resident,
    Specialty,
    Book,
    TransactionStatus,
    BookTransaction,
    LostDeclaration,
    User,
    UserStatus,
    UserRole,
    UserType,
    TransactionMetadata
};
