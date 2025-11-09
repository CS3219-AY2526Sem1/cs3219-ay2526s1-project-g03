import OAuthType from '../../constants/oAuthTypes';
import {MAX_USERNAME_LEN} from '../../constants/userParams';
import User from '../../models/user';
import {
  extractOAuthProfile,
  generateUniqueUsername,
  sanitizeUsername,
} from '../../services/passport';

jest.mock('../../models/user');

describe('Passport OAuth Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sanitizeUsername', () => {
    it('should replace special characters with underscores', () => {
      expect(sanitizeUsername('john@doe!')).toBe('john_doe_');
      expect(sanitizeUsername('user#123')).toBe('user_123');
    });

    it('should preserve alphanumeric and underscores', () => {
      expect(sanitizeUsername('john_doe123')).toBe('john_doe123');
    });

    it('should handle edge cases', () => {
      expect(sanitizeUsername('')).toBe('');
      expect(sanitizeUsername('@#$%')).toBe('____');
    });
  });

  describe('generateUniqueUsername', () => {
    it('should return base username if available', async () => {
      (User.exists as jest.Mock).mockReturnValue({
        collation: jest.fn().mockResolvedValue(false),
      });

      const result = await generateUniqueUsername('testuser');

      expect(result).toBe('testuser');
      expect(User.exists).toHaveBeenCalledWith({username: 'testuser'});
    });

    it('should append counter on collision', async () => {
      (User.exists as jest.Mock).mockReturnValue({
        collation: jest
          .fn()
          .mockResolvedValueOnce(true)
          .mockResolvedValueOnce(true)
          .mockResolvedValueOnce(true)
          .mockResolvedValueOnce(true)
          .mockResolvedValueOnce(true)
          .mockResolvedValueOnce(true)
          .mockResolvedValueOnce(true)
          .mockResolvedValueOnce(true)
          .mockResolvedValueOnce(true)
          .mockResolvedValueOnce(false),
      });

      const result = await generateUniqueUsername('testuser');

      expect(result).toBe('testuser_10');
      expect(User.exists).toHaveBeenCalledTimes(10);
    });

    it('should use case-insensitive collation', async () => {
      (User.exists as jest.Mock).mockReturnValue({
        collation: jest.fn().mockResolvedValue(false),
      });

      await generateUniqueUsername('TestUser');

      expect(User.exists).toHaveBeenCalledWith(expect.objectContaining({username: 'TestUser'}));
    });

    it('should truncate when exceeding MAX_USERNAME_LEN', async () => {
      const longUsername = 'a'.repeat(MAX_USERNAME_LEN);

      (User.exists as jest.Mock).mockReturnValue({
        collation: jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false),
      });

      const result = await generateUniqueUsername(longUsername);

      expect(result.length).toBe(MAX_USERNAME_LEN);
      expect(result).toMatch(/^a{28}_2$/);
    });

    it('should handle empty username', async () => {
      (User.exists as jest.Mock).mockReturnValue({
        collation: jest.fn().mockResolvedValue(false),
      });
      expect(await generateUniqueUsername('')).toBe('');
    });
  });

  describe('extractOAuthProfile', () => {
    it('should extract complete profile', () => {
      const profile = {
        id: 'google123',
        emails: [{value: 'test@example.com'}],
        displayName: 'John Doe',
        name: {givenName: 'John', familyName: 'Doe'},
        photos: [{value: 'https://example.com/photo.jpg'}],
      };

      const result = extractOAuthProfile(OAuthType.Google, profile);

      expect(result).toEqual({
        provider: OAuthType.Google,
        oAuthId: 'google123',
        oAuthEmail: 'test@example.com',
        displayName: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        profilePicture: 'https://example.com/photo.jpg',
      });
    });

    it('should prioritize username over displayName', () => {
      const profile = {
        id: 'github123',
        username: 'johndoe',
        displayName: 'John Doe (Different)',
        emails: [{value: 'john@example.com'}],
      };

      const result = extractOAuthProfile(OAuthType.GitHub, profile);

      expect(result.displayName).toBe('johndoe');
    });

    it('should fallback to email username when no display name', () => {
      const profile = {
        id: 'google123',
        emails: [{value: 'test@example.com'}],
      };

      const result = extractOAuthProfile(OAuthType.Google, profile);

      expect(result.displayName).toBe('test');
      expect(result.oAuthEmail).toBe('test@example.com');
    });

    it('should trim whitespace from all fields', () => {
      const profile = {
        id: 'google123',
        emails: [{value: '  test@example.com  '}],
        displayName: '  John Doe  ',
        name: {givenName: '  John  ', familyName: '  Doe  '},
        photos: [{value: '  https://example.com/photo.jpg  '}],
      };

      const result = extractOAuthProfile(OAuthType.Google, profile);

      expect(result.oAuthEmail).toBe('test@example.com');
      expect(result.displayName).toBe('John Doe');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.profilePicture).toBe('https://example.com/photo.jpg');
    });

    it('should parse name from displayName when name object missing', () => {
      const profile = {
        id: 'google123',
        emails: [{value: 'test@example.com'}],
        displayName: 'John Michael Doe',
      };

      const result = extractOAuthProfile(OAuthType.Google, profile);

      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Michael Doe');
    });

    it('should handle missing optional fields', () => {
      const profile = {
        id: 'google123',
        emails: [{value: 'test@example.com'}],
        displayName: 'JohnDoe',
      };

      const result = extractOAuthProfile(OAuthType.Google, profile);

      expect(result.firstName).toBe('JohnDoe');
      expect(result.lastName).toBe('');
      expect(result.profilePicture).toBe('');
    });

    it('should handle all empty values', () => {
      const profile = {
        id: 'test123',
        emails: [{value: ''}],
        displayName: '',
      };

      const result = extractOAuthProfile(OAuthType.Google, profile);

      expect(result.oAuthId).toBe('test123');
      expect(result.oAuthEmail).toBe('');
      expect(result.displayName).toBe('');
    });

    it('should handle whitespace-only values', () => {
      const profile = {
        id: 'test123',
        emails: [{value: '   '}],
        displayName: '   ',
        name: {givenName: '   ', familyName: '   '},
      };

      const result = extractOAuthProfile(OAuthType.Google, profile);

      expect(result.oAuthEmail).toBe('');
      expect(result.displayName).toBe('');
      expect(result.firstName).toBe('');
      expect(result.lastName).toBe('');
    });

    it('should handle undefined/null gracefully', () => {
      const profile = {id: 'test123'};

      const result = extractOAuthProfile(OAuthType.Google, profile);

      expect(result.oAuthId).toBe('test123');
      expect(result.oAuthEmail).toBe('');
      expect(result.displayName).toBe('');
    });
  });

  // Given nature of controller, handleOAuthLogin will be tested within controller implicitly.
});
