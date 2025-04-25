# Weight Tracker

A simple yet powerful weight tracking application built with React and ApexCharts. Track your weight over time, visualize trends, and forecast future progress.

## Features

- **Weight Tracking**: Log your weight with dates and see your progress over time
- **Visual Analytics**: Interactive charts that display your weight trend
- **Smart Statistics**: 7-day, 14-day, and 30-day averages and change calculations
- **Weight Distribution**: See how your weight is distributed across ranges
- **BMI Calculator**: Calculate and categorize your BMI based on your height and weight
- **Goal Forecasting**: Predict when you'll reach your goal weight based on current trends
- **Data Management**: Export your data to CSV for backup or further analysis
- **Mobile Responsive**: Optimized for both desktop and mobile viewing
- **Shareable View Mode**: Share your progress with others via a unique link

## Getting Started

### Prerequisites

- Node.js and npm

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

3. Start the development server
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Set your start weight, goal weight, and height in the Settings panel
2. Add new weight entries regularly using the "Add New Entry" panel
3. View your weight history, trends, and statistics in the various cards
4. Export your data as needed for backup

## Deployment

### Building for Production

Build the application for production:

```bash
npm run build
```

This will create a static export in the `out` directory that can be deployed to any static hosting service.

### Deploying to a Subdirectory

If you need to deploy to a subdirectory (e.g., `example.com/weight-tracker/`), uncomment and edit the `basePath` setting in `next.config.js`:

```js
// next.config.js
const nextConfig = {
  // ...
  basePath: '/weight-tracker',
  // ...
}
```

### View Mode in Static Deployments

When deployed as a static site (to Netlify, GitHub Pages, etc.), the view mode functionality will use localStorage for data persistence rather than server APIs.

### Sharing Options

There are two ways to share your weight tracker:

1. **One-Time Share**: 
   - Creates a unique link each time you share
   - The link expires after 30 days 
   - The data is frozen at the time of sharing

2. **Permalink**:
   - Creates a permanent link that always shows your latest data
   - Perfect for sharing in your bio or on social media
   - Each user has one permalink that gets updated when they reshare

To share, click the Share button in the header and choose your preferred method.

### Demo Link

You can view a demo of the shared view mode here:
https://testweight.netlify.app/?view=demo_permalink

> **Note:** In static deployments, the sharing functionality is limited to the same browser. To share with others across devices, you'll need to implement a backend service or use a service like Firebase, Supabase, etc.

### Hosting Services

You can deploy this application to:
- GitHub Pages
- Netlify
- Vercel
- Any static file hosting service

## Technologies Used

- React
- Next.js for static site generation
- ApexCharts for data visualization
- date-fns for date manipulation
- localStorage for data persistence
- Tailwind CSS for styling

## License

This project is licensed under the MIT License. 