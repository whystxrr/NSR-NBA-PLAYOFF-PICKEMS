const API_BASE = 'https://script.google.com/macros/s/AKfycbyBe0X8nhU7oOtJJIn5mrAbXeDzuv5cfCbY8h1HYzSeaIRDnOEx9SdXbDWRaTfDCfpX/exec';

// NBA Playoff Teams for 2025-26 Season (placeholder - update as needed)
const NBA_TEAMS = [
    'Boston Celtics', 'Milwaukee Bucks', 'Philadelphia 76ers', 'Denver Nuggets',
    'Golden State Warriors', 'Phoenix Suns', 'Dallas Mavericks', 'Los Angeles Lakers',
    'Cleveland Cavaliers', 'New York Knicks', 'Miami Heat', 'Atlanta Hawks',
    'LA Clippers', 'New Orleans Pelicans', 'Indiana Pacers', 'Orlando Magic'
];

let config = null;
let countdownInterval = null;

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
}

function showMessage(text, type) {
    const msg = document.getElementById('message');
    msg.textContent = text;
    msg.className = `message ${type}`;
    msg.classList.remove('hidden');
    msg.scrollIntoView({ behavior: 'smooth' });
}

function hideMessage() {
    document.getElementById('message').classList.add('hidden');
}

async function fetchConfig() {
    try {
        const response = await fetch(`${API_BASE}?action=getConfig`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        config = await response.json();
        return config;
    } catch (error) {
        console.error('Failed to fetch config:', error);
        throw new Error('Unable to load voting configuration. Please check your connection and try again.');
    }
}

function isVotingOpen() {
    if (!config) return false;
    const now = new Date();
    const deadline = new Date(config.deadline);
    return config.votingOpen && now <= deadline;
}

function startCountdown(elementId, targetDate) {
    if (countdownInterval) clearInterval(countdownInterval);
    
    const target = new Date(targetDate);
    const countdownEl = document.getElementById(elementId);
    
    function updateCountdown() {
        const now = new Date();
        const diff = target - now;
        
        if (diff <= 0) {
            countdownEl.textContent = 'Voting Closed';
            clearInterval(countdownInterval);
            return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        countdownEl.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
    
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
}

function renderTeamSelector() {
    const container = document.getElementById('team-selector');
    container.innerHTML = '';
    
    NBA_TEAMS.forEach(team => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'team-button';
        button.textContent = team;
        button.dataset.team = team;
        
        button.addEventListener('click', () => {
            document.querySelectorAll('.team-button').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            document.getElementById('selected-team').value = team;
        });
        
        container.appendChild(button);
    });
}

function loadApp() {
    showScreen('loading-screen');
    
    fetchConfig().then(() => {
        if (!isVotingOpen()) {
            showScreen('voting-closed-screen');
            return;
        }
        
        const submitted = localStorage.getItem('nba_prediction_submitted');
        if (submitted) {
            const data = JSON.parse(submitted);
            document.getElementById('submitted-name').textContent = data.name;
            document.getElementById('submitted-pick').textContent = data.pick;
            document.getElementById('submitted-time').textContent = new Date(data.timestamp).toLocaleString();
            startCountdown('countdown', config.deadline);
            showScreen('already-submitted-screen');
        } else {
            renderTeamSelector();
            startCountdown('countdown', config.deadline);
            showScreen('form-screen');
        }
    }).catch(error => {
        showScreen('voting-closed-screen');
        document.querySelector('#voting-closed-screen .message').innerHTML = `
            <p><strong>Error:</strong> ${error.message}</p>
            <p>Please refresh the page to try again.</p>
        `;
    });
}

document.getElementById('pick-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage();
    
    const name = document.getElementById('playerName').value.trim();
    const pick = document.getElementById('selected-team').value;
    
    if (!name) {
        showMessage('Please enter your full name.', 'error');
        return;
    }
    
    if (!pick) {
        showMessage('Please select a team.', 'error');
        return;
    }
    
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    showScreen('submitting-screen');
    
    const payload = {
        name: name,
        pick: pick,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
    };
    
    try {
        const response = await fetch(`${API_BASE}?action=submitPick`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error(`Submission failed: ${response.status}`);
        
        // Success
        localStorage.setItem('nba_prediction_submitted', JSON.stringify({
            name: name,
            pick: pick,
            timestamp: payload.timestamp
        }));
        
        document.getElementById('success-name').textContent = name;
        document.getElementById('success-pick').textContent = pick;
        document.getElementById('success-time').textContent = new Date(payload.timestamp).toLocaleString();
        
        showScreen('success-screen');
        
    } catch (error) {
        console.error('Submission error:', error);
        showScreen('form-screen');
        showMessage('Failed to submit prediction. Please check your connection and try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Prediction';
    }
});

// Initialize app
loadApp();