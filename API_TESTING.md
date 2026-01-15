# API Testing Guide

Quick reference for testing the Loopin API endpoints.

## Test Credentials

**Email**: `test@example.com`  
**Password**: `password123`

## Quick Test Commands

### 1. Health Checks

```bash
# API health
curl http://localhost:3000/health | jq

# Database health
curl http://localhost:3000/health/db | jq
```

### 2. Register New User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepass123",
    "name": "John Doe"
  }' | jq
```

### 3. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' | jq
```

**Save the tokens from the response!**

### 4. Get Current User (Protected)

```bash
# Replace YOUR_ACCESS_TOKEN with the actual token from login
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" | jq
```

### 5. Refresh Token

```bash
# Replace YOUR_REFRESH_TOKEN with the actual refresh token
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }' | jq
```

### 6. Logout

```bash
# Replace YOUR_REFRESH_TOKEN with the actual refresh token
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }' | jq
```

## Complete Authentication Flow

```bash
# 1. Login and save tokens
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')

# 2. Extract access token
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.tokens.accessToken')

# 3. Extract refresh token
REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.tokens.refreshToken')

# 4. Use access token to get user info
curl -s http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# 5. Refresh the access token
curl -s -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}" | jq

# 6. Logout
curl -s -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}" | jq
```

## Error Testing

### Invalid Credentials

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "wrongpassword"
  }' | jq
```

### Missing Authorization Header

```bash
curl http://localhost:3000/api/auth/me | jq
```

### Invalid Token

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer invalid_token" | jq
```

### Duplicate Email Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' | jq
```

## Using Postman

### Import as Collection

Create a new Postman collection with these requests:

1. **Health Check**
   - Method: GET
   - URL: `http://localhost:3000/health`

2. **Register**
   - Method: POST
   - URL: `http://localhost:3000/api/auth/register`
   - Body (JSON):
     ```json
     {
       "email": "{{email}}",
       "password": "{{password}}",
       "name": "{{name}}"
     }
     ```

3. **Login**
   - Method: POST
   - URL: `http://localhost:3000/api/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "{{email}}",
       "password": "{{password}}"
     }
     ```
   - Tests (to save tokens):
     ```javascript
     const response = pm.response.json();
     pm.environment.set("accessToken", response.data.tokens.accessToken);
     pm.environment.set("refreshToken", response.data.tokens.refreshToken);
     ```

4. **Get Current User**
   - Method: GET
   - URL: `http://localhost:3000/api/auth/me`
   - Headers:
     - `Authorization`: `Bearer {{accessToken}}`

5. **Refresh Token**
   - Method: POST
   - URL: `http://localhost:3000/api/auth/refresh`
   - Body (JSON):
     ```json
     {
       "refreshToken": "{{refreshToken}}"
     }
     ```

6. **Logout**
   - Method: POST
   - URL: `http://localhost:3000/api/auth/logout`
   - Body (JSON):
     ```json
     {
       "refreshToken": "{{refreshToken}}"
     }
     ```

### Environment Variables

Create a Postman environment with:
- `email`: `test@example.com`
- `password`: `password123`
- `name`: `Test User`
- `accessToken`: (will be set automatically)
- `refreshToken`: (will be set automatically)
