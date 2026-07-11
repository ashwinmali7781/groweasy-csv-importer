'use strict';

const multer = require('multer');

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const okMime = ['text/csv', 'application/vnd.ms-excel', 'application/csv', 'text/plain'];
  const okExt = file.originalname.toLowerCase().endsWith('.csv');
  if (okExt || okMime.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only .csv files are accepted.'));
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

module.exports = upload;
