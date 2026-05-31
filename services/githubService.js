const axios = require('axios');

const GITHUB_API_BASE = 'https://api.github.com';

function buildHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Github-Profiler-App',
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

/**
 * Fetches a GitHub user profile from the public API.
 * @param {string} username
 * @returns {Promise<object>} Raw GitHub user payload
 */
async function fetchGitHubUser(username) {
  try {
    const { data } = await axios.get(`${GITHUB_API_BASE}/users/${encodeURIComponent(username)}`, {
      headers: buildHeaders(),
    });
    return data;
  } catch (error) {
    if (error.response?.status === 404) {
      const notFound = new Error('GitHub user not found');
      notFound.statusCode = 404;
      throw notFound;
    }

    if (error.response?.status === 403) {
      const rateLimited = new Error('GitHub API rate limit exceeded. Add a GITHUB_TOKEN to your .env file.');
      rateLimited.statusCode = 429;
      throw rateLimited;
    }

    const apiError = new Error(error.response?.data?.message || 'Failed to fetch data from GitHub API');
    apiError.statusCode = error.response?.status || 502;
    throw apiError;
  }
}

/**
 * Calculates an influence score from follower and repo counts.
 * @param {number} followers
 * @param {number} publicRepos
 * @param {number} accountAgeDays
 * @returns {number}
 */
function calculateInfluenceScore(followers, publicRepos, accountAgeDays) {
  const tenureBonus = Math.floor(accountAgeDays / 365);
  return Math.round(followers + publicRepos * 5 + tenureBonus * 10);
}

/**
 * Derives insight metrics from raw GitHub user data.
 * @param {object} githubUser
 * @returns {object}
 */
function buildProfileInsights(githubUser) {
  const createdAt = new Date(githubUser.created_at);
  const now = new Date();
  const accountAgeMs = now.getTime() - createdAt.getTime();
  const accountAgeDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));

  const followers = githubUser.followers ?? 0;
  const following = githubUser.following ?? 0;
  const publicRepos = githubUser.public_repos ?? 0;

  return {
    username: githubUser.login,
    display_name: githubUser.name || null,
    bio: githubUser.bio || null,
    followers,
    following,
    public_repos: publicRepos,
    account_age_days: accountAgeDays,
    influence_score: calculateInfluenceScore(followers, publicRepos, accountAgeDays),
  };
}

module.exports = {
  fetchGitHubUser,
  buildProfileInsights,
  calculateInfluenceScore,
};
