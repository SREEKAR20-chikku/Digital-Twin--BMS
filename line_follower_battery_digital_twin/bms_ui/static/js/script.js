// ─── BMS Dashboard — Professional Analytics UI ──────────────────────────────────
const MAX_PTS = 50;
const INTERVAL = 3000;

let gaugeSOC, gaugeSOH, gaugeTemp;
let trendsChart, errChart, socCompChart, alphaChart, sohChart, tempChart;
let dataBuffer = [];

const PALETTE = {
    physics: '#5DCAA5',
    ml: '#7F77DD',
    hybrid: '#EF9F27',
    volt: '#3b82f6',
    curr: '#10b981',
    temp: '#f59e0b'
};

// ─── Chart Configuration Helper ────────────────────────────────────────────────
function mkGauge(id, color) {
    return new Chart(document.getElementById(id), {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [0, 100],
                backgroundColor: [color, '#e5e7eb'],
                borderWidth: 0
            }]
        },
        options: {
            cutout: '76%',
            rotation: -90,
            circumference: 180,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            responsive: true,
            maintainAspectRatio: true
        }
    });
}

function mkLineChart(id, datasets, yLabel, yMin, yMax) {
    const ctx = document.getElementById(id);
    const myChart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 10,
                        boxHeight: 10,
                        font: { size: 11 },
                        color: '#6b7280',
                        padding: 12
                    }
                }
            },
            scales: {
                x: { display: false },
                y: {
                    min: yMin,
                    max: yMax,
                    title: { display: !!yLabel, text: yLabel, font: { size: 11 } },
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    ticks: { font: { size: 10 } }
                }
            }
        }
    });
    return myChart;
}

// ─── Initialize Charts ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    gaugeSOC = mkGauge('socGauge', '#3b82f6');
    gaugeSOH = mkGauge('sohGauge', '#10b981');
    gaugeTemp = mkGauge('tempGauge', '#f59e0b');

    // Sensor Trends Chart (multi-axis)
    trendsChart = mkLineChart('trendsChart', [
        {
            label: 'Voltage (V)',
            data: [],
            borderColor: PALETTE.volt,
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
            borderWidth: 2.5,
            pointRadius: 0,
            tension: 0.3,
            yAxisID: 'y'
        },
        {
            label: 'Current (A)',
            data: [],
            borderColor: PALETTE.curr,
            backgroundColor: 'rgba(16, 185, 129, 0.05)',
            borderWidth: 2.5,
            pointRadius: 0,
            tension: 0.3,
            yAxisID: 'y2',
            borderDash: [4, 3]
        },
        {
            label: 'Temp (°C)',
            data: [],
            borderColor: PALETTE.temp,
            backgroundColor: 'rgba(245, 158, 11, 0.05)',
            borderWidth: 2.5,
            pointRadius: 0,
            tension: 0.3,
            yAxisID: 'y3',
            borderDash: [4, 3]
        }
    ], '', undefined, undefined);

    trendsChart.options.scales = {
        x: { display: false },
        y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'Voltage (V)', font: { size: 10, weight: '600' } },
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { font: { size: 10 } }
        },
        y2: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: 'Current (A)', font: { size: 10, weight: '600' } },
            grid: { drawOnChartArea: false },
            ticks: { font: { size: 10 } }
        },
        y3: {
            type: 'linear',
            display: true,
            position: 'right',
            offset: true,
            title: { display: true, text: 'Temp (°C)', font: { size: 10, weight: '600' } },
            grid: { drawOnChartArea: false },
            ticks: { font: { size: 10 } }
        }
    };
    trendsChart.update();

    // Error Comparison Chart
    errChart = mkLineChart('errChart', [
        {
            label: 'Physics Error',
            data: [],
            borderColor: PALETTE.physics,
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3,
            fill: false
        },
        {
            label: 'ML Error',
            data: [],
            borderColor: PALETTE.ml,
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3,
            borderDash: [4, 3],
            fill: false
        }
    ], 'SOC Error (%)', 0, 5);

    // SOC Comparison Chart
    socCompChart = mkLineChart('socCompChart', [
        {
            label: 'Physics',
            data: [],
            borderColor: PALETTE.physics,
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.3,
            fill: false
        },
        {
            label: 'ML (LSTM)',
            data: [],
            borderColor: PALETTE.ml,
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.3,
            borderDash: [4, 3],
            fill: false
        },
        {
            label: 'Hybrid (Fused)',
            data: [],
            borderColor: PALETTE.hybrid,
            borderWidth: 2.5,
            pointRadius: 0,
            tension: 0.3,
            fill: false
        }
    ], 'SOC (%)', 0, 100);

    // Alpha (Fusion Weight) Chart
    alphaChart = mkLineChart('alphaChart', [
        {
            label: 'α (Physics Trust Weight)',
            data: [],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3,
            fill: true
        }
    ], 'Alpha (0-1)', 0, 1);

    // SOH Chart
    sohChart = mkLineChart('sohChart', [
        {
            label: 'SOH',
            data: [],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3,
            fill: true
        }
    ], 'SOH (%)', 60, 100);

    // Temperature Chart
    tempChart = mkLineChart('tempChart', [
        {
            label: 'Temperature',
            data: [],
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3,
            fill: true
        }
    ], 'Temp (°C)', undefined, undefined);

    tick();
    setInterval(tick, INTERVAL);
});

