#!/usr/bin/env python3
"""
Setup Cloud Monitoring for FGate
Creates uptime checks and alert policies
"""

import json
import subprocess
import sys

PROJECT_ID = "full-techno-channels"
SERVICE_URL = "membership-backend-1054327025113.us-central1.run.app"
NOTIFICATION_CHANNEL_ID = "17123829530400440380"


def run_command(cmd):
    """Execute shell command and return output"""
    print(f"Executing: {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return None
    return result.stdout


def create_uptime_check():
    """Create uptime check using gcloud REST API"""
    uptime_config = {
        "displayName": "FGate Health Check",
        "monitoredResource": {"type": "uptime_url", "labels": {}},
        "httpCheck": {
            "requestMethod": "GET",
            "path": "/health",
            "port": 443,
            "useSsl": True,
            "validateSsl": True,
        },
        "period": "60s",
        "timeout": "10s",
        "contentMatchers": [{"content": "healthy", "matcher": "CONTAINS_STRING"}],
        "checkerType": "STATIC_IP_CHECKERS",
    }

    # Save config to temp file
    with open("/tmp/uptime_config.json", "w") as f:
        json.dump(uptime_config, f, indent=2)

    # Create uptime check via API
    cmd = f"""
    curl -X POST \
      -H "Authorization: Bearer $(gcloud auth print-access-token)" \
      -H "Content-Type: application/json" \
      -d @/tmp/uptime_config.json \
      "https://monitoring.googleapis.com/v3/projects/{PROJECT_ID}/uptimeCheckConfigs"
    """

    result = run_command(cmd)
    if result:
        print("✅ Uptime check created!")
        print(result)
        return json.loads(result)
    return None


def create_error_rate_alert():
    """Create alert for high error rate"""
    alert_config = {
        "displayName": "FGate - High Error Rate",
        "conditions": [
            {
                "displayName": "Error rate > 5%",
                "conditionThreshold": {
                    "filter": 'resource.type="cloud_run_revision" AND resource.labels.service_name="membership-backend" AND metric.type="run.googleapis.com/request_count" AND metric.labels.response_code_class="5xx"',
                    "comparison": "COMPARISON_GT",
                    "thresholdValue": 0.05,
                    "duration": "300s",
                    "aggregations": [
                        {"alignmentPeriod": "60s", "perSeriesAligner": "ALIGN_RATE"}
                    ],
                },
            }
        ],
        "combiner": "OR",
        "enabled": True,
        "notificationChannels": [
            f"projects/{PROJECT_ID}/notificationChannels/{NOTIFICATION_CHANNEL_ID}"
        ],
        "alertStrategy": {"autoClose": "1800s"},
    }

    with open("/tmp/alert_config.json", "w") as f:
        json.dump(alert_config, f, indent=2)

    cmd = f"""
    curl -X POST \
      -H "Authorization: Bearer $(gcloud auth print-access-token)" \
      -H "Content-Type: application/json" \
      -d @/tmp/alert_config.json \
      "https://monitoring.googleapis.com/v3/projects/{PROJECT_ID}/alertPolicies"
    """

    result = run_command(cmd)
    if result:
        print("✅ Error rate alert created!")
        print(result)
        return json.loads(result)
    return None


def create_uptime_alert():
    """Create alert for uptime check failures"""
    alert_config = {
        "displayName": "FGate - Service Down",
        "conditions": [
            {
                "displayName": "Health check failing",
                "conditionThreshold": {
                    "filter": 'resource.type="uptime_url" AND metric.type="monitoring.googleapis.com/uptime_check/check_passed"',
                    "comparison": "COMPARISON_LT",
                    "thresholdValue": 1,
                    "duration": "60s",
                    "aggregations": [
                        {
                            "alignmentPeriod": "60s",
                            "perSeriesAligner": "ALIGN_FRACTION_TRUE",
                        }
                    ],
                },
            }
        ],
        "combiner": "OR",
        "enabled": True,
        "notificationChannels": [
            f"projects/{PROJECT_ID}/notificationChannels/{NOTIFICATION_CHANNEL_ID}"
        ],
        "alertStrategy": {"autoClose": "1800s"},
    }

    with open("/tmp/uptime_alert_config.json", "w") as f:
        json.dump(alert_config, f, indent=2)

    cmd = f"""
    curl -X POST \
      -H "Authorization: Bearer $(gcloud auth print-access-token)" \
      -H "Content-Type: application/json" \
      -d @/tmp/uptime_alert_config.json \
      "https://monitoring.googleapis.com/v3/projects/{PROJECT_ID}/alertPolicies"
    """

    result = run_command(cmd)
    if result:
        print("✅ Uptime alert created!")
        print(result)
        return json.loads(result)
    return None


def main():
    print("🚀 Setting up Cloud Monitoring for FGate...")
    print(f"Project: {PROJECT_ID}")
    print(f"Service: {SERVICE_URL}")
    print(f"Notification Channel: {NOTIFICATION_CHANNEL_ID}\n")

    # Create uptime check
    print("📊 Creating uptime check...")
    uptime = create_uptime_check()
    if not uptime:
        print("❌ Failed to create uptime check")
        sys.exit(1)

    # Create alerts
    print("\n🔔 Creating error rate alert...")
    error_alert = create_error_rate_alert()
    if not error_alert:
        print("⚠️  Failed to create error rate alert")

    print("\n🔔 Creating uptime alert...")
    uptime_alert = create_uptime_alert()
    if not uptime_alert:
        print("⚠️  Failed to create uptime alert")

    print("\n✅ Monitoring setup complete!")
    print("\n📊 View monitoring dashboard:")
    print(
        f"https://console.cloud.google.com/monitoring/dashboards?project={PROJECT_ID}"
    )


if __name__ == "__main__":
    main()
