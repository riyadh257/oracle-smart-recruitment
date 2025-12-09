# Mobile API Documentation

## Overview

The Oracle Smart Recruitment Mobile API provides RESTful endpoints for iOS and Android applications. All endpoints require JWT authentication and implement rate limiting (100 requests per minute).

**Base URL:** `https://your-domain.com/api/mobile`

**API Version:** `v1`

## Authentication

All API requests must include a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

The JWT token is obtained through the OAuth flow on the web platform.

## Rate Limiting

- **Limit:** 100 requests per minute per IP address
- **Response:** HTTP 429 (Too Many Requests) when limit exceeded
- **Retry-After:** Included in response headers

## Endpoints

### Health Check

**GET** `/v1/health`

Check if the API is running.

**Response:**
```json
{
  "success": true,
  "message": "Mobile API is running",
  "version": "1.0.0",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

---

### User Profile

#### Get Profile

**GET** `/v1/profile`

Get the current user's candidate profile.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 123,
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+966501234567",
    "location": "Riyadh, Saudi Arabia",
    "yearsOfExperience": 5,
    "currentJobTitle": "Senior Software Engineer",
    "expectedSalary": 15000,
    "resumeUrl": "https://storage.example.com/resumes/...",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### Update Profile

**PUT** `/v1/profile`

Update the current user's candidate profile.

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "fullName": "John Doe",
  "phone": "+966501234567",
  "location": "Riyadh, Saudi Arabia",
  "yearsOfExperience": 6,
  "currentJobTitle": "Lead Software Engineer",
  "expectedSalary": 18000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

---

### Jobs

#### List Jobs

**GET** `/v1/jobs`

Get a paginated list of open job postings.

**Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Senior Software Engineer",
      "description": "We are looking for...",
      "department": "Engineering",
      "location": "Riyadh",
      "employmentType": "full_time",
      "salaryMin": 12000,
      "salaryMax": 18000,
      "status": "open",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

#### Get Job Details

**GET** `/v1/jobs/:id`

Get detailed information about a specific job.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Senior Software Engineer",
    "description": "We are looking for...",
    "requirements": "5+ years of experience...",
    "department": "Engineering",
    "location": "Riyadh",
    "employmentType": "full_time",
    "salaryMin": 12000,
    "salaryMax": 18000,
    "status": "open",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### Applications

#### Submit Application

**POST** `/v1/applications`

Apply to a job posting.

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "jobId": 1,
  "coverLetter": "I am excited to apply for..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "applicationId": 123
  }
}
```

#### List Applications

**GET** `/v1/applications`

Get all applications submitted by the current user.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "candidateId": 1,
      "jobPostingId": 1,
      "status": "applied",
      "coverLetter": "I am excited to apply for...",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Notifications

#### List Notifications

**GET** `/v1/notifications`

Get user's notifications.

**Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (optional): Number of notifications (default: 50, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 123,
      "type": "interview_scheduled",
      "title": "Interview Scheduled",
      "message": "Your interview for Senior Software Engineer is scheduled for...",
      "metadata": {
        "interviewId": 456,
        "actionUrl": "/interviews/456"
      },
      "isRead": false,
      "priority": "high",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Mark Notification as Read

**PATCH** `/v1/notifications/:id/read`

Mark a specific notification as read.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error type",
  "message": "Human-readable error message"
}
```

### Common Error Codes

- **400 Bad Request:** Invalid request parameters
- **401 Unauthorized:** Missing or invalid authentication token
- **404 Not Found:** Resource not found
- **429 Too Many Requests:** Rate limit exceeded
- **500 Internal Server Error:** Server error

---

## Example Usage

### JavaScript/TypeScript (React Native)

```typescript
const API_BASE_URL = "https://your-domain.com/api/mobile/v1";

async function getJobs(token: string, page: number = 1) {
  const response = await fetch(`${API_BASE_URL}/jobs?page=${page}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
}

async function applyToJob(token: string, jobId: number, coverLetter: string) {
  const response = await fetch(`${API_BASE_URL}/applications`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jobId,
      coverLetter,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
}
```

### Swift (iOS)

```swift
import Foundation

class MobileAPI {
    let baseURL = "https://your-domain.com/api/mobile/v1"
    let token: String
    
    init(token: String) {
        self.token = token
    }
    
    func getJobs(page: Int = 1, completion: @escaping (Result<JobsResponse, Error>) -> Void) {
        guard let url = URL(string: "\(baseURL)/jobs?page=\(page)") else {
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                return
            }
            
            do {
                let decoder = JSONDecoder()
                let result = try decoder.decode(JobsResponse.self, from: data)
                completion(.success(result))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
}
```

### Kotlin (Android)

```kotlin
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

class MobileAPI(private val token: String) {
    private val baseUrl = "https://your-domain.com/api/mobile/v1"
    private val client = OkHttpClient()
    private val mediaType = "application/json; charset=utf-8".toMediaType()
    
    fun getJobs(page: Int = 1, callback: (String?) -> Unit) {
        val request = Request.Builder()
            .url("$baseUrl/jobs?page=$page")
            .addHeader("Authorization", "Bearer $token")
            .addHeader("Content-Type", "application/json")
            .get()
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                callback(null)
            }
            
            override fun onResponse(call: Call, response: Response) {
                callback(response.body?.string())
            }
        })
    }
    
    fun applyToJob(jobId: Int, coverLetter: String, callback: (String?) -> Unit) {
        val json = JSONObject()
        json.put("jobId", jobId)
        json.put("coverLetter", coverLetter)
        
        val body = json.toString().toRequestBody(mediaType)
        
        val request = Request.Builder()
            .url("$baseUrl/applications")
            .addHeader("Authorization", "Bearer $token")
            .addHeader("Content-Type", "application/json")
            .post(body)
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                callback(null)
            }
            
            override fun onResponse(call: Call, response: Response) {
                callback(response.body?.string())
            }
        })
    }
}
```

---

## Best Practices

1. **Token Management:** Store JWT tokens securely using platform-specific secure storage (Keychain on iOS, Keystore on Android)
2. **Error Handling:** Always handle network errors and API errors gracefully
3. **Retry Logic:** Implement exponential backoff for failed requests
4. **Caching:** Cache responses when appropriate to reduce API calls
5. **Pagination:** Use pagination for list endpoints to improve performance
6. **Rate Limiting:** Respect rate limits and implement client-side throttling

---

## Support

For API support or questions, please contact the development team or refer to the main documentation.
