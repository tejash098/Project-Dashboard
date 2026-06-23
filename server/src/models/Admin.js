import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import config from "../config/env.js";
import { generate16DigitId } from "../utils/generateId.js";

/**
 * Mongoose schema for an admin user. `username` is the login identifier; the
 * `password` field stores the bcrypt **hash**, never plain text (see the
 * pre-save hook below). `timestamps: true` auto-manages createdAt/updatedAt.
 */
const adminSchema = new mongoose.Schema(
  {
    // 16-digit unique identifier, generated automatically on creation.
    user_id: {
      type: String,
      unique: true,
      default: generate16DigitId,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true, // holds the bcrypt hash, set by the pre-save hook
    },
    email: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
    },
    firstName: {
      type: String,
      required: false,
      trim: true,
    },
    lastName: {
      type: String,
      required: false,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin"],
      default: "admin",
    },
  },
  {
    timestamps: true,
    // Expose virtuals (fullName) and strip the password hash from any JSON the
    // model produces, so the hash can never leak in an API response.
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.password;
        return ret;
      },
    },
  },
);

/**
 * Convenience virtual: the admin's full name, derived from first + last.
 * Returns an empty string when neither part is set.
 */
adminSchema.virtual("fullName").get(function () {
  return `${this.firstName ?? ""} ${this.lastName ?? ""}`.trim();
});

/**
 * Hash the password before saving whenever it has changed (new doc or password
 * update). Skipping unchanged passwords avoids re-hashing an already-hashed
 * value on unrelated updates. As an async hook, it signals completion by
 * resolving — Mongoose v9 does not pass a `next` callback here.
 */
adminSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, config.saltRounds);
});

/**
 * Compare a plain-text candidate password against the stored hash.
 * @param {string} candidate - The password supplied at login.
 * @returns {Promise<boolean>} True when the candidate matches.
 */
adminSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
