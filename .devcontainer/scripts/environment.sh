# Env
cat >> "/home/mmdev/.bashrc" << EOL

# Environment variables 
export DATABASE_URL=postgres://postgres:postgres@localhost/mattermost_test
export SENTRY_DNS=
export API_URL=http://localhost:9000
export WEB_URL=http://localhost:9005
export PORT=9000
EOL
