const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 3000;
const DB = path.join(__dirname, "data.json");
app.use(express.json());
app.use(express.static(__dirname));
function readDB() {
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
    fs.writeFileSync(
      DB,
      JSON.stringify(initialData, null, 2),
      "utf8"
    );
  }
  return JSON.parse(
    fs.readFileSync(DB, "utf8")
  );
}
function saveDB(data) {
  fs.writeFileSync(
    DB,
    JSON.stringify(data, null, 2),
    "utf8"
  );
}
/* HOME */
app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "index.html")
  );
});
/* STUDENT SIGNUP */
app.post("/api/signup", (req, res) => {
  const {
    name,
    id,
    password,
    department,
    phone,
    email
  } = req.body;
  if (!name || !id || !password || !department) {
    return res.status(400).json({
      success: false,
      message: "ناو، ID، وشەی نهێنی و بەش پڕ بکەرەوە."
    });
  }
  if (password.length < 4) {
    return res.status(400).json({
      success: false,
      message: "وشەی نهێنی دەبێت لانیکەم ٤ پیت بێت."
    });
  }
  const db = readDB();
  const exists = db.students.some(
    student => student.id === id
  );
  if (exists) {
    return res.status(409).json({
      success: false,
      message: "ئەم ID ـە پێشتر بەکارهاتووە."
    });
  }
  const newStudent = {
    name,
    id,
    password,
    department,
    phone: phone || "",
    email: email || ""
  };
  db.students.push(newStudent);
  saveDB(db);
  res.status(201).json({
    success: true,
    message: "ئەکاونتەکەت بە سەرکەوتوویی دروستکرا.",
    student: {
      name,
      id,
      department,
      phone: phone || "",
      email: email || ""
    }
  });
});
/* STUDENT LOGIN */
app.post("/api/login", (req, res) => {
  const { id, password } = req.body;
  if (!id || !password) {
    return res.status(400).json({
      success: false,
      message: "ID و وشەی نهێنی پڕ بکەرەوە."
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
  const student = db.students.find(
    s =>
      s.id === id &&
      s.password === password
  );
  if (!student) {
    return res.status(401).json({
      success: false,
      message: "ID یان وشەی نهێنی هەڵەیە."
    });
  }
  res.json({
    success: true,
    role: "student",
    student
  });
});
/* GET STUDENTS */
app.get("/api/students", (req, res) => {
  const db = readDB();
  const students = db.students.map(
    ({ password, ...student }) => student
  );
  res.json(students);
});
/* ADD STUDENT */
app.post("/api/students", (req, res) => {
  const {
    name,
    id,
    password,
    department,
    phone,
    email
  } = req.body;
  if (
    !name ||
    !id ||
    !password ||
    !department
  ) {
    return res.status(400).json({
      success: false,
      message: "زانیارییە سەرەکییەکان پڕ بکەرەوە."
    });
  }
  const db = readDB();
  const exists = db.students.some(
    student => student.id === id
  );
  if (exists) {
    return res.status(409).json({
      success: false,
      message: "ئەم ID ـە پێشتر بەکارهاتووە."
    });
  }
  const newStudent = {
    name,
    id,
    password,
    department,
    phone: phone || "",
    email: email || ""
  };
  db.students.push(newStudent);
  saveDB(db);
  res.json({
    success: true,
    message: "قوتابی زیادکرا.",
    student: {
      name,
      id,
      department,
      phone: phone || "",
      email: email || ""
    }
  });
});
/* DELETE STUDENT */
app.delete("/api/students/:id", (req, res) => {
  const db = readDB();
  const index = db.students.findIndex(
    student =>
      student.id === req.params.id
  );
  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "قوتابی نەدۆزرایەوە."
    });
  }
  db.students.splice(index, 1);
  saveDB(db);
  res.json({
    success: true,
    message: "قوتابی سڕایەوە."
  });
});
/* SERVER ERROR HANDLER */
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({
    success: false,
    message: "هەڵەی ناوخۆی سێرڤەر ڕوویدا."
  });
});
/* START SERVER */
app.listen(PORT, () => {
  console.log(
    `Zansti Sardam server running on port ${PORT}`
  );
});
