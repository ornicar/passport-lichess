// Load modules.
var OAuth2Strategy = require('passport-oauth2')
  , util = require('util')
  , Profile = require('./profile')
  , InternalOAuthError = require('passport-oauth2').InternalOAuthError
  , APIError = require('./errors/apierror');


/**
 * `Strategy` constructor.
 *
 * The Lichess authentication strategy authenticates requests by delegating to
 * Lichess using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `cb`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `clientID`      your Lichess application's Client ID
 *   - `clientSecret`  your Lichess application's Client Secret
 *   - `callbackURL`   URL to which Lichess will redirect the user after granting authorization
 *   - `scope`         array of permission scopes to request. See https://lichess.org/api#section/Authentication
 *   — `userAgent`     All API requests should include a valid User Agent string.  e.g: domain name of your application.
 *
 * Examples:
 *
 *     passport.use(new LichessStrategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/lichess/callback',
 *         userAgent: 'myapp.com'
 *       },
 *       function(accessToken, refreshToken, profile, cb) {
 *         User.findOrCreate(..., function (err, user) {
 *           cb(err, user);
 *         });
 *       }
 *     ));
 *
 * @constructor
 * @param {object} options
 * @param {function} verify
 * @access public
 */
function Strategy(options, verify) {
  options = options || {};
  options.authorizationURL = options.authorizationURL || 'https://oauth.lichess.org/oauth/authorize';
  options.tokenURL = options.tokenURL || 'https://oauth.lichess.org/oauth';
  options.scopeSeparator = options.scopeSeparator || ' ';
  options.customHeaders = options.customHeaders || {};

  OAuth2Strategy.call(this, options, verify);
  this.name = 'lichess';
  this._userProfileURL = options.userProfileURL || 'https://lichess.org/api/account';
  this._oauth2.useAuthorizationHeaderforGET(true);

  // NOTE: GitHub returns an HTTP 200 OK on error responses.  As a result, the
  //       underlying `oauth` implementation understandably does not parse the
  //       response as an error.  This code swizzles the implementation to
  //       handle this condition.
  // var self = this;
  // var _oauth2_getOAuthAccessToken = this._oauth2.getOAuthAccessToken;
  // this._oauth2.getOAuthAccessToken = function(code, params, callback) {
  //   _oauth2_getOAuthAccessToken.call(self._oauth2, code, params, function(err, accessToken, refreshToken, params) {
  //     if (err) { return callback(err); }
  //     if (!accessToken) {
  //       return callback({
  //         statusCode: 400,
  //         data: JSON.stringify(params)
  //       });
  //     }
  //     callback(null, accessToken, refreshToken, params);
  //   });
  // }
}

// Inherit from `OAuth2Strategy`.
util.inherits(Strategy, OAuth2Strategy);


/**
 * Retrieve user profile from Lichess.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `lichess`
 *   - `id`               the user's Lichess ID
 *   - `username`         the user's Lichess username
 *   - `displayName`      the user's full name
 *   - `profileUrl`       the URL of the profile for the user on Lichess
 *
 * @param {string} accessToken
 * @param {function} done
 * @access protected
 */
Strategy.prototype.userProfile = function(accessToken, done) {
  var self = this;
  this._oauth2.get(this._userProfileURL, accessToken, function (err, body, res) {
    var json;

    if (err) {
      if (err.data) {
        try {
          json = JSON.parse(err.data);
        } catch (_) {}
      }

      if (json && json.message) {
        return done(new APIError(json.message));
      }
      return done(new InternalOAuthError('Failed to fetch user profile', err));
    }

    try {
      json = JSON.parse(body);
    } catch (ex) {
      return done(new Error('Failed to parse user profile'));
    }

    var profile = Profile.parse(json);
    profile.provider  = 'lichess';
    profile._raw = body;
    profile._json = json;

    done(null, profile);
  });
}


// Expose constructor.
module.exports = Strategy;
