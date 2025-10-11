import mongoose from 'mongoose';

// Source: https://mongoosejs.com/docs/6.x/docs/typescript/statics-and-methods.html

export interface IUser {
  username: string;
  email: string;
  verified: boolean;
  password: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(val: string): Promise<boolean>;
}

export type UserModel = mongoose.Model<IUser, {}, IUserMethods>;

const userSchema = new mongoose.Schema<IUser, UserModel, IUserMethods>(
  {
    username: {type: String, required: true,
      index: {unique: true, collation: {locale: 'en', strength: 2}}
    },
    email: {type: String, required: true,
      index: {unique: true, collation: {locale: 'en', strength: 2}}
    },
    verified: {type: Boolean, required: true, default: false},
    password: {type: String, unique: true, required: true},
    role: {type: String, required: true, default: 'user'},
  },
  {
    timestamps: true,
  }
);

// Todo: Encrypt

/**
 * Compares user provided `password` and `confirmPassword`
 *
 * @param {string} val `confirmPassword`.
 */
userSchema.method('comparePassword', async function (val: string) {
  return val === this.password;
});

/**
 * Omits user password in the JSON output
 *
 * @returns {IUser} object without a password
 */
userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;

  return userObject;
};

const User = mongoose.model<IUser, UserModel>('User', userSchema);

export default User;
