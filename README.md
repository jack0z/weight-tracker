# Weight Tracker

A powerful weight tracking application built with React and ApexCharts. Track your weight over time, visualize trends, and forecast future progress. Now with MongoDB integration for cloud storage!

## Features

- **Weight Tracking**: Log your weight with dates and see your progress over time
- **Visual Analytics**: Interactive charts that display your weight trend
- **Smart Statistics**: 7-day, 14-day, and 30-day averages and change calculations
- **Weight Distribution**: See how your weight is distributed across ranges
- **BMI Calculator**: Calculate and categorize your BMI based on your height and weight
- **Goal Forecasting**: Predict when you'll reach your goal weight based on current trends
- **Data Management**: Export your data to CSV for backup or further analysis
- **MongoDB Integration**: Store your weight data securely in the cloud (optional)

## Getting Started

### Prerequisites

- Node.js and npm
- MongoDB Atlas account (optional, for cloud storage)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/weight-tracker.git
   cd weight-tracker
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables (for MongoDB integration)
   ```bash
   cp .env.example .env
   ```
   Then edit the `.env` file with your MongoDB connection string.

4. Start the development server
   ```bash
   # For local-only storage version
   npm run dev
   
   # For MongoDB integration (requires MongoDB connection)
   npm run netlify:dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Set your start weight, goal weight, and height in the Settings panel
2. Add new weight entries regularly using the "Add New Entry" panel
3. View your weight history, trends, and statistics in the various cards
4. Export your data as needed for backup

### MongoDB Integration

The application offers two modes:
- **Local Storage**: The default mode that stores data in your browser (original version)
- **MongoDB**: Cloud storage mode that persists your data across devices

To use the MongoDB integration:

1. Create a free MongoDB Atlas account at [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Set up a new cluster and database
3. Add your MongoDB connection string to the `.env` file
4. Test your database connection:
   ```bash
   npm run test-db
   ```
5. Initialize the database with sample data (optional):
   ```bash
   npm run init-db
   ```
6. Run the application with Netlify Dev:
   ```bash
   npm run netlify:dev
   ```
7. Click the "Try MongoDB Version" button in the app to switch to cloud storage mode

## Technologies Used

- React
- Next.js
- MongoDB and Mongoose for cloud data storage
- Netlify Functions for serverless API endpoints
- ApexCharts for data visualization
- date-fns for date manipulation
- Tailwind CSS and DaisyUI for styling
- localStorage for local data persistence

## License

This project is licensed under the MIT License. 