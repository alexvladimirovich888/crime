// Global variables
let map;
let incidents = [];
let activeIncidents = 0;
let autoUpdateInterval;
let isAutoUpdateActive = true;
let incidentIdCounter = 0;

// Brooklyn coordinates
const BROOKLYN_BOUNDS = {
    center: [40.6782, -73.9442],
    bounds: [
        [40.5693, -74.0567], // Southwest
        [40.7391, -73.8336]  // Northeast
    ]
};

// Brooklyn land zones (excluding water)
const BROOKLYN_LAND_ZONES = [
    // Williamsburg
    { minLat: 40.7000, maxLat: 40.7200, minLng: -73.9700, maxLng: -73.9400 },
    // Greenpoint
    { minLat: 40.7200, maxLat: 40.7400, minLng: -73.9600, maxLng: -73.9300 },
    // Bushwick
    { minLat: 40.6900, maxLat: 40.7100, minLng: -73.9400, maxLng: -73.9100 },
    // Bedford-Stuyvesant
    { minLat: 40.6800, maxLat: 40.7000, minLng: -73.9500, maxLng: -73.9200 },
    // Crown Heights
    { minLat: 40.6600, maxLat: 40.6900, minLng: -73.9500, maxLng: -73.9200 },
    // Prospect Heights / Park Slope
    { minLat: 40.6600, maxLat: 40.6800, minLng: -73.9800, maxLng: -73.9500 },
    // Fort Greene
    { minLat: 40.6800, maxLat: 40.6950, minLng: -73.9800, maxLng: -73.9600 },
    // Cobble Hill / Carroll Gardens
    { minLat: 40.6750, maxLat: 40.6900, minLng: -74.0000, maxLng: -73.9800 },
    // Red Hook (land area)
    { minLat: 40.6700, maxLat: 40.6800, minLng: -74.0100, maxLng: -73.9950 },
    // Flatbush
    { minLat: 40.6400, maxLat: 40.6700, minLng: -73.9600, maxLng: -73.9300 },
    // Bensonhurst
    { minLat: 40.6000, maxLat: 40.6300, minLng: -74.0200, maxLng: -73.9800 },
    // Bay Ridge
    { minLat: 40.6200, maxLat: 40.6500, minLng: -74.0400, maxLng: -74.0100 },
    // Brighton Beach (land area)
    { minLat: 40.5750, maxLat: 40.5900, minLng: -73.9700, maxLng: -73.9500 },
    // Coney Island (land area)
    { minLat: 40.5700, maxLat: 40.5850, minLng: -73.9900, maxLng: -73.9700 },
    // Canarsie (land area)
    { minLat: 40.6300, maxLat: 40.6500, minLng: -73.9100, maxLng: -73.8800 },
    // East New York
    { minLat: 40.6500, maxLat: 40.6800, minLng: -73.9000, maxLng: -73.8700 }
];

// Incident types with danger ratings
const INCIDENT_TYPES = {
    murder: {
        name: 'Murder',
        danger: 5,
        color: '#ff0000',
        icon: '🔪',
        descriptions: [
            'Body found with multiple stab wounds',
            'Fatal shooting incident',
            'Attack involving firearms',
            'Body discovered in apartment basement',
            'Street fight ended in tragedy'
        ]
    },
    robbery: {
        name: 'Robbery',
        danger: 4,
        color: '#ff6600',
        icon: '💰',
        descriptions: [
            'Bank robbery with hostages',
            'Armed attack on jewelry store',
            'Mugging of pedestrian',
            '24-hour store robbery',
            'ATM theft with explosives'
        ]
    },
    carjacking: {
        name: 'Carjacking',
        danger: 3,
        color: '#ffaa00',
        icon: '🚗',
        descriptions: [
            'Carjacking with violence',
            'Luxury sports car theft',
            'Service vehicle stolen',
            'Car seized at traffic light',
            'Cargo truck theft'
        ]
    },
    assault: {
        name: 'Assault',
        danger: 2,
        color: '#ffdd00',
        icon: '👊',
        descriptions: [
            'Bar fight with weapons',
            'Attack in dark alley',
            'Beating in subway tunnel',
            'Gang conflict',
            'Cyclist assault'
        ]
    },
    vandalism: {
        name: 'Vandalism',
        danger: 1,
        color: '#ffff00',
        icon: '🎨',
        descriptions: [
            'Store windows smashed',
            'Graffiti on historic building',
            'City buses damaged',
            'Playground equipment destroyed',
            'Dumpster fire started'
        ]
    }
};

