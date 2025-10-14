import passport from 'passport';
import {Strategy as GoogleStrategy} from 'passport-google-oauth20';
import {Strategy as GitHubStrategy} from 'passport-github2';
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_AUTH_REDIR_URI,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
} from '../constants/env';
import User from '../models/user';
import {MAX_USERNAME_LEN} from '../constants/userParams.ts';
import OAuthType from '../constants/oAuthTypes.ts';
import {verifyToken} from '../utils/jwt.ts';
import {GITHUB_AUTH_REDIR_URI} from '../constants/env.ts';

/**
 * Sanitize username to fit PeerPrep requirements.
 *
 * @param name Existing username provided by OAuth
 * @returns Username containing only characters accepted by `usernameSchema`.
 */
const sanitizeUsername = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
};

/**
 * Generates placeholder username for OAuth users in event of username collision.
 * TODO (if need): Reduce IO by performing batch queries.
 *
 * @param baseUsername Existing username provided from OAuth.
 * @returns Valid unique username completely adhering to `usernameSchema`.
 */
const generateUniqueUsername = async (baseUsername: string): Promise<string> => {
  const baseLen = baseUsername.length;
  let username = baseUsername;
  let truncBase = baseUsername;
  let counter = 2;

  while (true) {
    const exists = await User.exists({username}).collation({locale: 'en', strength: 2});
    if (!exists) break;

    const suffix = `_${counter}`;
    const totLen = baseLen + suffix.length;
    if (totLen > MAX_USERNAME_LEN) {
      truncBase = baseUsername.slice(0, MAX_USERNAME_LEN - suffix.length);
    }
    username = truncBase + suffix;
  }

  return username;
};

interface IOAuthProfileData {
  provider: OAuthType.Google | OAuthType.GitHub;
  oAuthId: string;
  oAuthEmail: string;
  displayName: string;
  firstName: string;
  lastName: string;
  profilePicture: string;
}

const handleOAuthLogin = async (req, data: IOAuthProfileData, cb) => {
  try {
    const {provider, oAuthId, oAuthEmail, displayName, firstName, lastName, profilePicture} = data;

    const oAuthIdField = `${provider}OAuthId`;
    const oAuthEmailField = `${provider}OAuthEmail`;
    const oAuthVerifiedField = `${provider}OAuthVerified`;

    if (!oAuthEmail) {
      return cb(new Error('Email permission required!'), undefined);
    }

    const isLinkingAttempt = req.query?.link === 'true';

    const existingAccessToken = req.cookies?.accessToken;
    if (isLinkingAttempt || existingAccessToken) {
      let userId;
      let payload;

      if (existingAccessToken) {
        const {payload: tmpPayload} = verifyToken(existingAccessToken);
        if (tmpPayload && tmpPayload.userId) {
          userId = tmpPayload.userId;
        }
        payload = tmpPayload;
      }

      if (isLinkingAttempt && !userId) {
        return cb(new Error('Session expired. Please log in and try again'), undefined);
      }

      if (userId) {
        const existingUser = await User.findOne({
          [oAuthIdField]: oAuthId,
          _id: {$ne: payload.userId},
        });

        if (existingUser) {
          return cb(
            new Error('This account is already linked to another PeerPrep account!'),
            undefined
          );
        }
      }

      const user = await User.findById(userId);
      if (!user) {
        return cb(new Error('User not found!'), undefined);
      }

      user[oAuthIdField] = oAuthId;
      user[oAuthEmailField] = oAuthEmail;
      user[oAuthVerifiedField] = true;

      if (!user.profilePicture && profilePicture) {
        user.profilePicture = profilePicture;
        user.profilePictureScoure = provider;
      }

      await user.save();
      return cb(null, user, {linking: true});
    }

    let user = await User.findOne({[oAuthIdField]: oAuthId});
    if (user) return cb(null, user);

    const username = await generateUniqueUsername(sanitizeUsername(displayName));

    user = await User.create({
      username,
      [oAuthIdField]: oAuthId,
      [oAuthEmailField]: oAuthEmail,
      [oAuthVerifiedField]: true,
      firstName: firstName,
      lastName: lastName,
      profilePicture,
      profilePictureSource: provider,
      profileComplete: false,
    });

    return cb(null, user);
  } catch (error) {
    return cb(error, undefined);
  }
};

const extractGoogleProfile = (profile: any): IOAuthProfileData => {
  return {
    provider: OAuthType.Google,
    oAuthId: profile.id,
    oAuthEmail: profile.emails?.[0]?.value?.trim() ?? '',

    displayName:
      profile.username?.trim() ??
      profile.displayName?.trim() ??
      profile.emails?.[0]?.value?.split('@')[0] ??
      '',
    firstName: profile.name?.givenName?.trim() ?? '',
    lastName: profile.name?.familyName?.trim() ?? '',
    profilePicture: profile.photos?.[0]?.value?.trim() ?? '',
  };
};

const extractGithubProfile = (profile: any): IOAuthProfileData => {
  const fullName = profile.displayName?.trim() ?? '';
  const [first, ...rest] = fullName.split(' ');

  return {
    provider: OAuthType.GitHub,
    oAuthId: profile.id,
    oAuthEmail: profile.emails?.[0]?.value?.trim() ?? '',
    displayName:
      profile.username?.trim() ??
      profile.displayName?.trim() ??
      profile.emails?.[0]?.value?.split('@')[0] ??
      '',
    firstName: first ?? 'User',
    lastName: rest.join(' '),
    profilePicture: profile.photos?.[0]?.value ?? '',
  };
};

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_AUTH_REDIR_URI,
      scope: ['profile', 'email'],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, cb) =>
      handleOAuthLogin(req, extractGoogleProfile(profile), cb)
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: GITHUB_AUTH_REDIR_URI,
      scope: ['read:user', 'user:email'],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, cb) =>
      handleOAuthLogin(req, extractGithubProfile(profile), cb)
  )
);

export default passport;
