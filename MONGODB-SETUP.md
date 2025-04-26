# MongoDB Integration Setup

This document provides step-by-step instructions for setting up the MongoDB integration for the Weight Tracker application.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (free tier is sufficient)
- [Netlify](https://www.netlify.com/) account for deployment

## Setting Up MongoDB Atlas

1. **Create a MongoDB Atlas account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up for a free account
   - Create a new organization if prompted

2. **Create a new project**
   - Name your project (e.g., "WeightTracker")
   - Click "Create Project"

3. **Create a new cluster**
   - Choose the free tier (M0 Sandbox)
   - Select a cloud provider and region closest to your users
   - Name your cluster (e.g., "weight-tracker-cluster")
   - Click "Create Cluster"

4. **Set up database access**
   - Go to "Database Access" under Security
   - Click "Add New Database User"
   - Create a username and password (save these securely!)
   - Set privileges to "Read and Write to Any Database"
   - Click "Add User"

5. **Set up network access**
   - Go to "Network Access" under Security
   - Click "Add IP Address"
   - Select "Allow Access From Anywhere" for development (you can restrict this later)
   - Click "Confirm"

6. **Get your connection string**
   - Go to your cluster and click "Connect"
   - Choose "Connect your application"
   - Select Node.js as the driver
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with a name for your database (e.g., "weight-tracker")

## Local Development Setup

1. **Clone the repository**
   ```
   git clone https://github.com/yourusername/weight-tracker.git
   cd weight-tracker
   ```

2. **Install dependencies**
   ```
   npm install
   ```

3. **Create a `.env` file**
   - Create a file named `.env` in the root directory
   - Add your MongoDB connection string:
     ```
     MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
     ```

4. **Start the development server**
   ```
   npm run dev
   ```

5. **Test the MongoDB connection**
   - Open your browser to `http://localhost:8888`
   - Use the "Sync Now" button in the Cloud Sync card
   - If successful, you'll see a confirmation message

## Deploying to Netlify

1. **Commit your code to a Git repository**
   - Create a repository on GitHub, GitLab, or Bitbucket
   - Push your code to the repository

2. **Connect your repository to Netlify**
   - Log in to [Netlify](https://www.netlify.com/)
   - Click "New site from Git"
   - Select your repository
   - Set the build command to `npm run build`
   - Set the publish directory to `.`

3. **Configure environment variables**
   - Go to Site settings > Build & deploy > Environment
   - Add your MongoDB connection string as an environment variable:
     - Key: `MONGODB_URI`
     - Value: Your MongoDB connection string
   - Save the changes

4. **Deploy your site**
   - Trigger a new deploy
   - Once the build is complete, your site will be live with MongoDB integration

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Check that your MongoDB Atlas cluster is running
   - Verify your connection string is correct
   - Ensure your IP allowlist includes your current IP address

2. **Authentication Errors**
   - Check your database username and password
   - Ensure the user has the correct permissions

3. **Function Invocation Errors**
   - Check the Netlify Function logs in the Netlify dashboard
   - Verify that the Netlify functions are properly configured in `netlify.toml`

### Getting Help

If you encounter issues not covered here, you can:

- Check the MongoDB Atlas documentation: https://docs.atlas.mongodb.com/
- Check the Netlify documentation: https://docs.netlify.com/
- Open an issue on the GitHub repository

## Data Privacy Considerations

- By default, all weight entries are associated with a user ID
- For demo purposes, the application generates a random user ID if none is provided
- In a production environment, you should implement proper authentication
- Consider enabling MongoDB Atlas encryption at rest for sensitive data 