// Brooklyn addresses
const BROOKLYN_ADDRESSES = [
    'Brooklyn Bridge Park',
    'Prospect Park',
    'Coney Island',
    'Williamsburg',
    'DUMBO',
    'Red Hook',
    'Park Slope',
    'Bay Ridge',
    'Bensonhurst',
    'Brighton Beach',
    'Sheepshead Bay',
    'Canarsie',
    'Flatbush',
    'Crown Heights',
    'Bedford-Stuyvesant',
    'Bushwick',
    'Greenpoint',
    'Fort Greene',
    'Cobble Hill',
    'Carroll Gardens'
];

// Real incident images
const INCIDENT_IMAGES = {
    murder: [
        'img/kill/1.jpg',
        'img/kill/2.png', 
        'img/kill/3.jpg',
        'img/kill/4.webp'
    ],
    robbery: [
        'img/robbery/1.jpg',
        'img/robbery/2.jpg',
        'img/robbery/3.jpg'
    ],
    carjacking: [
        'img/hijacking/1.jpg',
        'img/hijacking/2.jpg',
        'img/hijacking/3.jpg'
    ],
    assault: [
        'img/protests/1.jpg',
        'img/protests/2.jpg',
        'img/protests/3.jpg'
    ],
    vandalism: [
        'img/vandalism/1.jpg',
        'img/vandalism/2.jpg',
        'img/vandalism/3.jpg'
    ]
};

// Map initialization
function initMap() {
    map = L.map('map').setView(BROOKLYN_BOUNDS.center, 12);

    // Dark theme map
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors, © CARTO',
        maxZoom: 19
    }).addTo(map);

    // Limit map area to Brooklyn
    map.setMaxBounds(BROOKLYN_BOUNDS.bounds);
}

// Generate random coordinates on land only (excluding water)
function getRandomBrooklynCoords() {
    // Select random land zone
    const randomZone = BROOKLYN_LAND_ZONES[Math.floor(Math.random() * BROOKLYN_LAND_ZONES.length)];
    
    // Generate coordinates within selected zone
    const lat = Math.random() * (randomZone.maxLat - randomZone.minLat) + randomZone.minLat;
    const lng = Math.random() * (randomZone.maxLng - randomZone.minLng) + randomZone.minLng;

    return [lat, lng];
}

// Create star rating for danger level
function createStarRating(danger) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += i <= danger ? '★' : '☆';
    }
    return stars;
}

// Create new incident
function createIncident() {
    const types = Object.keys(INCIDENT_TYPES);
    const randomType = types[Math.floor(Math.random() * types.length)];
    const incidentType = INCIDENT_TYPES[randomType];
    
    const coords = getRandomBrooklynCoords();
    const address = BROOKLYN_ADDRESSES[Math.floor(Math.random() * BROOKLYN_ADDRESSES.length)];
    const description = incidentType.descriptions[Math.floor(Math.random() * incidentType.descriptions.length)];
    
    const now = new Date();
    const timeOptions = { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    };
    
    // Select random image for this incident type
    const typeImages = INCIDENT_IMAGES[randomType];
    const randomImage = typeImages[Math.floor(Math.random() * typeImages.length)];
    
    const incident = {
        id: ++incidentIdCounter,
        type: randomType,
        name: incidentType.name,
        danger: incidentType.danger,
        color: incidentType.color,
        icon: incidentType.icon,
        coords: coords,
        address: address,
        description: description,
        time: now.toLocaleString('en-US', timeOptions),
        timestamp: now.getTime(),
        image: randomImage
    };

    return incident;
}

