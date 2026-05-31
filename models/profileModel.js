const pool = require('../config/db');

const SORT_COLUMNS = {
  followers: 'followers',
  following: 'following',
  repos: 'public_repos',
  account_age: 'account_age_days',
  username: 'username',
  influence: 'influence_score',
  analyzed: 'last_analyzed_at',
};

function mapRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    username: row.username,
    display_name: row.display_name,
    bio: row.bio,
    followers: row.followers,
    following: row.following,
    public_repos: row.public_repos,
    account_age_days: row.account_age_days,
    influence_score: Number(row.influence_score),
    last_analyzed_at: row.last_analyzed_at,
  };
}

/**
 * Inserts a new profile or updates an existing one (upsert).
 * @param {object} profile
 * @returns {Promise<object>}
 */
async function upsertProfile(profile) {
  const sql = `
    INSERT INTO profiles (
      username, display_name, public_repos, followers, following,
      bio, influence_score, account_age_days, last_analyzed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      display_name = VALUES(display_name),
      public_repos = VALUES(public_repos),
      followers = VALUES(followers),
      following = VALUES(following),
      bio = VALUES(bio),
      influence_score = VALUES(influence_score),
      account_age_days = VALUES(account_age_days),
      last_analyzed_at = NOW()
  `;

  const values = [
    profile.username,
    profile.display_name,
    profile.public_repos,
    profile.followers,
    profile.following,
    profile.bio,
    profile.influence_score,
    profile.account_age_days,
  ];

  await pool.query(sql, values);
  return getProfileByUsername(profile.username);
}

/**
 * Retrieves all stored profiles with optional filtering and sorting.
 * @param {{ sort?: string, order?: string, minRepos?: number }} options
 * @returns {Promise<object[]>}
 */
async function getAllProfiles(options = {}) {
  const conditions = [];
  const params = [];

  if (options.minRepos !== undefined && !Number.isNaN(options.minRepos)) {
    conditions.push('public_repos >= ?');
    params.push(options.minRepos);
  }

  if (options.minFollowers !== undefined && !Number.isNaN(options.minFollowers)) {
    conditions.push('followers >= ?');
    params.push(options.minFollowers);
  }

  const sortKey = SORT_COLUMNS[options.sort] || SORT_COLUMNS.analyzed;
  const order = options.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT * FROM profiles
    ${whereClause}
    ORDER BY ${sortKey} ${order}
  `;

  const [rows] = await pool.query(sql, params);
  return rows.map(mapRow);
}

/**
 * Retrieves a single profile by username.
 * @param {string} username
 * @returns {Promise<object|null>}
 */
async function getProfileByUsername(username) {
  const [rows] = await pool.query('SELECT * FROM profiles WHERE username = ?', [username]);
  return mapRow(rows[0]);
}

/**
 * Returns aggregate statistics across all stored profiles.
 * @returns {Promise<object>}
 */
async function getProfilesSummary() {
  const [aggregateRows] = await pool.query(`
    SELECT
      COUNT(*) AS total_profiles,
      ROUND(AVG(followers), 0) AS avg_followers,
      ROUND(AVG(public_repos), 1) AS avg_public_repos,
      ROUND(AVG(influence_score), 0) AS avg_influence_score,
      MAX(influence_score) AS max_influence_score,
      SUM(followers) AS total_followers_across_profiles
    FROM profiles
  `);

  const [topInfluence] = await pool.query(`
    SELECT username, display_name, influence_score, followers, public_repos
    FROM profiles
    ORDER BY influence_score DESC
    LIMIT 1
  `);

  const [mostFollowed] = await pool.query(`
    SELECT username, display_name, followers, influence_score
    FROM profiles
    ORDER BY followers DESC
    LIMIT 1
  `);

  const summary = aggregateRows[0];

  return {
    total_profiles: Number(summary.total_profiles),
    avg_followers: Number(summary.avg_followers) || 0,
    avg_public_repos: Number(summary.avg_public_repos) || 0,
    avg_influence_score: Number(summary.avg_influence_score) || 0,
    max_influence_score: Number(summary.max_influence_score) || 0,
    total_followers_across_profiles: Number(summary.total_followers_across_profiles) || 0,
    top_by_influence: topInfluence[0]
      ? {
          username: topInfluence[0].username,
          display_name: topInfluence[0].display_name,
          influence_score: Number(topInfluence[0].influence_score),
          followers: topInfluence[0].followers,
          public_repos: topInfluence[0].public_repos,
        }
      : null,
    most_followed: mostFollowed[0]
      ? {
          username: mostFollowed[0].username,
          display_name: mostFollowed[0].display_name,
          followers: mostFollowed[0].followers,
          influence_score: Number(mostFollowed[0].influence_score),
        }
      : null,
  };
}

module.exports = {
  upsertProfile,
  getAllProfiles,
  getProfileByUsername,
  getProfilesSummary,
};
