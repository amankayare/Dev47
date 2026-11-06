# Shared Authentication Implementation Guide (Online Version)

This document outlines the requirements and steps to use **Dev47** as a centralized identity provider for other applications.

## 1. Concept
Instead of creating a new authentication system for every project, other applications (the "Clients") will use Dev47's existing JWT-based endpoints to verify if a user is genuine. In the **Online Version**, the Client application verifies the token by making a server-to-server (or client-to-server) call to Dev47.

---

## 2. Requirements

### For Dev47 (The Identity Provider)
- **Public Accessibility**: The API must be reachable by the Client application.
- **CORS Configuration**: Must allow the Origin of the Client application.
- **Stable Endpoints**: The `/api/auth/me` endpoint must remain the standard for verification.

### For the New Application (The Client)
- **Token Storage**: Ability to store JWTs (e.g., `localStorage`).
- **Authorization Header**: Ability to send `Authorization: Bearer <token>` in all API requests.
- **Login Flow**: Must be able to redirect users to the Dev47 login page or host its own login form that talks to Dev47's `/api/auth/login`.

---

## 3. Required Changes in Dev47

### Configuration (`.env`)
You must update the `CORS_ORIGINS` to allow your new application to make requests.
```env
# Example: Adding a new local project and a production domain
CORS_ORIGINS=http://localhost:3001,http://localhost:3000,https://your-new-app.com
```

### Configuration (`server/config.py`)
Ensure the `JWT_EXP_MINUTES` provides a good balance between security and user experience.
```python
JWT_EXP_MINUTES = 120 # 2 hours
```

---

## 4. Core Operations

To integrate your new application, you only need to implement these two operations:

### Operation 1: Get Token (Login)
The new application sends the user's credentials to Dev47 to receive a valid JWT.

*   **Endpoint**: `POST /api/auth/login`
*   **Request Body**:
    ```json
    {
      "username": "your_username_or_email",
      "password": "your_password"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": { "id": 1, "username": "admin", "email": "..." },
      "message": "Login successful"
    }
    ```

### Operation 2: Validate Token (Identity Check)
The new application sends the token back to Dev47 to verify the user is still logged in and to get their permissions.

*   **Endpoint**: `GET /api/auth/me`
*   **Required Header**: `Authorization: Bearer <JWT_TOKEN>`
*   **Success Response (200 OK)**:
    ```json
    {
      "user": {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "is_admin": true
      }
    }
    ```
*   **Failure Response (401 Unauthorized)**:
    ```json
    {
      "error": "invalid_token",
      "message": "Token has expired"
    }
    ```

---

## 5. Technical Workflow
1.  **Login**: Your new app captures credentials and performs **Operation 1**.
2.  **Storage**: Your new app saves the `access_token` in `localStorage` or a cookie.
3.  **Protection**: Before showing a private page, your new app performs **Operation 2**.
4.  **Session Control**: If **Operation 2** fails (401), the app clears the token and redirects to the login page.

---

## 6. Client-Side Implementation Example

```javascript
// Function to check if a user is logged in using Dev47
async function checkAuth() {
    const token = localStorage.getItem('access_token');
    if (!token) return false;

    try {
        const response = await fetch('https://dev47-api.yourdomain.com/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            return data.user; // User is authenticated
        }
    } catch (err) {
        console.error("Auth server unreachable");
    }
    return false;
}
```

---

## 6. Security Considerations
1. **HTTPS**: Always use HTTPS in production to prevent token interception.
2. **Token Scoping**: Currently, a Dev47 token grants full access to Dev47. Ensure the Client application only uses the token for identity verification.
3. **CORS**: Never use `CORS_ORIGINS=*` in production. Always whitelist specific domains.
