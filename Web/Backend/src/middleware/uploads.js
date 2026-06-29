const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = path.join(process.cwd(), "assets");

    if (file.fieldname === "modelo_3d_files") {
      uploadPath = path.join(process.cwd(), "assets", "tmp", "modelo3d");
    }

    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "modelo_3d_files") {
    const ext = path.extname(file.originalname).toLowerCase();

    if (
      ext === ".gltf" ||
      ext === ".bin" ||
      ext === ".png" ||
      ext === ".jpg" ||
      ext === ".jpeg" ||
      ext === ".webp"
    ) {
      return cb(null, true);
    }

    return cb(
      new Error(
        "El archivo del modelo 3D debe ser .gltf, .bin o una textura válida"
      ),
      false
    );
  }

  if (file.mimetype.startsWith("image/")) {
    return cb(null, true);
  }

  return cb(new Error("El archivo no es una imagen"), false);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 20 },
});

module.exports = upload;