const githubService = require('../services/githubService');
const profileModel = require('../models/profileModel');

async function analyzeProfile(req, res, next) {
  try {
    const { username } = req.params;

    if (!username?.trim()) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const githubUser = await githubService.fetchGitHubUser(username.trim());
    const insights = githubService.buildProfileInsights(githubUser);
    const savedProfile = await profileModel.upsertProfile(insights);

    res.status(200).json({
      status: 'success',
      message: `Profile for "${savedProfile.username}" analyzed and saved successfully`,
      data: savedProfile,
    });
  } catch (error) {
    next(error);
  }
}

function parseNonNegativeInt(value, fieldName) {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return { error: `${fieldName} must be a non-negative integer` };
  }
  return { value: parsed };
}

async function listProfiles(req, res, next) {
  try {
    const { sort, order, minRepos, minFollowers } = req.query;

    const options = { sort, order };

    if (minRepos !== undefined) {
      const parsed = parseNonNegativeInt(minRepos, 'minRepos');
      if (parsed.error) return res.status(400).json({ error: parsed.error });
      options.minRepos = parsed.value;
    }

    if (minFollowers !== undefined) {
      const parsed = parseNonNegativeInt(minFollowers, 'minFollowers');
      if (parsed.error) return res.status(400).json({ error: parsed.error });
      options.minFollowers = parsed.value;
    }

    const profiles = await profileModel.getAllProfiles(options);

    res.status(200).json({
      status: 'success',
      count: profiles.length,
      data: profiles,
    });
  } catch (error) {
    next(error);
  }
}

async function getProfile(req, res, next) {
  try {
    const { username } = req.params;
    const profile = await profileModel.getProfileByUsername(username);

    if (!profile) {
      return res.status(404).json({
        error: `No saved profile found for username "${username}"`,
      });
    }

    res.status(200).json({
      status: 'success',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}

async function getProfilesSummary(req, res, next) {
  try {
    const summary = await profileModel.getProfilesSummary();

    if (summary.total_profiles === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No profiles analyzed yet. Use POST /api/profiles/:username/analyze first.',
        data: summary,
      });
    }

    res.status(200).json({
      status: 'success',
      data: summary,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  analyzeProfile,
  listProfiles,
  getProfile,
  getProfilesSummary,
};
