# Dress Shop Admin Dashboard

A complete admin dashboard system for managing dress shop products and tracking sales progress. Built with HTML, CSS, JavaScript (frontend) and Node.js, Express.js, MongoDB (backend).

## Features

- **Demo Login System**: Simple authentication with demo credentials
- **Product Management**: Full CRUD operations (Create, Read, Update, Delete)
- **Progress Tracking**: Monitor sales, stock, and profit calculations
- **Real-time Dashboard**: Updates without page refresh
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Theme**: Beautiful dark UI adapted for dress shop branding

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Demo-based (hardcoded credentials)

## Project Structure

```
project-11/
├── frontend/
│   ├── index.html          # Login page
│   ├── dashboard.html      # Admin dashboard
│   ├── css/
│   │   └── style.css       # Styling
│   └── js/
│       ├── login.js        # Login functionality
│       └── dashboard.js    # Dashboard CRUD operations
├── backend/
│   ├── server.js           # Express server
│   ├── routes/
│   │   ├── auth.js         # Authentication routes
│   │   ├── products.js     # Product CRUD routes
│   │   └── progress.js     # Progress tracking routes
│   ├── models/
│   │   ├── Product.js      # Product model
│   │   └── Progress.js     # Progress model
│   └── config/
│       └── database.js     # MongoDB connection
├── package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or MongoDB Atlas connection string)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure MongoDB:**
   - Make sure MongoDB is running locally on `mongodb://127.0.0.1:27017`
   - Or create a `.env` file with your MongoDB connection string:
     ```
     MONGODB_URI=mongodb://your-connection-string
     PORT=5000
     ```

3. **Start the server:**
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - Open `frontend/index.html` in your browser
   - Or navigate to `http://localhost:5000` if serving through Express

## Demo Credentials

- **Email**: `admin@example.com`
- **Password**: `admin123`

## API Endpoints

### Authentication
- `POST /api/login` - Login with demo credentials

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Progress
- `GET /api/progress` - Get all progress data
- `POST /api/progress` - Update purchase/progress for a product

## Usage

1. **Login**: Use the demo credentials to access the dashboard
2. **Add Product**: Fill in the product form and click "Save Product"
3. **Edit Product**: Click "Edit" button on any product row
4. **Delete Product**: Click "Delete" button (with confirmation)
5. **View Progress**: Progress table shows sales, stock, and profit automatically
6. **Summary Cards**: View total items sold and profit summary at the bottom

## Notes

- This is a demo application with no real authentication
- All data is stored in MongoDB
- Progress tracking is automatically calculated based on product sales
- The application uses demo tokens stored in localStorage

## Development

To run in development mode with auto-reload:
```bash
npm run dev
```

Make sure MongoDB is running before starting the server.
