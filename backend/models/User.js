const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true, // this will store the bcrypt HASH, never the raw password
    },
    // Used to invalidate old refresh tokens on logout / password change.
    // Every time we issue a fresh refresh token, we bump this version.
    // The refresh endpoint checks the version in the token against this value.
    refreshTokenVersion: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);