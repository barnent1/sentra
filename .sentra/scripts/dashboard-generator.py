#!/usr/bin/env python3
"""
Dashboard Generator - Phase 3 Component

Generates an interactive HTML dashboard from metrics data.
"""

import json
from pathlib import Path
from datetime import datetime

def generate_dashboard():
    """Generate HTML dashboard from metrics history"""

    metrics_file = Path('.sentra/metrics/history.json')
    if not metrics_file.exists():
        print("❌ No metrics data found. Run metrics-collector.py first.")
        return

    with open(metrics_file, 'r') as f:
        history = json.load(f)

    if not history:
        print("❌ Metrics history is empty")
        return

    latest = history[-1]

    # Generate HTML
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Architecture Intelligence Dashboard - Sentra</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; padding: 2rem; }}
        .container {{ max-width: 1400px; margin: 0 auto; }}
        header {{ margin-bottom: 3rem; }}
        h1 {{ font-size: 2.5rem; font-weight: 700; margin-bottom: 0.5rem; }}
        .subtitle {{ color: #94a3b8; font-size: 1.1rem; }}
        .health-score {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; border-radius: 1rem; margin-bottom: 2rem; text-align: center; }}
        .health-score h2 {{ font-size: 4rem; font-weight: 700; margin-bottom: 0.5rem; }}
        .health-score p {{ font-size: 1.2rem; opacity: 0.9; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }}
        .card {{ background: #1e293b; padding: 1.5rem; border-radius: 0.75rem; border: 1px solid #334155; }}
        .card h3 {{ font-size: 0.9rem; color: #94a3b8; text-transform: uppercase; margin-bottom: 1rem; letter-spacing: 0.05em; }}
        .metric {{ font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; }}
        .metric-label {{ color: #94a3b8; font-size: 0.9rem; }}
        .chart-container {{ background: #1e293b; padding: 1.5rem; border-radius: 0.75rem; border: 1px solid #334155; margin-bottom: 2rem; }}
        .trend-up {{ color: #10b981; }}
        .trend-down {{ color: #ef4444; }}
        .trend-neutral {{ color: #f59e0b; }}
        .status-green {{ color: #10b981; }}
        .status-yellow {{ color: #f59e0b; }}
        .status-red {{ color: #ef4444; }}
        table {{ width: 100%; border-collapse: collapse; }}
        th, td {{ padding: 0.75rem; text-align: left; border-bottom: 1px solid #334155; }}
        th {{ color: #94a3b8; font-weight: 600; }}
        .footer {{ margin-top: 3rem; text-align: center; color: #64748b; font-size: 0.9rem; }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🏗️ Architecture Intelligence Dashboard</h1>
            <p class="subtitle">Sentra Project - Generated {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </header>

        <div class="health-score">
            <h2>{calculate_health_score(latest)}/100</h2>
            <p>Overall Architectural Health Score</p>
        </div>

        <div class="grid">
            <div class="card">
                <h3>Pattern Consistency</h3>
                <div class="metric status-{get_status_color(latest['pattern_consistency_score'], 95, 80)}">{latest['pattern_consistency_score']:.1f}%</div>
                <div class="metric-label">Target: 95%+</div>
            </div>

            <div class="card">
                <h3>Test Coverage</h3>
                <div class="metric status-{get_status_color(latest['overall_coverage'], 75, 60)}">{latest['overall_coverage']:.1f}%</div>
                <div class="metric-label">Target: 75%+</div>
            </div>

            <div class="card">
                <h3>Total Violations</h3>
                <div class="metric status-{get_status_color_inverse(latest['total_violations'], 10, 25)}">{latest['total_violations']}</div>
                <div class="metric-label">Target: < 10</div>
            </div>

            <div class="card">
                <h3>Technical Debt</h3>
                <div class="metric status-{get_status_color_inverse(latest['estimated_fix_hours'], 20, 40)}">{latest['estimated_fix_hours']:.1f}h</div>
                <div class="metric-label trend-{get_trend(latest['debt_trend'])}">{latest['debt_trend'].title()}</div>
            </div>
        </div>

        <div class="chart-container">
            <h3 style="margin-bottom: 1rem; color: #94a3b8;">📈 PATTERN CONSISTENCY TREND</h3>
            <canvas id="consistencyChart" height="80"></canvas>
        </div>

        <div class="chart-container">
            <h3 style="margin-bottom: 1rem; color: #94a3b8;">📉 VIOLATIONS OVER TIME</h3>
            <canvas id="violationsChart" height="80"></canvas>
        </div>

        <div class="card">
            <h3>Patterns by Status</h3>
            <table>
                <tr><th>Status</th><th>Count</th></tr>
                <tr><td>Adopted</td><td>{latest['patterns_adopted']}</td></tr>
                <tr><td>In Trial</td><td>{latest['patterns_in_trial']}</td></tr>
                <tr><td>Proposed</td><td>{latest['patterns_proposed']}</td></tr>
            </table>
        </div>

        <div class="card">
            <h3>Refactoring Activity (Last 7 Days)</h3>
            <table>
                <tr><th>Metric</th><th>Value</th></tr>
                <tr><td>Files Refactored</td><td>{latest['files_refactored_last_week']}</td></tr>
                <tr><td>Successful</td><td class="status-green">{latest['auto_fixes_successful']}</td></tr>
                <tr><td>Failed</td><td class="status-red">{latest['auto_fixes_failed']}</td></tr>
            </table>
        </div>

        <div class="footer">
            <p>Phase 3: The Evolver - Architecture Intelligence System</p>
            <p>Glen Barnhardt with help from Claude Code • November 2025</p>
        </div>
    </div>

    <script>
        const history = {json.dumps(history)};

        // Pattern Consistency Chart
        new Chart(document.getElementById('consistencyChart'), {{
            type: 'line',
            data: {{
                labels: history.map(h => new Date(h.timestamp).toLocaleDateString()),
                datasets: [{{
                    label: 'Pattern Consistency',
                    data: history.map(h => h.pattern_consistency_score),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4
                }}]
            }},
            options: {{
                responsive: true,
                plugins: {{
                    legend: {{ display: false }},
                }},
                scales: {{
                    y: {{
                        beginAtZero: true,
                        max: 100,
                        grid: {{ color: '#334155' }},
                        ticks: {{ color: '#94a3b8' }}
                    }},
                    x: {{
                        grid: {{ color: '#334155' }},
                        ticks: {{ color: '#94a3b8' }}
                    }}
                }}
            }}
        }});

        // Violations Chart
        new Chart(document.getElementById('violationsChart'), {{
            type: 'bar',
            data: {{
                labels: history.map(h => new Date(h.timestamp).toLocaleDateString()),
                datasets: [{{
                    label: 'Total Violations',
                    data: history.map(h => h.total_violations),
                    backgroundColor: '#ef4444',
                }}]
            }},
            options: {{
                responsive: true,
                plugins: {{
                    legend: {{ display: false }},
                }},
                scales: {{
                    y: {{
                        beginAtZero: true,
                        grid: {{ color: '#334155' }},
                        ticks: {{ color: '#94a3b8' }}
                    }},
                    x: {{
                        grid: {{ color: '#334155' }},
                        ticks: {{ color: '#94a3b8' }}
                    }}
                }}
            }}
        }});
    </script>
</body>
</html>"""

    # Write dashboard
    output_file = Path('.sentra/metrics/dashboard.html')
    output_file.write_text(html)

    print(f"✅ Dashboard generated: {output_file}")
    print(f"Open with: open {output_file}")


def calculate_health_score(snapshot: dict) -> int:
    """Calculate health score from snapshot"""
    score = 0
    score += min(30, snapshot['pattern_consistency_score'] * 0.3)
    score += min(30, snapshot['overall_coverage'] * 0.3)
    if snapshot['total_violations'] == 0:
        score += 20
    elif snapshot['total_violations'] < 10:
        score += 15
    elif snapshot['total_violations'] < 25:
        score += 10
    if snapshot['debt_trend'] == 'decreasing':
        score += 10
    elif snapshot['debt_trend'] == 'stable':
        score += 5
    if snapshot['files_refactored_last_week'] > 5:
        score += 10
    elif snapshot['files_refactored_last_week'] > 0:
        score += 5
    return int(score)


def get_status_color(value: float, good_threshold: float, ok_threshold: float) -> str:
    """Get status color based on value"""
    if value >= good_threshold:
        return 'green'
    elif value >= ok_threshold:
        return 'yellow'
    else:
        return 'red'


def get_status_color_inverse(value: float, good_threshold: float, ok_threshold: float) -> str:
    """Get status color for metrics where lower is better"""
    if value <= good_threshold:
        return 'green'
    elif value <= ok_threshold:
        return 'yellow'
    else:
        return 'red'


def get_trend(trend: str) -> str:
    """Map trend to CSS class"""
    if trend == 'decreasing':
        return 'up'
    elif trend == 'increasing':
        return 'down'
    else:
        return 'neutral'


if __name__ == '__main__':
    generate_dashboard()
