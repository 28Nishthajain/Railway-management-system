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
  {
    name: 'Simple Veg Thali', price: 190, category: 'Vegetarian',
    description: 'A comforting vegetarian classic.',
    image: 'assets/veg-thali.svg',
    alt: 'Illustrated vegetarian thali with rice, vegetables, and curry'
  },
  {
    name: 'Special Veg Thali', price: 210, category: 'Vegetarian',
    description: 'A colorful meal with a little extra variety.',
    image: 'assets/special-veg-thali.svg',
    alt: 'Paneer curry, rice, flatbread, and sides on a banana leaf'
  },
  {
    name: 'Veg Deluxe Thali', price: 240, category: 'Vegetarian',
    description: 'A generous spread for a longer journey.',
    image: 'assets/deluxe-veg-thali.svg',
    alt: 'Deluxe vegetarian meal with multiple curries, rice, breads, and dessert'
  },
  {
    name: 'Simple Non-Veg Thali', price: 210, category: 'Non-vegetarian',
    description: 'A hearty non-vegetarian meal.',
    image: 'assets/non-veg-thali.svg',
    alt: 'Illustrated non-vegetarian thali with chicken curry and rice'
  },
  {
    name: 'Special Non-Veg Thali', price: 250, category: 'Non-vegetarian',
    description: 'A richer meal with more to enjoy.',
    image: 'assets/special-non-veg-thali.svg',
    alt: 'Chicken biryani with a golden leg piece, raita, and lemon'
  },
  {
    name: 'Non-Veg Deluxe Thali', price: 270, category: 'Non-vegetarian',
    description: 'A generous non-vegetarian spread.',
    image: 'assets/non-veg-deluxe-thali.svg',
    alt: 'Grilled chicken meal with naan, salad, and dipping sauces'
  },
  {
    name: 'Simple South-Indian Thali', price: 210, category: 'South Indian',
    description: 'A regional favorite for your journey.',
    image: 'assets/south-indian-thali.svg',
    alt: 'Illustrated South Indian meal with dosa, idli, and chutneys'
  },
  {
    name: 'Special South-Indian Thali', price: 240, category: 'South Indian',
    description: 'South Indian favorites with extra variety.',
    image: 'assets/special-south-indian-thali.svg',
    alt: 'South Indian spread with mini dosas, idlis, uttapam, and chutneys'
  }
];

const coachesByClass = {
  '3A': ['B1', 'B2', 'B3'],
  '2A': ['A1', 'A2', 'A3'],
  '1A': ['H1', 'H2', 'H3']
};
const CLASS_FARE_MULTIPLIERS = { '3A': 1, '2A': 1.4, '1A': 2.3 };
const SEATS_PER_COACH = 24;
const RAC_SPOTS_PER_COACH = 2;
const DEMO_JOURNEY_MINUTES = 90;
const DEMO_MINUTES_PER_TICK = 5;

const USER_STORAGE_KEY = 'xyz_railway_users';
const SESSION_STORAGE_KEY = 'xyz_railway_session';
const BOOKING_STORAGE_KEY = 'xyz_railway_bookings';
const TRAIN_STORAGE_KEY = 'xyz_railway_trains';
const STATION_STORAGE_KEY = 'xyz_railway_stations';
const ROUTE_STORAGE_KEY = 'xyz_railway_routes';
const DELAY_HISTORY_STORAGE_KEY = 'xyz_railway_delay_history';
const DELAY_STATUS_STORAGE_KEY = 'xyz_railway_delay_status';
const DEFAULT_STATIONS = ['Origin Station', ...Object.keys(defaultTrainsByCity)];
const DEFAULT_ROUTES = Object.keys(defaultTrainsByCity).map((city) => ({
  from: 'Origin Station',
  to: city
}));
const WEATHER_DELAY_MINUTES = { clear: 0, lightRain: 5, heavyRain: 12, fog: 8 };
const WEATHER_LABELS = { clear: 'Clear', lightRain: 'Light rain', heavyRain: 'Heavy rain', fog: 'Fog' };
const WAITLIST_PRIOR_RATE = 0.15;

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
    const isValid = trains &&
      Object.keys(defaultTrainsByCity).every((city) => Array.isArray(trains[city])) &&
      Object.values(trains).every((cityTrains) =>
        Array.isArray(cityTrains) && cityTrains.every((train) =>
          train && typeof train.code === 'string' && Number.isFinite(train.fare)
        )
      );

    if (isValid) {
      return { ...defaults, ...trains };
    }

    throw new Error('Stored train data has an invalid format.');
  } catch (error) {
    console.error('Unable to load saved trains; using the default train list.', error);
    return defaults;
  }
}

function getStoredStations() {
  const stored = localStorage.getItem(STATION_STORAGE_KEY);
  if (!stored) {
    return [...DEFAULT_STATIONS];
  }

  try {
    const savedStations = JSON.parse(stored);
    if (Array.isArray(savedStations) &&
      savedStations.every((station) => typeof station === 'string' && station.trim()) &&
      new Set(savedStations).size === savedStations.length) {
      return savedStations;
    }
    throw new Error('Stored station data has an invalid format.');
  } catch (error) {
    console.error('Unable to load saved stations; using the default station list.', error);
    return [...DEFAULT_STATIONS];
  }
}

function getStoredRoutes(stationList) {
  const stored = localStorage.getItem(ROUTE_STORAGE_KEY);
  if (!stored) {
    return DEFAULT_ROUTES.map((route) => ({ ...route }));
  }

  try {
    const savedRoutes = JSON.parse(stored);
    const isValid = Array.isArray(savedRoutes) && savedRoutes.every((route) =>
      route && stationList.includes(route.from) && stationList.includes(route.to) && route.from !== route.to
    );
    if (isValid) {
      return savedRoutes;
    }
    throw new Error('Stored route data has an invalid format.');
  } catch (error) {
    console.error('Unable to load saved routes; using the default route list.', error);
    return DEFAULT_ROUTES.map((route) => ({ ...route }));
  }
}

function getStoredDelayHistory() {
  const stored = localStorage.getItem(DELAY_HISTORY_STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    const history = JSON.parse(stored);
    const isValid = Array.isArray(history) && history.every((entry) =>
      entry && typeof entry.train === 'string' && typeof entry.city === 'string' &&
      Object.prototype.hasOwnProperty.call(WEATHER_DELAY_MINUTES, entry.weather) &&
      Number.isFinite(entry.baseDelayMinutes) && entry.baseDelayMinutes >= 0
    );
    if (isValid) {
      return history;
    }
    throw new Error('Stored delay history has an invalid format.');
  } catch (error) {
    console.error('Unable to load saved delay history; using an empty history.', error);
    return [];
  }
}

function saveDelayHistory(history) {
  localStorage.setItem(DELAY_HISTORY_STORAGE_KEY, JSON.stringify(history));
}

function getStoredDelayStatuses() {
  try {
    const statuses = JSON.parse(localStorage.getItem(DELAY_STATUS_STORAGE_KEY) || '{}');
    const valid = statuses && typeof statuses === 'object' && !Array.isArray(statuses) &&
      Object.values(statuses).every((status) =>
        status && Number.isInteger(status.operatorDelayMinutes) &&
        status.operatorDelayMinutes >= 0 && status.operatorDelayMinutes <= 240 &&
        typeof status.updatedAt === 'string'
      );
    if (valid) {
      return statuses;
    }
    throw new Error('Stored delay status has an invalid format.');
  } catch (error) {
    console.error('Unable to load saved delay status; using no saved updates.', error);
    return {};
  }
}

function getDelayStatusKey(city, train, travelDate) {
  return JSON.stringify([city, train, travelDate]);
}

function getStoredDelayStatus(city, train, travelDate) {
  return getStoredDelayStatuses()[getDelayStatusKey(city, train, travelDate)] || null;
}

