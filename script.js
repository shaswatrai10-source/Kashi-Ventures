const popularCities = [
    { name: "Varanasi", state: "Uttar Pradesh", lat: 25.3176, lng: 82.9739 },
    { name: "Ghazipur", state: "Uttar Pradesh", lat: 25.5833, lng: 83.5853 },
    { name: "Ayodhya", state: "Uttar Pradesh", lat: 26.7922, lng: 82.1998 },
    { name: "Prayagraj", state: "Uttar Pradesh", lat: 25.4358, lng: 81.8463 },
    { name: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462 },
    { name: "Agra", state: "Uttar Pradesh", lat: 27.1767, lng: 78.0081 },
    { name: "Mathura", state: "Uttar Pradesh", lat: 27.4924, lng: 77.6737 },
    { name: "Vrindavan", state: "Uttar Pradesh", lat: 27.5650, lng: 77.6593 },
    { name: "Delhi", state: "Delhi", lat: 28.6139, lng: 77.2090 },
    { name: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873 },
    { name: "Udaipur", state: "Rajasthan", lat: 24.5854, lng: 73.7125 },
    { name: "Haridwar", state: "Uttarakhand", lat: 29.9457, lng: 78.1642 },
    { name: "Rishikesh", state: "Uttarakhand", lat: 30.0869, lng: 78.2676 },
    { name: "Patna", state: "Bihar", lat: 25.5941, lng: 85.1376 },
    { name: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639 },
    { name: "Mumbai", state: "Maharashtra", lat: 19.0760, lng: 72.8777 },
    { name: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567 },
    { name: "Goa", state: "Goa", lat: 15.2993, lng: 74.1240 },
    { name: "Hyderabad", state: "Telangana", lat: 17.3850, lng: 78.4867 },
    { name: "Bengaluru", state: "Karnataka", lat: 12.9716, lng: 77.5946 },
    { name: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707 }
];

const WHATSAPP_BUSINESS_NUMBER = "919555730875";

const vehicleRates = {
    sedan: { label: "Sedan", perKm: 14, minimum: 1200, driver: 500 },
    suv: { label: "SUV", perKm: 19, minimum: 1800, driver: 700 },
    tempo: { label: "Tempo Traveller", perKm: 28, minimum: 3200, driver: 1000 }
};

const sampleRoutes = [
    ["Varanasi", "Ayodhya"],
    ["Varanasi", "Ghazipur"],
    ["Varanasi", "Prayagraj"],
    ["Lucknow", "Agra"],
    ["Delhi", "Jaipur"],
    ["Mumbai", "Goa"]
];

let routeMap;
let routeLayerGroup;
let activeRouteRequest = 0;

function formatMoney(amount) {
    return "Rs " + Math.round(amount).toLocaleString("en-IN");
}

function buildWhatsAppLink(message) {
    return `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodeURIComponent(message)}`;
}

function getCity(name) {
    return popularCities.find((city) => city.name === name);
}

function toRadians(degree) {
    return degree * Math.PI / 180;
}

function getAirDistanceKm(from, to) {
    const earthRadiusKm = 6371;
    const dLat = toRadians(to.lat - from.lat);
    const dLng = toRadians(to.lng - from.lng);
    const lat1 = toRadians(from.lat);
    const lat2 = toRadians(to.lat);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
}

function estimateRouteFare(from, to, vehicleKey, tripType) {
    const vehicle = vehicleRates[vehicleKey];
    const airDistance = getAirDistanceKm(from, to);
    const roadDistance = Math.ceil(airDistance * 1.28);
    const billedDistance = tripType === "roundTrip" ? roadDistance * 2 : roadDistance;
    const longTripDays = Math.max(1, Math.ceil(billedDistance / 450));
    const tollAndParking = Math.max(250, billedDistance * 1.6);
    const baseFare = billedDistance * vehicle.perKm;
    const total = Math.max(vehicle.minimum, baseFare) + tollAndParking + (vehicle.driver * longTripDays);

    return {
        distance: roadDistance,
        billedDistance,
        days: longTripDays,
        tollAndParking,
        total
    };
}

function fillCitySelects() {
    const fromSelect = document.getElementById("fromCity");
    const toSelect = document.getElementById("toCity");

    popularCities.forEach((city) => {
        const optionText = `${city.name}, ${city.state}`;
        fromSelect.add(new Option(optionText, city.name));
        toSelect.add(new Option(optionText, city.name));
    });

    fromSelect.value = "Varanasi";
    toSelect.value = "Ayodhya";
}

function calculateFare() {
    const from = getCity(document.getElementById("fromCity").value);
    const to = getCity(document.getElementById("toCity").value);
    const vehicleKey = document.getElementById("carType").value;
    const tripType = document.getElementById("tripType").value;

    if (!from || !to || from.name === to.name) {
        alert("Please select two different cities.");
        return;
    }

    const estimate = estimateRouteFare(from, to, vehicleKey, tripType);
    const tripLabel = tripType === "roundTrip" ? "round trip" : "one way";
    document.getElementById("resultText").innerText = `Estimated Fare: ${formatMoney(estimate.total)}`;
    document.getElementById("routeDetails").innerText =
        `${from.name} to ${to.name} is approx ${estimate.distance} km by road. ` +
        `${vehicleRates[vehicleKey].label}, ${tripLabel}, billed ${estimate.billedDistance} km with toll/parking and driver allowance included.`;

    updateRideConfirmationLink(from, to, vehicleKey, tripType, estimate);
    drawRouteOnMap(from, to);
}

