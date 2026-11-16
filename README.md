# Railway Management System

This project includes a C++ console application and a standalone browser interface.

## Console application

From this directory, compile with MinGW:

```powershell
g++ railway.cpp -o railway.exe
.\railway.exe
```

The application stores account, ticket, and catering data in local text files. Those runtime files are excluded from version control.

## Browser interface

Open `index.html` in a browser. The web interface stores demo users, bookings (including PNRs and seat reservations), and admin-managed trains in browser local storage and is separate from the C++ application. Seat availability is tracked per train, travel date, class, and coach; each demo coach has 24 seats. PNR enquiry and cancellation use this local booking data. Sign in to the Admin Portal with the demo credentials `admin` / `admin` to open the train management dashboard.
