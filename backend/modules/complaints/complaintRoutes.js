const express = require('express');
const router = express.Router();
const {
  createComplaint, getMyComplaints, getAllComplaints,
  getComplaint, updateComplaint, deleteComplaint,
} = require('./complaintController');
const { protect, adminOnly } = require('../../middleware/auth');
const upload = require('../../middleware/upload');

router.post('/', protect, upload.single('complaintImage'), createComplaint);
router.get('/my', protect, getMyComplaints);
router.get('/', protect, adminOnly, getAllComplaints);
router.get('/:id', protect, getComplaint);
router.put('/:id', protect, adminOnly, updateComplaint);
router.delete('/:id', protect, deleteComplaint);

module.exports = router;
