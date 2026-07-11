'use strict';

const express = require('express');
const upload = require('../middleware/upload');
const csvController = require('../controllers/csvController');

const router = express.Router();

router.post('/preview', upload.single('file'), csvController.preview);
router.post('/import', upload.single('file'), csvController.importCsv);

module.exports = router;
