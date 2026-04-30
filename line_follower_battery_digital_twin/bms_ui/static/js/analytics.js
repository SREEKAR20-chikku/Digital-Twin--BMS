/* ─────────────────────────────────────────────────────────────────────────────
   BATTERY ANALYTICS DASHBOARD - JAVASCRIPT
   ───────────────────────────────────────────────────────────────────────────── */

const UPDATE_INTERVAL = 3000; // 3 seconds
const MAX_HISTORY_POINTS = 120; // 120 minutes worth of data

let charts = {
    multiAxis: null,
    comparison: null,
    socZone: null,
    sohZone: null,
    tempZone: null
};

let dataHistory = [];
let kpiData = {
    peakVoltage: 0,
    peakCurrent: 0,
    maxTemp: 0,
    peakVoltageTime: '-',
    peakCurrentTime: '-',
    maxTempTime: '-'
};

// ─ Initialize Dashboard ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    updateDashboard();
    setInterval(updateDashboard, UPDATE_INTERVAL);
});

// ─ Initialize All Charts ────────────────────────────────────────────────────────
function initializeCharts() {
    // Multi-Axis Chart
    const multiAxisCtx = document.getElementById('multiAxisChart').getContext('2d');
    charts.multiAxis = new Chart(multiAxisCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Voltage (V)',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    borderWidth: 2.5,
                    pointRadius: 0,
                    tension: 0.4,
                    yAxisID: 'y',
                    fill: false
                },
                {
                    label: 'Current (A)',
                    data: [],
                    borderColor: '#10b981',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    pointStyle: 'circle',
                    pointBorderColor: '#10b981',
                    pointBackgroundColor: 'white',
                    tension: 0.4,
                    yAxisID: 'y1',
                    fill: false
                },
                {
                    label: 'Temperature (°C)',
                    data: [],
                    borderColor: '#b8860b',
                    borderWidth: 2,
                    borderDash: [3, 3],
                    pointRadius: 0,
                    tension: 0.4,
                    yAxisID: 'y2',
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    display: true,
                    title: { display: true, text: 'Time (minutes)', font: { size: 12, weight: '600' } },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Voltage (V)', font: { size: 12, weight: '600', color: '#3b82f6' } },
                    grid: { color: 'rgba(59, 130, 246, 0.1)' },
                    ticks: { color: '#3b82f6' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'Current (A)', font: { size: 12, weight: '600', color: '#10b981' } },
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#10b981' }
                },
                y2: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    offset: true,
                    title: { display: true, text: 'Temp (°C)', font: { size: 12, weight: '600', color: '#b8860b' } },
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#b8860b' }
                }
            }
        }
    });

    // Comparison Chart
    const comparisonCtx = document.getElementById('comparisonChart').getContext('2d');
    charts.comparison = new Chart(comparisonCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'SOC (%)',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    borderWidth: 2.5,
                    pointRadius: 0,
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y-soc'
                },
                {
                    label: 'SOH (%)',
                    data: [],
                    borderColor: '#10b981',
                    borderWidth: 2,
                    borderDash: [4, 4],
                    pointRadius: 0,
                    tension: 0.4,
                    fill: false,
                    yAxisID: 'y-soh'
                },
                {
                    label: 'Temperature (°C)',
                    data: [],
                    borderColor: '#b8860b',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.4,
                    fill: false,
                    yAxisID: 'y-temp'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    display: true,
                    title: { display: true, text: 'Time (minutes)', font: { size: 12, weight: '600' } },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                'y-soc': {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'SOC / SOH (%)', font: { size: 12, weight: '600' } },
                    min: 0,
                    max: 100,
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                'y-temp': {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'Temperature (°C)', font: { size: 12, weight: '600' } },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });

    // SOC Zone Chart
    const socZoneCtx = document.getElementById('socZoneChart').getContext('2d');
    charts.socZone = new Chart(socZoneCtx, createZoneChart('SOC', '#3b82f6'));

    // SOH Zone Chart
    const sohZoneCtx = document.getElementById('sohZoneChart').getContext('2d');
    charts.sohZone = new Chart(sohZoneCtx, createZoneChart('SOH', '#10b981'));

    // Temperature Zone Chart
    const tempZoneCtx = document.getElementById('tempZoneChart').getContext('2d');
    charts.tempZone = new Chart(tempZoneCtx, createZoneChart('Temperature', '#b8860b'));
}

