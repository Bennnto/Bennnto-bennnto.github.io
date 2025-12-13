#!/usr/bin/env bash
set -euo pipefail

# Upload a local file to the remote assignment path as solution.js
# Usage: ./upload_solution.sh [path/to/local/solution.js]

REMOTE_USER_HOST="S5582010@gblearn.com"
REMOTE_DIR="~/public_html/comp1235/assignments/assignment4"
REMOTE_FILE_NAME="solution.js"

LOCAL_FILE_PATH="${1:-solution.js}"

if [[ ! -f "${LOCAL_FILE_PATH}" ]]; then
  echo "Local file not found: ${LOCAL_FILE_PATH}" >&2
  echo "Usage: $0 [path/to/local/solution.js]" >&2
  exit 1
fi

# SSH options:
# - BatchMode=yes: fail rather than prompt for passwords (non-interactive)
# - StrictHostKeyChecking=accept-new: auto-accept new hosts, but fail on key changes
SSH_OPTS="-o BatchMode=yes -o StrictHostKeyChecking=accept-new"

# Ensure the remote directory exists
ssh ${SSH_OPTS} "${REMOTE_USER_HOST}" "mkdir -p '${REMOTE_DIR}'"

# Upload the file, forcing the remote name to solution.js
scp ${SSH_OPTS} "${LOCAL_FILE_PATH}" "${REMOTE_USER_HOST}:${REMOTE_DIR}/${REMOTE_FILE_NAME}"

echo "Upload complete: ${REMOTE_USER_HOST}:${REMOTE_DIR}/${REMOTE_FILE_NAME}"