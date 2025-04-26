# Weight Tracker with MongoDB Integration

A weight tracking application with MongoDB cloud storage for data synchronization across devices.

## Features

- Track daily weight measurements
- View statistics and trends
- Visualize your progress with charts
- Synchronize data with MongoDB cloud storage
- Access your data from multiple devices

## Setup

### Prerequisites

- Node.js 18 or later
- MongoDB Atlas account (free tier works fine)
- Netlify account (for deployment)

### Local Development

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/weight-tracker.git
   cd weight-tracker
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your MongoDB connection string
   ```bash
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

5. Open your browser to `http://localhost:8888`

### MongoDB Setup

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user with read/write permissions
4. Add your IP address to the IP allowlist
5. Get your connection string from the "Connect" button
6. Replace `<username>`, `<password>`, `<cluster>`, and `<database>` in the connection string

### Netlify Deployment

1. Push your code to a GitHub repository
2. Connect your repository to Netlify
3. Add the `MONGODB_URI` environment variable in Netlify's site settings
4. Deploy your site

## Using the Sync Feature

1. Enter your weight data in the application
2. Click the "Sync Now" button in the Cloud Sync card
3. Your data will be synchronized with MongoDB
4. Access your data from any device by visiting your Netlify URL

## API Endpoints

The application includes the following serverless functions:

- `/.netlify/functions/weight-entry` - CRUD operations for weight entries
- `/.netlify/functions/sync` - Sync local data with MongoDB

## Project Structure

- `/components` - React components
- `/js` - Client-side JavaScript utilities
- `/functions` - Netlify serverless functions
  - `/functions/database` - MongoDB connection and models
  - `/functions/utils` - Utility functions for API responses

## License

MIT 