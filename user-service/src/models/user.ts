import mongoose from 'mongoose';
import {hashPassword, verifyPassword, needsRehash} from '../utils/pbkdf2';
import {OCCUPATIONS, type Occupation} from '../constants/occupations.ts';
import {AREAS_OF_STUDY, type AreaOfStudy} from '../constants/areaOfStudy.ts';
import {daysFromNow} from '../utils/date.ts';
import {ACCOUNT_DELETION_DAYS} from '../constants/expirables.ts';
import type ProfilePicType from '../constants/oAuthTypes.ts';

// Source: https://mongoosejs.com/docs/6.x/docs/typescript/statics-and-methods.html

export interface IUser {
  username: string;
  email: string;
  verified: boolean;
  passwordHash?: string;
  passwordSalt?: string;
  passwordIterations?: number;
  hasPassword?: boolean;
  role: string;

  firstName?: string;
  lastName?: string;
  occupation?: Occupation;
  areaOfStudy?: AreaOfStudy;
  profileComplete: boolean;

  googleOAuthId?: string;
  googleOAuthEmail?: string;
  googleOAuthVerified?: boolean;

  githubOAuthId?: string;
  githubOAuthEmail?: string;
  githubOAuthVerified?: boolean;

  profilePicture?: string;
  profilePictureSource?: ProfilePicType;

  markedForDeletion: boolean;
  deletionScheduleAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(password: string): Promise<boolean>;
  setPassword(password: string): Promise<void>;
}

export type UserModel = mongoose.Model<IUser, {}, IUserMethods>;

const userSchema = new mongoose.Schema<IUser, UserModel, IUserMethods>(
  {
    username: {
      type: String,
      required: true,
      index: {unique: true, collation: {locale: 'en', strength: 2}},
    },
    email: {
      type: String,
      required: false,
      index: {unique: true, sparse: true, collation: {locale: 'en', strength: 2}},
    },
    verified: {type: Boolean, required: true, default: false},
    passwordHash: {type: String, required: false},
    passwordSalt: {type: String, required: false},
    passwordIterations: {type: Number, required: false},
    hasPassword: {type: Boolean, required: false, defaulte: false},
    role: {type: String, required: true, default: 'user', enum: ['user', 'admin']},

    firstName: {type: String, required: false},
    lastName: {type: String, required: false},
    occupation: {type: String, enum: OCCUPATIONS},
    areaOfStudy: {type: String, enum: AREAS_OF_STUDY},
    profileComplete: {type: Boolean, required: true, default: false},

    googleOAuthId: {type: String, required: false},
    googleOAuthEmail: {type: String, required: false},
    googleOAuthVerified: {type: Boolean, required: false},

    githubOAuthId: {type: String, required: false},
    githubOAuthEmail: {type: String, required: false},
    githubOAuthVerified: {type: Boolean, required: false},

    profilePicture: {type: String, required: false},
    profilePictureSource: {type: String, required: false},

    markedForDeletion: {type: Boolean, required: true, default: false},
    deletionScheduleAt: {type: Date, required: false},
  },
  {
    timestamps: true,
  }
);

// Virtual storage for password
userSchema
  .virtual('password')
  .set(function (password: string) {
    this.password_ = password;
  })
  .get(function () {
    return this.password_;
  });

/**
 * Salts and hashes password prior to data validation.
 */
userSchema.pre('validate', async function (next) {
  if (this.password_) {
    await this.setPassword(this.password_);
  }
  this.password_ = undefined;
  next();
});

/**
 * Checks if password requires hashing prior to persisting.
 */
userSchema.pre('save', async function (next) {
  if (this.isModified('passwordIterations')) {
    if (needsRehash(this.passwordIterations)) {
      console.warn('Password needs rehashing but password not available');
    }
  }
  next();
});

/**
 * Compares user provided `password` and `confirmPassword`
 *
 * @param {string} confirmPassword
 */
userSchema.method('comparePassword', async function (password: string): Promise<boolean> {
  return verifyPassword(password, this.passwordHash, this.passwordSalt, this.passwordIterations);
});

/**
 * Sets user password after hashing with PBKDF2.
 *
 * @param {string} password Plain text password.
 */
userSchema.method('setPassword', async function (password: string): Promise<void> {
  const {hash, salt, iterations} = await hashPassword(password);
  this.passwordHash = hash;
  this.passwordSalt = salt;
  this.passwordIterations = iterations;
  this.hasPassword = true;
});

/**
 * Omits user password in the JSON output
 *
 * @returns {IUser} object without a password
 */
userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.passwordHash;
  delete userObject.passwordSalt;
  delete userObject.passwordIterations;

  return userObject;
};

const User = mongoose.model<IUser, UserModel>('User', userSchema);

export default User;