// ─ Create Zone Chart Config ─────────────────────────────────────────────────
function createZoneChart(name, color) {
    return {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: name,
                    data: [],
                    borderColor: color,
                    backgroundColor: 'rgba(0,0,0,0.02)',
                    borderWidth: 2.5,
                    pointRadius: 0,
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                filler: { propagate: true }
            },
            scales: {
                x: { display: true },
                y: {
                    display: true,
                    grid: { color: 'rgba(0,0,0,0.05)' }
                }
            }
        }
    };
}

// ─ Update Dashboard Data ────────────────────────────────────────────────────
async function updateDashboard() {
    try {
        // Fetch data from API endpoints
        const [bmsRes, historyRes] = await Promise.all([
            fetch('/api/bms'),
            fetch('/api/history')
        ]);

        if (!bmsRes.ok) return;

        const bmsData = await bmsRes.json();
        const historyData = historyRes.ok ? (await historyRes.json()).data : [];

        // Add to history
        if (!dataHistory.find(d => d.timestamp === bmsData.timestamp)) {
            dataHistory.push(bmsData);
            if (dataHistory.length > MAX_HISTORY_POINTS) {
                dataHistory.shift();
            }
        }

        // Update KPIs
        updateKPIs(dataHistory);

        // Update charts
        updateCharts(dataHistory);

        // Update thresholds
        updateThresholds(bmsData);

        // Update time
        document.getElementById('updateTime').textContent = 
            `Last updated: ${new Date(bmsData.timestamp).toLocaleTimeString()}`;

    } catch (error) {
        console.error('Dashboard update error:', error);
    }
}

// ─ Update KPI Values ────────────────────────────────────────────────────────
function updateKPIs(history) {
    if (history.length === 0) return;

    // Peak Voltage
    let maxVolt = -Infinity;
    let maxVoltTime = '-';
    history.forEach((d, i) => {
        if (d.voltage > maxVolt) {
            maxVolt = d.voltage;
            maxVoltTime = formatTime(i);
        }
    });

    // Peak Current
    let maxCurr = -Infinity;
    let maxCurrTime = '-';
    history.forEach((d, i) => {
        if (d.current > maxCurr) {
            maxCurr = d.current;
            maxCurrTime = formatTime(i);
        }
    });

    // Max Temperature
    let maxT = -Infinity;
    let maxTTime = '-';
    history.forEach((d, i) => {
        if (d.temperature > maxT) {
            maxT = d.temperature;
            maxTTime = formatTime(i);
        }
    });

    // Duration
    const duration = history.length;
    const lastPoint = history[history.length - 1];

    document.getElementById('peakVoltage').textContent = maxVolt !== -Infinity ? maxVolt.toFixed(2) : '—';
    document.getElementById('peakVoltageTime').textContent = `at ${maxVoltTime}`;
    document.getElementById('peakCurrent').textContent = maxCurr !== -Infinity ? maxCurr.toFixed(2) : '—';
    document.getElementById('peakCurrentTime').textContent = `at ${maxCurrTime}`;
    document.getElementById('maxTemp').textContent = maxT !== -Infinity ? maxT.toFixed(1) : '—';
    document.getElementById('maxTempTime').textContent = `at ${maxTTime}`;
    document.getElementById('duration').textContent = duration;
    document.getElementById('cycleInfo').textContent = `${lastPoint?.cycle_count || 0} cycles`;
}

// ─ Update Charts with Data ────────────────────────────────────────────────────
function updateCharts(history) {
    if (history.length === 0) return;

    const labels = history.map((d, i) => formatTime(i));
    const voltages = history.map(d => d.voltage);
    const currents = history.map(d => d.current);
    const temps = history.map(d => d.temperature);
    const socs = history.map(d => d.soc);
    const sohs = history.map(d => d.soh);

    // Update Multi-Axis Chart
    charts.multiAxis.data.labels = labels;
    charts.multiAxis.data.datasets[0].data = voltages;
    charts.multiAxis.data.datasets[1].data = currents;
    charts.multiAxis.data.datasets[2].data = temps;
    charts.multiAxis.update('none');

    // Update Comparison Chart
    charts.comparison.data.labels = labels;
    charts.comparison.data.datasets[0].data = socs;
    charts.comparison.data.datasets[1].data = sohs;
    charts.comparison.data.datasets[2].data = temps;
    charts.comparison.update('none');

    // Update Zone Charts
    updateZoneChart(charts.socZone, socs, labels);
    updateZoneChart(charts.sohZone, sohs, labels);
    updateZoneChart(charts.tempZone, temps, labels);

    // Update Zone Statistics
    updateZoneStatistics(socs, sohs, temps);
}

