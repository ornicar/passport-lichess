/**
 * Parse profile.
 *
 * @param {object|string} json
 * @return {object}
 * @access public
 */
exports.parse = function(json) {
  if ('string' == typeof json) json = JSON.parse(json);
  return {
    id: String(json.id),
    displayName: json.username,
    username: json.username,
    profileUrl: 'https://lichess.org/@/' + json.username
  };
};
