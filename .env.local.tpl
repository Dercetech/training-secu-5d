# Copy this file to .env.local and replace placeholders with local-only values.
# Do not commit .env.local.

# Active target: _servers/training.dercetech.com/ -> the live portal's /labs/ route.
DEPLOY_TRAINING_DERCETECH_COM_REMOTE_HOST=your-ssh-host-alias
DEPLOY_TRAINING_DERCETECH_COM_REMOTE_DIR=/absolute/remote/path/to/trainings/python-html5-security/labs/

# Optional target: _servers/training2.dercetech.com/ -> a sibling training domain.
# Keep the actual hosting account and document root in .env.local only.
# DEPLOY_TRAINING2_DERCETECH_COM_REMOTE_HOST=your-existing-training-ssh-host-alias
# DEPLOY_TRAINING2_DERCETECH_COM_REMOTE_DIR=/absolute/remote/path/to/training2/document-root/

# Optional target: _servers/second-domain/ -> a separate domain document root.
# Leave both values unset until SSH access and the exact document root are verified.
# DEPLOY_SECOND_DOMAIN_REMOTE_HOST=your-other-ssh-host-alias
# DEPLOY_SECOND_DOMAIN_REMOTE_DIR=/absolute/remote/path/to/scoped/lab/root/

# Optional target: _servers/second-domain-root/ -> that domain's document root.
# Its sync protects the separately managed secu-5d/, .well-known/ and cgi-bin/ trees.
# DEPLOY_SECOND_DOMAIN_ROOT_REMOTE_HOST=your-other-ssh-host-alias
# DEPLOY_SECOND_DOMAIN_ROOT_REMOTE_DIR=/absolute/remote/path/to/domain/document-root/

# Disposable SC8 Incinerator target. It is intentionally excluded from
# deploy:sync and deploy:sync:watch. Only `npm run sc8:scratch` touches it.
# DEPLOY_INCINERATOR_REMOTE_HOST=your-sc8-ssh-host-alias
# DEPLOY_INCINERATOR_REMOTE_DIR=/absolute/remote/path/to/sc8rumo3487.universe.wf/document-root/
