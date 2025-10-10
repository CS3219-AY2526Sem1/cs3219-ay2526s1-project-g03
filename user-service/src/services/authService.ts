import User from '../models/user';

export type CreateAccoutParams = {
  username: string;
  email: string;
  password: string;
};

export const createAccount = async (data: CreateAccoutParams) => {
  // Check if user exists.
  const existingUser = await User.exists({
    email: data.email,
  });

  if (existingUser) {
    throw new Error('User already exists!');
  }

  // Create user.
  const user = await User.create({
    username: data.username,
    email: data.email,
    password: data.password,
  });

  return user;
};
