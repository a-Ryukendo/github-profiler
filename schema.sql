-- GitHub Profiler database schema
-- Run: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS github_profiler;
USE github_profiler;

CREATE TABLE IF NOT EXISTS profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) DEFAULT NULL,
    public_repos INT NOT NULL DEFAULT 0,
    followers INT NOT NULL DEFAULT 0,
    following INT NOT NULL DEFAULT 0,
    bio TEXT DEFAULT NULL,
    influence_score DECIMAL(10, 0) NOT NULL DEFAULT 0,
    account_age_days INT NOT NULL,
    last_analyzed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_followers (followers),
    INDEX idx_public_repos (public_repos),
    INDEX idx_influence_score (influence_score),
    INDEX idx_last_analyzed (last_analyzed_at)
);
