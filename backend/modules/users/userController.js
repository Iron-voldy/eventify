const User = require('./User');
const asyncHandler = require('../../utils/asyncHandler');

// @desc    Get all users (admin)
// @route   GET /api/users
exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort('-createdAt');
  res.json({ success: true, count: users.length, data: users });
});

// @desc    Get single user (admin)
// @route   GET /api/users/:id
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({ success: true, data: user });
});

// @desc    Create user (admin)
// @route   POST /api/users
exports.createUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, phoneNumber, role } = req.body;

  // Validate required fields
  if (!fullName || !email || !password) {
    res.status(400);
    throw new Error('Full name, email and password are required');
  }

  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Please enter a valid email address');
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  const user = await User.create({ fullName, email, password, phoneNumber, role });
  res.status(201).json({ success: true, data: user });
});

// @desc    Update user (admin)
// @route   PUT /api/users/:id
exports.updateUser = asyncHandler(async (req, res) => {
  const { fullName, email, phoneNumber, role, accountStatus } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { fullName, email, phoneNumber, role, accountStatus },
    { new: true, runValidators: true }
  );
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({ success: true, data: user });
});

// @desc    Delete user (admin)
// @route   DELETE /api/users/:id
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  await user.deleteOne();
  res.json({ success: true, message: 'User removed' });
});

// @desc    Update own profile (user)
// @route   PUT /api/users/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phoneNumber } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { fullName, phoneNumber },
    { new: true, runValidators: true }
  );
  res.json({ success: true, data: user });
});

// @desc    Update profile image
// @route   PUT /api/users/profile/image
exports.updateProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image');
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { profileImage: imageUrl },
    { new: true }
  );
  res.json({ success: true, data: user });
});
