const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = Number(process.env.PORT) || 3000;
// Deplexo /app is read-only.
// Use writable runtime storage instead.
const DATA_DIR =
  process.env.DATA_DIR || path.join("/tmp", "zansti-sardam");
const DB = path.join(DATA_DIR, "data.json");
app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(express.static(__dirname));
function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {
      recursive: true
    });
  }
}
function defaultDB() {
  return {
    students: [
      {
        name: "Shalaw Saman",
        id: "1001",
        password: "1234",
        department: "تەکنەلۆجیا",
        phone: "07XX XXX XXXX",
        email: "student@zansti.sardam.institute"
      }
    ]
  };
}
function readDB() {
  try {
    ensureDataDirectory();
    if (!fs.existsSync(DB)) {
      const data = defaultDB();
      fs.writeFileSync(
        DB,
        JSON.stringify(data, null, 2),
        "utf8"
      );
      return data;
    }
    const raw = fs.readFileSync(DB, "utf8").trim();
    if (!raw) {
      return {
        students: []
      };
    }
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.students)) {
      throw new Error("Invalid database structure");
    }
    return data;
  } catch (error) {
    console.error(
      "DATABASE READ ERROR:",
      error
    );
    throw new Error(
      "DATABASE_READ_FAILED"
    );
  }
}
function saveDB(data) {
  try {
    ensureDataDirectory();
    if (
      !data ||
      !Array.isArray(data.students)
    ) {
      throw new Error(
        "Invalid database data"
      );
    }
    const tempDB = DB + ".tmp";
    fs.writeFileSync(
      tempDB,
      JSON.stringify(data, null, 2),
      "utf8"
    );
    fs.renameSync(tempDB, DB);
    return true;
  } catch (error) {
    console.error(
      "DATABASE WRITE ERROR:",
      error
    );
    try {
      const tempDB = DB + ".tmp";
      if (fs.existsSync(tempDB)) {
        fs.unlinkSync(tempDB);
      }
    } catch (_) {}
    throw new Error(
      "DATABASE_WRITE_FAILED"
    );
  }
}
function clean(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }
  return String(value).trim();
}
function publicStudent(student) {
  const {
    password,
    ...safeStudent
  } = student;
  return safeStudent;
}
function sendServerError(res, error) {
  console.error(
    "REQUEST ERROR:",
    error
  );
  if (
    error &&
    error.message ===
      "DATABASE_WRITE_FAILED"
  ) {
    return res.status(500).json({
      success: false,
      message:
        "نەتوانرا زانیارییەکان هەڵبگیرێن."
    });
  }
  if (
    error &&
    error.message ===
      "DATABASE_READ_FAILED"
  ) {
    return res.status(500).json({
      success: false,
      message:
        "نەتوانرا داتاکان بخوێندرێنەوە."
    });
  }
  return res.status(500).json({
    success: false,
    message:
      "هەڵەی ناوخۆی سێرڤەر ڕوویدا."
  });
}
/* =========================
   HOME
========================= */
app.get("/", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "index.html"
    )
  );
});
/* =========================
   HEALTH CHECK
========================= */
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    server: "online",
    service: "Zansti Sardam"
  });
});
/* =========================
   SIGN UP
========================= */
app.post("/api/signup", (req, res) => {
  try {
    const name = clean(req.body.name);
    const id = clean(req.body.id);
    const password =
      clean(req.body.password);
    const department =
      clean(req.body.department);
    const phone =
      clean(req.body.phone);
    const email =
      clean(req.body.email);
    if (
      !name ||
      !id ||
      !password ||
      !department
    ) {
      return res.status(400).json({
        success: false,
        message:
          "ناو، ID، وشەی نهێنی و بەش پڕ بکەرەوە."
      });
    }
    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        message:
          "وشەی نهێنی دەبێت لانیکەم ٤ پیت بێت."
      });
    }
    const db = readDB();
    const exists =
      db.students.some(
        student =>
          clean(student.id)
            .toLowerCase() ===
          id.toLowerCase()
      );
    if (exists) {
      return res.status(409).json({
        success: false,
        message:
          "ئەم ID ـە پێشتر بەکارهاتووە."
      });
    }
    const newStudent = {
      name,
      id,
      password,
      department,
      phone,
      email
    };
    db.students.push(
      newStudent
    );
    saveDB(db);
    return res.status(201).json({
      success: true,
      message:
        "ئەکاونتەکەت بە سەرکەوتوویی دروستکرا.",
      student:
        publicStudent(
          newStudent
        )
    });
  } catch (error) {
    return sendServerError(
      res,
      error
    );
  }
});
/* =========================
   LOGIN
========================= */
app.post("/api/login", (req, res) => {
  try {
    const id = clean(req.body.id);
    const password =
      clean(req.body.password);
    if (!id || !password) {
      return res.status(400).json({
        success: false,
        message:
          "ID و وشەی نهێنی پڕ بکەرەوە."
      });
    }
    if (
      id === "admin" &&
      password === "admin123"
    ) {
      return res.json({
        success: true,
        role: "admin"
      });
    }
    const db = readDB();
    const student =
      db.students.find(
        s =>
          clean(s.id) === id &&
          clean(s.password) ===
            password
      );
    if (!student) {
      return res.status(401).json({
        success: false,
        message:
          "ID یان وشەی نهێنی هەڵەیە."
      });
    }
    return res.json({
      success: true,
      role: "student",
      student:
        publicStudent(student)
    });
  } catch (error) {
    return sendServerError(
      res,
      error
    );
  }
});
/* =========================
   GET STUDENTS
========================= */
app.get(
  "/api/students",
  (req, res) => {
    try {
      const db = readDB();
      const students =
        db.students.map(
          student =>
            publicStudent(student)
        );
      return res.json(
        students
      );
    } catch (error) {
      return sendServerError(
        res,
        error
      );
    }
  }
);
/* =========================
   GET ONE STUDENT
========================= */
app.get(
  "/api/students/:id",
  (req, res) => {
    try {
      const id =
        clean(req.params.id);
      const db = readDB();
      const student =
        db.students.find(
          s =>
            clean(s.id) === id
        );
      if (!student) {
        return res.status(404).json({
          success: false,
          message:
            "قوتابی نەدۆزرایەوە."
        });
      }
      return res.json({
        success: true,
        student:
          publicStudent(
            student
          )
      });
    } catch (error) {
      return sendServerError(
        res,
        error
      );
    }
  }
);
/* =========================
   ADD STUDENT
========================= */
app.post(
  "/api/students",
  (req, res) => {
    try {
      const name =
        clean(req.body.name);
      const id =
        clean(req.body.id);
      const password =
        clean(req.body.password);
      const department =
        clean(
          req.body.department
        );
      const phone =
        clean(req.body.phone);
      const email =
        clean(req.body.email);
      if (
        !name ||
        !id ||
        !password ||
        !department
      ) {
        return res.status(400).json({
          success: false,
          message:
            "زانیارییە سەرەکییەکان پڕ بکەرەوە."
        });
      }
      const db = readDB();
      const exists =
        db.students.some(
          student =>
            clean(student.id)
              .toLowerCase() ===
            id.toLowerCase()
        );
      if (exists) {
        return res.status(409).json({
          success: false,
          message:
            "ئەم ID ـە پێشتر بەکارهاتووە."
        });
      }
      const newStudent = {
        name,
        id,
        password,
        department,
        phone,
        email
      };
      db.students.push(
        newStudent
      );
      saveDB(db);
      return res.status(201).json({
        success: true,
        message:
          "قوتابی زیادکرا.",
        student:
          publicStudent(
            newStudent
          )
      });
    } catch (error) {
      return sendServerError(
        res,
        error
      );
    }
  }
);
/* =========================
   DELETE STUDENT
========================= */
app.delete(
  "/api/students/:id",
  (req, res) => {
    try {
      const id =
        clean(req.params.id);
      const db = readDB();
      const index =
        db.students.findIndex(
          student =>
            clean(student.id) ===
            id
        );
      if (index === -1) {
        return res.status(404).json({
          success: false,
          message:
            "قوتابی نەدۆزرایەوە."
        });
      }
      db.students.splice(
        index,
        1
      );
      saveDB(db);
      return res.json({
        success: true,
        message:
          "قوتابی سڕایەوە."
      });
    } catch (error) {
      return sendServerError(
        res,
        error
      );
    }
  }
);
/* =========================
   API 404
========================= */
app.use(
  "/api",
  (req, res) => {
    res.status(404).json({
      success: false,
      message:
        "ئەم API ـە نەدۆزرایەوە."
    });
  }
);
/* =========================
   GLOBAL ERROR HANDLER
========================= */
app.use(
  (err, req, res, next) => {
    console.error(
      "GLOBAL SERVER ERROR:",
      err
    );
    if (res.headersSent) {
      return next(err);
    }
    return res.status(500).json({
      success: false,
      message:
        "هەڵەی ناوخۆی سێرڤەر ڕوویدا."
    });
  }
);
/* =========================
   START SERVER
========================= */
app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `🔐 SHALAW all-in-one server running on ${PORT}`
    );
    console.log(
      `📁 Writable data directory: ${DATA_DIR}`
    );
  }
);