// Add marker to map
function addIncidentToMap(incident) {
    // Create custom icon with danger color
    const customIcon = L.divIcon({
        className: 'custom-incident-marker',
        html: `
            <div style="
                background: ${incident.color};
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                border: 3px solid white;
                box-shadow: 0 0 15px ${incident.color};
                animation: incidentPulse 2s infinite;
            ">
                ${incident.icon}
            </div>
            <style>
                @keyframes incidentPulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
            </style>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    const marker = L.marker(incident.coords, { icon: customIcon }).addTo(map);
    
    // Quick popup window
    const popupContent = `
        <div style="color: #00ff88; font-family: 'Rajdhani', sans-serif; min-width: 200px;">
            <h3 style="margin: 0 0 10px 0; color: ${incident.color};">${incident.name}</h3>
            <p style="margin: 5px 0;"><strong>Danger:</strong> ${createStarRating(incident.danger)}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${incident.time}</p>
            <p style="margin: 5px 0;"><strong>Address:</strong> ${incident.address}</p>
            <button onclick="showIncidentDetails(${incident.id})" style="
                background: #00ff88;
                color: black;
                border: none;
                padding: 8px 16px;
                border-radius: 5px;
                cursor: pointer;
                font-family: 'Rajdhani', sans-serif;
                font-weight: 600;
                margin-top: 10px;
            ">Details</button>
        </div>
    `;

    marker.bindPopup(popupContent);
    
    // Add marker to incident
    incident.marker = marker;
    
    return marker;
}

// Show incident details in modal window
function showIncidentDetails(incidentId) {
    const incident = incidents.find(inc => inc.id === incidentId);
    if (!incident) return;

    document.getElementById('incidentTitle').textContent = incident.name.toUpperCase();
    document.getElementById('incidentRating').textContent = createStarRating(incident.danger);
    document.getElementById('incidentTime').textContent = incident.time;
    document.getElementById('incidentAddress').textContent = incident.address;
    document.getElementById('incidentDescription').textContent = incident.description;
    
    // Image setup with error handling
    const imgElement = document.getElementById('incidentImg');
    imgElement.src = incident.image;
    imgElement.onerror = function() {
        // If image fails to load, show placeholder
        this.src = 'https://via.placeholder.com/300x200/330000/ffffff?text=IMAGE+UNAVAILABLE';
        console.warn(`Failed to load image: ${incident.image}`);
    };

    document.getElementById('incidentModal').style.display = 'block';
}

// Create notification
function showNotification(incident) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-header">
            ${incident.icon} ${incident.name}
        </div>
        <div class="notification-body">
            ${incident.address}
        </div>
        <div class="notification-time">
            ${incident.time}
        </div>
    `;

    document.getElementById('notifications').appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);

    // Sound notification (can add audio file)
    playNotificationSound();
}

// Sound notification
function playNotificationSound() {
    // Create short sound signal
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

// Update statistics
function updateStats() {
    document.getElementById('activeIncidents').textContent = activeIncidents;
    
    // Calculate average danger level
    const totalDanger = incidents.reduce((sum, inc) => sum + inc.danger, 0);
    const avgDanger = incidents.length > 0 ? Math.round(totalDanger / incidents.length) : 1;
    document.getElementById('dangerLevel').textContent = avgDanger;
}

// Add new incident
function spawnIncident() {
    if (!isAutoUpdateActive) return;

    const incident = createIncident();
    incidents.push(incident);
    activeIncidents++;
    
    addIncidentToMap(incident);
    showNotification(incident);
    updateStats();

    console.log(`New incident: ${incident.name} at ${incident.address}`);
}

// Button control functions removed

// Start auto-update
function startAutoUpdate() {
    autoUpdateInterval = setInterval(spawnIncident, 5000); // Every 5 seconds
}

// Application initialization
function init() {
    initMap();
    updateStats();
    startAutoUpdate();
    
    // Add first incident immediately
    setTimeout(spawnIncident, 1000);
    
    // Button event handlers removed
    
    // Close modal window
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('incidentModal').style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('incidentModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Start application after DOM loads
document.addEventListener('DOMContentLoaded', init); 