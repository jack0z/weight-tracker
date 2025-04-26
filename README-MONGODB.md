# Weight Tracker - MongoDB Backend

This project includes a MongoDB backend using Netlify Functions to store weight entries persistently. The backend provides a fallback to localStorage when no MongoDB connection is available.

## Getting Started

### Prerequisites

- A MongoDB Atlas account (free tier works fine) or local MongoDB server
- Netlify account (for deployment)

### Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables by creating a `.env` file in the root directory with the following:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
   ```
   - Replace `<username>`, `<password>`, `<cluster>`, and `<database>` with your MongoDB Atlas credentials.
   - For local MongoDB, use: `MONGODB_URI=mongodb://localhost:27017/<database>`

4. To test Netlify Functions locally, install the Netlify CLI:
   ```
   npm install -g netlify-cli
   ```

5. Start the development server with Netlify Functions:
   ```
   netlify dev
   ```

## API Endpoints

The backend provides the following API endpoints:

### Get Weight Entries

```
GET /api/weight/get-entries?userId=<userId>&startDate=<startDate>&endDate=<endDate>&limit=<limit>&skip=<skip>
```

Parameters:
- `userId` (required): The ID of the user
- `startDate` (optional): Filter entries after this date (YYYY-MM-DD)
- `endDate` (optional): Filter entries before this date (YYYY-MM-DD)
- `limit` (optional, default: 100): Maximum number of entries to return
- `skip` (optional, default: 0): Number of entries to skip (for pagination)

### Create Entry

```
POST /api/weight/create-entry
```

Request body:
```json
{
  "userId": "user123",
  "date": "2023-09-18",
  "weight": 75.5,
  "notes": "Optional note"
}
```

### Update Entry

```
PUT /api/weight/update-entry/<entryId>
```

Request body:
```json
{
  "userId": "user123",
  "date": "2023-09-19",
  "weight": 75.2,
  "notes": "Updated note"
}
```

### Delete Entry

```
DELETE /api/weight/delete-entry/<entryId>?userId=<userId>
```

Parameters:
- `entryId`: The ID of the entry to delete
- `userId`: The ID of the user

### Bulk Delete

```
DELETE /api/weight/bulk-delete
```

Request body:
```json
{
  "userId": "user123",
  "deleteAll": true
}
```

OR

```json
{
  "userId": "user123",
  "entryIds": ["id1", "id2", "id3"]
}
```

OR

```json
{
  "userId": "user123",
  "startDate": "2023-09-01",
  "endDate": "2023-09-15"
}
```

## Local Storage Fallback

The application will automatically fallback to localStorage when:

1. The environment variable `NEXT_PUBLIC_USE_LOCALSTORAGE_FALLBACK` is set to `true`
2. The user has explicitly set to use localStorage by setting `localStorage.setItem('useLocalStorage', 'true')`

This allows for offline use and testing without a MongoDB connection.

## Deployment

### Deploy to Netlify

1. Connect your repository to Netlify
2. Add the following environment variables in Netlify:
   - `MONGODB_URI`: Your MongoDB connection string

3. Deploy the site

## Database Schema

### Weight Entry

```javascript
{
  userId: { type: String, required: true, index: true },
  date: { type: Date, required: true },
  weight: { type: Number, required: true },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

The schema includes a compound index on `userId` and `date` to ensure each user can only have one entry per date.

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request (missing required fields)
- `404`: Not Found
- `409`: Conflict (e.g., duplicate date)
- `500`: Server Error

## Security

This implementation uses a simple user ID system for demonstration purposes. In a production environment, you should implement proper authentication (e.g., JWT, OAuth) to secure the API endpoints. 