import passport from 'passport';
import {Strategy as GitHubStrategy} from 'passport-github2';
import {Strategy as GoogleStrategy} from 'passport-google-oauth20';
import {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GOOGLE_AUTH_REDIR_URI,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} from '../constants/env';
import {GITHUB_AUTH_REDIR_URI} from '../constants/env.ts';
import OAuthType from '../constants/oAuthTypes.ts';
import {MAX_USERNAME_LEN} from '../constants/userParams.ts';
import User from '../models/user';
import {verifyToken} from '../utils/jwt.ts';
import OAuthLink from '../models/oAuthLink.ts';

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

/**
 * Handles OAuth login.
 *
 * @param req Request object.
 * @param data Profile data of associated OAuth (Google or GitHub).
 * @param cb Callback function.
 * @returns User object if successful, else error.
 */
const handleOAuthLogin = async (req, data: IOAuthProfileData, cb) => {
  try {
    if (req.query.state) {
      try {
        const state = JSON.parse(req.query.state);

        if (state.link && state.linkId) {
          const oAuthLink = await OAuthLink.findById(state.linkId);

          if (!oAuthLink) {
            return cb(new Error('Linking session expired. Please try again.'), undefined);
          }

          // Check if session is expired
          if (new Date() > oAuthLink.expiresAt) {
            await oAuthLink.deleteOne();
            return cb(new Error('Linking session expired. Please try again.'), undefined);
          }

          req.authenticatedUserId = oAuthLink.userId;

          await oAuthLink.deleteOne();
        }
      } catch (e) {
        return cb(new Error('Invalid linking request. Please try again.'), undefined);
      }
    }

    const {provider, oAuthId, oAuthEmail, displayName, firstName, lastName, profilePicture} = data;

    const oAuthIdField = `${provider}OAuthId`;
    const oAuthEmailField = `${provider}OAuthEmail`;
    const oAuthVerifiedField = `${provider}OAuthVerified`;

    if (!oAuthEmail) {
      return cb(new Error('Email permission required!'), undefined);
    }

    // Check if user is logging in for the first time or is linking an account to an existing user.
    let isLinkingAttempt = req.query?.link === 'true';
    if (req.query?.state) {
      try {
        const state = JSON.parse(req.query.state);
        isLinkingAttempt = state.link === true;
      } catch (e) {}
    }

    const existingAccessToken = req.cookies?.accessToken;
    if (isLinkingAttempt || existingAccessToken || req.authenticatedUserId) {
      let userId = req.authenticatedUserId; // From OAuthLink session
      let payload;

      // Only check cookies if we don't already have userId from linking session
      if (!userId && existingAccessToken) {
        const {payload: tmpPayload} = verifyToken(existingAccessToken);
        if (tmpPayload && tmpPayload.userId) {
          userId = tmpPayload.userId;
        }
        payload = tmpPayload;
      }

      if (isLinkingAttempt && !userId) {
        return cb(new Error('Session expired. Please log in and try again'), undefined);
      }

      // Checks if exisiting user with OAuth is present.
      if (userId) {
        const existingUser = await User.findOne({
          [oAuthIdField]: oAuthId,
          _id: {$ne: userId},
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

      // OAuth profile picture is used if none are available.
      if (!user.profilePicture && profilePicture) {
        user.profilePicture = profilePicture;
        user.profilePictureScoure = provider;
      }

      await user.save();
      return cb(null, user, {linking: true});
    }

    // Creates a new user with OAuth.
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

/**
 * Extracts and normalizes profile data from OAuth providers.
 *
 * @param provider OAuth provider type (Google or GitHub).
 * @param profile Raw profile data from OAuth provider.
 * @returns Normalized profile data structure.
 */
const extractOAuthProfile = (
  provider: OAuthType.Google | OAuthType.GitHub,
  profile: any
): IOAuthProfileData => {
  const displayName =
    profile.username?.trim() ??
    profile.displayName?.trim() ??
    profile.emails?.[0]?.value?.split('@')[0] ??
    '';

  const fullName = profile.displayName?.trim() ?? '';
  const [first, ...rest] = fullName.split(' ');

  return {
    provider,
    oAuthId: profile.id,
    oAuthEmail: profile.emails?.[0]?.value?.trim() ?? '',
    displayName,
    firstName: profile.name?.givenName?.trim() ?? first ?? '',
    lastName: profile.name?.familyName?.trim() ?? rest.join(' '),
    profilePicture: profile.photos?.[0]?.value?.trim() ?? '',
  };
};

/**
 * Creates an OAuth strategy configuration.
 *
 * @param provider OAuth provider type.
 * @param StrategyClass The passport strategy class to use.
 * @param config Strategy-specific configuration.
 * @returns Configured passport strategy.
 */
const createOAuthStrategy = (
  provider: OAuthType.Google | OAuthType.GitHub,
  StrategyClass: any,
  config: {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope: string[];
  }
) => {
  return new StrategyClass(
    {
      ...config,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, cb) =>
      handleOAuthLogin(req, extractOAuthProfile(provider, profile), cb)
  );
};

passport.use(
  createOAuthStrategy(OAuthType.Google, GoogleStrategy, {
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_AUTH_REDIR_URI,
    scope: ['profile', 'email'],
  })
);

passport.use(
  createOAuthStrategy(OAuthType.GitHub, GitHubStrategy, {
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: GITHUB_AUTH_REDIR_URI,
    scope: ['read:user', 'user:email'],
  })
);

export default passport;
