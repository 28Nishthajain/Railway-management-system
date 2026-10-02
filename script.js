const trainsByCity = {
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

const USER_STORAGE_KEY = 'xyz_railway_users';
const SESSION_STORAGE_KEY = 'xyz_railway_session';
const BOOKING_STORAGE_KEY = 'xyz_railway_bookings';

const state = {
  selectedFood: new Set(),
  currentUser: localStorage.getItem(SESSION_STORAGE_KEY) || 'Guest'
};

const destinationSelect = document.getElementById('destinationSelect');
const trainSelect = document.getElementById('trainSelect');
const classSelect = document.getElementById('classSelect');
const passengerCount = document.getElementById('passengerCount');
const welcomeTitle = document.getElementById('welcomeTitle');
const currentUserLabel = document.getElementById('currentUserLabel');
const recentBookingsBox = document.getElementById('recentBookings');
const toast = document.getElementById('toast');

const summaryDestination = document.getElementById('summaryDestination');
const summaryTrain = document.getElementById('summaryTrain');
const summaryClass = document.getElementById('summaryClass');
const summaryPassengers = document.getElementById('summaryPassengers');
const summaryTotal = document.getElementById('summaryTotal');

function renderTrains(city) {
  const options = trainsByCity[city] || trainsByCity.Delhi;
  trainSelect.innerHTML = options
    .map((train) => `<option value="${train.code}">${train.code}</option>`)
    .join('');
  updateSummary();
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
  try {
    return JSON.parse(localStorage.getItem(BOOKING_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveBookings(data) {
  localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(data));
}

function updateSessionLabel() {
  const userName = state.currentUser === 'Guest' ? 'Guest' : state.currentUser;
  currentUserLabel.textContent = userName;
  welcomeTitle.textContent = userName === 'Guest' ? 'XYZ Railways' : `${userName} • XYZ Railways`;
}

function renderRecentBookings() {
  const bookings = getStoredBookings();

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
            <strong>${booking.train}</strong>
            <span>${booking.city} • ${booking.className}</span>
          </div>
          <span>${booking.passengers} pax</span>
        </div>
      `
    )
    .join('');
}

function switchScreen(screenId) {
  document.querySelectorAll('.screen').forEach((screen) => screen.classList.toggle('active', screen.id === screenId));
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.target === screenId));
}

function handleUserLogin(username, password) {
  const users = getStoredUsers();
  const isAdmin = username === 'admin' && password === 'admin';

  if (isAdmin) {
    state.currentUser = 'Admin';
    localStorage.setItem(SESSION_STORAGE_KEY, 'Admin');
    updateSessionLabel();
    switchScreen('home');
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
  const className = classSelect.value;
  const passengers = Number(passengerCount.value) || 1;
  const baseFare = trainsByCity[city].find((item) => item.code === train)?.fare || 2100;
  const seatMultiplier = {
    '3A': 1,
    '2A': 1.4,
    '1A': 2.3
  }[className] || 1;

  const price = Math.round(baseFare * seatMultiplier * passengers);

  summaryDestination.textContent = city;
  summaryTrain.textContent = train;
  summaryClass.textContent = className;
  summaryPassengers.textContent = passengers;
  summaryTotal.textContent = `₹${price.toLocaleString('en-IN')}`;
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
  const className = classSelect.value;
  const passengers = Number(passengerCount.value) || 1;

  if (!train) {
    showToast('Select a train to continue.', 'error');
    return;
  }

  const baseFare = trainsByCity[city].find((item) => item.code === train)?.fare || 2100;
  const multiplier = { '3A': 1, '2A': 1.4, '1A': 2.3 }[className] || 1;
  const total = Math.round(baseFare * multiplier * passengers);
  const booking = {
    city,
    train,
    className,
    passengers,
    total,
    createdAt: new Date().toLocaleString()
  };

  const bookings = getStoredBookings();
  bookings.unshift(booking);
  saveBookings(bookings.slice(0, 5));
  renderRecentBookings();
  showToast(`Ticket booked for ${train} • ${formatCurrency(total)}`);
}

["home", "admin", "user", "booking", "food"].forEach((id) => {
  const navButton = document.querySelector(`[data-target="${id}"]`);
  if (navButton) {
    navButton.addEventListener('click', () => {
      switchScreen(id);
    });
  }
});

["booking", "admin"].forEach((key) => {
  const button = document.querySelector(`[data-open="${key}"]`);
  if (button) {
    button.addEventListener('click', () => {
      switchScreen(key);
    });
  }
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

document.getElementById('bookTicketBtn').addEventListener('click', bookTicket);

document.getElementById('placeFoodOrderBtn').addEventListener('click', placeFoodOrder);

destinationSelect.addEventListener('change', () => renderTrains(destinationSelect.value));
trainSelect.addEventListener('change', updateSummary);
classSelect.addEventListener('change', updateSummary);
passengerCount.addEventListener('input', updateSummary);

document.addEventListener('click', (event) => {
  const target = event.target.closest('button[data-index]');
  if (target) {
    toggleFoodItem(Number(target.dataset.index));
  }
});

updateSessionLabel();
renderTrains(destinationSelect.value);
renderFoodItems();
renderRecentBookings();
