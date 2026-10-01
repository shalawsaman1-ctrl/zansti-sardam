const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 3000;
const DB = path.join(__dirname, "data.json");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
function readDB() {
  try {
    if (!fs.existsSync(DB)) {
      const initialData = {
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
      fs.writeFileSync(DB, JSON.stringify(initialData, null, 2), "utf8");
    }
    const data = fs.readFileSync(DB, "utf8");
    if (!data.trim()) return { students: [] };
    const db = JSON.parse(data);
    if (!Array.isArray(db.students)) db.students = [];
    return db;
  } catch (error) {
    console.error("Database read error:", error);
    return { students: [] };
  }
}
function saveDB(data) {
  try {
    fs.writeFileSync(DB, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Database save error:", error);
    return false;
  }
}
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
/* SIGN UP */
app.post("/api/signup", (req, res) => {
  try {
    const { name, id, password, department, phone, email } = req.body;
    if (!name || !id || !password || !department) {
      return res.status(400).json({
        success: false,
        message: "تکایە زانیارییە سەرەکییەکان پڕ بکەرەوە."
      });
    }
    if (String(password).length < 4) {
      return res.status(400).json({
        success: false,
        message: "وشەی نهێنی دەبێت لانیکەم ٤ پیت بێت."
      });
    }
    const db = readDB();
    const exists = db.students.some(
      student => String(student.id) === String(id)
    );
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "ئەم ID ـە پێشتر بەکارهاتووە."
      });
    }
    const newStudent = {
      name: String(name).trim(),
      id: String(id).trim(),
      password: String(password),
      department: String(department).trim(),
      phone: phone ? String(phone).trim() : "",
      email: email ? String(email).trim() : ""
    };
    db.students.push(newStudent);
    if (!saveDB(db)) {
      return res.status(500).json({
        success: false,
        message: "نەتوانرا ئەکاونتەکە هەڵبگیرێت."
      });
    }
    return res.status(201).json({
      success: true,
      message: "ئەکاونتەکە بە سەرکەوتوویی دروستکرا.",
      student: {
        name: newStudent.name,
        id: newStudent.id,
        department: newStudent.department,
        phone: newStudent.phone,
        email: newStudent.email
      }
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error."
    });
  }
});
/* LOGIN */
app.post("/api/login", (req, res) => {
  try {
    const { id, password } = req.body;
    if (!id || !password) {
      return res.status(400).json({
        success: false,
        message: "ID و وشەی نهێنی پڕ بکەرەوە."
      });
    }
    if (String(id) === "admin" && String(password) === "admin123") {
      return res.json({
        success: true,
        role: "admin"
      });
    }
    const db = readDB();
    const student = db.students.find(
      s =>
        String(s.id) === String(id) &&
        String(s.password) === String(password)
    );
    if (!student) {
      return res.status(401).json({
        success: false,
        message: "ID یان وشەی نهێنی هەڵەیە."
      });
    }
    return res.json({
      success: true,
      role: "student",
      student: {
        name: student.name,
        id: student.id,
        department: student.department,
        phone: student.phone || "",
        email: student.email || ""
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error."
    });
  }
});
/* GET STUDENTS */
app.get("/api/students", (req, res) => {
  try {
    const db = readDB();
    const students = db.students.map(
      ({ password, ...student }) => student
    );
    return res.json(students);
  } catch (error) {
    console.error("Get students error:", error);
    return res.status(500).json({
      success: false,
      message: "نەتوانرا لیستی قوتابیان بهێنرێت."
    });
  }
});
/* GET ONE STUDENT */
app.get("/api/students/:id", (req, res) => {
  try {
    const db = readDB();
    const student = db.students.find(
      s => String(s.id) === String(req.params.id)
    );
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "قوتابی نەدۆزرایەوە."
      });
    }
    return res.json({
      name: student.name,
      id: student.id,
      department: student.department,
      phone: student.phone || "",
      email: student.email || ""
    });
  } catch (error) {
    console.error("Get student error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error."
    });
  }
});
/* ADD STUDENT */
app.post("/api/students", (req, res) => {
  try {
    const { name, id, password, department, phone, email } = req.body;
    if (!name || !id || !password || !department) {
      return res.status(400).json({
        success: false,
        message: "زانیارییە سەرەکییەکان پڕ بکەرەوە."
      });
    }
    const db = readDB();
    const exists = db.students.some(
      student => String(student.id) === String(id)
    );
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "ئەم ID ـە پێشتر بەکارهاتووە."
      });
    }
    const newStudent = {
      name: String(name).trim(),
      id: String(id).trim(),
      password: String(password),
      department: String(department).trim(),
      phone: phone ? String(phone).trim() : "",
      email: email ? String(email).trim() : ""
    };
    db.students.push(newStudent);
    if (!saveDB(db)) {
      return res.status(500).json({
        success: false,
        message: "نەتوانرا قوتابی هەڵبگیرێت."
      });
    }
    return res.status(201).json({
      success: true,
      message: "قوتابی زیادکرا.",
      student: {
        name: newStudent.name,
        id: newStudent.id,
        department: newStudent.department,
        phone: newStudent.phone,
        email: newStudent.email
      }
    });
  } catch (error) {
    console.error("Add student error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error."
    });
  }
});
/* DELETE STUDENT */
app.delete("/api/students/:id", (req, res) => {
  try {
    const db = readDB();
    const index = db.students.findIndex(
      student => String(student.id) === String(req.params.id)
    );
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "قوتابی نەدۆزرایەوە."
      });
    }
    db.students.splice(index, 1);
    if (!saveDB(db)) {
      return res.status(500).json({
        success: false,
        message: "نەتوانرا قوتابی بسڕدرێتەوە."
      });
    }
    return res.json({
      success: true,
      message: "قوتابی سڕایەوە."
    });
  } catch (error) {
    console.error("Delete student error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error."
    });
  }
});
/* HEALTH CHECK */
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    server: "online",
    service: "Zansti Sardam"
  });
});
/* ERROR HANDLER */
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error."
  });
});
/* START SERVER */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🔐 SHALAW all-in-one server running on ${PORT}`);
});
