const defaultTrainsByCity = {
  Delhi: [
    { code: 'DEL-123', fare: 2100 },
    { code: 'DEL-345', fare: 2300 },
    { code: 'DEL-456', fare: 2400 }
  ],
  Kolkata: [
    { code: 'KOL-897', fare: 1800 },
    { code: 'KOL-567', fare: 1900 },
    { code: 'KOL-789', fare: 1700 }
  ],
  Patna: [
    { code: 'PAT-123', fare: 2200 },
    { code: 'PAT-345', fare: 2300 },
    { code: 'PAT-456', fare: 2400 }
  ],
  Nagpur: [
    { code: 'NAG-123', fare: 1300 },
    { code: 'NAG-345', fare: 1400 },
    { code: 'NAG-456', fare: 1500 }
  ],
  Jaipur: [
    { code: 'JAI-123', fare: 2200 },
    { code: 'JAI-345', fare: 2300 },
    { code: 'JAI-456', fare: 2400 }
  ],
  Mumbai: [
    { code: 'MUM-123', fare: 1500 },
    { code: 'MUM-345', fare: 1600 },
    { code: 'MUM-456', fare: 1700 }
  ]
};

const foodItems = [
  { name: 'Simple Veg Thali', price: 190 },
  { name: 'Special Veg Thali', price: 210 },
  { name: 'Veg Deluxe Thali', price: 240 },
  { name: 'Simple Non-Veg Thali', price: 210 },
  { name: 'Special Non-Veg Thali', price: 250 },
  { name: 'Non-Veg Deluxe Thali', price: 270 },
  { name: 'Simple South-Indian Thali', price: 210 },
  { name: 'Special South-Indian Thali', price: 240 }
];

const coachesByClass = {
  '3A': ['B1', 'B2', 'B3'],
  '2A': ['A1', 'A2', 'A3'],
  '1A': ['H1', 'H2', 'H3']
};
const SEATS_PER_COACH = 24;

const USER_STORAGE_KEY = 'xyz_railway_users';
const SESSION_STORAGE_KEY = 'xyz_railway_session';
const BOOKING_STORAGE_KEY = 'xyz_railway_bookings';
const TRAIN_STORAGE_KEY = 'xyz_railway_trains';

function getStoredTrains() {
  const stored = localStorage.getItem(TRAIN_STORAGE_KEY);
  const defaults = Object.fromEntries(
    Object.entries(defaultTrainsByCity).map(([city, trains]) => [
      city,
      trains.map((train) => ({ ...train }))
    ])
  );

  if (!stored) {
    return defaults;
  }

  try {
    const trains = JSON.parse(stored);
    const isValid = trains && Object.keys(defaultTrainsByCity).every((city) =>
      Array.isArray(trains[city]) && trains[city].every((train) =>
        train && typeof train.code === 'string' && Number.isFinite(train.fare)
      )
    );

    if (isValid) {
      return trains;
    }

    throw new Error('Stored train data has an invalid format.');
  } catch (error) {
    console.error('Unable to load saved trains; using the default train list.', error);
    return defaults;
  }
}

const trainsByCity = getStoredTrains();

const state = {
  selectedFood: new Set(),
  selectedSeats: new Set(),
  currentUser: localStorage.getItem(SESSION_STORAGE_KEY) || 'Guest'
};

const destinationSelect = document.getElementById('destinationSelect');
const trainSelect = document.getElementById('trainSelect');
const classSelect = document.getElementById('classSelect');
const passengerCount = document.getElementById('passengerCount');
const travelDateInput = document.getElementById('travelDate');
const coachSelect = document.getElementById('coachSelect');
const seatMap = document.getElementById('seatMap');
const welcomeTitle = document.getElementById('welcomeTitle');
const currentUserLabel = document.getElementById('currentUserLabel');
const recentBookingsBox = document.getElementById('recentBookings');
const toast = document.getElementById('toast');

const summaryDestination = document.getElementById('summaryDestination');
const summaryTrain = document.getElementById('summaryTrain');
const summaryTravelDate = document.getElementById('summaryTravelDate');
const summaryClass = document.getElementById('summaryClass');
const summaryPassengers = document.getElementById('summaryPassengers');
const summarySeats = document.getElementById('summarySeats');
const summaryTotal = document.getElementById('summaryTotal');

function renderTrains(city) {
  const options = trainsByCity[city] || [];
  trainSelect.innerHTML = options
    .map((train) => `<option value="${escapeHtml(train.code)}">${escapeHtml(train.code)}</option>`)
    .join('');
  state.selectedSeats.clear();
  updateSummary();
  renderSeatMap();
}

