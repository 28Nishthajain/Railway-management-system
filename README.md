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

Open `index.html` in a browser. The web interface stores its demo users and bookings in browser local storage and is separate from the C++ application.