function saveDelayStatus(city, train, travelDate, operatorDelayMinutes) {
  const statuses = getStoredDelayStatuses();
  statuses[getDelayStatusKey(city, train, travelDate)] = {
    operatorDelayMinutes,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(DELAY_STATUS_STORAGE_KEY, JSON.stringify(statuses));
}

const trainsByCity = getStoredTrains();
const stations = getStoredStations();
const routes = getStoredRoutes(stations);

const state = {
  selectedFood: new Set(),
  selectedSeats: new Set(),
  pendingBooking: null,
  liveSimulation: null,
  liveSimulationTimer: null,
  editingTrain: null,
  currentUser: localStorage.getItem(SESSION_STORAGE_KEY) || 'Guest'
};

const destinationSelect = document.getElementById('destinationSelect');
const originSelect = document.getElementById('originSelect');
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
const summaryBaseFare = document.getElementById('summaryBaseFare');
const summaryClassAdjustment = document.getElementById('summaryClassAdjustment');
const summaryTotal = document.getElementById('summaryTotal');
const paymentForm = document.getElementById('paymentForm');
const statusDestinationSelect = document.getElementById('statusDestinationSelect');
const statusTrainSelect = document.getElementById('statusTrainSelect');
const liveWeatherSelect = document.getElementById('liveWeatherSelect');
const statusTravelDateInput = document.getElementById('statusTravelDate');
const operatorDelayInput = document.getElementById('operatorDelayInput');
const waitlistCitySelect = document.getElementById('waitlistCitySelect');
const waitlistTrainSelect = document.getElementById('waitlistTrainSelect');
const delayCitySelect = document.getElementById('delayCitySelect');
const delayTrainSelect = document.getElementById('delayTrainSelect');

function saveStations() {
  localStorage.setItem(STATION_STORAGE_KEY, JSON.stringify(stations));
}

function saveRoutes() {
  localStorage.setItem(ROUTE_STORAGE_KEY, JSON.stringify(routes));
}

function saveTrains() {
  localStorage.setItem(TRAIN_STORAGE_KEY, JSON.stringify(trainsByCity));
}

function renderTrains(city) {
  const options = trainsByCity[city] || [];
  trainSelect.innerHTML = options
    .map((train) => `<option value="${escapeHtml(train.code)}">${escapeHtml(train.code)}</option>`)
    .join('');
  state.selectedSeats.clear();
  updateSummary();
  renderSeatMap();
}

function renderBookingOrigins() {
  const validRoutes = routes.filter((route) => route.to === destinationSelect.value);
  const origins = [...new Set(validRoutes.map((route) => route.from))];
  const previousOrigin = originSelect.value;
  originSelect.innerHTML = origins.length
    ? origins.map((origin) => `<option value="${escapeHtml(origin)}">${escapeHtml(origin)}</option>`).join('')
    : '<option value="">No route configured</option>';
  originSelect.value = origins.includes(previousOrigin) ? previousOrigin : origins[0] || '';
  originSelect.disabled = origins.length === 0 || Boolean(state.pendingBooking);
  updateSummary();
}

function formatCurrency(value) {
  return `₹${value.toLocaleString('en-IN')}`;
}

function calculateFare(baseFare, className, passengers) {
  const multiplier = CLASS_FARE_MULTIPLIERS[className] || 1;
  const baseSubtotal = baseFare * passengers;
  const total = Math.round(baseFare * multiplier * passengers);
  return {
    baseSubtotal,
    classAdjustment: total - baseSubtotal,
    total
  };
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
    const storedStatus = String(booking.status || '').toLowerCase();
    const normalizedStatus = ['confirmed', 'rac', 'waitlisted', 'cancelled'].includes(storedStatus)
      ? storedStatus
      : 'confirmed';
    if (booking.status !== normalizedStatus) {
      booking.status = normalizedStatus;
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

function getBookingStatusLabel(status) {
  return ({
    confirmed: 'Confirmed',
    rac: 'RAC',
    waitlisted: 'Waitlisted',
    cancelled: 'Cancelled'
  })[status] || 'Unknown';
}

function setBookingStatus(booking, status) {
  booking.status = status;
  booking.passengerStatuses = Array.from(
    { length: Math.max(0, Number(booking.passengers) || 0) },
    () => status
  );
}

function getPassengerStatus(booking, index) {
  return Array.isArray(booking.passengerStatuses)
    ? booking.passengerStatuses[index] || booking.status
    : booking.status;
}

function getTripQueue(bookings, city, train, travelDate, className) {
  return bookings
    .filter((booking) =>
      ['rac', 'waitlisted'].includes(booking.status) &&
      booking.city === city &&
      booking.train === train &&
      booking.travelDate === travelDate &&
      booking.className === className
    )
    .sort((left, right) => {
      const leftTime = new Date(left.createdAtTimestamp || 0).getTime() || 0;
      const rightTime = new Date(right.createdAtTimestamp || 0).getTime() || 0;
      return leftTime - rightTime || String(left.pnr).localeCompare(String(right.pnr));
    });
}

function getRacCapacity(className) {
  return (coachesByClass[className] || []).length * RAC_SPOTS_PER_COACH;
}

function getInitialQueueStatus(bookings, city, train, travelDate, className, passengers) {
  const queue = getTripQueue(bookings, city, train, travelDate, className);
  const hasEarlierWaitlisted = queue.some((booking) => booking.status === 'waitlisted');
  const racPassengers = queue
    .filter((booking) => booking.status === 'rac')
    .reduce((total, booking) => total + (Number(booking.passengers) || 0), 0);
  return !hasEarlierWaitlisted && racPassengers + passengers <= getRacCapacity(className)
    ? 'rac'
    : 'waitlisted';
}

function findAvailableCoachAllocation(bookings, city, train, travelDate, className, passengers) {
  for (const coach of coachesByClass[className] || []) {
    const occupiedSeats = getOccupiedSeats(city, train, travelDate, className, coach, bookings);
    const availableSeats = Array.from({ length: SEATS_PER_COACH }, (_, index) => String(index + 1))
      .filter((seat) => !occupiedSeats.has(seat));
    if (availableSeats.length >= passengers) {
      return { coach, seats: availableSeats.slice(0, passengers) };
    }
  }
  return null;
}

function updateQueuePositions(bookings, city, train, travelDate, className) {
  getTripQueue(bookings, city, train, travelDate, className)
    .forEach((booking, index) => {
      booking.queuePosition = index + 1;
    });
}

function promoteTripQueue(bookings, city, train, travelDate, className) {
  const racCapacity = getRacCapacity(className);
  while (true) {
    let queue = getTripQueue(bookings, city, train, travelDate, className);
    if (!queue.length) {
      break;
    }

    let nextBooking = queue.find((booking) => booking.status === 'rac');
    if (!nextBooking) {
      nextBooking = queue[0];
    }
    const allocation = findAvailableCoachAllocation(
      bookings, city, train, travelDate, className, Number(nextBooking.passengers) || 0
    );
    if (!allocation) {
      break;
    }

    nextBooking.coach = allocation.coach;
    nextBooking.seats = allocation.seats;
    nextBooking.queuePosition = null;
    setBookingStatus(nextBooking, 'confirmed');

    queue = getTripQueue(bookings, city, train, travelDate, className);
    const racPassengers = queue
      .filter((booking) => booking.status === 'rac')
      .reduce((total, booking) => total + (Number(booking.passengers) || 0), 0);
    const firstWaiting = queue.find((booking) => booking.status === 'waitlisted');
    if (firstWaiting && racPassengers + (Number(firstWaiting.passengers) || 0) <= racCapacity) {
      setBookingStatus(firstWaiting, 'rac');
    }
  }
  updateQueuePositions(bookings, city, train, travelDate, className);
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
            <span>${escapeHtml(booking.origin || 'Origin Station')} → ${escapeHtml(booking.city)} • ${escapeHtml(booking.travelDate || '—')} • ${escapeHtml(booking.className)} • ${escapeHtml(getBookingStatusLabel(booking.status))} • PNR ${escapeHtml(booking.pnr)}</span>
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

function renderStatusTrains() {
  const city = statusDestinationSelect.value;
  const trains = trainsByCity[city] || [];
  const route = routes.find((item) => item.to === city);
  statusTrainSelect.innerHTML = trains
    .map((train) => `<option value="${escapeHtml(train.code)}">${escapeHtml(train.code)}</option>`)
    .join('');
  document.getElementById('liveTrainLabel').textContent = trains.length
    ? `${trains[0].code} • ${city}`
    : 'No trains available';
  document.getElementById('liveOriginLabel').textContent = route ? route.from : 'No route configured';
  document.getElementById('liveDestinationLabel').textContent = city;
}

function renderManagedCitySelects() {
  const cities = stations.filter((station) => station !== 'Origin Station' && Array.isArray(trainsByCity[station]));
  [destinationSelect, statusDestinationSelect, document.getElementById('adminTrainCity'),
    waitlistCitySelect, delayCitySelect].forEach((select) => {
    const previousCity = select.value;
    select.innerHTML = cities
      .map((city) => `<option value="${escapeHtml(city)}">${escapeHtml(city)}</option>`)
      .join('');
    select.value = cities.includes(previousCity) ? previousCity : cities[0] || '';
  });
  renderBookingOrigins();
  renderTrains(destinationSelect.value);
  renderStatusTrains();
  renderRouteFinderStations();
  renderPredictionTrainOptions(waitlistCitySelect, waitlistTrainSelect);
  renderPredictionTrainOptions(delayCitySelect, delayTrainSelect);
}

function renderPredictionTrainOptions(citySelect, trainSelect) {
  const city = citySelect.value;
  const trains = trainsByCity[city] || [];
  const previousTrain = trainSelect.value;
  trainSelect.innerHTML = trains
    .map((train) => `<option value="${escapeHtml(train.code)}">${escapeHtml(train.code)}</option>`)
    .join('');
  trainSelect.value = trains.some((train) => train.code === previousTrain)
    ? previousTrain
    : trains[0] && trains[0].code || '';
}

function renderStationManagement() {
  document.getElementById('adminStationRows').innerHTML = stations.length
    ? stations.map((station) => `
        <tr>
          <td>${escapeHtml(station)}</td>
          <td><button class="remove-train-btn" data-remove-station="${escapeHtml(station)}" type="button">Remove</button></td>
        </tr>
      `).join('')
    : '<tr><td class="muted-empty" colspan="2">No stations configured.</td></tr>';

  const stationOptions = stations
    .map((station) => `<option value="${escapeHtml(station)}">${escapeHtml(station)}</option>`)
    .join('');
  [document.getElementById('routeOriginSelect'), document.getElementById('routeDestinationSelect')]
    .forEach((select) => {
      const previousStation = select.value;
      select.innerHTML = stationOptions;
      select.value = stations.includes(previousStation) ? previousStation : stations[0] || '';
    });

  document.getElementById('adminRouteRows').innerHTML = routes.length
    ? routes.map((route, index) => `
        <tr>
          <td>${escapeHtml(route.from)}</td>
          <td>${escapeHtml(route.to)}</td>
          <td><button class="remove-train-btn" data-remove-route="${index}" type="button">Remove</button></td>
        </tr>
      `).join('')
    : '<tr><td class="muted-empty" colspan="3">No routes configured.</td></tr>';
  renderBookingOrigins();
  renderStatusTrains();
}

function renderRouteFinderStations() {
  const originSelectForRoutes = document.getElementById('routeFinderOrigin');
  const destinationSelectForRoutes = document.getElementById('routeFinderDestination');
  const makeOptions = (select, fallback) => {
    const previousValue = select.value;
    select.innerHTML = stations
      .map((station) => `<option value="${escapeHtml(station)}">${escapeHtml(station)}</option>`)
      .join('');
    select.value = stations.includes(previousValue) ? previousValue : fallback || stations[0] || '';
  };
  makeOptions(originSelectForRoutes, stations[0]);
  makeOptions(destinationSelectForRoutes, stations[1] || stations[0]);
  if (originSelectForRoutes.value === destinationSelectForRoutes.value) {
    destinationSelectForRoutes.value = stations.find((station) => station !== originSelectForRoutes.value) || '';
  }
}

function getRouteGraph(className) {
  const graph = new Map();
  routes.forEach((route) => {
    const trains = trainsByCity[route.to] || [];
    trains.forEach((train) => {
      const fare = calculateFare(train.fare, className, 1).total;
      const edge = { from: route.from, to: route.to, train: train.code, fare };
      if (!graph.has(route.from)) {
        graph.set(route.from, []);
      }
      graph.get(route.from).push(edge);
    });
  });
  graph.forEach((edges) => edges.sort((left, right) =>
    left.fare - right.fare || left.to.localeCompare(right.to) || left.train.localeCompare(right.train)
  ));
  return graph;
}

function findFewestLegRoute(graph, origin, destination) {
  const queue = [{ station: origin, edges: [], visited: new Set([origin]) }];
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    if (current.station === destination) {
      return current.edges;
    }
    for (const edge of graph.get(current.station) || []) {
      if (!current.visited.has(edge.to)) {
        const visited = new Set(current.visited);
        visited.add(edge.to);
        queue.push({ station: edge.to, edges: [...current.edges, edge], visited });
      }
    }
  }
  return null;
}

function findCheapestRoute(graph, origin, destination) {
  const distances = new Map([[origin, 0]]);
  const legCounts = new Map([[origin, 0]]);
  const previousEdges = new Map();
  const visited = new Set();
  while (true) {
    const current = [...distances.keys()]
      .filter((station) => !visited.has(station))
      .sort((left, right) =>
        distances.get(left) - distances.get(right) ||
        legCounts.get(left) - legCounts.get(right) ||
        left.localeCompare(right)
      )[0];
    if (!current || current === destination) {
      break;
    }
    visited.add(current);
    for (const edge of graph.get(current) || []) {
      const candidateFare = distances.get(current) + edge.fare;
      const candidateLegs = legCounts.get(current) + 1;
      const knownFare = distances.get(edge.to);
      if (knownFare === undefined || candidateFare < knownFare ||
        (candidateFare === knownFare && candidateLegs < legCounts.get(edge.to))) {
        distances.set(edge.to, candidateFare);
        legCounts.set(edge.to, candidateLegs);
        previousEdges.set(edge.to, edge);
      }
    }
  }
  if (!previousEdges.has(destination)) {
    return null;
  }
  const path = [];
  let station = destination;
  while (station !== origin) {
    const edge = previousEdges.get(station);
    if (!edge) {
      return null;
    }
    path.unshift(edge);
    station = edge.from;
  }
  return path;
}

function formatRouteOption(title, path, highlighted) {
  const totalFare = path.reduce((total, leg) => total + leg.fare, 0);
  const routeLegs = path.map((leg, index) => `
    <div class="route-leg">
      <div><strong>Leg ${index + 1} · ${escapeHtml(leg.train)}</strong><span>${escapeHtml(leg.from)} → ${escapeHtml(leg.to)}</span></div>
      <strong>${formatCurrency(leg.fare)}</strong>
    </div>
  `).join('');
  const firstLeg = path[0];
  return `
    <article class="route-option-card ${highlighted ? 'recommended' : ''}">
      <div class="route-option-heading">
        <div><p class="eyebrow">${highlighted ? 'Recommended' : 'Alternative'}</p><h4>${escapeHtml(title)}</h4></div>
        <strong class="route-total">${formatCurrency(totalFare)}</strong>
      </div>
      <p class="route-summary">${path.length} train leg${path.length === 1 ? '' : 's'} · ${Math.max(0, path.length - 1)} change${path.length === 2 ? '' : 's'}</p>
      ${routeLegs}
      <button class="secondary-btn" data-route-origin="${escapeHtml(firstLeg.from)}" data-route-destination="${escapeHtml(firstLeg.to)}" data-route-train="${escapeHtml(firstLeg.train)}" type="button">Book first leg</button>
    </article>
  `;
}

function handleRouteFinder(event) {
  event.preventDefault();
  const origin = document.getElementById('routeFinderOrigin').value;
  const destination = document.getElementById('routeFinderDestination').value;
  const className = document.getElementById('routeFinderClass').value;
  const preference = document.getElementById('routeFinderPreference').value;
  const result = document.getElementById('routeFinderResult');
  if (!stations.includes(origin) || !stations.includes(destination) || origin === destination) {
    result.innerHTML = '<p>Choose two different configured stations.</p>';
    result.hidden = false;
    return;
  }
  const graph = getRouteGraph(className);
  const fewestLegs = findFewestLegRoute(graph, origin, destination);
  const cheapest = findCheapestRoute(graph, origin, destination);
  if (!fewestLegs && !cheapest) {
    result.innerHTML = `<p>No train route is available from ${escapeHtml(origin)} to ${escapeHtml(destination)}. Ask an admin to configure connected routes and train services.</p>`;
    result.hidden = false;
    return;
  }
  const recommended = preference === 'cheapest' ? cheapest || fewestLegs : fewestLegs || cheapest;
  const alternative = preference === 'cheapest' ? fewestLegs : cheapest;
  const isSameRoute = recommended && alternative &&
    recommended.map((leg) => `${leg.from}:${leg.to}:${leg.train}`).join('|') ===
    alternative.map((leg) => `${leg.from}:${leg.to}:${leg.train}`).join('|');
  const title = preference === 'cheapest'
    ? 'Lowest-fare route'
    : 'Fewest-leg route';
  result.innerHTML = `
    <div class="route-results-header"><h4>Route suggestions</h4><span>${escapeHtml(origin)} → ${escapeHtml(destination)}</span></div>
    <div class="route-options">
      ${formatRouteOption(title, recommended, true)}
      ${alternative && !isSameRoute ? formatRouteOption(
        preference === 'cheapest' ? 'Fewest-leg alternative' : 'Lowest-fare alternative',
        alternative,
        false
      ) : '<p class="route-same-note">The fewest-leg and lowest-fare searches recommend the same route.</p>'}
    </div>
  `;
  result.hidden = false;
}

function prefillBookingForLeg(origin, destination, train) {
  if (!stations.includes(origin) || !routes.some((route) => route.from === origin && route.to === destination)) {
    showToast('That route is no longer available.', 'error');
    return;
  }
  destinationSelect.value = destination;
  renderBookingOrigins();
  originSelect.value = origin;
  renderTrains(destination);
  if (!(trainsByCity[destination] || []).some((item) => item.code === train)) {
    showToast('That train is no longer available.', 'error');
    return;
  }
  trainSelect.value = train;
  state.selectedSeats.clear();
  renderSeatMap();
  switchScreen('booking');
}

function addStation(event) {
  event.preventDefault();
  const station = document.getElementById('newStationName').value.trim();
  if (!/^[\p{L}\p{N}][\p{L}\p{N} .'-]{0,49}$/u.test(station)) {
    showToast('Enter a valid station name.', 'error');
    return;
  }
  if (stations.some((item) => item.toLowerCase() === station.toLowerCase())) {
    showToast('That station already exists.', 'error');
    return;
  }

  stations.push(station);
  trainsByCity[station] = [];
  saveStations();
  saveTrains();
  document.getElementById('addStationForm').reset();
  renderManagedCitySelects();
  renderAdminDashboard();
  showToast(`${station} added.`);
}

function removeStation(station) {
  const cityTrains = trainsByCity[station] || [];
  const hasBookings = getStoredBookings().some((booking) => booking.city === station);
  if (cityTrains.length || hasBookings) {
    showToast('Remove the station’s trains and bookings before deleting it.', 'error');
    return;
  }
  if (routes.some((route) => route.from === station || route.to === station)) {
    showToast('Remove routes using this station before deleting it.', 'error');
    return;
  }

  const index = stations.indexOf(station);
  if (index < 0) {
    return;
  }
  stations.splice(index, 1);
  if (Object.prototype.hasOwnProperty.call(defaultTrainsByCity, station)) {
    trainsByCity[station] = [];
  } else {
    delete trainsByCity[station];
  }
  saveStations();
  saveTrains();
  renderManagedCitySelects();
  renderAdminDashboard();
  showToast(`${station} removed.`);
}

function addRoute(event) {
  event.preventDefault();
  const from = document.getElementById('routeOriginSelect').value;
  const to = document.getElementById('routeDestinationSelect').value;
  if (!stations.includes(from) || !stations.includes(to) || from === to) {
    showToast('Choose two different configured stations.', 'error');
    return;
  }
  if (routes.some((route) => route.from === from && route.to === to)) {
    showToast('That route already exists.', 'error');
    return;
  }
  routes.push({ from, to });
  saveRoutes();
  renderStationManagement();
  showToast(`Route added: ${from} to ${to}.`);
}

function removeRoute(index) {
  if (!Number.isInteger(index) || index < 0 || index >= routes.length) {
    return;
  }
  const [route] = routes.splice(index, 1);
  saveRoutes();
  renderStationManagement();
  showToast(`Route removed: ${route.from} to ${route.to}.`);
}

function resetTrainEditForm() {
  state.editingTrain = null;
  document.getElementById('addTrainForm').reset();
  document.getElementById('trainFormTitle').textContent = 'Add a train';
  document.getElementById('trainFormSubmit').textContent = 'Add train';
  document.getElementById('cancelTrainEditBtn').hidden = true;
}

function startTrainEdit(city, code) {
  const train = (trainsByCity[city] || []).find((item) => item.code === code);
  if (!train) {
    showToast('Train not found.', 'error');
    return;
  }
  state.editingTrain = { city, code };
  document.getElementById('adminTrainCity').value = city;
  document.getElementById('adminTrainCode').value = train.code;
  document.getElementById('adminTrainFare').value = train.fare;
  document.getElementById('trainFormTitle').textContent = `Update ${train.code}`;
  document.getElementById('trainFormSubmit').textContent = 'Save train';
  document.getElementById('cancelTrainEditBtn').hidden = false;
}

function resetLiveSimulation() {
  clearInterval(state.liveSimulationTimer);
  state.liveSimulationTimer = null;
  state.liveSimulation = null;
  document.getElementById('toggleSimulationBtn').textContent = 'Start demo journey';
  document.getElementById('liveLocation').textContent = 'Start a demo journey to see train movement.';
  document.getElementById('liveDeparture').textContent = '—';
  document.getElementById('liveArrival').textContent = '—';
  const delayLabel = document.getElementById('liveDelay');
  delayLabel.textContent = '—';
  delayLabel.classList.remove('delayed');
  delayLabel.classList.add('on-time');
  document.getElementById('liveProgressLabel').textContent = 'Journey not started';
  document.getElementById('liveProgressTrack').setAttribute('aria-valuenow', '0');
  document.getElementById('liveProgressBar').style.width = '0%';
  document.getElementById('liveCascadeRows').innerHTML =
    '<tr><td class="muted-empty" colspan="4">Start or update a journey to simulate delay propagation.</td></tr>';
}

function getCurrentDelayMinutes(simulation) {
  const progressDelay = simulation.elapsedMinutes >= 55 ? 12
    : simulation.elapsedMinutes >= 25 ? 5 : 0;
  simulation.baseDelayMinutes = progressDelay;
  return Math.max(0,
    (Number(simulation.operatorDelayMinutes) || 0) +
    progressDelay +
    (WEATHER_DELAY_MINUTES[simulation.weather] || 0)
  );
}

function getExpectedJourneyMinutes(simulation) {
  return DEMO_JOURNEY_MINUTES + getCurrentDelayMinutes(simulation);
}

function formatLiveDateTime(timestamp) {
  return new Date(timestamp).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function getSelectedDepartureTime() {
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(statusTravelDateInput.value);
  if (!dateParts) {
    return null;
  }
  const now = new Date();
  const departure = new Date(
    Number(dateParts[1]),
    Number(dateParts[2]) - 1,
    Number(dateParts[3]),
    now.getHours(),
    now.getMinutes(),
    0,
    0
  );
  return departure.getFullYear() === Number(dateParts[1]) &&
    departure.getMonth() === Number(dateParts[2]) - 1 &&
    departure.getDate() === Number(dateParts[3])
    ? departure.getTime()
    : null;
}

function syncDelayControlsForSelection() {
  const saved = getStoredDelayStatus(
    statusDestinationSelect.value,
    statusTrainSelect.value,
    statusTravelDateInput.value
  );
  operatorDelayInput.value = saved ? String(saved.operatorDelayMinutes) : '0';
}

function createLiveSimulation() {
  const city = statusDestinationSelect.value;
  const train = statusTrainSelect.value;
  const route = routes.find((item) => item.to === city);
  if (!train) {
    showToast('Select an available train to start the simulation.', 'error');
    return null;
  }
  if (!route) {
    showToast('Configure a route for this destination before starting the simulation.', 'error');
    return null;
  }
  const departureTime = getSelectedDepartureTime();
  if (departureTime === null) {
    showToast('Select a valid journey date.', 'error');
    return null;
  }
  const operatorDelayMinutes = Number(operatorDelayInput.value) || 0;
  operatorDelayInput.value = String(operatorDelayMinutes);
  return {
    city,
    train,
    origin: route.from,
    weather: liveWeatherSelect.value,
    departureTime,
    travelDate: statusTravelDateInput.value,
    elapsedMinutes: 0,
    operatorDelayMinutes,
    baseDelayMinutes: 0,
    running: false,
    completed: false
  };
}

function updateLiveStatus() {
  const simulation = state.liveSimulation;
  if (!simulation) {
    return null;
  }

  const delayMinutes = getCurrentDelayMinutes(simulation);
  const journeyDurationMinutes = DEMO_JOURNEY_MINUTES + delayMinutes;
  const progress = Math.min(100, Math.round(simulation.elapsedMinutes / journeyDurationMinutes * 100));
  let location;
  if (simulation.elapsedMinutes < 5) {
    location = `Departing ${simulation.origin}`;
  } else if (simulation.elapsedMinutes < 25) {
    location = `Departed from ${simulation.origin}`;
  } else if (simulation.elapsedMinutes < 50) {
    location = 'En route to Midway Junction';
  } else if (simulation.elapsedMinutes < 60) {
    location = 'At Midway Junction';
  } else if (simulation.elapsedMinutes < DEMO_JOURNEY_MINUTES) {
    location = `En route to ${simulation.city}`;
  } else if (simulation.elapsedMinutes < journeyDurationMinutes) {
    location = `Delayed, approaching ${simulation.city}`;
  } else {
    location = `Arrived at ${simulation.city} terminal`;
  }

  const arrivalTime = simulation.departureTime +
    journeyDurationMinutes * 60000;
  const delayLabel = document.getElementById('liveDelay');
  const trainLabel = `${simulation.train} • ${simulation.city}`;

  document.getElementById('liveLocation').textContent = location;
  document.getElementById('liveDeparture').textContent =
    formatLiveDateTime(simulation.departureTime);
  document.getElementById('liveArrival').textContent = simulation.elapsedMinutes >= DEMO_JOURNEY_MINUTES
    ? simulation.elapsedMinutes >= journeyDurationMinutes
      ? `Arrived ${formatLiveDateTime(arrivalTime)}`
      : `Expected ${formatLiveDateTime(arrivalTime)}`
    : `Expected ${formatLiveDateTime(arrivalTime)}`;
  delayLabel.textContent = delayMinutes ? `${delayMinutes} min` : 'On time';
  delayLabel.classList.toggle('delayed', delayMinutes > 0);
  delayLabel.classList.toggle('on-time', delayMinutes === 0);
  document.getElementById('liveTrainLabel').textContent = trainLabel;
  document.getElementById('liveProgressLabel').textContent =
    `${progress}% complete • ${Math.min(simulation.elapsedMinutes, journeyDurationMinutes)}/${journeyDurationMinutes} simulated minutes`;
  document.getElementById('liveProgressTrack').setAttribute('aria-valuenow', String(progress));
  document.getElementById('liveProgressBar').style.width = `${progress}%`;
  renderCascadingDelays(simulation, delayMinutes);
  return journeyDurationMinutes;
}

function renderCascadingDelays(simulation, delayMinutes = getCurrentDelayMinutes(simulation)) {
  const firstConnectionDelay = Math.max(0, delayMinutes - 5);
  const secondConnectionDelay = Math.max(0, Math.ceil(firstConnectionDelay * 0.75) - 5);
  const scheduledDepartures = [
    simulation.departureTime,
    simulation.departureTime + 55 * 60000,
    simulation.departureTime + (DEMO_JOURNEY_MINUTES + 20) * 60000
  ];
  const services = [
    { name: simulation.train, point: simulation.origin, delay: delayMinutes },
    { name: 'DEMO-CON-1', point: 'Midway Junction', delay: firstConnectionDelay },
    { name: 'DEMO-CON-2', point: simulation.city, delay: secondConnectionDelay }
  ];
  document.getElementById('liveCascadeRows').innerHTML = services.map((service, index) => `
    <tr>
      <td>${escapeHtml(service.name)}</td>
      <td>${escapeHtml(service.point)}</td>
      <td>${service.delay ? `${service.delay} min` : 'On time'}</td>
      <td>${escapeHtml(formatLiveDateTime(scheduledDepartures[index] + service.delay * 60000))}</td>
    </tr>
  `).join('');
}

function applyDelayUpdate() {
  const operatorDelayMinutes = Number(operatorDelayInput.value);
  if (!Number.isInteger(operatorDelayMinutes) || operatorDelayMinutes < 0 || operatorDelayMinutes > 240) {
    showToast('Enter a delay from 0 to 240 whole minutes.', 'error');
    return;
  }
  if (state.liveSimulation && state.liveSimulation.completed) {
    resetLiveSimulation();
  }
  if (!state.liveSimulation) {
    state.liveSimulation = createLiveSimulation();
    if (!state.liveSimulation) {
      return;
    }
  }
  const simulation = state.liveSimulation;
  simulation.operatorDelayMinutes = operatorDelayMinutes;
  simulation.weather = liveWeatherSelect.value;
  saveDelayStatus(simulation.city, simulation.train, simulation.travelDate, operatorDelayMinutes);
  const duration = updateLiveStatus();
  if (simulation.elapsedMinutes >= duration) {
    simulation.elapsedMinutes = duration;
    finishLiveSimulation(simulation);
  }
  showToast(`Delay updated. Expected arrival: ${formatLiveDateTime(
    simulation.departureTime + getExpectedJourneyMinutes(simulation) * 60000
  )}.`);
}

function alertPassengers() {
  const city = statusDestinationSelect.value;
  const train = statusTrainSelect.value;
  const travelDate = statusTravelDateInput.value;
  const selectedTrain = (trainsByCity[city] || []).some((item) => item.code === train);
  const departureTime = state.liveSimulation &&
    state.liveSimulation.city === city &&
    state.liveSimulation.train === train &&
    state.liveSimulation.travelDate === travelDate
    ? state.liveSimulation.departureTime
    : getSelectedDepartureTime();
  const inputDelay = Number(operatorDelayInput.value);
  if (!selectedTrain || departureTime === null ||
    !Number.isInteger(inputDelay) || inputDelay < 0 || inputDelay > 240) {
    showToast('Choose a valid train, journey date, and delay before alerting passengers.', 'error');
    return;
  }
  const simulationMatchesSelection = state.liveSimulation &&
    state.liveSimulation.city === city &&
    state.liveSimulation.train === train &&
    state.liveSimulation.travelDate === travelDate;
  const delayMinutes = simulationMatchesSelection
    ? getCurrentDelayMinutes(state.liveSimulation)
    : inputDelay + (WEATHER_DELAY_MINUTES[liveWeatherSelect.value] || 0);
  const expectedArrival = new Date(
    departureTime + (DEMO_JOURNEY_MINUTES + delayMinutes) * 60000
  );
  const expectedArrivalText = formatLiveDateTime(expectedArrival.getTime());
  const bookings = getStoredBookings();
  const matchingBookings = bookings.filter((booking) =>
    booking.status !== 'cancelled' &&
    booking.city === city &&
    booking.train === train &&
    booking.travelDate === travelDate
  );
  const result = document.getElementById('delayAlertResult');
  if (!matchingBookings.length) {
    result.textContent = `No active passenger bookings were found for ${train} on ${travelDate}.`;
    result.hidden = false;
    showToast('No matching passengers to alert.', 'error');
    return;
  }
  const sentAt = new Date().toISOString();
  const message = `${train} to ${city} is expected ${delayMinutes} minute${delayMinutes === 1 ? '' : 's'} late. Expected arrival: ${expectedArrivalText}.`;
  matchingBookings.forEach((booking) => {
    booking.delayAlert = {
      delayMinutes,
      expectedArrival: expectedArrival.toISOString(),
      message,
      sentAt
    };
  });
  saveBookings(bookings);
  const passengerTotal = matchingBookings.reduce(
    (total, booking) => total + (Number(booking.passengers) || 0), 0
  );
  result.innerHTML = `<strong>Demo alert sent to ${passengerTotal} passenger${passengerTotal === 1 ? '' : 's'}.</strong> ${escapeHtml(message)} Passengers can view it with their PNR.`;
  result.hidden = false;
  ['ticketResult', 'pnrEnquiryResult', 'adminPnrResult'].forEach((id) => {
    const ticket = document.getElementById(id);
    if (!ticket.hidden && ticket.dataset.pnr) {
      const booking = bookings.find((item) => item.pnr === ticket.dataset.pnr);
      if (booking) {
        renderTicket(booking, ticket);
      }
    }
  });
  showToast(`Delay alert sent to ${passengerTotal} passenger${passengerTotal === 1 ? '' : 's'}.`);
}

function finishLiveSimulation(simulation) {
  if (simulation.completed) {
    return;
  }
  simulation.completed = true;
  simulation.running = false;
  clearInterval(state.liveSimulationTimer);
  state.liveSimulationTimer = null;
  document.getElementById('toggleSimulationBtn').textContent = 'Replay simulation';
  updateLiveStatus();
  recordCompletedSimulation(simulation);
}

function recordCompletedSimulation(simulation) {
  const history = getStoredDelayHistory();
  history.push({
    city: simulation.city,
    train: simulation.train,
    weather: simulation.weather,
    baseDelayMinutes: simulation.baseDelayMinutes + simulation.operatorDelayMinutes,
    completedAt: new Date().toISOString()
  });
  saveDelayHistory(history.slice(-200));
}

function toggleLiveSimulation() {
  if (!state.liveSimulation || state.liveSimulation.completed) {
    if (state.liveSimulation) {
      resetLiveSimulation();
    }
    state.liveSimulation = createLiveSimulation();
    if (!state.liveSimulation) {
      return;
    }
    state.liveSimulation.running = true;
  } else {
    state.liveSimulation.running = !state.liveSimulation.running;
  }

  const simulation = state.liveSimulation;
  const toggleButton = document.getElementById('toggleSimulationBtn');
  if (simulation.running) {
    toggleButton.textContent = 'Pause simulation';
    updateLiveStatus();
    state.liveSimulationTimer = setInterval(() => {
      if (!simulation.running) {
        return;
      }
      simulation.elapsedMinutes = Math.min(
        getExpectedJourneyMinutes(simulation),
        simulation.elapsedMinutes + DEMO_MINUTES_PER_TICK
      );
      const journeyDuration = updateLiveStatus();
      if (simulation.elapsedMinutes >= journeyDuration) {
        finishLiveSimulation(simulation);
      }
    }, 1000);
  } else {
    clearInterval(state.liveSimulationTimer);
    state.liveSimulationTimer = null;
    toggleButton.textContent = 'Resume simulation';
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

function renderPassengerFields() {
  const count = Number(passengerCount.value);
  const passengerTotal = Number.isInteger(count) && count >= 1 && count <= 6 ? count : 1;
  const existingDetails = [...document.querySelectorAll('[data-passenger-name]')]
    .map((input) => {
      const fieldGroup = input.closest('.passenger-field-group');
      return {
        name: input.value,
        priorityType: fieldGroup.querySelector('[data-assistance-priority]').value,
        wheelchair: fieldGroup.querySelector('[data-wheelchair-request]').checked
      };
    });
  document.getElementById('passengerDetailsFields').innerHTML = Array.from(
    { length: passengerTotal },
    (_, index) => `
      <div class="passenger-field-group">
        <label>
          <span>Passenger ${index + 1} full name</span>
          <input data-passenger-name="${index}" type="text" maxlength="80" autocomplete="name" value="${escapeHtml(existingDetails[index]?.name || '')}" required />
        </label>
        <label>
          <span>Priority assistance</span>
          <select data-assistance-priority="${index}">
            <option value="">Not requested</option>
            <option value="elderly" ${existingDetails[index]?.priorityType === 'elderly' ? 'selected' : ''}>Elderly passenger</option>
            <option value="disability" ${existingDetails[index]?.priorityType === 'disability' ? 'selected' : ''}>Passenger with a disability</option>
          </select>
        </label>
        <label class="checkbox-field">
          <input data-wheelchair-request="${index}" type="checkbox" ${existingDetails[index]?.wheelchair ? 'checked' : ''} />
          <span>Wheelchair assistance requested</span>
        </label>
      </div>
    `
  ).join('');
}

function collectPassengerDetails(passengers) {
  const passengerNames = [...document.querySelectorAll('[data-passenger-name]')]
    .map((input) => input.value.trim());
  if (passengerNames.length !== passengers || passengerNames.some((name) => !name)) {
    showToast('Enter the full name for each passenger.', 'error');
    return null;
  }
  const assistanceRequests = Array.from({ length: passengers }, (_, index) => {
    const priorityType = document.querySelector(`[data-assistance-priority="${index}"]`).value;
    const wheelchair = document.querySelector(`[data-wheelchair-request="${index}"]`).checked;
    return {
      priorityType,
      wheelchair,
      status: priorityType || wheelchair ? 'requested' : ''
    };
  });
  return { passengerNames, assistanceRequests };
}

function updateWaitlistControls() {
  const button = document.getElementById('joinWaitlistBtn');
  const city = destinationSelect.value;
  const train = trainSelect.value;
  const travelDate = travelDateInput.value;
  const className = classSelect.value;
  const passengers = Number(passengerCount.value);
  const bookings = getStoredBookings();
  if (!train || !travelDate || !Number.isInteger(passengers) || passengers < 1 || passengers > 6) {
    button.hidden = true;
    return;
  }
  if (!routes.some((route) => route.from === originSelect.value && route.to === city)) {
    button.hidden = true;
    return;
  }
  const queue = getTripQueue(bookings, city, train, travelDate, className);
  const allocation = findAvailableCoachAllocation(bookings, city, train, travelDate, className, passengers);
  button.hidden = Boolean(allocation) && !queue.length;
  if (!allocation) {
    const status = getInitialQueueStatus(
      bookings, city, train, travelDate, className, passengers
    );
    button.textContent = status === 'rac' ? 'Join RAC' : 'Join waitlist';
  } else if (queue.length) {
    button.textContent = 'Join FIFO waitlist';
  }
}

function updateSummary() {
  const city = destinationSelect.value;
  const train = trainSelect.value;
  const travelDate = travelDateInput.value;
  const className = classSelect.value;
  const passengers = Number(passengerCount.value) || 1;
  const selectedTrain = (trainsByCity[city] || []).find((item) => item.code === train);
  const baseFare = selectedTrain?.fare || 0;
  const fare = calculateFare(baseFare, className, passengers);

  document.getElementById('summaryOrigin').textContent = originSelect.value || 'No route available';
  summaryDestination.textContent = city;
  summaryTrain.textContent = train || 'No trains available';
  summaryTravelDate.textContent = travelDate || 'Select date';
  summaryClass.textContent = className;
  summaryPassengers.textContent = passengers;
  summarySeats.textContent = state.selectedSeats.size
    ? `${coachSelect.value}: ${[...state.selectedSeats].sort((a, b) => Number(a) - Number(b)).join(', ')}`
    : 'Select seats';
  summaryBaseFare.textContent = formatCurrency(fare.baseSubtotal);
  summaryClassAdjustment.textContent = formatCurrency(fare.classAdjustment);
  summaryTotal.textContent = formatCurrency(fare.total);
}

function renderCoachOptions() {
  const coaches = coachesByClass[classSelect.value] || [];
  const selectedCoach = coachSelect.value;
  coachSelect.innerHTML = coaches
    .map((coach) => `<option value="${coach}">${coach}</option>`)
    .join('');
  coachSelect.value = coaches.includes(selectedCoach) ? selectedCoach : coaches[0] || '';
}

function getOccupiedSeats(city, train, travelDate, className, coach, bookings = getStoredBookings()) {
  return new Set(
    bookings
      .filter((booking) =>
        booking.status === 'confirmed' &&
        booking.city === city &&
        booking.train === train &&
        booking.travelDate === travelDate &&
        booking.className === className &&
        booking.coach === coach &&
        Array.isArray(booking.seats)
      )
      .flatMap((booking) => booking.seats.map(String).filter(Boolean))
  );
}

function renderSeatMap() {
  const coach = coachSelect.value;
  if (!coach) {
    seatMap.innerHTML = '';
    seatMap.classList.add('is-empty');
    document.getElementById('seatAvailabilityLabel').textContent = 'No coach available.';
    document.getElementById('selectedSeatsLabel').textContent = '';
    updateWaitlistControls();
    return;
  }

  if (!trainSelect.value || !travelDateInput.value) {
    seatMap.innerHTML = '';
    seatMap.classList.add('is-empty');
    document.getElementById('seatAvailabilityLabel').textContent = 'Select a train and travel date to view seats.';
    document.getElementById('selectedSeatsLabel').textContent = '';
    updateSummary();
    updateWaitlistControls();
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
  updateWaitlistControls();
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
          <div class="food-photo">
            <img src="${food.image}" alt="${food.alt}" loading="lazy" />
            <span class="food-category">${food.category}</span>
          </div>
          <div class="food-item-body">
            <div class="food-item-heading">
              <h5>${food.name}</h5>
              <strong class="food-price">${formatCurrency(food.price)}</strong>
            </div>
            <p>${food.description}</p>
            <button data-index="${index}" aria-pressed="${state.selectedFood.has(index)}">${state.selectedFood.has(index) ? 'Added to order' : 'Add to order'}</button>
          </div>
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
  const origin = originSelect.value;
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

  if (!routes.some((route) => route.from === origin && route.to === city)) {
    showToast('No route is configured for this origin and destination.', 'error');
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
  const bookings = getStoredBookings();
  if (getTripQueue(bookings, city, train, travelDate, className).length) {
    showToast('A FIFO queue already exists for this train and class. Join it instead of selecting seats.', 'error');
    updateWaitlistControls();
    return;
  }

  const passengerDetails = collectPassengerDetails(passengers);
  if (!passengerDetails) {
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

  const fare = calculateFare(selectedTrain.fare, className, passengers);
  state.pendingBooking = {
    origin,
    city,
    train,
    travelDate,
    className,
    coach,
    seats,
    passengers,
    ...passengerDetails,
    queueRequest: false,
    baseFare: fare.baseSubtotal,
    classAdjustment: fare.classAdjustment,
    total: fare.total
  };

  beginCheckout(fare);
}

function joinWaitlist() {
  const origin = originSelect.value;
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
  if (!routes.some((route) => route.from === origin && route.to === city)) {
    showToast('No route is configured for this origin and destination.', 'error');
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
  const bookings = getStoredBookings();
  const hasEarlierQueue = getTripQueue(bookings, city, train, travelDate, className).length > 0;
  if (!hasEarlierQueue && findAvailableCoachAllocation(
    bookings, city, train, travelDate, className, passengers
  )) {
    showToast('A coach still has enough available seats for your party. Choose those seats to book.', 'error');
    updateWaitlistControls();
    return;
  }
  const passengerDetails = collectPassengerDetails(passengers);
  if (!passengerDetails) {
    return;
  }

  const fare = calculateFare(selectedTrain.fare, className, passengers);
  state.pendingBooking = {
    origin,
    city,
    train,
    travelDate,
    className,
    coach: '',
    seats: [],
    passengers,
    ...passengerDetails,
    queueRequest: true,
    baseFare: fare.baseSubtotal,
    classAdjustment: fare.classAdjustment,
    total: fare.total
  };
  beginCheckout(fare);
}

function beginCheckout(fare) {
  document.getElementById('paymentBaseFare').textContent = formatCurrency(fare.baseSubtotal);
  document.getElementById('paymentClassAdjustment').textContent = formatCurrency(fare.classAdjustment);
  document.getElementById('paymentTotal').textContent = formatCurrency(fare.total);
  const paymentSubtitle = document.querySelector('.payment-subtitle');
  const queueRequest = state.pendingBooking.queueRequest;
  paymentSubtitle.textContent = queueRequest
    ? 'Payment confirms your request; the final RAC / waitlist position is assigned at checkout.'
    : 'Choose a method to complete your booking.';
  document.getElementById('payNowBtn').textContent = queueRequest
    ? `Pay ${formatCurrency(fare.total)} to join queue`
    : `Pay ${formatCurrency(fare.total)}`;
  paymentForm.hidden = false;
  document.getElementById('ticketResult').hidden = true;
  setBookingControlsDisabled(true);
  paymentForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function setBookingControlsDisabled(disabled) {
  [originSelect, destinationSelect, trainSelect, travelDateInput, classSelect, passengerCount, coachSelect,
    document.getElementById('bookTicketBtn'), document.getElementById('joinWaitlistBtn')].forEach((control) => {
    control.disabled = disabled;
  });
  seatMap.querySelectorAll('.seat-button').forEach((seat) => {
    seat.disabled = disabled || seat.classList.contains('occupied');
  });
}

function cancelPayment() {
  state.pendingBooking = null;
  paymentForm.hidden = true;
  setBookingControlsDisabled(false);
  showToast('Checkout cancelled. Your seats are not booked.');
}

function payForBooking(event) {
  event.preventDefault();
  const pendingBooking = state.pendingBooking;
  if (!pendingBooking) {
    showToast('Start a booking before making a payment.', 'error');
    return;
  }

  const bookings = getStoredBookings();
  let finalStatus = 'confirmed';
  let finalCoach = pendingBooking.coach;
  let finalSeats = pendingBooking.seats;
  if (pendingBooking.queueRequest) {
    const hasEarlierQueue = getTripQueue(
      bookings, pendingBooking.city, pendingBooking.train, pendingBooking.travelDate, pendingBooking.className
    ).length > 0;
    const allocation = hasEarlierQueue ? null : findAvailableCoachAllocation(
      bookings, pendingBooking.city, pendingBooking.train, pendingBooking.travelDate,
      pendingBooking.className, pendingBooking.passengers
    );
    if (allocation) {
      finalCoach = allocation.coach;
      finalSeats = allocation.seats;
    } else {
      finalStatus = getInitialQueueStatus(
        bookings, pendingBooking.city, pendingBooking.train, pendingBooking.travelDate,
        pendingBooking.className, pendingBooking.passengers
      );
    }
  } else {
    const occupiedSeats = getOccupiedSeats(
      pendingBooking.city,
      pendingBooking.train,
      pendingBooking.travelDate,
      pendingBooking.className,
      pendingBooking.coach,
      bookings
    );
    if (pendingBooking.seats.some((seat) => occupiedSeats.has(seat))) {
      state.pendingBooking = null;
      state.selectedSeats.clear();
      paymentForm.hidden = true;
      setBookingControlsDisabled(false);
      renderSeatMap();
      showToast('A selected seat is no longer available. Please choose again.', 'error');
      return;
    }
  }

  const method = new FormData(paymentForm).get('paymentMethod');
  const transactionId = `DEMO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const booking = {
    ...pendingBooking,
    coach: finalCoach,
    seats: finalSeats,
    pnr: generateUniquePnr(new Set(bookings.map((item) => String(item.pnr)))),
    status: finalStatus,
    paymentStatus: 'paid',
    paymentMethod: String(method),
    transactionId,
    createdAt: new Date().toLocaleString(),
    createdAtTimestamp: new Date().toISOString()
  };
  delete booking.queueRequest;
  setBookingStatus(booking, finalStatus);

  bookings.unshift(booking);
  if (finalStatus !== 'confirmed') {
    updateQueuePositions(
      bookings, booking.city, booking.train, booking.travelDate, booking.className
    );
  }
  saveBookings(bookings);
  state.pendingBooking = null;
  paymentForm.hidden = true;
  setBookingControlsDisabled(false);
  renderRecentBookings();
  renderTicket(booking, document.getElementById('ticketResult'));
  state.selectedSeats.clear();
  renderSeatMap();
  showToast(finalStatus === 'confirmed'
    ? `Sandbox payment confirmed. PNR: ${booking.pnr}`
    : `Sandbox payment confirmed. ${getBookingStatusLabel(finalStatus)} status. PNR: ${booking.pnr}`);
}

function renderAdminDashboard() {
  const allBookings = getStoredBookings();
  const bookings = allBookings.filter((booking) => booking.status !== 'cancelled');
  const trains = Object.entries(trainsByCity).flatMap(([city, cityTrains]) =>
    cityTrains.map((train) => ({ ...train, city }))
  );
  const revenue = bookings.reduce((total, booking) => total + (Number(booking.total) || 0), 0);
  const passengers = bookings.reduce((total, booking) => total + (Number(booking.passengers) || 0), 0);

  document.getElementById('adminTrainCount').textContent = trains.length;
  document.getElementById('adminPassengerCount').textContent = passengers;
  document.getElementById('adminBookingCount').textContent = bookings.length;
  document.getElementById('adminBookingRevenue').textContent = formatCurrency(revenue);
  document.getElementById('adminTrainRows').innerHTML = trains.length
    ? trains.map((train) => `
        <tr>
          <td>${escapeHtml(train.city)}</td>
          <td>${escapeHtml(train.code)}</td>
          <td>${formatCurrency(train.fare)}</td>
          <td class="table-actions">
            <button class="secondary-btn compact-btn" data-edit-city="${escapeHtml(train.city)}" data-edit-code="${escapeHtml(train.code)}" type="button">Edit</button>
            <button class="remove-train-btn" data-remove-city="${escapeHtml(train.city)}" data-remove-code="${escapeHtml(train.code)}" type="button">Delete</button>
          </td>
        </tr>
      `).join('')
    : '<tr><td class="muted-empty" colspan="4">No trains available.</td></tr>';

  document.getElementById('adminBookingRows').innerHTML = allBookings.length
    ? allBookings.map((booking) => `
        <tr>
          <td><button class="table-link" data-admin-pnr="${escapeHtml(booking.pnr)}" type="button">${escapeHtml(booking.pnr)}</button></td>
          <td>${escapeHtml(booking.train)} / ${escapeHtml(booking.origin || 'Origin Station')} → ${escapeHtml(booking.city)}</td>
          <td>${escapeHtml(booking.travelDate || '—')}</td>
          <td>${Number(booking.passengers) || 0}</td>
          <td>${escapeHtml(booking.className || '—')}</td>
          <td>${escapeHtml((booking.seats || []).join(', ') || '—')}</td>
          <td>${formatCurrency(Number(booking.total) || 0)}</td>
          <td>${escapeHtml(getBookingStatusLabel(booking.status))}</td>
        </tr>
      `).join('')
    : '<tr><td class="muted-empty" colspan="8">No bookings yet.</td></tr>';

  const passengerRows = allBookings.flatMap((booking) => {
    const passengerCountForBooking = Math.max(0, Number(booking.passengers) || 0);
    return Array.from({ length: passengerCountForBooking }, (_, index) => `
      <tr>
        <td>${escapeHtml(booking.passengerNames && booking.passengerNames[index] || `Passenger ${index + 1} (name not recorded)`)}</td>
        <td>${escapeHtml(booking.pnr)}</td>
        <td>${escapeHtml(booking.train)} / ${escapeHtml(booking.origin || 'Origin Station')} → ${escapeHtml(booking.city)}</td>
        <td>${escapeHtml(booking.travelDate || '—')}</td>
        <td>${escapeHtml(booking.className || '—')}</td>
        <td>${escapeHtml(booking.seats && booking.seats[index] || '—')}</td>
        <td>${escapeHtml(getBookingStatusLabel(getPassengerStatus(booking, index)))}</td>
      </tr>
    `);
  });
  document.getElementById('adminPassengerRows').innerHTML = passengerRows.length
    ? passengerRows.join('')
    : '<tr><td class="muted-empty" colspan="7">No passenger records yet.</td></tr>';

  renderStationManagement();
  renderAdminReports();
  renderAssistanceRequests();
}

function getAssistanceRequestLabel(request) {
  const labels = [];
  if (request.priorityType === 'elderly') {
    labels.push('Priority assistance (elderly)');
  } else if (request.priorityType === 'disability') {
    labels.push('Priority assistance (disability)');
  }
  if (request.wheelchair) {
    labels.push('Wheelchair');
  }
  return labels.join(' + ');
}

function getAssistanceStatusLabel(status) {
  return ({
    requested: 'Requested',
    scheduled: 'Scheduled',
    completed: 'Completed',
    cancelled: 'Cancelled'
  })[status] || 'Unknown';
}

function renderAssistanceRequests() {
  const rows = getStoredBookings().flatMap((booking) => {
    const requests = Array.isArray(booking.assistanceRequests) ? booking.assistanceRequests : [];
    return requests.flatMap((request, index) => {
      if (!request || (!request.priorityType && !request.wheelchair)) {
        return [];
      }
      const progress = ['requested', 'scheduled', 'completed', 'cancelled'].includes(request.status)
        ? request.status
        : 'requested';
      return [`
        <tr>
          <td>${escapeHtml(booking.passengerNames && booking.passengerNames[index] || `Passenger ${index + 1}`)}</td>
          <td><button class="table-link" data-admin-pnr="${escapeHtml(booking.pnr)}" type="button">${escapeHtml(booking.pnr)}</button></td>
          <td>${escapeHtml(booking.train)} / ${escapeHtml(booking.origin || 'Origin Station')} → ${escapeHtml(booking.city)}</td>
          <td>${escapeHtml(booking.travelDate || '—')}</td>
          <td>${escapeHtml(getAssistanceRequestLabel(request))}</td>
          <td>
            <select data-assistance-pnr="${escapeHtml(booking.pnr)}" data-assistance-index="${index}" aria-label="Assistance request status for ${escapeHtml(booking.pnr)} passenger ${index + 1}">
              <option value="requested" ${progress === 'requested' ? 'selected' : ''}>Requested</option>
              <option value="scheduled" ${progress === 'scheduled' ? 'selected' : ''}>Scheduled</option>
              <option value="completed" ${progress === 'completed' ? 'selected' : ''}>Completed</option>
              <option value="cancelled" ${progress === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
        </tr>
      `];
    });
  });
  document.getElementById('adminAssistanceRows').innerHTML = rows.length
    ? rows.join('')
    : '<tr><td class="muted-empty" colspan="6">No assistance requests yet.</td></tr>';
}

function updateAssistanceStatus(pnr, passengerIndex, status) {
  if (!['requested', 'scheduled', 'completed', 'cancelled'].includes(status)) {
    showToast('Choose a valid assistance status.', 'error');
    return;
  }
  const bookings = getStoredBookings();
  const booking = bookings.find((item) => item.pnr === pnr);
  const request = booking && Array.isArray(booking.assistanceRequests)
    ? booking.assistanceRequests[passengerIndex]
    : null;
  if (!request || (!request.priorityType && !request.wheelchair)) {
    showToast('Assistance request not found.', 'error');
    renderAssistanceRequests();
    return;
  }
  request.status = status;
  saveBookings(bookings);
  renderAssistanceRequests();
  const lookup = document.getElementById('assistanceLookupResult');
  if (!lookup.hidden && lookup.dataset.pnr === pnr) {
    renderAssistanceLookup(pnr, lookup);
  }
  showToast('Assistance request status updated.');
}

function renderAssistanceLookup(pnr, container) {
  const booking = getStoredBookings().find((item) => item.pnr === pnr);
  if (!booking) {
    container.dataset.pnr = '';
    container.innerHTML = '<p>No booking found for that PNR.</p>';
    container.hidden = false;
    return;
  }
  const requests = Array.isArray(booking.assistanceRequests) ? booking.assistanceRequests : [];
  const rows = requests.flatMap((request, index) => {
    if (!request || (!request.priorityType && !request.wheelchair)) {
      return [];
    }
    return [`
      <div class="assistance-request-entry">
        <div>
          <strong>${escapeHtml(booking.passengerNames && booking.passengerNames[index] || `Passenger ${index + 1}`)}</strong>
          <span>${escapeHtml(getAssistanceRequestLabel(request))}</span>
        </div>
        <span class="assistance-progress assistance-progress-${escapeHtml(request.status || 'requested')}">${escapeHtml(getAssistanceStatusLabel(request.status || 'requested'))}</span>
      </div>
    `];
  });
  container.dataset.pnr = pnr;
  container.innerHTML = `
    <h4>Assistance status · PNR ${escapeHtml(pnr)}</h4>
    <p>${escapeHtml(booking.train)} · ${escapeHtml(booking.travelDate || '—')} · ${escapeHtml(getBookingStatusLabel(booking.status))}</p>
    ${rows.length ? rows.join('') : '<p>No assistance request was recorded for this booking.</p>'}
  `;
  container.hidden = false;
}

function trackAssistance(event) {
  event.preventDefault();
  const pnr = document.getElementById('assistancePnrInput').value.trim();
  const result = document.getElementById('assistanceLookupResult');
  if (!/^\d{10}$/.test(pnr)) {
    result.hidden = true;
    showToast('Enter a valid 10-digit PNR.', 'error');
    return;
  }
  renderAssistanceLookup(pnr, result);
  if (!result.dataset.pnr) {
    showToast('No booking found for that PNR.', 'error');
  }
}

function getBookingDate(booking) {
  const date = new Date(booking.createdAtTimestamp || booking.createdAt || '');
  return Number.isNaN(date.getTime()) ? null : date;
}

function renderAdminReports() {
  const period = document.getElementById('reportPeriodSelect').value;
  const selectedPeriod = document.getElementById('reportDateInput').value;
  const matchingBookings = getStoredBookings().filter((booking) => {
    const createdAt = getBookingDate(booking);
    if (!createdAt || !selectedPeriod) {
      return false;
    }
    if (period === 'monthly') {
      return `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}` === selectedPeriod;
    }
    return `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')}` === selectedPeriod;
  });
  const activeBookings = matchingBookings.filter((booking) => booking.status !== 'cancelled');

  document.getElementById('reportBookingCount').textContent = matchingBookings.length;
  document.getElementById('reportPassengerCount').textContent = activeBookings.reduce(
    (total, booking) => total + (Number(booking.passengers) || 0),
    0
  );
  document.getElementById('reportRevenue').textContent = formatCurrency(activeBookings.reduce(
    (total, booking) => total + (Number(booking.total) || 0),
    0
  ));
}

function changeReportPeriod() {
  const period = document.getElementById('reportPeriodSelect').value;
  const dateInput = document.getElementById('reportDateInput');
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  dateInput.type = period === 'monthly' ? 'month' : 'date';
  dateInput.value = period === 'monthly' ? today.slice(0, 7) : today;
  renderAdminReports();
}

function getWaitlistHistory(city, train, className, travelDate) {
  const allBookings = getStoredBookings();
  let samples = allBookings.filter((booking) =>
    booking.travelDate !== travelDate &&
    booking.city === city &&
    booking.train === train &&
    booking.className === className
  );
  let scope = 'matching train and class';
  if (!samples.length) {
    samples = allBookings.filter((booking) =>
      booking.travelDate !== travelDate &&
      booking.city === city &&
      booking.className === className
    );
    scope = 'matching destination and class';
  }
  if (!samples.length) {
    samples = allBookings.filter((booking) =>
      booking.travelDate !== travelDate && booking.className === className
    );
    scope = 'all trains in this class';
  }

  const totalPassengers = samples.reduce((total, booking) =>
    total + Math.max(0, Number(booking.passengers) || 0), 0);
  const cancelledPassengers = samples.reduce((total, booking) =>
    total + (booking.status === 'cancelled' ? Math.max(0, Number(booking.passengers) || 0) : 0), 0);
  const priorStrength = 10;
  const cancellationRate = totalPassengers
    ? (cancelledPassengers + WAITLIST_PRIOR_RATE * priorStrength) / (totalPassengers + priorStrength)
    : WAITLIST_PRIOR_RATE;
  const confidence = totalPassengers >= 40 ? 'High'
    : totalPassengers >= 15 ? 'Medium' : 'Low';

  return {
    totalPassengers,
    cancelledPassengers,
    cancellationRate,
    confidence,
    scope: totalPassengers ? scope : '15% demo baseline (no local history yet)'
  };
}

function binomialProbabilityAtLeast(position, passengerCount, cancellationRate) {
  if (cancellationRate <= 0) {
    return 0;
  }
  if (cancellationRate >= 1) {
    return 1;
  }

  let probabilityOfZero = Math.pow(1 - cancellationRate, passengerCount);
  let probability = 0;
  for (let cancelled = 0; cancelled <= passengerCount; cancelled += 1) {
    if (cancelled >= position) {
      probability += probabilityOfZero;
    }
    if (cancelled < passengerCount) {
      probabilityOfZero *=
        ((passengerCount - cancelled) / (cancelled + 1)) *
        (cancellationRate / (1 - cancellationRate));
    }
  }
  return Math.min(1, Math.max(0, probability));
}

function handleWaitlistPrediction(event) {
  event.preventDefault();
  const city = waitlistCitySelect.value;
  const train = waitlistTrainSelect.value;
  const className = document.getElementById('waitlistClassSelect').value;
  const travelDate = document.getElementById('waitlistTravelDate').value;
  const position = Number(document.getElementById('waitlistPosition').value);
  const result = document.getElementById('waitlistResult');
  const capacity = (coachesByClass[className] || []).length * SEATS_PER_COACH;
  const today = travelDateInput.min;

  if (!train || !travelDate || travelDate < today ||
    !Number.isInteger(position) || position < 1 || position > capacity) {
    showToast(`Choose a future travel date and waitlist position from 1 to ${capacity}.`, 'error');
    return;
  }

  const history = getWaitlistHistory(city, train, className, travelDate);
  const probability = binomialProbabilityAtLeast(position, capacity, history.cancellationRate);
  result.innerHTML = `
    <div class="prediction-result-header">
      <div>
        <span class="prediction-label">Estimated confirmation chance</span>
        <strong class="prediction-value">${(probability * 100).toFixed(1)}%</strong>
      </div>
      <span class="confidence-badge">${history.confidence} confidence</span>
    </div>
    <p>${escapeHtml(train)} to ${escapeHtml(city)} • ${escapeHtml(className)} • Waitlist ${position} • ${capacity} assumed seats.</p>
    <p>Estimated cancellation rate: ${(history.cancellationRate * 100).toFixed(1)}% from ${history.totalPassengers} historical passenger record${history.totalPassengers === 1 ? '' : 's'} (${escapeHtml(history.scope)}).</p>
    <p class="muted-empty">Model: probability that at least ${position} of ${capacity} passengers cancel, using a smoothed historical cancellation rate.</p>
  `;
  result.hidden = false;
}

function renderDelayPrediction() {
  const city = delayCitySelect.value;
  const train = delayTrainSelect.value;
  const weather = document.getElementById('delayWeatherSelect').value;
  const result = document.getElementById('delayPredictionResult');
  const allHistory = getStoredDelayHistory();
  let samples = allHistory.filter((entry) => entry.city === city && entry.train === train);
  let scope = 'this train';
  if (!samples.length) {
    samples = allHistory.filter((entry) => entry.city === city);
    scope = 'this destination';
  }
  if (!samples.length) {
    samples = allHistory;
    scope = 'all demo journeys';
  }

  if (!samples.length) {
    result.innerHTML = `
      <strong>No completed journey history is available yet.</strong>
      <p>Run a demo journey to completion on Live Train Status; it takes about 18 seconds and will be saved locally for future predictions.</p>
    `;
    result.hidden = false;
    return;
  }

  const weatherAdjustment = WEATHER_DELAY_MINUTES[weather] || 0;
  const averageBaseDelay = samples.reduce((total, entry) =>
    total + entry.baseDelayMinutes, 0) / samples.length;
  const predictedDelay = Math.round(averageBaseDelay + weatherAdjustment);
  const delayedJourneys = samples.filter((entry) =>
    entry.baseDelayMinutes + weatherAdjustment > 15
  ).length;
  const delayProbability = delayedJourneys / samples.length;
  const confidence = samples.length >= 10 ? 'High'
    : samples.length >= 4 ? 'Medium' : 'Low';

  result.innerHTML = `
    <div class="prediction-result-header">
      <div>
        <span class="prediction-label">Estimated delay</span>
        <strong class="prediction-value">${predictedDelay} min</strong>
      </div>
      <span class="confidence-badge">${confidence} confidence</span>
    </div>
    <p>${escapeHtml(train)} to ${escapeHtml(city)} • ${escapeHtml(WEATHER_LABELS[weather])} scenario • ${samples.length} historical demo journey${samples.length === 1 ? '' : 's'} (${scope}).</p>
    <p>Estimated chance of a delay over 15 minutes: ${(delayProbability * 100).toFixed(1)}%.</p>
    <p class="muted-empty">Estimate = historical average simulated delay + ${weatherAdjustment} min weather adjustment. Not an operational forecast.</p>
  `;
  result.hidden = false;
}

function appendChatMessage(message, sender) {
  const entry = document.createElement('p');
  entry.className = `chat-message ${sender}-message`;
  entry.textContent = message;
  document.getElementById('chatMessages').appendChild(entry);
  entry.scrollIntoView({ block: 'nearest' });
}

function getRailwayChatResponse(question) {
  const text = question.toLowerCase();
  const pnrMatch = question.match(/\b\d{10}\b/);
  if (pnrMatch) {
    const booking = getStoredBookings().find((item) => item.pnr === pnrMatch[0]);
    if (!booking) {
      return `I couldn't find PNR ${pnrMatch[0]} in this browser's demo bookings.`;
    }
    const status = getBookingStatusLabel(booking.status);
    const route = `${booking.origin || 'Origin Station'} to ${booking.city}`;
    return `PNR ${booking.pnr} is ${status}: ${booking.train}, ${route}, travel date ${booking.travelDate || 'not recorded'}, ${booking.passengers} passenger(s), fare ${formatCurrency(Number(booking.total) || 0)}.`;
  }
  if (/\b(cancel|cancellation|refund)\b/.test(text)) {
    return 'To cancel, open PNR Enquiry, search the 10-digit PNR, then select Cancel ticket. Demo refunds are 90% at least 2 calendar days before travel, 75% one day before, 50% on the travel date, and 0% after travel. Refunds only apply to paid demo bookings.';
  }
  if (/\b(waitlist|waiting list|wl)\b/.test(text)) {
    return 'Open Booking to request RAC / waitlist when no coach can fit your party. Queue promotion is FIFO and keeps each booking group together. Waitlist Prediction separately estimates confirmation from local history.';
  }
  if (/\b(delay|late|weather|arrival)\b/.test(text)) {
    return 'Open Delay Prediction and choose a train and weather scenario. Predictions use completed simulated journeys stored in this browser, not live railway or weather feeds.';
  }
  if (/\b(route|station|origin|destination)\b/.test(text)) {
    const routeList = routes.length
      ? routes.map((route) => `${route.from} to ${route.to}`).join('; ')
      : 'No routes are currently configured.';
    return `Configured routes: ${routeList}. Open Smart Train Route Finder to compare fewest-leg and lowest-fare journeys.`;
  }
  if (/\b(assistance|wheelchair|elderly|disability)\b/.test(text)) {
    return 'Request priority or wheelchair assistance for each passenger while booking. Use Passenger Assistance and your PNR to track progress; no diagnosis is collected.';
  }
  if (/\b(book|booking|ticket|seat|reservation)\b/.test(text)) {
    return 'Open Booking, choose a configured origin and destination, train, date and class, enter each passenger name, select one seat per passenger, then complete the sandbox payment.';
  }
  if (/\b(payment|pay|upi|card|wallet)\b/.test(text)) {
    return 'Payments in this college demo are simulated locally. UPI, card, net banking and wallet options do not charge money or collect payment credentials.';
  }
  if (/\b(pnr|ticket status|booking status)\b/.test(text)) {
    return 'Enter the 10-digit PNR in PNR Enquiry to view ticket and payment details. An admin can also verify it in the Admin Portal.';
  }
  if (/\b(train|fare|price|cost|available)\b/.test(text)) {
    const city = Object.keys(trainsByCity).find((destination) => text.includes(destination.toLowerCase()));
    const trainList = city ? { [city]: trainsByCity[city] } : trainsByCity;
    const details = Object.entries(trainList).flatMap(([destination, trains]) =>
      trains.map((train) => `${train.code} to ${destination} (${formatCurrency(train.fare)} base fare)`)
    );
    return details.length ? `Available demo trains: ${details.join('; ')}.` : 'No trains are currently listed.';
  }
  return 'I can help with trains and fares, routes, booking, payments, cancellation refunds, waitlist estimates, delay estimates, or a specific 10-digit PNR.';
}

function handleChatSubmit(event) {
  event.preventDefault();
  const input = document.getElementById('chatInput');
  const question = input.value.trim();
  if (!question) {
    return;
  }
  appendChatMessage(question, 'user');
  appendChatMessage(getRailwayChatResponse(question), 'assistant');
  input.value = '';
  input.focus();
}

function verifyAdminPnr(pnr) {
  const result = document.getElementById('adminPnrResult');
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

function handleAdminPnrSearch(event) {
  event.preventDefault();
  verifyAdminPnr(document.getElementById('adminPnrInput').value.trim());
}

const qrLowEccVersions = {
  5: { dataBlocks: [108], errorCorrectionCodewords: 26, alignmentCenters: [6, 30] },
  6: { dataBlocks: [68, 68], errorCorrectionCodewords: 18, alignmentCenters: [6, 34] },
  7: { dataBlocks: [78, 78], errorCorrectionCodewords: 20, alignmentCenters: [6, 22, 38] },
  8: { dataBlocks: [97, 97], errorCorrectionCodewords: 24, alignmentCenters: [6, 24, 42] },
  9: { dataBlocks: [116, 116], errorCorrectionCodewords: 30, alignmentCenters: [6, 26, 46] },
  10: { dataBlocks: [68, 68, 69, 69], errorCorrectionCodewords: 18, alignmentCenters: [6, 28, 50] }
};

function qrAppendBits(bits, value, count) {
  for (let index = count - 1; index >= 0; index -= 1) {
    bits.push((value >>> index) & 1);
  }
}

function qrMultiply(left, right) {
  let product = 0;
  for (let bit = 7; bit >= 0; bit -= 1) {
    product = (product << 1) ^ ((product >>> 7) * 0x11d);
    product ^= ((right >>> bit) & 1) * left;
  }
  return product;
}

function qrErrorCorrection(data, count) {
  let generator = [1];
  let root = 1;
  for (let degree = 0; degree < count; degree += 1) {
    const next = new Array(generator.length + 1).fill(0);
    generator.forEach((coefficient, index) => {
      next[index] ^= coefficient;
      next[index + 1] ^= qrMultiply(coefficient, root);
    });
    generator = next;
    root = qrMultiply(root, 2);
  }

  const remainder = [...data, ...new Array(count).fill(0)];
  data.forEach((_, offset) => {
    const coefficient = remainder[offset];
    if (coefficient) {
      generator.forEach((factor, index) => {
        remainder[offset + index] ^= qrMultiply(factor, coefficient);
      });
    }
  });
  return remainder.slice(data.length);
}

function qrBuildCodewords(bytes, version, config) {
  const dataCapacity = config.dataBlocks.reduce((total, count) => total + count, 0);
  const bits = [];
  qrAppendBits(bits, 0b0100, 4);
  qrAppendBits(bits, bytes.length, version < 10 ? 8 : 16);
  bytes.forEach((byte) => qrAppendBits(bits, byte, 8));
  if (bits.length > dataCapacity * 8) {
    return null;
  }

  const terminatorLength = Math.min(4, dataCapacity * 8 - bits.length);
  qrAppendBits(bits, 0, terminatorLength);
  while (bits.length % 8) {
    bits.push(0);
  }

  const data = [];
  for (let offset = 0; offset < bits.length; offset += 8) {
    data.push(bits.slice(offset, offset + 8).reduce((value, bit) => (value << 1) | bit, 0));
  }
  for (let pad = 0xec; data.length < dataCapacity; pad ^= 0xec ^ 0x11) {
    data.push(pad);
  }

  const blocks = [];
  let dataOffset = 0;
  config.dataBlocks.forEach((length) => {
    const block = data.slice(dataOffset, dataOffset + length);
    blocks.push({ data: block, errorCorrection: qrErrorCorrection(block, config.errorCorrectionCodewords) });
    dataOffset += length;
  });

  const interleaved = [];
  for (let index = 0; index < Math.max(...config.dataBlocks); index += 1) {
    blocks.forEach((block) => {
      if (index < block.data.length) {
        interleaved.push(block.data[index]);
      }
    });
  }
  for (let index = 0; index < config.errorCorrectionCodewords; index += 1) {
    blocks.forEach((block) => interleaved.push(block.errorCorrection[index]));
  }
  return interleaved;
}

function qrMaskApplies(mask, x, y) {
  switch (mask) {
    case 0: return (x + y) % 2 === 0;
    case 1: return y % 2 === 0;
    case 2: return x % 3 === 0;
    case 3: return (x + y) % 3 === 0;
    case 4: return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
    case 5: return (x * y) % 2 + (x * y) % 3 === 0;
    case 6: return ((x * y) % 2 + (x * y) % 3) % 2 === 0;
    default: return ((x + y) % 2 + (x * y) % 3) % 2 === 0;
  }
}

function qrFormatBits(mask) {
  const data = (1 << 3) | mask;
  let remainder = data;
  for (let index = 0; index < 10; index += 1) {
    remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537);
  }
  return ((data << 10) | remainder) ^ 0x5412;
}

function qrVersionBits(version) {
  let remainder = version;
  for (let index = 0; index < 12; index += 1) {
    remainder = (remainder << 1) ^ ((remainder >>> 11) * 0x1f25);
  }
  return (version << 12) | remainder;
}

function qrBuildMatrix(codewords, version, config, mask) {
  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => new Array(size).fill(false));
  const reserved = Array.from({ length: size }, () => new Array(size).fill(false));
  const setFunction = (x, y, dark) => {
    if (x >= 0 && x < size && y >= 0 && y < size) {
      modules[y][x] = dark;
      reserved[y][x] = true;
    }
  };

  const drawFinder = (centerX, centerY) => {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const distance = Math.max(Math.abs(dx), Math.abs(dy));
        setFunction(centerX + dx, centerY + dy, distance !== 2 && distance !== 4);
      }
    }
  };
  drawFinder(3, 3);
  drawFinder(size - 4, 3);
  drawFinder(3, size - 4);

  config.alignmentCenters.forEach((centerY) => {
    config.alignmentCenters.forEach((centerX) => {
      if (reserved[centerY][centerX]) {
        return;
      }
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          setFunction(
            centerX + dx,
            centerY + dy,
            Math.max(Math.abs(dx), Math.abs(dy)) !== 1
          );
        }
      }
    });
  });

  for (let index = 8; index < size - 8; index += 1) {
    if (!reserved[6][index]) {
      setFunction(index, 6, index % 2 === 0);
    }
    if (!reserved[index][6]) {
      setFunction(6, index, index % 2 === 0);
    }
  }

  const format = qrFormatBits(mask);
  for (let index = 0; index <= 5; index += 1) {
    setFunction(8, index, ((format >>> index) & 1) !== 0);
  }
  setFunction(8, 7, ((format >>> 6) & 1) !== 0);
  setFunction(8, 8, ((format >>> 7) & 1) !== 0);
  setFunction(7, 8, ((format >>> 8) & 1) !== 0);
  for (let index = 9; index < 15; index += 1) {
    setFunction(14 - index, 8, ((format >>> index) & 1) !== 0);
  }
  for (let index = 0; index < 8; index += 1) {
    setFunction(size - 1 - index, 8, ((format >>> index) & 1) !== 0);
  }
  for (let index = 8; index < 15; index += 1) {
    setFunction(8, size - 15 + index, ((format >>> index) & 1) !== 0);
  }
  setFunction(8, size - 8, true);

  if (version >= 7) {
    const versionBits = qrVersionBits(version);
    for (let index = 0; index < 18; index += 1) {
      const dark = ((versionBits >>> index) & 1) !== 0;
      const x = size - 11 + index % 3;
      const y = Math.floor(index / 3);
      setFunction(x, y, dark);
      setFunction(y, x, dark);
    }
  }

  let bitIndex = 0;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) {
      right = 5;
    }
    for (let offset = 0; offset < size; offset += 1) {
      const y = upward ? size - 1 - offset : offset;
      for (let column = 0; column < 2; column += 1) {
        const x = right - column;
        if (!reserved[y][x]) {
          const value = bitIndex < codewords.length * 8
            ? ((codewords[Math.floor(bitIndex / 8)] >>> (7 - bitIndex % 8)) & 1) !== 0
            : false;
          modules[y][x] = value !== qrMaskApplies(mask, x, y);
          bitIndex += 1;
        }
      }
    }
    upward = !upward;
  }
  return modules;
}

function qrMatrixPenalty(modules) {
  const size = modules.length;
  let penalty = 0;
  const lines = [
    ...modules,
    ...Array.from({ length: size }, (_, x) => modules.map((row) => row[x]))
  ];
  lines.forEach((line) => {
    let runColor = line[0];
    let runLength = 1;
    for (let index = 1; index <= size; index += 1) {
      if (index < size && line[index] === runColor) {
        runLength += 1;
      } else {
        if (runLength >= 5) {
          penalty += runLength - 2;
        }
        runColor = line[index];
        runLength = 1;
      }
    }
    for (let index = 0; index <= size - 11; index += 1) {
      const pattern = line.slice(index, index + 11).map(Number).join('');
      if (pattern === '10111010000' || pattern === '00001011101') {
        penalty += 40;
      }
    }
  });

  for (let y = 0; y < size - 1; y += 1) {
    for (let x = 0; x < size - 1; x += 1) {
      const color = modules[y][x];
      if (modules[y][x + 1] === color &&
        modules[y + 1][x] === color &&
        modules[y + 1][x + 1] === color) {
        penalty += 3;
      }
    }
  }

  const darkModules = modules.reduce((total, row) =>
    total + row.filter(Boolean).length, 0);
  penalty += Math.floor(Math.abs(darkModules * 100 / (size * size) - 50) / 5) * 10;
  return penalty;
}

function createTicketQrMatrix(payload) {
  const bytes = Array.from(new TextEncoder().encode(payload));
  for (let version = 5; version <= 10; version += 1) {
    const config = qrLowEccVersions[version];
    const codewords = qrBuildCodewords(bytes, version, config);
    if (!codewords) {
      continue;
    }

    let bestMatrix = null;
    let bestPenalty = Infinity;
    for (let mask = 0; mask < 8; mask += 1) {
      const matrix = qrBuildMatrix(codewords, version, config, mask);
      const penalty = qrMatrixPenalty(matrix);
      if (penalty < bestPenalty) {
        bestMatrix = matrix;
        bestPenalty = penalty;
      }
    }
    return bestMatrix;
  }
  return null;
}

function drawTicketQr(canvas, booking) {
  const payload = JSON.stringify({
    app: 'XYZ Railways',
    version: 1,
    pnr: booking.pnr,
    status: booking.status,
    train: booking.train,
    origin: booking.origin || 'Origin Station',
    destination: booking.city,
    travelDate: booking.travelDate || '',
    class: booking.className,
    coach: booking.coach || '',
    seats: Array.isArray(booking.seats) ? booking.seats : [],
    passengers: Number(booking.passengers) || 0,
    fare: Number(booking.total) || 0
  });
  const matrix = createTicketQrMatrix(payload);
  const status = canvas.parentElement.querySelector('[data-qr-error]');
  const context = canvas.getContext('2d');
  if (!matrix || !context) {
    canvas.hidden = true;
    status.textContent = 'Could not generate a QR for this booking. Verify it by PNR instead.';
    status.hidden = false;
    return;
  }

  const quietZone = 4;
  const moduleSize = 4;
  const imageSize = (matrix.length + quietZone * 2) * moduleSize;
  canvas.width = imageSize;
  canvas.height = imageSize;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, imageSize, imageSize);
  context.fillStyle = '#14231b';
  matrix.forEach((row, y) => row.forEach((dark, x) => {
    if (dark) {
      context.fillRect(
        (x + quietZone) * moduleSize,
        (y + quietZone) * moduleSize,
        moduleSize,
        moduleSize
      );
    }
  }));
  canvas.setAttribute('aria-label', `Ticket verification QR code for PNR ${booking.pnr}`);
  canvas.hidden = false;
  status.hidden = true;
}

function renderTicket(booking, container) {
  const passengerNames = Array.isArray(booking.passengerNames) ? booking.passengerNames : [];
  const assistanceRequests = Array.isArray(booking.assistanceRequests) ? booking.assistanceRequests : [];
  const passengerDetails = Array.from(
    { length: Math.max(1, Number(booking.passengers) || passengerNames.length) },
    (_, index) => {
      const request = assistanceRequests[index];
      const assistance = request && (request.priorityType || request.wheelchair)
        ? ` • Assistance: ${getAssistanceRequestLabel(request)} (${getAssistanceStatusLabel(request.status)})`
        : '';
      return `${escapeHtml(passengerNames[index] || 'Name not recorded')} • Seat ${escapeHtml(booking.seats && booking.seats[index] || '—')} • ${escapeHtml(getBookingStatusLabel(getPassengerStatus(booking, index)))}${escapeHtml(assistance)}`;
    }
  ).join('<br>');
  const statusClass = booking.status === 'cancelled' ? 'cancelled' : `status-${booking.status}`;
  container.dataset.pnr = booking.pnr;
  container.innerHTML = `
    <div class="ticket-slip">
      <div class="ticket-heading">
        <div>
          <span class="ticket-label">PNR</span>
          <strong class="ticket-pnr">${escapeHtml(booking.pnr)}</strong>
        </div>
        <span class="ticket-status ${escapeHtml(statusClass)}">${escapeHtml(getBookingStatusLabel(booking.status))}</span>
      </div>
      <div class="ticket-verification">
        <canvas class="ticket-qr" data-ticket-qr role="img" hidden></canvas>
        <div>
          <strong>Ticket verification QR</strong>
          <p>Scan for booking details, then verify the PNR in this demo. The QR is not digitally signed.</p>
          <p data-qr-error class="qr-error" hidden></p>
        </div>
      </div>
      ${booking.delayAlert ? `
        <div class="ticket-delay-alert">
          <strong>Passenger delay alert</strong>
          <span>${escapeHtml(booking.delayAlert.message || 'Delay update available.')}</span>
          <span>Sent ${escapeHtml(formatLiveDateTime(new Date(booking.delayAlert.sentAt).getTime()))}</span>
        </div>
      ` : ''}
      <div class="ticket-details">
        <div><span>Origin</span><strong>${escapeHtml(booking.origin || 'Origin Station')}</strong></div>
        <div><span>Destination</span><strong>${escapeHtml(booking.city)}</strong></div>
        <div><span>Train</span><strong>${escapeHtml(booking.train)}</strong></div>
        <div><span>Travel date</span><strong>${escapeHtml(booking.travelDate || '—')}</strong></div>
        <div><span>Class</span><strong>${escapeHtml(booking.className)}</strong></div>
        <div><span>Coach / seats</span><strong>${escapeHtml(booking.coach || '—')} / ${escapeHtml((booking.seats || []).join(', ') || '—')}</strong></div>
        ${['rac', 'waitlisted'].includes(booking.status) ? `<div><span>Queue position</span><strong>${escapeHtml(booking.queuePosition || '—')}</strong></div>` : ''}
        <div><span>Passengers</span><strong>${escapeHtml(booking.passengers)}</strong></div>
        <div><span>Passenger details</span><strong>${passengerDetails}</strong></div>
        <div><span>Booked</span><strong>${escapeHtml(booking.createdAt)}</strong></div>
        <div><span>Total fare</span><strong>${formatCurrency(Number(booking.total) || 0)}</strong></div>
        <div><span>Payment</span><strong>${booking.paymentStatus === 'paid' ? 'Paid (sandbox)' : '—'}</strong></div>
        <div><span>Method</span><strong>${escapeHtml(booking.paymentMethod || '—')}</strong></div>
        <div><span>Transaction reference</span><strong>${escapeHtml(booking.transactionId || '—')}</strong></div>
        ${booking.status === 'cancelled' ? booking.refundStatus ? `
          <div><span>Cancellation policy</span><strong>${escapeHtml(booking.refundPercent)}% (${escapeHtml(booking.daysUntilTravelAtCancellation)} calendar day${Number(booking.daysUntilTravelAtCancellation) === 1 ? '' : 's'} before travel)</strong></div>
          <div><span>Sandbox refund</span><strong>${booking.refundStatus === 'processed' ? formatCurrency(Number(booking.refundAmount) || 0) : '₹0 — no payment recorded'}</strong></div>
          <div><span>Cancellation charge</span><strong>${formatCurrency(Number(booking.cancellationCharge) || 0)}</strong></div>
        ` : '<div><span>Refund details</span><strong>Not recorded for this cancellation</strong></div>' : ''}
      </div>
      ${booking.status === 'cancelled' ? '' : `<button class="secondary-btn" data-cancel-pnr="${escapeHtml(booking.pnr)}" type="button">Cancel ticket</button>`}
    </div>
  `;
  drawTicketQr(container.querySelector('[data-ticket-qr]'), booking);
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

function getRefundDetails(booking, cancellationDate = new Date()) {
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(booking.travelDate || ''));
  const total = Number(booking.total);
  if (!dateParts || !Number.isFinite(total) || total < 0) {
    return null;
  }

  const travelDay = Date.UTC(Number(dateParts[1]), Number(dateParts[2]) - 1, Number(dateParts[3]));
  if (new Date(travelDay).toISOString().slice(0, 10) !== booking.travelDate) {
    return null;
  }
  const today = Date.UTC(
    cancellationDate.getFullYear(),
    cancellationDate.getMonth(),
    cancellationDate.getDate()
  );
  const daysUntilTravel = Math.round((travelDay - today) / 86400000);
  const refundPercent = daysUntilTravel >= 2 ? 90
    : daysUntilTravel === 1 ? 75
      : daysUntilTravel === 0 ? 50 : 0;
  const eligibleRefund = Math.round(total * refundPercent / 100);
  const paymentRecorded = booking.paymentStatus === 'paid';
  const refundAmount = paymentRecorded ? eligibleRefund : 0;

  return {
    daysUntilTravel,
    refundPercent,
    eligibleRefund,
    refundAmount,
    cancellationCharge: paymentRecorded ? total - refundAmount : 0,
    paymentRecorded
  };
}

function cancelTicket(pnr) {
  if (!/^\d{10}$/.test(String(pnr))) {
    showToast('Enter a valid 10-digit PNR.', 'error');
    return;
  }

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

  const refund = getRefundDetails(booking);
  if (!refund) {
    showToast('This booking is missing a valid travel date or fare and cannot be cancelled.', 'error');
    return;
  }

  setBookingStatus(booking, 'cancelled');
  (booking.assistanceRequests || []).forEach((request) => {
    if (request && (request.priorityType || request.wheelchair) &&
      !['completed', 'cancelled'].includes(request.status)) {
      request.status = 'cancelled';
    }
  });
  booking.cancelledAt = new Date().toLocaleString();
  booking.refundPercent = refund.refundPercent;
  booking.eligibleRefund = refund.eligibleRefund;
  booking.refundAmount = refund.refundAmount;
  booking.cancellationCharge = refund.cancellationCharge;
  booking.refundStatus = refund.paymentRecorded ? 'processed' : 'no-payment-recorded';
  booking.daysUntilTravelAtCancellation = refund.daysUntilTravel;
  const queuedPnrs = new Set(getTripQueue(
    bookings, booking.city, booking.train, booking.travelDate, booking.className
  ).map((queuedBooking) => queuedBooking.pnr));
  promoteTripQueue(bookings, booking.city, booking.train, booking.travelDate, booking.className);
  const promotedGroups = bookings.filter((candidate) =>
    queuedPnrs.has(candidate.pnr) && candidate.status === 'confirmed'
  ).length;
  saveBookings(bookings);
  renderRecentBookings();
  renderAdminDashboard();
  renderSeatMap();
  renderAssistanceRequests();

  ['ticketResult', 'pnrEnquiryResult', 'adminPnrResult'].forEach((id) => {
    const result = document.getElementById(id);
    if (!result.hidden && result.dataset.pnr === pnr) {
      renderTicket(booking, result);
    }
  });
  const promotionMessage = promotedGroups
    ? ` ${promotedGroups} queued booking${promotedGroups === 1 ? '' : 's'} promoted.`
    : '';
  showToast((refund.paymentRecorded
    ? `Ticket cancelled. Sandbox refund: ${formatCurrency(refund.refundAmount)}.`
    : `Ticket cancelled. No payment was recorded, so no refund was issued.`) + promotionMessage);
}

function addTrain(event) {
  event.preventDefault();

  const city = document.getElementById('adminTrainCity').value;
  const code = document.getElementById('adminTrainCode').value.trim().toUpperCase();
  const fare = Number(document.getElementById('adminTrainFare').value);
  const editingTrain = state.editingTrain;

  if (!trainsByCity[city] || !/^[A-Z0-9-]+$/.test(code) || !Number.isFinite(fare) || fare <= 0) {
    showToast('Enter a valid train code and positive fare.', 'error');
    return;
  }

  const duplicate = trainsByCity[city].some((train) =>
    train.code === code && (!editingTrain || editingTrain.city !== city || editingTrain.code !== code)
  );
  if (duplicate) {
    showToast('That train already exists for this destination.', 'error');
    return;
  }

  if (editingTrain) {
    const originalTrain = (trainsByCity[editingTrain.city] || [])
      .find((train) => train.code === editingTrain.code);
    if (!originalTrain) {
      showToast('The train being edited no longer exists.', 'error');
      resetTrainEditForm();
      return;
    }
    if (editingTrain.city === city) {
      originalTrain.code = code;
      originalTrain.fare = fare;
    } else {
      trainsByCity[editingTrain.city] = trainsByCity[editingTrain.city]
        .filter((train) => train.code !== editingTrain.code);
      trainsByCity[city].push({ code, fare });
    }
  } else {
    trainsByCity[city].push({ code, fare });
  }

  saveTrains();
  resetTrainEditForm();
  renderManagedCitySelects();
  renderAdminDashboard();
  showToast(`${code} ${editingTrain ? 'updated' : 'added'} for ${city}`);
}

function removeTrain(city, code) {
  const cityTrains = trainsByCity[city];
  if (!cityTrains) {
    return;
  }

  if (state.editingTrain && state.editingTrain.city === city && state.editingTrain.code === code) {
    resetTrainEditForm();
  }
  trainsByCity[city] = cityTrains.filter((train) => train.code !== code);
  saveTrains();
  renderManagedCitySelects();
  renderAdminDashboard();
  showToast(`${code} deleted from ${city}`);
}

["home", "admin", "user", "booking", "routeFinder", "liveStatus", "waitlist", "delayPrediction", "chatbot", "pnr", "assistance", "food"].forEach((id) => {
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
document.getElementById('cancelTrainEditBtn').addEventListener('click', resetTrainEditForm);
document.getElementById('addStationForm').addEventListener('submit', addStation);
document.getElementById('addRouteForm').addEventListener('submit', addRoute);
document.getElementById('pnrEnquiryForm').addEventListener('submit', enquirePnr);
document.getElementById('routeFinderForm').addEventListener('submit', handleRouteFinder);
document.getElementById('assistanceLookupForm').addEventListener('submit', trackAssistance);
document.getElementById('adminPnrSearchForm').addEventListener('submit', handleAdminPnrSearch);
document.getElementById('reportPeriodSelect').addEventListener('change', changeReportPeriod);
document.getElementById('reportDateInput').addEventListener('input', renderAdminReports);
document.getElementById('waitlistPredictionForm').addEventListener('submit', handleWaitlistPrediction);
document.getElementById('predictDelayBtn').addEventListener('click', renderDelayPrediction);
document.getElementById('chatForm').addEventListener('submit', handleChatSubmit);

document.getElementById('bookTicketBtn').addEventListener('click', bookTicket);
document.getElementById('joinWaitlistBtn').addEventListener('click', joinWaitlist);
paymentForm.addEventListener('submit', payForBooking);
document.getElementById('cancelPaymentBtn').addEventListener('click', cancelPayment);
document.getElementById('toggleSimulationBtn').addEventListener('click', toggleLiveSimulation);
document.getElementById('resetSimulationBtn').addEventListener('click', resetLiveSimulation);
document.getElementById('applyDelayBtn').addEventListener('click', applyDelayUpdate);
document.getElementById('alertPassengersBtn').addEventListener('click', alertPassengers);
statusDestinationSelect.addEventListener('change', () => {
  resetLiveSimulation();
  renderStatusTrains();
  syncDelayControlsForSelection();
});
statusTrainSelect.addEventListener('change', () => {
  resetLiveSimulation();
  syncDelayControlsForSelection();
});
statusTravelDateInput.addEventListener('change', () => {
  resetLiveSimulation();
  syncDelayControlsForSelection();
});
liveWeatherSelect.addEventListener('change', () => {
  if (state.liveSimulation) {
    state.liveSimulation.weather = liveWeatherSelect.value;
    updateLiveStatus();
  }
});
waitlistCitySelect.addEventListener('change', () =>
  renderPredictionTrainOptions(waitlistCitySelect, waitlistTrainSelect));
delayCitySelect.addEventListener('change', () =>
  renderPredictionTrainOptions(delayCitySelect, delayTrainSelect));

document.getElementById('placeFoodOrderBtn').addEventListener('click', placeFoodOrder);

destinationSelect.addEventListener('change', () => {
  renderBookingOrigins();
  renderTrains(destinationSelect.value);
});
originSelect.addEventListener('change', () => {
  updateSummary();
  updateWaitlistControls();
});
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
  renderPassengerFields();
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

  const editTrainButton = event.target.closest('button[data-edit-city][data-edit-code]');
  if (editTrainButton) {
    startTrainEdit(editTrainButton.dataset.editCity, editTrainButton.dataset.editCode);
  }

  const removeStationButton = event.target.closest('button[data-remove-station]');
  if (removeStationButton) {
    removeStation(removeStationButton.dataset.removeStation);
  }

  const removeRouteButton = event.target.closest('button[data-remove-route]');
  if (removeRouteButton) {
    removeRoute(Number(removeRouteButton.dataset.removeRoute));
  }

  const adminPnrButton = event.target.closest('button[data-admin-pnr]');
  if (adminPnrButton) {
    document.getElementById('adminPnrInput').value = adminPnrButton.dataset.adminPnr;
    verifyAdminPnr(adminPnrButton.dataset.adminPnr);
  }

  const cancelTicketButton = event.target.closest('button[data-cancel-pnr]');
  if (cancelTicketButton) {
    cancelTicket(cancelTicketButton.dataset.cancelPnr);
  }

  const seatButton = event.target.closest('button[data-seat]');
  if (seatButton) {
    toggleSeat(seatButton.dataset.seat);
  }

  const routeBookingButton = event.target.closest('button[data-route-origin][data-route-destination][data-route-train]');
  if (routeBookingButton) {
    prefillBookingForLeg(
      routeBookingButton.dataset.routeOrigin,
      routeBookingButton.dataset.routeDestination,
      routeBookingButton.dataset.routeTrain
    );
  }
});

document.addEventListener('change', (event) => {
  const statusSelect = event.target.closest('select[data-assistance-pnr][data-assistance-index]');
  if (statusSelect) {
    updateAssistanceStatus(
      statusSelect.dataset.assistancePnr,
      Number(statusSelect.dataset.assistanceIndex),
      statusSelect.value
    );
  }
});

const now = new Date();
const localToday = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
travelDateInput.min = localToday;
travelDateInput.value = localToday;
statusTravelDateInput.min = localToday;
statusTravelDateInput.value = localToday;
const waitlistTravelDate = document.getElementById('waitlistTravelDate');
waitlistTravelDate.min = localToday;
waitlistTravelDate.value = localToday;
document.getElementById('reportDateInput').value = localToday;
updateSessionLabel();
renderPassengerFields();
renderCoachOptions();
renderStationManagement();
renderManagedCitySelects();
syncDelayControlsForSelection();
renderFoodItems();
renderRecentBookings();
