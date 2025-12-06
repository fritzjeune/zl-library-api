// ---------------------------
// ✅ Imports (ESM Syntax)
// ---------------------------
import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import { fileURLToPath } from "url";
import { dirname } from "path";
import cors from "cors";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Sequelize connection
import { sequelize } from "./models/index.js";

// Routers
import indexRouter from "./routes/index.js";
import usersRouter from "./routes/users.js";
import bookRouter from "./routes/book.js";
import residentRouter from "./routes/resident.js";
import transactionRouter from "./routes/transaction.js";

// ---------------------------
// Express app setup
// ---------------------------
const app = express();
app.use(
    cors({
        origin:
            "*",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
    })
);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/books', bookRouter);
app.use("/residents", residentRouter);
app.use("/transactions", transactionRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected!");
    await sequelize.sync({ alter: false }); // creates/updates tables automatically
    console.log("✅ All models synchronized!");
  } catch (error) {
    console.error("❌ DB connection failed:", error);
  }
})();

export default app;
