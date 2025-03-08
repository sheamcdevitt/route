# Route Runner

A Next.js 15 application for finding nearby training locations and creating custom running routes. This app allows users to:

- Create custom running routes on an interactive map
- Calculate pace and time estimates for routes
- Find nearby training locations and events
- Save and manage favorite routes

## Features

- Interactive map for route creation using Leaflet
- Pace and time calculator for running routes
- Nearby training locations finder
- PostgreSQL database with Prisma ORM
- Modern UI with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Package Manager**: Bun
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Maps**: Leaflet / React Leaflet
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database
- Google Maps API key

### Setting Up Google Maps API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Library"
4. Search for and enable the following APIs:
   - Maps JavaScript API
   - Places API (if you want to use location search)
5. Go to "APIs & Services" > "Credentials"
6. Create an API key
7. Restrict the API key to only the APIs you're using (recommended)
8. Copy the API key

### Installation

1. Clone the repository:

   ```bash
   git clone git@github.com:sheamcdevitt/route.git
   cd route
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Set up environment variables:

   - Copy `.env.example` to `.env`
   - Update the `DATABASE_URL` with your PostgreSQL connection string
   - Add your Mapbox token if using Mapbox
   - Create a `.env.local` file in the root directory and add your Google Maps API key:
     ```
     NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
     ```

4. Set up the database:

   ```bash
   bunx prisma migrate dev --name init
   ```

5. Start the development server:

   ```bash
   bun run dev
   ```

6. Open [http://localhost:3200](http://localhost:3200) in your browser.

## Database Schema

The application uses the following data models:

- **User**: Stores user information
- **Route**: Stores custom running routes
- **Coordinate**: Stores route path coordinates
- **TrainingLocation**: Stores nearby training locations
- **RouteTime**: Stores time and pace information for routes

## API Routes

- `GET /api/locations`: Get all training locations
- `POST /api/locations`: Create a new training location
- `GET /api/routes`: Get all routes
- `POST /api/routes`: Create a new route
- `GET /api/routes/[id]/times`: Get times for a specific route
- `POST /api/routes/[id]/times`: Add a new time for a specific route

## License

This project is licensed under the MIT License - see the LICENSE file for details.
