// AI Assistance Disclosure:
// Tool: Claude 4.5 Sonnet (Anthropic)
// Date: 2025-09-2025
// Scope: Generated comprehensive test cases
// Author review: Tests validated for correctness and fixed test logic where applicable.

import {
  MAX_PW_LEN,
  MAX_USERNAME_LEN,
  MIN_PW_LEN,
  MIN_USERNAME_LEN,
} from '../../constants/userParams';
import {
  changePersonalInfoSchema,
  changePwSchema,
  changeRoleSchema,
  changeUsernameOrEmailSchema,
  emailSchema,
  loginSchema,
  passwordAndConfirmPassword,
  passwordResetSchema,
  registerSchema,
  setPwSchema,
  usernameAndEmail,
  usernameOrEmail,
  verificationCodeSchema,
} from '../../controllers/userSchema';

describe('controllers/userSchema', () => {
  describe('emailSchema', () => {
    it('should accept valid email formats', () => {
      expect(emailSchema.safeParse('user@example.com').success).toBe(true);
      expect(emailSchema.safeParse('user.name@example.com').success).toBe(true);
      expect(emailSchema.safeParse('user+tag@example.co.uk').success).toBe(true);
      expect(emailSchema.safeParse('123@example.com').success).toBe(true);
    });

    it('should trim emails with leading/trailing spaces', () => {
      const result = emailSchema.safeParse('  user@example.com  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('user@example.com');
      }
    });

    it('should convert email to lowercase', () => {
      const result = emailSchema.safeParse('User@Example.COM');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('user@example.com');
      }
    });

    it('should reject invalid email formats', () => {
      expect(emailSchema.safeParse('notanemail').success).toBe(false);
      expect(emailSchema.safeParse('@example.com').success).toBe(false);
      expect(emailSchema.safeParse('user@').success).toBe(false);
      expect(emailSchema.safeParse('user @example.com').success).toBe(false);
      expect(emailSchema.safeParse('user@example').success).toBe(false);
      expect(emailSchema.safeParse('user..name@example.com').success).toBe(false);
    });

    it('should reject empty emails', () => {
      expect(emailSchema.safeParse('').success).toBe(false);
      expect(emailSchema.safeParse('   ').success).toBe(false);
    });

    it('should handle complex valid email formats', () => {
      expect(emailSchema.safeParse('user+filter@subdomain.example.com').success).toBe(true);
      expect(emailSchema.safeParse('user_name@example-domain.com').success).toBe(true);
    });

    it('should handle special characters correctly', () => {
      expect(emailSchema.safeParse('user.name+tag@example.com').success).toBe(true);
      expect(emailSchema.safeParse('user_123@example.com').success).toBe(true);
    });
  });

  describe('verificationCodeSchema', () => {
    it('should accept valid MongoDB ObjectId format', () => {
      expect(verificationCodeSchema.safeParse('507f1f77bcf86cd799439011').success).toBe(true);
      expect(verificationCodeSchema.safeParse('000000000000000000000000').success).toBe(true);
      expect(verificationCodeSchema.safeParse('ffffffffffffffffffffffff').success).toBe(true);
    });

    it('should trim verification codes', () => {
      const result = verificationCodeSchema.safeParse('  507f1f77bcf86cd799439011  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('507f1f77bcf86cd799439011');
      }
    });

    it('should reject codes shorter than MONGO_MIN_ID_LEN (empty)', () => {
      expect(verificationCodeSchema.safeParse('').success).toBe(false);
    });

    it('should reject codes longer than MONGO_MAX_ID_LEN ', () => {
      expect(verificationCodeSchema.safeParse('507f1f77bcf86cd799439011extra').success).toBe(false);
    });
  });

  describe('usernameAndEmail', () => {
    it('should accept valid username and email combination', () => {
      const result = usernameAndEmail.safeParse({
        username: 'john_doe',
        email: 'john@example.com',
      });
      expect(result.success).toBe(true);
    });

    it('should trim both fields', () => {
      const result = usernameAndEmail.safeParse({
        username: '  john_doe  ',
        email: '  john@example.com  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe('john_doe');
        expect(result.data.email).toBe('john@example.com');
      }
    });

    it('should accept valid usernames', () => {
      expect(
        usernameAndEmail.safeParse({
          username: 'john_doe',
          email: 'john@example.com',
        }).success
      ).toBe(true);
      expect(
        usernameAndEmail.safeParse({
          username: 'user123',
          email: 'john@example.com',
        }).success
      ).toBe(true);
      expect(
        usernameAndEmail.safeParse({
          username: 'USERNAME',
          email: 'john@example.com',
        }).success
      ).toBe(true);
      expect(
        usernameAndEmail.safeParse({
          username: 'user_name_123',
          email: 'john@example.com',
        }).success
      ).toBe(true);
    });

    it('should reject usernames shorter than MIN_USERNAME_LEN', () => {
      expect(
        usernameAndEmail.safeParse({
          username: 'a'.repeat(MIN_USERNAME_LEN - 1),
          email: 'john@example.com',
        }).success
      ).toBe(false);
      expect(
        usernameAndEmail.safeParse({
          username: 'a'.repeat(MIN_USERNAME_LEN - 2),
          email: 'john@example.com',
        }).success
      ).toBe(false);
    });

    it('should accept username at MIN_USERNAME_LEN', () => {
      expect(
        usernameAndEmail.safeParse({
          username: 'a'.repeat(MIN_USERNAME_LEN),
          email: 'john@example.com',
        }).success
      ).toBe(true);
    });

    it('should reject usernames longer than MAX_USERNAME_LEN', () => {
      const longUsername = 'a'.repeat(MAX_USERNAME_LEN + 1);
      expect(
        usernameAndEmail.safeParse({
          username: longUsername,
          email: 'john@example.com',
        }).success
      ).toBe(false);
    });

    it('should accept username at MAX_USERNAME_LEN', () => {
      const maxUsername = 'a'.repeat(MAX_USERNAME_LEN);
      expect(
        usernameAndEmail.safeParse({
          username: maxUsername,
          email: 'john@example.com',
        }).success
      ).toBe(true);
    });

    it('should reject usernames with special characters', () => {
      expect(
        usernameAndEmail.safeParse({
          username: 'user-name',
          email: 'john@example.com',
        }).success
      ).toBe(false);
      expect(
        usernameAndEmail.safeParse({
          username: 'user.name',
          email: 'john@example.com',
        }).success
      ).toBe(false);
      expect(
        usernameAndEmail.safeParse({
          username: 'user@name',
          email: 'john@example.com',
        }).success
      ).toBe(false);
      expect(
        usernameAndEmail.safeParse({
          username: 'user name',
          email: 'john@example.com',
        }).success
      ).toBe(false);
    });

    it('should only allow alphanumerics and underscores', () => {
      expect(
        usernameAndEmail.safeParse({
          username: 'user___123',
          email: 'john@example.com',
        }).success
      ).toBe(true);
      expect(
        usernameAndEmail.safeParse({
          username: '___user',
          email: 'john@example.com',
        }).success
      ).toBe(true);
      expect(
        usernameAndEmail.safeParse({
          username: '123user',
          email: 'john@example.com',
        }).success
      ).toBe(true);
    });

    it('should trim username with leading/trailing spaces', () => {
      const result = usernameAndEmail.safeParse({
        username: '  username  ',
        email: 'john@example.com',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe('username');
      }
    });

    it('should reject empty or whitespace-only usernames', () => {
      expect(
        usernameAndEmail.safeParse({
          username: '',
          email: 'john@example.com',
        }).success
      ).toBe(false);
      expect(
        usernameAndEmail.safeParse({
          username: '   ',
          email: 'john@example.com',
        }).success
      ).toBe(false);
    });
  });

  it('should reject invalid email', () => {
    expect(
      usernameAndEmail.safeParse({
        username: 'john_doe',
        email: 'notanemail',
      }).success
    ).toBe(false);
  });

  it('should reject missing fields', () => {
    expect(usernameAndEmail.safeParse({username: 'john_doe'}).success).toBe(false);
    expect(usernameAndEmail.safeParse({email: 'john@example.com'}).success).toBe(false);
    expect(usernameAndEmail.safeParse({}).success).toBe(false);
  });

  describe('usernameOrEmail', () => {
    it('should accept any non-empty string as identifier', () => {
      expect(
        usernameOrEmail.safeParse({
          identifier: 'john_doe',
        }).success
      ).toBe(true);
      expect(
        usernameOrEmail.safeParse({
          identifier: 'john@example.com',
        }).success
      ).toBe(true);
      expect(
        usernameOrEmail.safeParse({
          identifier: 'a',
        }).success
      ).toBe(true);
    });

    it('should trim identifier', () => {
      const result = usernameOrEmail.safeParse({
        identifier: '  john_doe  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.identifier).toBe('john_doe');
      }
    });

    it('should reject empty identifier', () => {
      expect(
        usernameOrEmail.safeParse({
          identifier: '',
        }).success
      ).toBe(false);
    });

    it('should reject whitespace-only identifier', () => {
      expect(
        usernameOrEmail.safeParse({
          identifier: '   ',
        }).success
      ).toBe(false);
    });

    it('should reject missing identifier', () => {
      expect(usernameOrEmail.safeParse({}).success).toBe(false);
    });
  });

  describe('passwordAndConfirmPassword', () => {
    it('should accept valid passwords', () => {
      expect(
        passwordAndConfirmPassword.safeParse({
          password: 'password123',
          confirmPassword: 'password123',
        }).success
      ).toBe(true);
      expect(
        passwordAndConfirmPassword.safeParse({
          password: 'MyP@ssw0rd!',
          confirmPassword: 'MyP@ssw0rd!',
        }).success
      ).toBe(true);
    });

    it('should trim passwords', () => {
      const result = passwordAndConfirmPassword.safeParse({
        password: '  password123  ',
        confirmPassword: '  password123  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.password).toBe('password123');
        expect(result.data.confirmPassword).toBe('password123');
      }
    });

    it('should reject passwords shorter than MIN_PW_LEN', () => {
      expect(
        passwordAndConfirmPassword.safeParse({
          password: 'a'.repeat(MIN_PW_LEN - 1),
          confirmPassword: 'a'.repeat(MIN_PW_LEN - 1),
        }).success
      ).toBe(false);
    });

    it('should accept password at MIN_PW_LEN', () => {
      expect(
        passwordAndConfirmPassword.safeParse({
          password: 'a'.repeat(MIN_PW_LEN),
          confirmPassword: 'a'.repeat(MIN_PW_LEN),
        }).success
      ).toBe(true);
    });

    it('should reject passwords longer than MAX_PW_LEN', () => {
      const longPassword = 'a'.repeat(MAX_PW_LEN + 1);
      expect(
        passwordAndConfirmPassword.safeParse({
          password: longPassword,
          confirmPassword: longPassword,
        }).success
      ).toBe(false);
    });

    it('should accept password at MAX_PW_LEN', () => {
      const maxPassword = 'a'.repeat(MAX_PW_LEN);
      expect(
        passwordAndConfirmPassword.safeParse({
          password: maxPassword,
          confirmPassword: maxPassword,
        }).success
      ).toBe(true);
    });

    it('should accept passwords with special characters', () => {
      expect(
        passwordAndConfirmPassword.safeParse({
          password: 'P@ssw0rd!#$%',
          confirmPassword: 'P@ssw0rd!#$%',
        }).success
      ).toBe(true);
    });

    it('should accept passwords with spaces', () => {
      expect(
        passwordAndConfirmPassword.safeParse({
          password: 'pass word 123',
          confirmPassword: 'pass word 123',
        }).success
      ).toBe(true);
    });

    it('should reject empty passwords', () => {
      expect(
        passwordAndConfirmPassword.safeParse({
          password: '',
          confirmPassword: '',
        }).success
      ).toBe(false);
    });

    it('should reject whitespace-only passwords', () => {
      expect(
        passwordAndConfirmPassword.safeParse({
          password: '   ',
          confirmPassword: '   ',
        }).success
      ).toBe(false);
    });

    it('should reject missing fields', () => {
      expect(passwordAndConfirmPassword.safeParse({password: 'password123'}).success).toBe(false);
      expect(passwordAndConfirmPassword.safeParse({confirmPassword: 'password123'}).success).toBe(
        false
      );
      expect(passwordAndConfirmPassword.safeParse({}).success).toBe(false);
    });
  });

  // Already covered.
  describe('registerSchema', () => {
    const validRegisterData = {
      username: 'john_doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    it('should accept valid registration data', () => {
      expect(registerSchema.safeParse(validRegisterData).success).toBe(true);
    });
  });

  // Already covered.
  describe('loginSchema', () => {
    it('should accept valid login with username', () => {
      expect(
        loginSchema.safeParse({
          identifier: 'john_doe',
          password: 'password123',
        }).success
      ).toBe(true);
    });

    it('should accept valid login with email', () => {
      expect(
        loginSchema.safeParse({
          identifier: 'john@example.com',
          password: 'password123',
        }).success
      ).toBe(true);
    });
  });

  // Already covered.
  describe('changeUsernameOrEmailSchema', () => {
    it('should accept when only username is provided', () => {
      expect(
        changeUsernameOrEmailSchema.safeParse({
          username: 'new_username',
        }).success
      ).toBe(true);
    });

    it('should accept when only email is provided', () => {
      expect(
        changeUsernameOrEmailSchema.safeParse({
          email: 'new@example.com',
        }).success
      ).toBe(true);
    });

    it('should accept when both are provided', () => {
      expect(
        changeUsernameOrEmailSchema.safeParse({
          username: 'new_username',
          email: 'new@example.com',
        }).success
      ).toBe(true);
    });

    it('should reject when neither is provided', () => {
      const result = changeUsernameOrEmailSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some(issue => issue.message.includes('Either username or email'))
        ).toBe(true);
      }
    });
  });

  // Already covered.
  describe('setPwSchema', () => {
    it('should accept valid matching passwords', () => {
      expect(
        setPwSchema.safeParse({
          password: 'newpassword123',
          confirmPassword: 'newpassword123',
        }).success
      ).toBe(true);
    });

    it('should reject mismatched passwords', () => {
      const result = setPwSchema.safeParse({
        password: 'newpassword123',
        confirmPassword: 'different123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.message.includes('do not match'))).toBe(
          true
        );
      }
    });
  });

  // Already covered.
  describe('changePwSchema', () => {
    const validChangePasswordData = {
      currentPassword: 'oldpassword123',
      password: 'newpassword123',
      confirmPassword: 'newpassword123',
    };

    it('should accept valid password change data', () => {
      expect(changePwSchema.safeParse(validChangePasswordData).success).toBe(true);
    });
  });

  // Already covered.
  describe('passwordResetSchema', () => {
    it('should accept valid reset data', () => {
      expect(
        passwordResetSchema.safeParse({
          verificationCode: '507f1f77bcf86cd799439011',
          password: 'newpassword123',
        }).success
      ).toBe(true);
    });
  });

  // Already covered.
  describe('changePersonalInfoSchema', () => {
    const validPersonalInfo = {
      firstName: 'John',
      lastName: 'Doe',
      occupation: 'information-technology',
      areaOfStudy: 'computer-science',
    };

    it('should accept valid personal info', () => {
      expect(changePersonalInfoSchema.safeParse(validPersonalInfo).success).toBe(true);
    });

    it('should trim name fields', () => {
      const result = changePersonalInfoSchema.safeParse({
        ...validPersonalInfo,
        firstName: '  John  ',
        lastName: '  Doe  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.firstName).toBe('John');
        expect(result.data.lastName).toBe('Doe');
      }
    });

    it('should accept valid names with various formats', () => {
      expect(
        changePersonalInfoSchema.safeParse({
          ...validPersonalInfo,
          firstName: 'John',
          lastName: 'Smith',
        }).success
      ).toBe(true);
      expect(
        changePersonalInfoSchema.safeParse({
          ...validPersonalInfo,
          firstName: 'Mary Jane',
          lastName: 'Watson',
        }).success
      ).toBe(true);
      expect(
        changePersonalInfoSchema.safeParse({
          ...validPersonalInfo,
          firstName: "O'Connor",
          lastName: 'Smith',
        }).success
      ).toBe(true);
      expect(
        changePersonalInfoSchema.safeParse({
          ...validPersonalInfo,
          firstName: 'Jean-Pierre',
          lastName: 'Dubois',
        }).success
      ).toBe(true);
    });

    it('should accept international names', () => {
      expect(
        changePersonalInfoSchema.safeParse({
          ...validPersonalInfo,
          firstName: 'José',
          lastName: 'García',
        }).success
      ).toBe(true);
      expect(
        changePersonalInfoSchema.safeParse({
          ...validPersonalInfo,
          firstName: '李',
          lastName: '明',
        }).success
      ).toBe(true);
      expect(
        changePersonalInfoSchema.safeParse({
          ...validPersonalInfo,
          firstName: 'Müller',
          lastName: 'Schmidt',
        }).success
      ).toBe(true);
    });

    it('should accept names with dots', () => {
      expect(
        changePersonalInfoSchema.safeParse({
          ...validPersonalInfo,
          firstName: 'Dr. John',
          lastName: 'Smith Jr.',
        }).success
      ).toBe(true);
    });

    it('should reject empty names', () => {
      expect(
        changePersonalInfoSchema.safeParse({
          ...validPersonalInfo,
          firstName: '',
        }).success
      ).toBe(false);
      expect(
        changePersonalInfoSchema.safeParse({
          ...validPersonalInfo,
          lastName: '',
        }).success
      ).toBe(false);
    });

    it('should reject whitespace-only names', () => {
      expect(
        changePersonalInfoSchema.safeParse({
          ...validPersonalInfo,
          firstName: '   ',
        }).success
      ).toBe(false);
    });

    it('should reject names with invalid characters', () => {
      expect(
        changePersonalInfoSchema.safeParse({
          ...validPersonalInfo,
          firstName: 'John123',
        }).success
      ).toBe(false);
      expect(
        changePersonalInfoSchema.safeParse({
          ...validPersonalInfo,
          firstName: 'John@Smith',
        }).success
      ).toBe(false);
      expect(
        changePersonalInfoSchema.safeParse({
          ...validPersonalInfo,
          firstName: 'John#Smith',
        }).success
      ).toBe(false);
      expect(
        changePersonalInfoSchema.safeParse({
          ...validPersonalInfo,
          firstName: 'John_Smith',
        }).success
      ).toBe(false);
    });

    it('should reject names longer than 50 characters', () => {
      const longName = 'a'.repeat(51);
      expect(
        changePersonalInfoSchema.safeParse({
          ...validPersonalInfo,
          firstName: longName,
        }).success
      ).toBe(false);
    });

    it('should accept names exactly 50 characters', () => {
      const exactName = 'a'.repeat(50);
      expect(
        changePersonalInfoSchema.safeParse({
          ...validPersonalInfo,
          firstName: exactName,
        }).success
      ).toBe(true);
    });

    it('should reject invalid occupation', () => {
      const result = changePersonalInfoSchema.safeParse({
        ...validPersonalInfo,
        occupation: 'invalid-occupation',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.message.includes('occupation'))).toBe(true);
      }
    });

    it('should reject invalid area of study', () => {
      const result = changePersonalInfoSchema.safeParse({
        ...validPersonalInfo,
        areaOfStudy: 'invalid-area',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.message.includes('area of study'))).toBe(
          true
        );
      }
    });

    it('should reject empty occupation', () => {
      expect(
        changePersonalInfoSchema.safeParse({
          ...validPersonalInfo,
          occupation: '',
        }).success
      ).toBe(false);
    });

    it('should reject empty area of study', () => {
      expect(
        changePersonalInfoSchema.safeParse({
          ...validPersonalInfo,
          areaOfStudy: '',
        }).success
      ).toBe(false);
    });

    it('should trim occupation and areaOfStudy', () => {
      const result = changePersonalInfoSchema.safeParse({
        ...validPersonalInfo,
        occupation: '  information-technology  ',
        areaOfStudy: '  computer-science  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.occupation).toBe('information-technology');
        expect(result.data.areaOfStudy).toBe('computer-science');
      }
    });

    it('should reject missing required fields', () => {
      expect(
        changePersonalInfoSchema.safeParse({
          firstName: 'John',
          lastName: 'Doe',
          occupation: 'information-technology',
        }).success
      ).toBe(false);
      expect(
        changePersonalInfoSchema.safeParse({
          firstName: 'John',
          lastName: 'Doe',
          areaOfStudy: 'computer-science',
        }).success
      ).toBe(false);
    });
  });

  describe('changeRoleSchema', () => {
    it('should accept admin role', () => {
      expect(
        changeRoleSchema.safeParse({
          role: 'admin',
        }).success
      ).toBe(true);
    });

    it('should accept user role', () => {
      expect(
        changeRoleSchema.safeParse({
          role: 'user',
        }).success
      ).toBe(true);
    });

    it('should reject invalid roles', () => {
      expect(
        changeRoleSchema.safeParse({
          role: 'moderator',
        }).success
      ).toBe(false);
      expect(
        changeRoleSchema.safeParse({
          role: 'superuser',
        }).success
      ).toBe(false);
      expect(
        changeRoleSchema.safeParse({
          role: 'Admin', // case sensitive
        }).success
      ).toBe(false);
    });

    it('should reject empty role', () => {
      expect(
        changeRoleSchema.safeParse({
          role: '',
        }).success
      ).toBe(false);
    });

    it('should reject missing role', () => {
      expect(changeRoleSchema.safeParse({}).success).toBe(false);
    });
  });
});
