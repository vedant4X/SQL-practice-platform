DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS social_users CASCADE;

CREATE TABLE social_users (
    user_id SERIAL PRIMARY KEY,
    handle VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    bio TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    post_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES social_users(user_id),
    content TEXT NOT NULL,
    media_url VARCHAR(255),
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE comments (
    comment_id SERIAL PRIMARY KEY,
    post_id INT NOT NULL REFERENCES posts(post_id),
    user_id INT NOT NULL REFERENCES social_users(user_id),
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE likes (
    like_id SERIAL PRIMARY KEY,
    post_id INT NOT NULL REFERENCES posts(post_id),
    user_id INT NOT NULL REFERENCES social_users(user_id),
    liked_at TIMESTAMP NOT NULL,
    UNIQUE(post_id, user_id)
);

CREATE TABLE follows (
    follower_id INT NOT NULL REFERENCES social_users(user_id),
    following_id INT NOT NULL REFERENCES social_users(user_id),
    followed_at TIMESTAMP NOT NULL,
    PRIMARY KEY(follower_id, following_id)
);
