import UserRoleTypes from '../../constants/userRoles';
import User from '../../models/user';

describe('models/User', () => {
  const TEST_USERNAME = 'testuser';
  const TEST_USERNAME_CONFLICT = 'tEStUSeR';
  const TEST_USERNAME_DIFFERENT = 'differentuser';
  const TEST_USERNAME_ADMIN = 'admin';

  const TEST_EMAIL = 'test@example.com';
  const TEST_EMAIL_CONFLICT = 'tESt@eXaMPlE.cOm';
  const TEST_EMAIL_DIFFERENT = 'test_different@example.com';
  const TEST_EMAIL_ADMIN = 'test_admin@admin.com';

  const TEST_PASSWORD = 'testPassword!@#$%^';
  const TEST_PASSWORD_DIFFERENT = 'differentPassword&^%$#@';

  const USER = UserRoleTypes.User;
  const ADMIN = UserRoleTypes.Admin;

  const TEST_FIRSTNAME = 'John';
  const TEST_LASTNAME = 'Doe';
  const TEST_OCCUPATION = 'information-technology';
  const TEST_AREAOFSTUDY = 'computer-science';

  const TEST_PROF_PIC_LINK = 'https://example.com/pic.jpg';
  const TEST_PROF_PIC_BASE64 = 'data:image/jpeg;base64, /9j/2woRAYgewoP/9k=';

  const TEST_OAUTHID = '1234567542146357';

  describe('User creation', () => {
    it('should create user with required fields', async () => {
      const userData = {
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      };

      const user = await User.create(userData);

      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email);
      expect(user.verified).toBe(false);
      expect(user.role).toBe(USER);
      expect(user.profileComplete).toBe(false);
      expect(user.markedForDeletion).toBe(false);

      expect(user.firstName).toBeUndefined();
      expect(user.lastName).toBeUndefined();
      expect(user.occupation).toBeUndefined();
      expect(user.areaOfStudy).toBeUndefined();

      expect(user.googleOAuthId).toBeUndefined();
      expect(user.googleOAuthEmail).toBeUndefined();
      expect(user.googleOAuthVerified).toBeUndefined();

      expect(user.githubOAuthId).toBeUndefined();
      expect(user.githubOAuthEmail).toBeUndefined();
      expect(user.githubOAuthVerified).toBeUndefined();

      expect(user.profilePicture).toBeUndefined();
      expect(user.profilePictureSource).toBeUndefined();

      expect(user.deletionScheduleAt).toBeUndefined();
    });

    it('should create a user without password', async () => {
      const userData = {
        username: TEST_USERNAME,
        email: TEST_EMAIL,
      };

      const user = await User.create(userData);

      expect(user.username).toBe(userData.username);
      expect(user.passwordHash).toBeUndefined();
      expect(user.passwordSalt).toBeUndefined();
      expect(user.passwordIterations).toBeUndefined();
    });

    it('should create a user without email', async () => {
      const userData = {
        username: TEST_USERNAME,
        password: TEST_PASSWORD,
      };

      const user = await User.create(userData);

      expect(user.username).toBe(userData.username);
      expect(user.email).toBeUndefined();
    });

    it('should hash password on creation', async () => {
      const userData = {
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      };

      const user = await User.create(userData);

      expect(user).toHaveProperty('passwordHash');
      expect(user).toHaveProperty('passwordSalt');
      expect(user).toHaveProperty('passwordIterations');
      expect(user.hasPassword).toBe(true);
    });

    it('should set timestamps on creation', async () => {
      const userData = {
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      };

      const user = await User.create(userData);

      expect(user).toHaveProperty('createdAt');
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user).toHaveProperty('updatedAt');
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should create user with admin role', async () => {
      const userData = {
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        role: ADMIN,
      };

      const user = await User.create(userData);

      expect(user.role).toBe(ADMIN);
    });

    it('should create verified user', async () => {
      const userData = {
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        verified: true,
      };

      const user = await User.create(userData);

      expect(user.verified).toBe(true);
    });
  });

  describe('Username validation', () => {
    it('should require username', async () => {
      const userData = {
        password: TEST_PASSWORD,
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should enforce unique username (case-insensitive)', async () => {
      const userData1 = {
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      };

      const userData2 = {
        username: TEST_USERNAME_CONFLICT,
        email: TEST_EMAIL_DIFFERENT,
        password: TEST_PASSWORD,
      };

      await User.create(userData1);
      await expect(User.create(userData2)).rejects.toThrow();
    });

    it('should allow different usernames', async () => {
      const userData1 = {
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      };

      const userData2 = {
        username: TEST_USERNAME_DIFFERENT,
        email: TEST_EMAIL_DIFFERENT,
        password: TEST_PASSWORD,
      };

      const user1 = await User.create(userData1);
      const user2 = await User.create(userData2);

      expect(user1.username).toBe(TEST_USERNAME);
      expect(user2.username).toBe(TEST_USERNAME_DIFFERENT);
    });
  });

  describe('Email validation', () => {
    it('should enforce unique email (case-insensitive)', async () => {
      const userData1 = {
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      };

      const userData2 = {
        username: TEST_USERNAME_DIFFERENT,
        email: TEST_EMAIL_CONFLICT,
        password: TEST_PASSWORD,
      };

      await User.create(userData1);
      await expect(User.create(userData2)).rejects.toThrow();
    });

    it('should allow same email for undefined/null values', async () => {
      const userData1 = {
        username: TEST_USERNAME,
        password: TEST_PASSWORD,
      };

      const userData2 = {
        username: TEST_USERNAME_DIFFERENT,
        password: TEST_PASSWORD,
      };

      const user1 = await User.create(userData1);
      const user2 = await User.create(userData2);

      expect(user1.email).toBeUndefined();
      expect(user2.email).toBeUndefined();
    });

    it('should allow different emails', async () => {
      const userData1 = {
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      };

      const userData2 = {
        username: TEST_USERNAME_DIFFERENT,
        email: TEST_EMAIL_DIFFERENT,
        password: TEST_PASSWORD,
      };

      const user1 = await User.create(userData1);
      const user2 = await User.create(userData2);

      expect(user1.email).toBe(TEST_EMAIL);
      expect(user2.email).toBe(TEST_EMAIL_DIFFERENT);
    });
  });

  describe('Password validation', () => {
    describe('setPassword', () => {
      it('should generate different hashes for different passwords', async () => {
        const user = new User({
          username: TEST_USERNAME,
          email: TEST_EMAIL,
        });

        await user.setPassword(TEST_PASSWORD);
        const hash1 = user.passwordHash;

        await user.setPassword(TEST_PASSWORD_DIFFERENT);
        const hash2 = user.passwordHash;

        expect(hash1).not.toBe(hash2);
      });

      it('should update hasPassword flag', async () => {
        const user = new User({
          username: TEST_USERNAME,
          email: TEST_EMAIL,
        });

        expect(user.hasPassword).toBe(false);

        await user.setPassword(TEST_PASSWORD);

        expect(user.hasPassword).toBe(true);
      });
    });

    describe('comparePassword', () => {
      it('should return true for correct password', async () => {
        const user = await User.create({
          username: TEST_USERNAME,
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        });

        const isValid = await user.comparePassword(TEST_PASSWORD);
        expect(isValid).toBe(true);
      });

      it('should return false for incorrect password', async () => {
        const user = await User.create({
          username: TEST_USERNAME,
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        });

        const isValid = await user.comparePassword(TEST_PASSWORD_DIFFERENT);
        expect(isValid).toBe(false);
      });

      it('should be case-sensitive', async () => {
        const user = await User.create({
          username: TEST_USERNAME,
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        });

        const isValid = await user.comparePassword(TEST_PASSWORD.toUpperCase());
        expect(isValid).toBe(false);
      });
    });

    describe('Password virtual field', () => {
      it('should accept password through virtual field', async () => {
        const user = new User({
          username: TEST_USERNAME,
          email: TEST_EMAIL,
        });

        (user as any).password = TEST_PASSWORD;
        await user.validate();

        expect(user).toHaveProperty('passwordHash');
        expect(user.hasPassword).toBe(true);
      });

      it('should retrieve password through virtual field', () => {
        const user = new User({
          username: TEST_USERNAME,
          email: TEST_EMAIL,
        });

        (user as any).password = TEST_PASSWORD;
        const retrievedPassword = (user as any).password;

        expect(retrievedPassword).toBe(TEST_PASSWORD);
      });
    });
  });

  describe('Personal ation fields', () => {
    it('should store personal information provided', async () => {
      const userData = {
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        firstName: TEST_FIRSTNAME,
        lastName: TEST_LASTNAME,
        occupation: TEST_OCCUPATION,
        areaOfStudy: TEST_AREAOFSTUDY,
        profileComplete: true,
      };

      const user = await User.create(userData);

      expect(user.firstName).toBe(TEST_FIRSTNAME);
      expect(user.lastName).toBe(TEST_LASTNAME);
      expect(user.occupation).toBe(TEST_OCCUPATION);
      expect(user.areaOfStudy).toBe(TEST_AREAOFSTUDY);
      expect(user.profileComplete).toBe(true);
    });
  });

  describe('OAuth fields', () => {
    describe('Google OAuth', () => {
      it('should store Google OAuth information', async () => {
        const userData = {
          username: TEST_USERNAME,
          googleOAuthId: TEST_OAUTHID,
          googleOAuthEmail: TEST_EMAIL,
          googleOAuthVerified: true,
        };

        const user = await User.create(userData);

        expect(user.googleOAuthId).toBe(TEST_OAUTHID);
        expect(user.googleOAuthEmail).toBe(TEST_EMAIL);
        expect(user.googleOAuthVerified).toBe(true);
      });
    });

    describe('GitHub OAuth', () => {
      it('should store GitHub OAuth information', async () => {
        const userData = {
          username: TEST_USERNAME,
          githubOAuthId: TEST_OAUTHID,
          githubOAuthEmail: TEST_EMAIL,
          githubOAuthVerified: true,
        };

        const user = await User.create(userData);

        expect(user.githubOAuthId).toBe(TEST_OAUTHID);
        expect(user.githubOAuthEmail).toBe(TEST_EMAIL);
        expect(user.githubOAuthVerified).toBe(true);
      });
    });

    it('should allow both OAuth providers', async () => {
      const userData = {
        username: TEST_USERNAME,
        googleOAuthId: TEST_OAUTHID,
        googleOAuthEmail: TEST_EMAIL,
        githubOAuthId: TEST_OAUTHID,
        githubOAuthEmail: TEST_EMAIL,
      };

      const user = await User.create(userData);

      expect(user.googleOAuthId).toBe(TEST_OAUTHID);
      expect(user.githubOAuthId).toBe(TEST_OAUTHID);
    });
  });

  describe('Profile picture', () => {
    it('should store profile picture URL', async () => {
      const userData = {
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        profilePicture: TEST_PROF_PIC_LINK,
        profilePictureSource: 'google',
      };

      const user = await User.create(userData);

      expect(user.profilePicture).toBe(TEST_PROF_PIC_LINK);
      expect(user.profilePictureSource).toBe('google');
    });

    it('should store base64 encoded image', async () => {
      const base64Image = TEST_PROF_PIC_BASE64;

      const userData = {
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        profilePicture: base64Image,
        profilePictureSource: 'upload',
      };

      const user = await User.create(userData);

      expect(user.profilePicture).toBe(base64Image);
      expect(user.profilePictureSource).toBe('upload');
    });
  });

  describe('Account deletion fields', () => {
    it('should mark account for deletion', async () => {
      const deletionDate = new Date(Date.now());

      const userData = {
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        markedForDeletion: true,
        deletionScheduleAt: deletionDate,
      };

      const user = await User.create(userData);

      expect(user.markedForDeletion).toBe(true);
      expect(user.deletionScheduleAt).toEqual(deletionDate);
    });

    it('should allow unmarking for deletion', async () => {
      const userData = {
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        markedForDeletion: true,
        deletionScheduleAt: new Date(Date.now()),
      };

      const user = await User.create(userData);
      expect(user.markedForDeletion).toBe(true);

      user.markedForDeletion = false;
      user.deletionScheduleAt = undefined;
      await user.save();

      expect(user.markedForDeletion).toBe(false);
      expect(user).toHaveProperty('deletionScheduleAt');
      expect(user.deletionScheduleAt).toBeUndefined();
    });
  });

  describe('User queries', () => {
    const EXPECT_VALID = 2;
    const EXPECT_ADMIN = 1;

    beforeEach(async () => {
      await User.create([
        {
          username: TEST_USERNAME,
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          verified: true,
        },
        {
          username: TEST_USERNAME_DIFFERENT,
          email: TEST_EMAIL_DIFFERENT,
          password: TEST_PASSWORD,
          verified: false,
        },
        {
          username: TEST_USERNAME_ADMIN,
          email: TEST_EMAIL_ADMIN,
          password: TEST_PASSWORD,
          verified: true,
          role: ADMIN,
        },
      ]);
    });

    it('should find user by username', async () => {
      const user = await User.findOne({username: TEST_USERNAME});

      expect(user).not.toBeNull();
      expect(user.username).toBe(TEST_USERNAME);
    });

    it('should find user by email', async () => {
      const user = await User.findOne({email: TEST_EMAIL});

      expect(user).not.toBeNull();
      expect(user.email).toBe(TEST_EMAIL);
    });

    it('should find user by ID', async () => {
      const createdUser = await User.findOne({username: TEST_USERNAME});
      const foundUser = await User.findById(createdUser!._id);

      expect(foundUser).not.toBeNull();
      expect(foundUser._id.toString()).toBe(createdUser._id.toString());
    });

    it('should find verified users', async () => {
      const verifiedUsers = await User.find({verified: true});

      expect(verifiedUsers.length).toBe(EXPECT_VALID);
      expect(verifiedUsers.every(u => u.verified)).toBe(true);
    });

    it('should find users by role', async () => {
      const admins = await User.find({role: ADMIN});

      expect(admins.length).toBe(1);
      expect(admins.every(u => u.role === ADMIN)).toBe(true);
    });

    it('should support case-insensitive username search', async () => {
      const user = await User.findOne({username: TEST_USERNAME_CONFLICT}).collation({
        locale: 'en',
        strength: 2,
      });

      expect(user).not.toBeNull();
      expect(user.username).toBe(TEST_USERNAME);
    });

    it('should support case-insensitive email search', async () => {
      const user = await User.findOne({email: TEST_EMAIL_CONFLICT}).collation({
        locale: 'en',
        strength: 2,
      });

      expect(user).not.toBeNull();
      expect(user!.email).toBe(TEST_EMAIL);
    });
  });

  describe('User updates', () => {
    it('should update updatedAt timestamp', async () => {
      const user = await User.create({
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      const originalUpdatedAt = user.updatedAt;

      user.username = TEST_USERNAME_DIFFERENT;
      user.firstName = TEST_FIRSTNAME;
      await user.save();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(user.username).toBe(TEST_USERNAME_DIFFERENT);
      expect(user.firstName).toBe(TEST_FIRSTNAME);
      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should update password correctly', async () => {
      const user = await User.create({
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      const oldHash = user.passwordHash;

      (user as any).password = TEST_PASSWORD_DIFFERENT;
      await user.save();

      expect(user.passwordHash).not.toBe(oldHash);

      const isOldValid = await user.comparePassword(TEST_PASSWORD);
      const isNewValid = await user.comparePassword(TEST_PASSWORD_DIFFERENT);

      expect(isOldValid).toBe(false);
      expect(isNewValid).toBe(true);
    });
  });

  describe('Password rehashing', () => {
    it('should warn when password needs rehashing but password not available', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const user = await User.create({
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      user.passwordIterations = 1000;
      await user.save();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Password needs rehashing but password not available'
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('toJSON method', () => {
    it('should exclude irrelevant fields from JSON', async () => {
      const user = await User.create({
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        verified: true,
        password: TEST_PASSWORD,
        firstName: TEST_FIRSTNAME,
        lastName: TEST_LASTNAME,
        occupation: TEST_OCCUPATION,
        areaOfStudy: TEST_AREAOFSTUDY,
        profileComplete: true,
        googleOAuthId: TEST_OAUTHID,
        googleOAuthEmail: TEST_EMAIL,
        googleOAuthVerified: true,
        githubOAuthId: TEST_OAUTHID,
        githubOAuthEmail: TEST_EMAIL,
        githubOAuthVerified: true,
        profilePicture: TEST_PROF_PIC_BASE64,
        profilePictureSource: 'upload',
        markedForDeletion: true,
        deletionScheduleAt: new Date(Date.now()),
      });

      const json = user.toJSON();

      expect(json.username).toBe(TEST_USERNAME);
      expect(json.email).toBe(TEST_EMAIL);
      expect(json.verified).toBe(true);
      expect(json.firstName).toBe(TEST_FIRSTNAME);
      expect(json.lastName).toBe(TEST_LASTNAME);
      expect(json.occupation).toBe(TEST_OCCUPATION);
      expect(json.areaOfStudy).toBe(TEST_AREAOFSTUDY);
      expect(json.profileComplete).toBe(true);
      expect(json.googleOAuthId).not.toBe(TEST_OAUTHID);
      expect(json.googleOAuthEmail).toBe(TEST_EMAIL);
      expect(json.googleOAuthVerified).toBe(true);
      expect(json.githubOAuthId).not.toBe(TEST_OAUTHID);
      expect(json.githubOAuthEmail).toBe(TEST_EMAIL);
      expect(json.githubOAuthVerified).toBe(true);
      expect(json.profilePicture).toBe(TEST_PROF_PIC_BASE64);
      expect(json.profilePictureSource).toBe('upload');

      expect(json).not.toHaveProperty('passwordHash');
      expect(json).not.toHaveProperty('passwordSalt');
      expect(json).not.toHaveProperty('passwordIterations');
      expect(json).not.toHaveProperty('markedForDeletion');
      expect(json).not.toHaveProperty('deletionScheduleAt');
    });
  });

  describe('Others', () => {
    it('should handle very long username', async () => {
      const longUsername = 'a'.repeat(30);

      const user = await User.create({
        username: longUsername,
        email: TEST_USERNAME,
        password: TEST_PASSWORD,
      });

      expect(user.username).toBe(longUsername);
    });

    it('should handle unicode characters in names', async () => {
      const userData = {
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        firstName: "O'Brien",
        lastName: 'José-María',
      };

      const user = await User.create(userData);

      expect(user.firstName).toBe("O'Brien");
      expect(user.lastName).toBe('José-María');
    });

    it('should handle concurrent user creation', async () => {
      const users = Array.from({length: 10}, (_, i) => ({
        username: `user${i}`,
        email: `user${i}@example.com`,
        password: TEST_PASSWORD,
      }));

      const createdUsers = await Promise.all(users.map(userData => User.create(userData)));

      expect(createdUsers).toHaveLength(10);
      expect(new Set(createdUsers.map(u => u.username)).size).toBe(10);
    });
  });
});