// ─ Update Zone Chart with Background Colors ─────────────────────────────────
function updateZoneChart(chart, data, labels) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;

    // Add background zones
    const ctx = chart.ctx;
    const chartInstance = chart;

    // Store zone rendering
    chart.zoneData = data;
    chart.update('none');
}

// ─ Render Zone Backgrounds on Chart.js Plugin ──────────────────────────────
Chart.defaults.plugins.annotation = {
    drawTime: 'beforeDatasetsDraw'
};

// ─ Update Zone Statistics ──────────────────────────────────────────────────
function updateZoneStatistics(socs, sohs, temps) {
    // SOC Zones
    const socHigh = socs.filter(s => s > 80).length;
    const socNormal = socs.filter(s => s >= 20 && s <= 80).length;
    const socLow = socs.filter(s => s < 20).length;
    const socTotal = socs.length || 1;

    document.getElementById('socHighTime').textContent = ((socHigh / socTotal) * 100).toFixed(1) + '%';
    document.getElementById('socNormalTime').textContent = ((socNormal / socTotal) * 100).toFixed(1) + '%';
    document.getElementById('socLowTime').textContent = ((socLow / socTotal) * 100).toFixed(1) + '%';

    // SOH Zones
    const sohHealthy = sohs.filter(s => s > 99.5).length;
    const sohModerate = sohs.filter(s => s > 80 && s <= 99.5).length;
    const sohDegraded = sohs.filter(s => s <= 80).length;
    const sohTotal = sohs.length || 1;

    document.getElementById('sohHealthyTime').textContent = ((sohHealthy / sohTotal) * 100).toFixed(1) + '%';
    document.getElementById('sohModerateTime').textContent = ((sohModerate / sohTotal) * 100).toFixed(1) + '%';
    document.getElementById('sohDegradedTime').textContent = ((sohDegraded / sohTotal) * 100).toFixed(1) + '%';

    // Temperature Zones
    const tempCool = temps.filter(t => t < 30).length;
    const tempNormal = temps.filter(t => t >= 30 && t <= 40).length;
    const tempHot = temps.filter(t => t > 40).length;
    const tempTotal = temps.length || 1;

    document.getElementById('tempCoolTime').textContent = ((tempCool / tempTotal) * 100).toFixed(1) + '%';
    document.getElementById('tempNormalTime').textContent = ((tempNormal / tempTotal) * 100).toFixed(1) + '%';
    document.getElementById('tempHotTime').textContent = ((tempHot / tempTotal) * 100).toFixed(1) + '%';
}

// ─ Update Safety Threshold Indicators ──────────────────────────────────────
function updateThresholds(bmsData) {
    // Critical Voltage
    const critVoltEl = document.getElementById('critVolt');
    if (bmsData.voltage < 3.0) {
        critVoltEl.textContent = 'TRIGGERED';
        critVoltEl.classList.add('active');
    } else {
        critVoltEl.textContent = 'Not triggered';
        critVoltEl.classList.remove('active');
    }

    // Low SOC
    const lowSocEl = document.getElementById('lowSoc');
    if (bmsData.soc < 20) {
        lowSocEl.textContent = 'TRIGGERED';
        lowSocEl.classList.add('active');
    } else {
        lowSocEl.textContent = 'Not triggered';
        lowSocEl.classList.remove('active');
    }

    // Critical Temperature
    const critTempEl = document.getElementById('critTemp');
    if (bmsData.temperature > 55) {
        critTempEl.textContent = 'TRIGGERED';
        critTempEl.classList.add('active');
    } else {
        critTempEl.textContent = 'Not triggered';
        critTempEl.classList.remove('active');
    }

    // Battery Aging
    const agingEl = document.getElementById('aging');
    if (bmsData.soh < 80) {
        agingEl.textContent = 'TRIGGERED';
        agingEl.classList.add('active');
    } else {
        agingEl.textContent = 'Not triggered';
        agingEl.classList.remove('active');
    }
}

// ─ Format Time Helper ──────────────────────────────────────────────────────
function formatTime(index) {
    return `${index}m`;
}

// ─ Initialize with defer to ensure DOM is ready ────────────────────────────
window.addEventListener('load', () => {
    // Additional initialization if needed
});