// ─── Push Data to Chart ────────────────────────────────────────────────────────
function pushToChart(chart, label, ...seriesData) {
    chart.data.labels.push(label);
    seriesData.forEach((v, i) => {
        if (chart.data.datasets[i]) {
            chart.data.datasets[i].data.push(v);
        }
    });

    if (chart.data.labels.length > MAX_PTS) {
        chart.data.labels.shift();
        chart.data.datasets.forEach(d => d.data.shift());
    }

    chart.update('none');
}

// ─── Update Dashboard ──────────────────────────────────────────────────────────
async function tick() {
    try {
        const [bmsRes, compRes] = await Promise.all([
            fetch('/api/bms'),
            fetch('/api/compare')
        ]);

        if (!bmsRes.ok) return;

        const d = await bmsRes.json();
        const cmp = compRes.ok ? await compRes.json() : null;

        dataBuffer.push(d);
        if (dataBuffer.length > 100) dataBuffer.shift();

        const ts = new Date(d.timestamp).toLocaleTimeString();

        // ─── Update Gauges ───────────────────────────────────────────────────
        gaugeSOC.data.datasets[0].data = [d.soc, 100 - d.soc];
        gaugeSOC.update('none');

        gaugeSOH.data.datasets[0].data = [d.soh, 100 - d.soh];
        gaugeSOH.update('none');

        const tempPercent = Math.min((d.temperature / 65) * 100, 100);
        gaugeTemp.data.datasets[0].data = [tempPercent, 100 - tempPercent];
        gaugeTemp.update('none');

        // ─── Update Header Values ────────────────────────────────────────────
        document.getElementById('socVal').textContent = d.soc + '%';
        document.getElementById('sohVal').textContent = d.soh + '%';
        document.getElementById('tempVal').textContent = d.temperature + '°C';
        document.getElementById('alphaVal').textContent = (d.fusion_alpha * 100).toFixed(0);

        document.getElementById('socModels').textContent = 
            `Physics ${d.soc_physics.toFixed(1)}% · ML ${d.soc_ml.toFixed(1)}%`;
        document.getElementById('sohModels').textContent = 
            `Physics ${d.soh_physics.toFixed(1)}% · ML ${d.soh_ml.toFixed(1)}%`;
        document.getElementById('tempModels').textContent = 
            `Physics ${d.temp_physics.toFixed(1)}°C · ML ${d.temp_ml.toFixed(1)}°C`;

        // ─── Update Last Update Time ─────────────────────────────────────────
        document.getElementById('lastUpdate').textContent = `Last update: ${ts}`;

        // ─── Update Cycle Count ──────────────────────────────────────────────
        document.getElementById('cycleCount').textContent = d.cycle_count;

        // ─── Calculate Health Score ──────────────────────────────────────────
        const healthScore = Math.round((d.soc * 0.3 + d.soh * 0.7));
        document.getElementById('healthScore').querySelector('.health-value').textContent = healthScore;

        // ─── Update Status Indicators ────────────────────────────────────────

        // SOH Badge
        const sohBadge = document.getElementById('sohBadge');
        if (d.soh > 90) {
            sohBadge.textContent = 'Excellent';
            sohBadge.className = 'status-badge good';
        } else if (d.soh > 80) {
            sohBadge.textContent = 'Healthy';
            sohBadge.className = 'status-badge good';
        } else if (d.soh > 70) {
            sohBadge.textContent = 'Degraded';
            sohBadge.className = 'status-badge warn';
        } else {
            sohBadge.textContent = 'Critical';
            sohBadge.className = 'status-badge bad';
        }

        // Temperature Badge
        const tempBadge = document.getElementById('tempBadge');
        if (d.temperature < 40) {
            tempBadge.textContent = 'Normal';
            tempBadge.className = 'status-badge good';
        } else if (d.temperature < 50) {
            tempBadge.textContent = 'Elevated';
            tempBadge.className = 'status-badge warn';
        } else {
            tempBadge.textContent = 'Critical';
            tempBadge.className = 'status-badge bad';
        }

        // System Status
        const sysStatus = document.getElementById('systemStatus');
        const indicator = sysStatus.querySelector('.status-indicator');
        let hasWarning = d.warnings && d.warnings.length > 0;
        
        if (hasWarning && d.warnings.some(w => w.includes('CRITICAL'))) {
            indicator.className = 'status-indicator bad';
            sysStatus.querySelector('span').textContent = 'Critical Alert';
        } else if (hasWarning) {
            indicator.className = 'status-indicator warn';
            sysStatus.querySelector('span').textContent = 'Warning';
        } else {
            indicator.className = 'status-indicator good';
            sysStatus.querySelector('span').textContent = 'System Healthy';
        }

        // ─── Battery Progress Bar ────────────────────────────────────────────
        const battBar = document.getElementById('battBar');
        battBar.style.width = d.soc + '%';

        if (d.soc > 60) {
            battBar.style.background = 'linear-gradient(90deg, #10b981 0%, #059669 100%)';
        } else if (d.soc > 30) {
            battBar.style.background = 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)';
        } else {
            battBar.style.background = 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
        }

        // ─── Update Warnings ─────────────────────────────────────────────────
        const warnList = document.getElementById('warnList');
        warnList.innerHTML = '';

        if (d.warnings && d.warnings.length > 0) {
            d.warnings.forEach(w => {
                const el = document.createElement('div');
                const isCritical = w.includes('CRITICAL');
                el.className = 'warn-item ' + (isCritical ? 'danger' : 'warning');
                el.innerHTML = `<div class="warn-dot"></div> <span>${w}</span>`;
                warnList.appendChild(el);
            });
        } else {
            const el = document.createElement('div');
            el.className = 'warn-item ok';
            el.innerHTML = '<div class="warn-dot"></div> <span>All systems normal</span>';
            warnList.appendChild(el);
        }

        // ─── Update Metrics ──────────────────────────────────────────────────
        document.getElementById('voltVal').textContent = d.voltage.toFixed(2);
        document.getElementById('currVal').textContent = d.current.toFixed(2);
        document.getElementById('capVal').textContent = d.capacity.toFixed(3);

        if (cmp && !cmp.error) {
            document.getElementById('errPhyVal').textContent = cmp.soc_error_physics.toFixed(2);
            document.getElementById('errMlVal').textContent = cmp.soc_error_ml.toFixed(2);

            // Push to error chart
            pushToChart(errChart, ts, cmp.soc_error_physics, cmp.soc_error_ml);

            // Push alpha weight
            if (cmp.model_weights && cmp.model_weights.length > 0) {
                const lastAlpha = cmp.model_weights[cmp.model_weights.length - 1];
                pushToChart(alphaChart, ts, lastAlpha);
            }
        }

        // ─── Update Trends Chart ─────────────────────────────────────────────
        trendsChart.data.labels.push(ts);
        trendsChart.data.datasets[0].data.push(d.voltage);
        trendsChart.data.datasets[1].data.push(d.current);
        trendsChart.data.datasets[2].data.push(d.temperature);

        if (trendsChart.data.labels.length > MAX_PTS) {
            trendsChart.data.labels.shift();
            trendsChart.data.datasets.forEach(ds => ds.data.shift());
        }
        trendsChart.update('none');

        // ─── Update SOC Comparison ───────────────────────────────────────────
        pushToChart(socCompChart, ts, d.soc_physics, d.soc_ml, d.soc);

        // ─── Update SOH & Temp Charts ────────────────────────────────────────
        pushToChart(sohChart, ts, d.soh);
        pushToChart(tempChart, ts, d.temperature);

    } catch (e) {
        console.error('Dashboard update error:', e);
    }
}