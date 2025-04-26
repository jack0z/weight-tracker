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

# MongoDB Integration Guide

This guide will help you set up and use the MongoDB integration for the Weight Tracker application.

## Why MongoDB?

While the default version of the Weight Tracker uses localStorage for data persistence, the MongoDB integration offers several advantages:

- **Cross-Device Sync**: Access your weight data from any device
- **Data Durability**: Your data persists even if you clear your browser data
- **Enhanced Security**: Protect your data with MongoDB Atlas security features
- **Scalability**: Handle large amounts of data without performance issues
- **Analytics**: Leverage MongoDB's querying capabilities for advanced statistics

## Setup Instructions

### 1. Create a MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up for a free account
2. Create a new organization if prompted
3. Create a new project for the Weight Tracker

### 2. Create a Cluster

1. Create a new shared cluster (free tier is sufficient)
2. Choose your preferred cloud provider and region
3. Select "M0 Sandbox" (free) for the cluster tier
4. Name your cluster (e.g., "weight-tracker")
5. Click "Create Cluster"

### 3. Set Up Database Access

1. In the sidebar, go to Database Access
2. Click "Add New Database User"
3. Create a new user with a secure password
4. Select "Read and write to any database" for user privileges
5. Click "Add User"

### 4. Configure Network Access

1. In the sidebar, go to Network Access
2. Click "Add IP Address"
3. For development, you can choose "Allow Access from Anywhere" (or specify your IP)
4. Click "Confirm"

### 5. Get Your Connection String

1. Go back to the Clusters view and click "Connect"
2. Choose "Connect your application"
3. Select "Node.js" as the driver and the latest version
4. Copy the connection string (it will look like `mongodb+srv://username:<password>@cluster0.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`)
5. Replace `<password>` with your database user's password
6. Replace `myFirstDatabase` with `weight_tracker`

### 6. Configure the Application

1. In the Weight Tracker project, copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your MongoDB connection string:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/weight_tracker?retryWrites=true&w=majority
   ```

### 7. Test Your Connection

Run the database connection test script:
```bash
npm run test-db
```

You should see a successful connection message.

### 8. Initialize the Database (Optional)

To add sample data to your database:
```bash
npm run init-db
```

This will create the necessary collections and add sample weight entries that you can use to test the application.

### 9. Start the Application with MongoDB Integration

```bash
npm run netlify:dev
```

This will start the application with both Next.js frontend and Netlify Functions for the MongoDB API.

## Using the MongoDB Version

1. Open the application in your browser (usually at http://localhost:8888)
2. On the main page, click the "Try MongoDB Version" button
3. You'll be taken to the MongoDB version of the application where all your data is stored in the cloud

## API Endpoints

The MongoDB integration includes several REST API endpoints:

- `GET /api/weight-entries` - Get all weight entries with pagination
- `POST /api/weight-entries` - Create a new weight entry
- `PUT /api/weight-entries/:id` - Update an existing entry
- `DELETE /api/weight-entries/:id` - Delete an entry
- `GET /api/weight-stats` - Get weight statistics and analytics

## Deployment

To deploy the application with MongoDB integration to Netlify:

1. Push your code to a GitHub repository
2. Create a new site in Netlify connected to your repository
3. Add your `MONGODB_URI` as an environment variable in Netlify
4. Deploy the site

## Troubleshooting

### Cannot Connect to MongoDB

1. Verify your connection string is correct in the `.env` file
2. Check if your IP is allowed in the Network Access settings
3. Ensure your database user has the correct permissions
4. Try running the test script: `npm run test-db`

### Serverless Functions Not Working

1. Make sure you're running the app with `npm run netlify:dev`
2. Check the terminal for any error messages
3. Verify that the `netlify.toml` file is correctly set up

### Data Not Showing Up

1. Check if you're viewing the MongoDB version (URL path should include `/mongodb`)
2. Ensure you have data in your MongoDB database
3. Try initializing sample data with `npm run init-db`

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/) 