# Isho ERP

Mobile garments ERP for Dekko Isho Group, built from the mobile app plan: sign-in, alerts, approvals, dashboards, HR self-service, sewing-floor output, QC, store, and shipments.

The phone app is React Native (Expo, JavaScript). The API is Django with PostgreSQL.

## Demo accounts

Password for every account: `Dekko@123`

| Username | Role |
| --- | --- |
| rahim | Manager — approvals and the full dashboard |
| sadia | Merchandiser — orders, costing, requisitions |
| karim | Supervisor — hourly output and QC |
| farhana | Store — receive and issue |
| nusrat | Operator — attendance, leave, payslips |

`rahim` is also the Django admin user at http://localhost:8000/admin/

## Backend

Requires PostgreSQL already running locally, and Python 3.12+.

```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Edit `backend/.env` and set `POSTGRES_PASSWORD` to the password for your local PostgreSQL user. This machine’s PostgreSQL 18 service is running, and the password `postgres` was not accepted.

```powershell
psql -U postgres -c "CREATE DATABASE dekko_erp;"
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 0.0.0.0:8000
```

On this computer `psql` is `D:\DataBase\bin\psql.exe`.

`seed_demo` replaces the demo records. Run it again any time you want a fresh floor.

## Mobile

Requires Node.js 20 or newer.

```powershell
cd mobile
npm install
npx expo start
```

Press `w` for the browser, or scan the QR code with Expo Go. On a physical phone, open **API server** on the sign-in screen and use your computer’s LAN address, for example `http://192.168.0.10:8000`.

The app icon and splash mark live in `mobile/assets`.

## What the first release covers

- Token sign-in and role-based screens
- In-app alerts for approvals, risk, and low stock
- Approve or reject purchase requisitions, leave, work orders, and costing
- Order, production-versus-target, efficiency, and shipment dashboard
- Attendance, leave requests, payslips, and notices
- Hourly line output with an on-phone queue when the factory network drops
- QC pass/fail, shipment status, and store receive/issue by SKU

Ask Isho answers from the live database (English or Bangla). It does not call an outside model. Device push, camera barcode scan, invoice OCR, and photo defect detection are later phases and are not simulated here.
