# GPS Data Loader - Setup Instructions

## 🎯 Purpose
Load device and GPS tracking data from `u187878636_gps.csv` into your database.

## 📊 CSV Data Summary
- **Devices**: 1 (Test GPS Tracker)
- **GPS Points**: 1,761 location records

## 🔧 Setup Options

### Option 1: Local Database (Development)
If you have MySQL running locally:

```bash
& "c:/Users/NANDHINI NANDHAGOPAL/.VIRTUALENVS/DEMO-QXGBLSJT/Scripts/python.exe" load_csv_data.py
```

### Option 2: Render Cloud Database (Production)

#### Step 1: Get Render Database Credentials
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Find your **Postgres database** or **MySQL database** service
3. Click on it and go to **Info** section
4. Copy the **Connection String** or individual details:
   - **Host**: e.g., `mysql-xxx.onrender.com`
   - **Port**: Usually `3306` for MySQL
   - **Database**: Your database name
   - **User**: Your database user
   - **Password**: Your database password

#### Step 2: Set Environment Variables

Run the loader with environment variables for your Render database:

```powershell
$env:MYSQL_HOST = "mysql-xxx.onrender.com"
$env:MYSQL_PORT = "3306"
$env:MYSQL_USER = "your_username"
$env:MYSQL_PASSWORD = "your_password"
$env:MYSQL_DATABASE = "your_database_name"

& "c:/Users/NANDHINI NANDHAGOPAL/.VIRTUALENVS/DEMO-QXGBLSJT/Scripts/python.exe" load_csv_data.py
```

#### Step 3: Or Modify `.env` File (Optional)
Create a `.env` file in the project root:

```env
MYSQL_HOST=mysql-xxx.onrender.com
MYSQL_PORT=3306
MYSQL_USER=your_username
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=your_database_name
```

Then load it before running:
```powershell
# Install python-dotenv if needed
pip install python-dotenv

# Modify load_csv_data.py to load from .env:
# from dotenv import load_dotenv
# load_dotenv()
```

## ✅ Verification

After running the script, you should see:
```
📂 Reading CSV from: D:\VS_code_python\GPS\u187878636_gps.csv
✅ Parsed 1 device(s) and 1761 GPS point(s)
✅ Connected to database
📱 Loading 1 device(s)...
  ✅ Inserted device: Test GPS Tracker (ID: test_gps_engine)
📍 Loading 1761 GPS point(s)...
  ✅ Inserted 1761 GPS point(s)
📊 Database Summary:
  Total Devices: 1
  Total GPS Points: 1761
✅ Data loading completed successfully!
```

## 🧪 Test in Frontend

Once data is loaded:

1. **Push changes** to Render:
   ```bash
   git add .
   git commit -m "Add CSV data loader script"
   git push origin main
   ```

2. **Check API endpoints**:
   - `/api.php?action=devices` - See loaded devices
   - `/api.php?action=live` - See latest GPS position
   - `/api.php?action=history` - See historical data

3. **Frontend will show**:
   - Device listed in "Devices" page
   - GPS points on map in "Live Tracking"
   - History records in "History" page

## 🚨 Troubleshooting

### "Can't connect to MySQL server"
- Check host/port are correct
- Ensure firewall rules allow connection
- Verify credentials are correct

### "Invalid literal for int()"
- CSV file may be corrupted
- Verify CSV format matches expected structure

### "Duplicate entry"
- Data already loaded
- Script will skip duplicates automatically

## 📌 Notes
- Script checks for duplicates before inserting
- Safe to run multiple times (won't create duplicates)
- All timestamps preserved from CSV
- Satellite signal strength included in data
