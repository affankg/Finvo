# BS Engineering Quotation & Invoicing System

A modern web-based quotation and invoicing system built with Django REST Framework and React.

## Features

- User authentication with JWT
- Role-based access control (Admin, Sales, Accountant, Viewer)
- Client management
- Service/Product catalog
- Quotation generation with auto-numbering
- Invoice generation from quotations
- PDF export for quotations and invoices
- Email integration for sending documents
- Dashboard with financial insights
- Activity logging
- Dark mode support
- Fully responsive design

## Tech Stack

### Backend
- Django REST Framework
- MySQL Database
- JWT Authentication
- WeasyPrint for PDF generation
- Django Email Backend

### Frontend
- React with TypeScript
- Tailwind CSS
- Axios for API calls
- React Router for navigation
- JWT for authentication
- React Hot Toast for notifications

## Prerequisites

- Python 3.8+
- Node.js 14+
- MySQL 8+

## Setup Instructions

### Backend Setup

1. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

2. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Create a `.env` file in the backend directory with your configuration.

4. Run migrations:
```bash
python manage.py migrate
```

5. Create a superuser:
```bash
python manage.py createsuperuser
```

6. Run the development server:
```bash
python manage.py runserver
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Run the development server:
```bash
npm run dev
```

## Environment Variables

### Backend (.env)

```
DJANGO_DEBUG=False
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1,.onrender.com

DB_NAME=bs_engineering
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=3306

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@bsengineering.com

CORS_ALLOWED_ORIGINS=http://localhost:3000
```

## Deployment

The project is configured for deployment on Render.com. The `render.yaml` file contains all necessary configuration.

### Deployment Steps

1. Create a new Render account if you don't have one
2. Connect your GitHub repository
3. Create a new Web Service using the `render.yaml` configuration
4. Set up the environment variables in Render dashboard
5. Deploy!

## License

MIT License
