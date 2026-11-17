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

Open `index.html` in a browser. The web interface stores demo users, bookings (including passenger names, PNRs, seat reservations, and sandbox payment references), trains, stations, routes, delay updates, and completed demo-delay observations in browser local storage and is separate from the C++ application. Seat availability is tracked per train, travel date, class, and coach; each demo coach has 24 seats. Booking origin choices use the routes configured by the admin. Booking fares are calculated from the selected train's base fare, class multiplier (3A ×1, 2A ×1.4, 1A ×2.3), and passenger count. The UPI, card, net banking, and wallet options simulate successful payments locally; no real money is charged and no payment credentials are collected. Confirmed tickets and PNR enquiry results include a locally generated QR with the PNR and essential ticket details, excluding passenger names and payment references. Scan it to read the details, then verify the PNR in the demo; QR contents are not digitally signed. PNR cancellations use a demo refund policy based on calendar days before travel: 90% at least 2 days before, 75% 1 day before, 50% on the travel date, and 0% after travel. Refunds are simulated locally and are issued only for bookings with a recorded payment. The Live Train Status screen simulates a journey with location, departure, expected arrival, progress, delay updates, and selectable demo weather; completed journeys become local history. Waitlist prediction estimates the chance of enough passengers cancelling from local booking history, with a labeled 15% demo baseline when no history exists. Delay prediction combines completed simulated journey history with a manually selected weather adjustment. Neither predictor is an official forecast or connected to live railway/weather data. The Railway Assistant is a local rule-based FAQ/PNR helper, not an external AI service. The Admin Portal supports train add/edit/delete and fare updates, station and route management, passenger and booking lists, PNR verification, daily/monthly reports, and train/passenger/booking/revenue analytics. Sign in with the demo credentials `admin` / `admin` to open the admin dashboard.

When no coach can seat the whole party, checkout can place the booking in RAC or the waitlist. The demo reserves two RAC places per coach and advances whole booking groups FIFO when cancellations free enough seats; passenger status and queue position are shown on the ticket and in admin booking views. The Smart Train Route Finder searches configured train-served route connections, compares fewest legs with lowest fare for the chosen class, and can prefill the first leg for booking; “shortest” means fewest legs because journey durations are not stored. Booking can include optional elderly/disability priority or wheelchair assistance requests. Requests are stored locally, can be tracked by PNR, and their progress can be updated in the admin dashboard. No diagnosis is requested.

Train Delay Management lets a demo operator update delay minutes for a train and journey date, calculates the revised expected arrival, and stores the update locally. Passenger alerts are attached to matching active bookings and appear in PNR tickets; they are not sent by SMS or email. The cascading-delay table demonstrates propagation to two illustrative downstream connections, using a 5-minute recovery buffer and 75% carry-over per connection; it is not operational schedule data.

The e-catering menu uses eight distinct original SVG meal illustrations stored in `assets/`, so the images load locally without an external image service.