function initializeRouteMap() {
    if (!window.L || routeMap) {
        return;
    }

    routeMap = L.map("routeMap", {
        scrollWheelZoom: false,
        zoomControl: true
    }).setView([22.9734, 78.6569], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(routeMap);

    routeLayerGroup = L.layerGroup().addTo(routeMap);
}

async function drawRouteOnMap(from, to) {
    initializeRouteMap();

    if (!routeMap || !routeLayerGroup) {
        return;
    }

    const requestId = ++activeRouteRequest;
    const mapStatus = document.getElementById("mapStatus");
    mapStatus.innerText = `Finding road route from ${from.name} to ${to.name}...`;

    try {
        const routeCoordinates = await fetchRoadRoute(from, to);
        if (requestId !== activeRouteRequest) {
            return;
        }
        renderRoute(from, to, routeCoordinates, true);
        mapStatus.innerText = `Showing real road route: ${from.name} to ${to.name}`;
    } catch (error) {
        if (requestId !== activeRouteRequest) {
            return;
        }
        renderRoute(from, to, [[from.lat, from.lng], [to.lat, to.lng]], false);
        mapStatus.innerText = `Road route unavailable, showing direct route: ${from.name} to ${to.name}`;
    }
}

async function fetchRoadRoute(from, to) {
    const coordinates = `${from.lng},${from.lat};${to.lng},${to.lat}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Route request failed");
    }

    const data = await response.json();
    const geometry = data.routes?.[0]?.geometry?.coordinates;

    if (!geometry || geometry.length < 2) {
        throw new Error("Route geometry unavailable");
    }

    return geometry.map(([lng, lat]) => [lat, lng]);
}

function renderRoute(from, to, routeCoordinates, isRoadRoute) {
    routeLayerGroup.clearLayers();

    const startMarker = L.marker([from.lat, from.lng]).bindPopup(`<strong>${from.name}</strong><br>Pickup city`);
    const endMarker = L.marker([to.lat, to.lng]).bindPopup(`<strong>${to.name}</strong><br>Destination city`);
    const routeLine = L.polyline(routeCoordinates, {
        color: isRoadRoute ? "#27ae60" : "#f39c12",
        dashArray: isRoadRoute ? null : "8 10",
        lineCap: "round",
        lineJoin: "round",
        opacity: 0.9,
        weight: 6
    });

    routeLayerGroup.addLayer(routeLine);
    routeLayerGroup.addLayer(startMarker);
    routeLayerGroup.addLayer(endMarker);
    routeMap.fitBounds(routeLine.getBounds().pad(0.2), {
        animate: true,
        maxZoom: 9
    });
}

function registerRouteControls() {
    ["fromCity", "toCity", "carType", "tripType"].forEach((id) => {
        document.getElementById(id).addEventListener("change", calculateFare);
    });
}

function updateRideConfirmationLink(from, to, vehicleKey, tripType, estimate) {
    const tripLabel = tripType === "roundTrip" ? "Round Trip" : "One Way";
    const message = [
        "Hello Kashi Ventures, I want to confirm a ride.",
        `Route: ${from.name} to ${to.name}`,
        `Vehicle: ${vehicleRates[vehicleKey].label}`,
        `Trip Type: ${tripLabel}`,
        `Approx Distance: ${estimate.distance} km`,
        `Estimated Fare: ${formatMoney(estimate.total)}`,
        "Please confirm availability and pickup details."
    ].join("\n");

    document.getElementById("confirmRideBtn").href = buildWhatsAppLink(message);
}

function sendQueryToWhatsApp() {
    const query = document.getElementById("customerQuery").value.trim();
    const message = query
        ? `Hello Kashi Ventures, I have a query:\n${query}`
        : "Hello Kashi Ventures, I have a query about booking a ride.";

    window.open(buildWhatsAppLink(message), "_blank", "noopener");
}

function initializeWhatsAppLinks() {
    const defaultMessage = "Hello Kashi Ventures, I want to know more about travel booking.";
    const defaultLink = buildWhatsAppLink(defaultMessage);
    document.getElementById("navWhatsApp").href = defaultLink;
    document.getElementById("floatingWhatsApp").href = defaultLink;
}

function renderPopularRoutes() {
    const routeList = document.getElementById("popularRoutes");
    routeList.innerHTML = "";

    sampleRoutes.forEach(([fromName, toName]) => {
        const from = getCity(fromName);
        const to = getCity(toName);
        const estimate = estimateRouteFare(from, to, "sedan", "oneWay");
        const button = document.createElement("button");
        button.className = "route-chip";
        button.type = "button";
        button.innerHTML = `<span>${fromName} to ${toName}</span><strong>${formatMoney(estimate.total)}</strong>`;
        button.onclick = () => {
            document.getElementById("fromCity").value = fromName;
            document.getElementById("toCity").value = toName;
            document.getElementById("carType").value = "sedan";
            document.getElementById("tripType").value = "oneWay";
            calculateFare();
        };
        routeList.appendChild(button);
    });
}

function estimateFarmProfit() {
    const profitPerAcre = parseFloat(document.getElementById("cropType").value);
    const bigha = parseFloat(document.getElementById("areaSize").value);

    if (profitPerAcre > 0 && bigha > 0) {
        const acreage = bigha / 1.6;
        const totalProfit = Math.round(profitPerAcre * acreage);
        document.getElementById("farmResult").innerText = "Potential Profit: " + formatMoney(totalProfit);
    } else {
        alert("Please enter valid bigha and select a crop!");
    }
}

fillCitySelects();
renderPopularRoutes();
initializeWhatsAppLinks();
initializeRouteMap();
registerRouteControls();
calculateFare();

console.log("Kashi Ventures smart route estimator ready.");
