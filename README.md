# GPS Tracking System

A comprehensive web-based GPS tracking application built with React, TypeScript, and PHP. This system allows for real-time tracking of devices (like Raspberry Pi Pico W), historical data playback, and device management.

## 🚀 Features

- **Live Dashboard**: Real-time overview of fleet status, active devices, and quick stats.
- **Live Tracking**: Full-screen interactive map updating every 10 seconds.
- **History & Playback**: Replay historical paths on a map for any date range.
- **Device Management**: Add, edit, and monitor status of GPS devices.
- **Responsive Design**: Fully optimized for desktop and mobile devices.
- **Dark/Light Mode**: User preference theme support.

## 🛠️ Tech Stack

### Frontend

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Maps**: Leaflet (React-Leaflet)
- **Icons**: React Icons (Lucide/Feather)

### Backend

- **Server Script**: PHP (Vanilla)
- **Database**: MySQL
- **Hardware**: Raspberry Pi Pico W (or similar GPS modules)

---

## ⚙️ Setup Instructions

### 1. Database Setup

Create a MySQL database and run the following SQL schema to create the required tables:

**`users` table:**

```sql
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
);
```

**`devices` table:**

```sql
CREATE TABLE `devices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `device_name` varchar(100) NOT NULL,
  `device_id` varchar(50) NOT NULL UNIQUE,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
);
```

**`gps_data` table:**

```sql
CREATE TABLE `gps_data` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `device_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `satellites` int(11) DEFAULT 0,
  `recorded_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
);
```

### 2. Backend Deployment

1.  Navigate to the `php server` folder (or root).
2.  Open `api.php` and configure your database credentials:
    ```php
    $db_host = 'localhost';
    $db_name = 'your_db_name';
    $db_user = 'your_db_user';
    $db_pass = 'your_db_password';
    ```
3.  Upload `api.php` to your web server (e.g., `public_html` on Hostinger).
4.  Note the public URL (e.g., `https://yourdomain.com/api.php`).

### 3. Frontend Setup

1.  Open the project folder in your terminal.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure the API URL:
    - Open `src/services/api.ts`.
    - Update `API_BASE_URL` to point to your hosted PHP file:
      ```typescript
      const API_BASE_URL = "https://yourdomain.com/api.php";
      ```
4.  Run development server:
    ```bash
    npm run dev
    ```
5.  Build for production:
    ```bash
    npm run build
    ```

---

## 📡 API Endpoints

The `api.php` file handles both data submission and retrieval.

### Data Submission (For Hardware/Pico W)

- **Method**: `POST`
- **Headers**: `X-API-Key: <device_id>`
- **Body**:
  ```json
  {
    "lat": 12.345678,
    "lon": 80.123456,
    "sats": 8
  }
  ```

### Data Retrieval (For Frontend)

- **Get Live Data**: `GET ?action=live`
- **Get History**: `GET ?action=history&limit=100`
- **Get Devices**: `GET ?action=devices`
- **Get Stats**: `GET ?action=stats`

---

## 📱 Hardware Configuration (Pico W)

Your Pico W simply needs to make an HTTP POST request to your API URL with the JSON payload. Ensure the `X-API-Key` header matches a `device_id` entry in your `devices` table.
