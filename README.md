<p align="center">
  <img src="https://raw.githubusercontent.com/cvat-ai/cvat/develop/site/content/en/images/cvat-readme-gif.gif" alt="CVAT Platform" width="100%" max-width="800px">
</p>

# Computer Vision Annotation Tool (CVAT) - UNOPS Edition

This repository contains a customized and optimized version of CVAT, featuring an improved project structure, Amazon Cognito SSO integration, and automated domain configuration.

---

## 🚀 Quick Start (Running the Project)

This project uses a modular Docker Compose strategy. To run the application with all features (Database, Redis, Analytics, and SSO), use the following commands:

### **Standard Startup**
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### **Rebuilding Images (After Code Changes)**
If you pull new changes or modify the codebase (especially UI/Backend), use the `--build` flag:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

### **Stopping the Project**
```bash
docker compose down
```

### **Hard Reset (Delete All Data)**
⚠️ **Warning:** This will permanently delete all users, tasks, and annotations.
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
```

---

## 🏢 Organization & SSO Invitation Guide

To prevent "Ghost User" conflicts (where invitations sit on a temporary account instead of the real worker account), please follow this workflow when onboarding new workers:

1.  **Worker Log In First**: Ask the new worker to log into the CVAT instance via **Cognito/SSO** at least once. This creates their permanent account in the system.
2.  **Send Invite**: After the worker has an account, the Administrator sends the invitation to their exact email.
3.  **Accepting the Invite**: The worker clicks the link in their email.
4.  **Crucial Step - Switch Organization**:
    *   Once logged in, the worker **must** click the "Personal" dropdown in the top header and select the relevant **Organization (e.g., UNOPS)**.
    *   Tasks assigned to the organization will **not** appear until the worker switches to that organization's view.

---

## ⚙️ Configuration (.env)

Ensure your `.env` file is configured with your domain and Cognito credentials:

```bash
# General
CVAT_HOST=your-domain.com
CVAT_BASE_URL=http://your-domain.com:8080

# Cognito SSO
COGNITO_DOMAIN=https://your-auth-domain.auth.region.amazoncognito.com
COGNITO_APP_ID=your-client-id
COGNITO_APP_SECRET=your-client-secret

# Email
CVAT_EMAIL_HOST=smtp.gmail.com
CVAT_EMAIL_PORT=587
CVAT_EMAIL_USE_TLS=true
CVAT_EMAIL_USE_SSL=false  # Do not set both TLS and SSL to true simultaneously
```

---

## 📂 Project Structure Cleanup

The project has been reorganized for better maintainability:

*   **`cvat/`**: Core Backend application logic.
*   **`packages/`**: UI components, SDKs, and Canvas libraries.
*   **`extra/`**: Utility scripts, AI models, and serverless functions.
*   **`components/`**: External services like Grafana, Vector, and Clickhouse.

---

## 📧 Email Configuration Details

To use invitations, you must have a working email backend.

### **Manual Debugging (Console)**
If you don't have an SMTP server, you can see invitation links in the server logs:
1. Set `CVAT_EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend` in `.env`.
2. Run `docker logs cvat_server -f` to see the emails.

---

## 🆘 Troubleshooting

### **"example.com" Links in Emails**
The `backend_entrypoint.sh` automatically updates the internal Site domain to match your `CVAT_BASE_URL` on every startup. If the links are still wrong, ensure `CVAT_BASE_URL` in your `.env` is correct and restart the containers.

### **Internal Server Error (500) on Send**
Check the `cvat_server` logs. This is often caused by setting both `EMAIL_USE_TLS` and `EMAIL_USE_SSL` to `true`. You must pick only one.

---

*Original CVAT documentation can be found at [docs.cvat.ai](https://docs.cvat.ai).*
