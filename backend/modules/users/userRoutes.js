const express = require('express');
const router = express.Router();
const {
  getUsers, getUser, createUser, updateUser, deleteUser,
  updateProfile, updateProfileImage,
} = require('./userController');
const { protect, adminOnly } = require('../../middleware/auth');
const upload = require('../../middleware/upload');

router.put('/profile', protect, updateProfile);
router.put('/profile/image', protect, upload.single('profileImage'), updateProfileImage);

router.route('/')
  .get(protect, adminOnly, getUsers)
  .post(protect, adminOnly, createUser);

router.route('/:id')
  .get(protect, adminOnly, getUser)
  .put(protect, adminOnly, updateUser)
  .delete(protect, adminOnly, deleteUser);

module.exports = router;