function formatCurrency(value) {
  return `₹${value.toLocaleString('en-IN')}`;
}

function showToast(message, mode = 'success') {
  toast.textContent = message;
  toast.classList.remove('show-error', 'show-success');
  toast.classList.add(mode === 'error' ? 'show-error' : 'show-success');

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove('show-success', 'show-error');
  }, 2200);
}

function getStoredUsers() {
  try {
    return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveUsers(data) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
}

function getStoredBookings() {
  let bookings;
  try {
    bookings = JSON.parse(localStorage.getItem(BOOKING_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }

  if (!Array.isArray(bookings)) {
    return [];
  }

  const usedPnrs = new Set();
  let updated = false;
  bookings.forEach((booking) => {
    const pnr = String(booking.pnr || '');
    if (!/^\d{10}$/.test(pnr) || usedPnrs.has(pnr)) {
      booking.pnr = generateUniquePnr(usedPnrs);
      updated = true;
    } else if (booking.pnr !== pnr) {
      booking.pnr = pnr;
      updated = true;
    }

    usedPnrs.add(booking.pnr);
    if (booking.status !== 'cancelled' && booking.status !== 'confirmed') {
      booking.status = 'confirmed';
      updated = true;
    }
  });

  if (updated) {
    saveBookings(bookings);
  }

  return bookings;
}

function saveBookings(data) {
  localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(data));
}

function generateUniquePnr(usedPnrs) {
  let pnr;
  do {
    pnr = String(Math.floor(1000000000 + Math.random() * 9000000000));
  } while (usedPnrs.has(pnr));
  return pnr;
}

function saveTrains() {
  localStorage.setItem(TRAIN_STORAGE_KEY, JSON.stringify(trainsByCity));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

function updateSessionLabel() {
  const userName = state.currentUser === 'Guest' ? 'Guest' : state.currentUser;
  currentUserLabel.textContent = userName;
  welcomeTitle.textContent = userName === 'Guest' ? 'XYZ Railways' : `${userName} • XYZ Railways`;
}

function renderRecentBookings() {
  const bookings = getStoredBookings().filter((booking) => booking.status !== 'cancelled');

  if (!bookings.length) {
    recentBookingsBox.innerHTML = '<p class="muted-empty">No bookings yet. Start your first journey.</p>';
    return;
  }

  recentBookingsBox.innerHTML = bookings
    .slice(0, 3)
    .map(
      (booking) => `
        <div class="booking-entry">
          <div>
            <strong>${escapeHtml(booking.train)}</strong>
            <span>${escapeHtml(booking.city)} • ${escapeHtml(booking.travelDate || '—')} • ${escapeHtml(booking.className)} • PNR ${escapeHtml(booking.pnr)}</span>
          </div>
          <span>${booking.passengers} pax</span>
        </div>
      `
    )
    .join('');
}

function switchScreen(screenId) {
  document.querySelectorAll('.screen').forEach((screen) => screen.classList.toggle('active', screen.id === screenId));
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle(
    'active',
    item.dataset.target === screenId || (screenId === 'adminDashboard' && item.dataset.target === 'admin')
  ));

  if (screenId === 'adminDashboard') {
    renderAdminDashboard();
  }
}

function handleUserLogin(username, password) {
  const users = getStoredUsers();
  const isAdmin = username === 'admin' && password === 'admin';

  if (isAdmin) {
    state.currentUser = 'Admin';
    localStorage.setItem(SESSION_STORAGE_KEY, 'Admin');
    updateSessionLabel();
    switchScreen('adminDashboard');
    showToast('Admin login successful');
    return;
  }

  if (users[username] && users[username] === password) {
    state.currentUser = username;
    localStorage.setItem(SESSION_STORAGE_KEY, username);
    updateSessionLabel();
    switchScreen('home');
    showToast(`Welcome back, ${username}`);
    return;
  }

  showToast('Invalid login credentials.', 'error');
}

function handleLogout() {
  state.currentUser = 'Guest';
  localStorage.removeItem(SESSION_STORAGE_KEY);
  updateSessionLabel();
  showToast('Logged out successfully');
  switchScreen('home');
}

function handleCreateAccount() {
  const userId = document.getElementById('createUserId').value.trim();
  const password = document.getElementById('createUserPassword').value.trim();

  if (!userId || !password) {
    showToast('Please enter both ID and password.', 'error');
    return;
  }

  const users = getStoredUsers();

  if (users[userId]) {
    showToast('User ID already exists.', 'error');
    return;
  }

  users[userId] = password;
  saveUsers(users);
  state.currentUser = userId;
  localStorage.setItem(SESSION_STORAGE_KEY, userId);
  updateSessionLabel();
  switchScreen('home');
  showToast(`Account created for ${userId}`);

  document.getElementById('createUserId').value = '';
  document.getElementById('createUserPassword').value = '';
}

function updateSummary() {
  const city = destinationSelect.value;
  const train = trainSelect.value;
  const travelDate = travelDateInput.value;
  const className = classSelect.value;
  const passengers = Number(passengerCount.value) || 1;
  const selectedTrain = (trainsByCity[city] || []).find((item) => item.code === train);
  const baseFare = selectedTrain?.fare || 0;
  const seatMultiplier = {
    '3A': 1,
    '2A': 1.4,
    '1A': 2.3
  }[className] || 1;

  const price = Math.round(baseFare * seatMultiplier * passengers);

  summaryDestination.textContent = city;
  summaryTrain.textContent = train || 'No trains available';
  summaryTravelDate.textContent = travelDate || 'Select date';
  summaryClass.textContent = className;
  summaryPassengers.textContent = passengers;
  summarySeats.textContent = state.selectedSeats.size
    ? `${coachSelect.value}: ${[...state.selectedSeats].sort((a, b) => Number(a) - Number(b)).join(', ')}`
    : 'Select seats';
  summaryTotal.textContent = `₹${price.toLocaleString('en-IN')}`;
}

function renderCoachOptions() {
  const coaches = coachesByClass[classSelect.value] || [];
  const selectedCoach = coachSelect.value;
  coachSelect.innerHTML = coaches
    .map((coach) => `<option value="${coach}">${coach}</option>`)
    .join('');
  coachSelect.value = coaches.includes(selectedCoach) ? selectedCoach : coaches[0] || '';
}

function getOccupiedSeats(city, train, travelDate, className, coach) {
  return new Set(
    getStoredBookings()
      .filter((booking) =>
        booking.status !== 'cancelled' &&
        booking.city === city &&
        booking.train === train &&
        booking.travelDate === travelDate &&
        booking.className === className &&
        booking.coach === coach &&
        Array.isArray(booking.seats)
      )
      .flatMap((booking) => booking.seats.map(String))
  );
}

function renderSeatMap() {
  const coach = coachSelect.value;
  if (!coach) {
    seatMap.innerHTML = '';
    seatMap.classList.add('is-empty');
    document.getElementById('seatAvailabilityLabel').textContent = 'No coach available.';
    document.getElementById('selectedSeatsLabel').textContent = '';
    return;
  }

  if (!trainSelect.value || !travelDateInput.value) {
    seatMap.innerHTML = '';
    seatMap.classList.add('is-empty');
    document.getElementById('seatAvailabilityLabel').textContent = 'Select a train and travel date to view seats.';
    document.getElementById('selectedSeatsLabel').textContent = '';
    updateSummary();
    return;
  }

  const occupiedSeats = getOccupiedSeats(
    destinationSelect.value,
    trainSelect.value,
    travelDateInput.value,
    classSelect.value,
    coach
  );
  seatMap.classList.remove('is-empty');
  const passengers = Number(passengerCount.value) || 1;
  document.getElementById('seatAvailabilityLabel').textContent =
    `${Math.max(0, SEATS_PER_COACH - occupiedSeats.size)} of ${SEATS_PER_COACH} seats available`;
  seatMap.innerHTML = `
    <div class="seat-aisle" aria-hidden="true">AISLE</div>
    ${Array.from({ length: SEATS_PER_COACH }, (_, index) => {
      const seatNumber = String(index + 1);
      const isOccupied = occupiedSeats.has(seatNumber);
      const isSelected = state.selectedSeats.has(seatNumber);
      const row = Math.floor(index / 4) + 1;
      const column = index % 4;
      const gridColumn = column < 2 ? column + 1 : column + 2;
      const status = isOccupied ? 'occupied' : isSelected ? 'selected' : 'available';
      return `<button class="seat-button ${status}" data-seat="${seatNumber}" style="grid-row:${row};grid-column:${gridColumn}" type="button" aria-label="Seat ${seatNumber}, ${status}" aria-pressed="${isSelected}" ${isOccupied ? 'disabled' : ''}>${seatNumber}</button>`;
    }).join('')}
  `;
  document.getElementById('selectedSeatsLabel').textContent =
    `${state.selectedSeats.size} of ${passengers} seats selected` +
    (state.selectedSeats.size ? `: ${[...state.selectedSeats].sort((a, b) => Number(a) - Number(b)).join(', ')}` : '');
  updateSummary();
}

function toggleSeat(seatNumber) {
  const occupiedSeats = getOccupiedSeats(
    destinationSelect.value,
    trainSelect.value,
    travelDateInput.value,
    classSelect.value,
    coachSelect.value
  );
  if (occupiedSeats.has(seatNumber)) {
    return;
  }

  if (state.selectedSeats.has(seatNumber)) {
    state.selectedSeats.delete(seatNumber);
  } else {
    const passengers = Number(passengerCount.value) || 1;
    if (state.selectedSeats.size >= passengers) {
      showToast(`Select up to ${passengers} seat${passengers === 1 ? '' : 's'}.`, 'error');
      return;
    }
    state.selectedSeats.add(seatNumber);
  }

  renderSeatMap();
}

function renderFoodItems() {
  const grid = document.getElementById('foodGrid');
  grid.innerHTML = foodItems
    .map(
      (food, index) => `
        <article class="food-item ${state.selectedFood.has(index) ? 'selected' : ''}">
          <h5>${food.name}</h5>
          <p>${formatCurrency(food.price)}</p>
          <button data-index="${index}">${state.selectedFood.has(index) ? 'Added' : 'Add to order'}</button>
        </article>
      `
    )
    .join('');
}

function toggleFoodItem(index) {
  if (state.selectedFood.has(index)) {
    state.selectedFood.delete(index);
  } else {
    state.selectedFood.add(index);
  }
  renderFoodItems();
}

function placeFoodOrder() {
  if (!state.selectedFood.size) {
    showToast('Select at least one food item.', 'error');
    return;
  }

  const items = [...state.selectedFood].map((index) => foodItems[index].name);
  showToast(`Order placed: ${items.join(', ')}`);
  state.selectedFood.clear();
  renderFoodItems();
}

function bookTicket() {
  const city = destinationSelect.value;
  const train = trainSelect.value;
  const travelDate = travelDateInput.value;
  const className = classSelect.value;
  const passengers = Number(passengerCount.value);

  const selectedTrain = (trainsByCity[city] || []).find((item) => item.code === train);
  if (!selectedTrain) {
    showToast('Select a train to continue.', 'error');
    return;
  }

  if (!travelDate) {
    showToast('Select a travel date to continue.', 'error');
    return;
  }

  if (!Number.isInteger(passengers) || passengers < 1 || passengers > 6) {
    showToast('Select between 1 and 6 passengers.', 'error');
    return;
  }

  if (state.selectedSeats.size !== passengers) {
    showToast(`Select ${passengers} seat${passengers === 1 ? '' : 's'} to continue.`, 'error');
    return;
  }

  const coach = coachSelect.value;
  const occupiedSeats = getOccupiedSeats(city, train, travelDate, className, coach);
  const seats = [...state.selectedSeats];
  if (seats.some((seat) => occupiedSeats.has(seat))) {
    state.selectedSeats.clear();
    renderSeatMap();
    showToast('A selected seat is no longer available. Please choose again.', 'error');
    return;
  }

  const baseFare = selectedTrain.fare;
  const multiplier = { '3A': 1, '2A': 1.4, '1A': 2.3 }[className] || 1;
  const total = Math.round(baseFare * multiplier * passengers);
  const bookings = getStoredBookings();
  const booking = {
    pnr: generateUniquePnr(new Set(bookings.map((item) => String(item.pnr)))),
    status: 'confirmed',
    city,
    train,
    travelDate,
    className,
    coach,
    seats,
    passengers,
    total,
    createdAt: new Date().toLocaleString()
  };

  bookings.unshift(booking);
  saveBookings(bookings);
  renderRecentBookings();
  renderTicket(booking, document.getElementById('ticketResult'));
  state.selectedSeats.clear();
  renderSeatMap();
  showToast(`Ticket booked. PNR: ${booking.pnr}`);
}

function renderAdminDashboard() {
  const bookings = getStoredBookings().filter((booking) => booking.status !== 'cancelled');
  const trains = Object.entries(trainsByCity).flatMap(([city, cityTrains]) =>
    cityTrains.map((train) => ({ ...train, city }))
  );
  const revenue = bookings.reduce((total, booking) => total + (Number(booking.total) || 0), 0);

  document.getElementById('adminTrainCount').textContent = trains.length;
  document.getElementById('adminBookingCount').textContent = bookings.length;
  document.getElementById('adminBookingRevenue').textContent = formatCurrency(revenue);
  document.getElementById('adminTrainRows').innerHTML = trains.length
    ? trains.map((train) => `
        <tr>
          <td>${escapeHtml(train.city)}</td>
          <td>${escapeHtml(train.code)}</td>
          <td>${formatCurrency(train.fare)}</td>
          <td><button class="remove-train-btn" data-remove-city="${escapeHtml(train.city)}" data-remove-code="${escapeHtml(train.code)}" type="button">Remove</button></td>
        </tr>
      `).join('')
    : '<tr><td class="muted-empty" colspan="4">No trains available.</td></tr>';

  document.getElementById('adminBookings').innerHTML = bookings.length
    ? bookings.slice(0, 5).map((booking) => `
        <div class="booking-entry">
          <div>
            <strong>${escapeHtml(booking.train)}</strong>
            <span>${escapeHtml(booking.city)} • ${escapeHtml(booking.className)}</span>
          </div>
          <span>${formatCurrency(Number(booking.total) || 0)}</span>
        </div>
      `).join('')
    : '<p class="muted-empty">No bookings yet.</p>';
}

function renderTicket(booking, container) {
  container.dataset.pnr = booking.pnr;
  container.innerHTML = `
    <div class="ticket-slip">
      <div class="ticket-heading">
        <div>
          <span class="ticket-label">PNR</span>
          <strong class="ticket-pnr">${escapeHtml(booking.pnr)}</strong>
        </div>
        <span class="ticket-status ${booking.status === 'cancelled' ? 'cancelled' : ''}">${booking.status === 'cancelled' ? 'Cancelled' : 'Confirmed'}</span>
      </div>
      <div class="ticket-details">
        <div><span>Destination</span><strong>${escapeHtml(booking.city)}</strong></div>
        <div><span>Train</span><strong>${escapeHtml(booking.train)}</strong></div>
        <div><span>Travel date</span><strong>${escapeHtml(booking.travelDate || '—')}</strong></div>
        <div><span>Class</span><strong>${escapeHtml(booking.className)}</strong></div>
        <div><span>Coach / seats</span><strong>${escapeHtml(booking.coach || '—')} / ${escapeHtml((booking.seats || []).join(', ') || '—')}</strong></div>
        <div><span>Passengers</span><strong>${escapeHtml(booking.passengers)}</strong></div>
        <div><span>Booked</span><strong>${escapeHtml(booking.createdAt)}</strong></div>
        <div><span>Total fare</span><strong>${formatCurrency(Number(booking.total) || 0)}</strong></div>
      </div>
      ${booking.status === 'cancelled' ? '' : `<button class="secondary-btn" data-cancel-pnr="${escapeHtml(booking.pnr)}" type="button">Cancel ticket</button>`}
    </div>
  `;
  container.hidden = false;
}

function enquirePnr(event) {
  event.preventDefault();

  const pnr = document.getElementById('pnrInput').value.trim();
  const result = document.getElementById('pnrEnquiryResult');
  if (!/^\d{10}$/.test(pnr)) {
    result.hidden = true;
    showToast('Enter a valid 10-digit PNR.', 'error');
    return;
  }

  const booking = getStoredBookings().find((item) => item.pnr === pnr);
  if (!booking) {
    result.dataset.pnr = '';
    result.textContent = 'No booking found for that PNR.';
    result.hidden = false;
    showToast('No booking found for that PNR.', 'error');
    return;
  }

  renderTicket(booking, result);
}

function cancelTicket(pnr) {
  const bookings = getStoredBookings();
  const booking = bookings.find((item) => item.pnr === pnr);
  if (!booking) {
    showToast('No booking found for that PNR.', 'error');
    return;
  }
  if (booking.status === 'cancelled') {
    showToast('This ticket is already cancelled.', 'error');
    return;
  }

  booking.status = 'cancelled';
  booking.cancelledAt = new Date().toLocaleString();
  saveBookings(bookings);
  renderRecentBookings();
  renderAdminDashboard();
  renderSeatMap();

  ['ticketResult', 'pnrEnquiryResult'].forEach((id) => {
    const result = document.getElementById(id);
    if (!result.hidden && result.dataset.pnr === pnr) {
      renderTicket(booking, result);
    }
  });
  showToast(`Ticket ${pnr} cancelled.`);
}

function addTrain(event) {
  event.preventDefault();

  const city = document.getElementById('adminTrainCity').value;
  const code = document.getElementById('adminTrainCode').value.trim().toUpperCase();
  const fare = Number(document.getElementById('adminTrainFare').value);

  if (!trainsByCity[city] || !/^[A-Z0-9-]+$/.test(code) || !Number.isFinite(fare) || fare <= 0) {
    showToast('Enter a valid train code and positive fare.', 'error');
    return;
  }

  if (trainsByCity[city].some((train) => train.code === code)) {
    showToast('That train already exists for this destination.', 'error');
    return;
  }

  trainsByCity[city].push({ code, fare });
  saveTrains();
  renderTrains(destinationSelect.value);
  renderAdminDashboard();
  event.currentTarget.reset();
  showToast(`${code} added for ${city}`);
}

function removeTrain(city, code) {
  const cityTrains = trainsByCity[city];
  if (!cityTrains) {
    return;
  }

  trainsByCity[city] = cityTrains.filter((train) => train.code !== code);
  saveTrains();
  renderTrains(destinationSelect.value);
  renderAdminDashboard();
  showToast(`${code} removed from ${city}`);
}

["home", "admin", "user", "booking", "pnr", "food"].forEach((id) => {
  const navButton = document.querySelector(`[data-target="${id}"]`);
  if (navButton) {
    navButton.addEventListener('click', () => {
      switchScreen(id);
    });
  }
});

["booking", "admin"].forEach((key) => {
  document.querySelectorAll(`[data-open="${key}"]`).forEach((button) => {
    button.addEventListener('click', () => {
      switchScreen(key);
    });
  });
});

document.getElementById('adminLoginBtn').addEventListener('click', () => {
  handleUserLogin(
    document.getElementById('adminUsername').value.trim(),
    document.getElementById('adminPassword').value.trim()
  );
});

document.getElementById('createAccountBtn').addEventListener('click', handleCreateAccount);

document.getElementById('userLoginBtn').addEventListener('click', () => {
  handleUserLogin(
    document.getElementById('loginUserId').value.trim(),
    document.getElementById('loginUserPassword').value.trim()
  );
});

document.getElementById('logoutBtn').addEventListener('click', handleLogout);
document.getElementById('adminDashboardLogoutBtn').addEventListener('click', handleLogout);
document.getElementById('addTrainForm').addEventListener('submit', addTrain);
document.getElementById('pnrEnquiryForm').addEventListener('submit', enquirePnr);

document.getElementById('bookTicketBtn').addEventListener('click', bookTicket);

document.getElementById('placeFoodOrderBtn').addEventListener('click', placeFoodOrder);

destinationSelect.addEventListener('change', () => renderTrains(destinationSelect.value));
trainSelect.addEventListener('change', () => {
  state.selectedSeats.clear();
  renderSeatMap();
});
classSelect.addEventListener('change', () => {
  state.selectedSeats.clear();
  renderCoachOptions();
  renderSeatMap();
});
coachSelect.addEventListener('change', () => {
  state.selectedSeats.clear();
  renderSeatMap();
});
travelDateInput.addEventListener('change', () => {
  state.selectedSeats.clear();
  renderSeatMap();
});
passengerCount.addEventListener('input', () => {
  const passengerTotal = Number(passengerCount.value) || 1;
  while (state.selectedSeats.size > passengerTotal) {
    state.selectedSeats.delete([...state.selectedSeats].pop());
  }
  renderSeatMap();
});

document.addEventListener('click', (event) => {
  const target = event.target.closest('button[data-index]');
  if (target) {
    toggleFoodItem(Number(target.dataset.index));
  }

  const removeTrainButton = event.target.closest('button[data-remove-city][data-remove-code]');
  if (removeTrainButton) {
    removeTrain(removeTrainButton.dataset.removeCity, removeTrainButton.dataset.removeCode);
  }

  const cancelTicketButton = event.target.closest('button[data-cancel-pnr]');
  if (cancelTicketButton) {
    cancelTicket(cancelTicketButton.dataset.cancelPnr);
  }

  const seatButton = event.target.closest('button[data-seat]');
  if (seatButton) {
    toggleSeat(seatButton.dataset.seat);
  }
});

const now = new Date();
const localToday = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
travelDateInput.min = localToday;
travelDateInput.value = localToday;
updateSessionLabel();
renderCoachOptions();
renderTrains(destinationSelect.value);
renderFoodItems();
renderRecentBookings();
