#!/usr/bin/env python3
"""
Create FGate monitoring dashboard in Cloud Monitoring
"""

import json
import subprocess

PROJECT_ID = "full-techno-channels"
SERVICE_NAME = "membership-backend"

# Dashboard configuration
dashboard_config = {
    "displayName": "FGate - Production Dashboard",
    "mosaicLayout": {
        "columns": 12,
        "tiles": [
            # Row 1: Overview metrics
            {
                "width": 4,
                "height": 4,
                "widget": {
                    "title": "Request Rate (QPS)",
                    "xyChart": {
                        "dataSets": [
                            {
                                "timeSeriesQuery": {
                                    "timeSeriesFilter": {
                                        "filter": f'resource.type="cloud_run_revision" AND resource.labels.service_name="{SERVICE_NAME}" AND metric.type="run.googleapis.com/request_count"',
                                        "aggregation": {
                                            "alignmentPeriod": "60s",
                                            "perSeriesAligner": "ALIGN_RATE",
                                        },
                                    }
                                },
                                "plotType": "LINE",
                            }
                        ],
                        "yAxis": {"label": "Requests/sec", "scale": "LINEAR"},
                    },
                },
            },
            {
                "width": 4,
                "height": 4,
                "xPos": 4,
                "widget": {
                    "title": "Response Time (p95)",
                    "xyChart": {
                        "dataSets": [
                            {
                                "timeSeriesQuery": {
                                    "timeSeriesFilter": {
                                        "filter": f'resource.type="cloud_run_revision" AND resource.labels.service_name="{SERVICE_NAME}" AND metric.type="run.googleapis.com/request_latencies"',
                                        "aggregation": {
                                            "alignmentPeriod": "60s",
                                            "perSeriesAligner": "ALIGN_DELTA",
                                            "crossSeriesReducer": "REDUCE_PERCENTILE_95",
                                        },
                                    }
                                },
                                "plotType": "LINE",
                            }
                        ],
                        "yAxis": {"label": "Milliseconds", "scale": "LINEAR"},
                    },
                },
            },
            {
                "width": 4,
                "height": 4,
                "xPos": 8,
                "widget": {
                    "title": "Error Rate (%)",
                    "xyChart": {
                        "dataSets": [
                            {
                                "timeSeriesQuery": {
                                    "timeSeriesFilter": {
                                        "filter": f'resource.type="cloud_run_revision" AND resource.labels.service_name="{SERVICE_NAME}" AND metric.type="run.googleapis.com/request_count" AND metric.labels.response_code_class="5xx"',
                                        "aggregation": {
                                            "alignmentPeriod": "60s",
                                            "perSeriesAligner": "ALIGN_RATE",
                                        },
                                    }
                                },
                                "plotType": "LINE",
                            }
                        ],
                        "yAxis": {"label": "Errors/sec", "scale": "LINEAR"},
                    },
                },
            },
            # Row 2: Resource utilization
            {
                "width": 6,
                "height": 4,
                "yPos": 4,
                "widget": {
                    "title": "CPU Utilization",
                    "xyChart": {
                        "dataSets": [
                            {
                                "timeSeriesQuery": {
                                    "timeSeriesFilter": {
                                        "filter": f'resource.type="cloud_run_revision" AND resource.labels.service_name="{SERVICE_NAME}" AND metric.type="run.googleapis.com/container/cpu/utilizations"',
                                        "aggregation": {
                                            "alignmentPeriod": "60s",
                                            "perSeriesAligner": "ALIGN_MEAN",
                                        },
                                    }
                                },
                                "plotType": "LINE",
                            }
                        ],
                        "yAxis": {"label": "Utilization", "scale": "LINEAR"},
                    },
                },
            },
            {
                "width": 6,
                "height": 4,
                "xPos": 6,
                "yPos": 4,
                "widget": {
                    "title": "Memory Utilization",
                    "xyChart": {
                        "dataSets": [
                            {
                                "timeSeriesQuery": {
                                    "timeSeriesFilter": {
                                        "filter": f'resource.type="cloud_run_revision" AND resource.labels.service_name="{SERVICE_NAME}" AND metric.type="run.googleapis.com/container/memory/utilizations"',
                                        "aggregation": {
                                            "alignmentPeriod": "60s",
                                            "perSeriesAligner": "ALIGN_MEAN",
                                        },
                                    }
                                },
                                "plotType": "LINE",
                            }
                        ],
                        "yAxis": {"label": "Utilization", "scale": "LINEAR"},
                    },
                },
            },
            # Row 3: Instance metrics
            {
                "width": 6,
                "height": 4,
                "yPos": 8,
                "widget": {
                    "title": "Container Instance Count",
                    "xyChart": {
                        "dataSets": [
                            {
                                "timeSeriesQuery": {
                                    "timeSeriesFilter": {
                                        "filter": f'resource.type="cloud_run_revision" AND resource.labels.service_name="{SERVICE_NAME}" AND metric.type="run.googleapis.com/container/instance_count"',
                                        "aggregation": {
                                            "alignmentPeriod": "60s",
                                            "perSeriesAligner": "ALIGN_MAX",
                                        },
                                    }
                                },
                                "plotType": "LINE",
                            }
                        ],
                        "yAxis": {"label": "Instances", "scale": "LINEAR"},
                    },
                },
            },
            {
                "width": 6,
                "height": 4,
                "xPos": 6,
                "yPos": 8,
                "widget": {
                    "title": "Startup Latency (Cold Starts)",
                    "xyChart": {
                        "dataSets": [
                            {
                                "timeSeriesQuery": {
                                    "timeSeriesFilter": {
                                        "filter": f'resource.type="cloud_run_revision" AND resource.labels.service_name="{SERVICE_NAME}" AND metric.type="run.googleapis.com/container/startup_latencies"',
                                        "aggregation": {
                                            "alignmentPeriod": "60s",
                                            "perSeriesAligner": "ALIGN_DELTA",
                                        },
                                    }
                                },
                                "plotType": "LINE",
                            }
                        ],
                        "yAxis": {"label": "Milliseconds", "scale": "LINEAR"},
                    },
                },
            },
            # Row 4: HTTP Status codes
            {
                "width": 12,
                "height": 4,
                "yPos": 12,
                "widget": {
                    "title": "HTTP Status Codes Distribution",
                    "xyChart": {
                        "dataSets": [
                            {
                                "timeSeriesQuery": {
                                    "timeSeriesFilter": {
                                        "filter": f'resource.type="cloud_run_revision" AND resource.labels.service_name="{SERVICE_NAME}" AND metric.type="run.googleapis.com/request_count" AND metric.labels.response_code_class="2xx"',
                                        "aggregation": {
                                            "alignmentPeriod": "60s",
                                            "perSeriesAligner": "ALIGN_RATE",
                                        },
                                    }
                                },
                                "plotType": "STACKED_AREA",
                                "legendTemplate": "2xx Success",
                            },
                            {
                                "timeSeriesQuery": {
                                    "timeSeriesFilter": {
                                        "filter": f'resource.type="cloud_run_revision" AND resource.labels.service_name="{SERVICE_NAME}" AND metric.type="run.googleapis.com/request_count" AND metric.labels.response_code_class="4xx"',
                                        "aggregation": {
                                            "alignmentPeriod": "60s",
                                            "perSeriesAligner": "ALIGN_RATE",
                                        },
                                    }
                                },
                                "plotType": "STACKED_AREA",
                                "legendTemplate": "4xx Client Error",
                            },
                            {
                                "timeSeriesQuery": {
                                    "timeSeriesFilter": {
                                        "filter": f'resource.type="cloud_run_revision" AND resource.labels.service_name="{SERVICE_NAME}" AND metric.type="run.googleapis.com/request_count" AND metric.labels.response_code_class="5xx"',
                                        "aggregation": {
                                            "alignmentPeriod": "60s",
                                            "perSeriesAligner": "ALIGN_RATE",
                                        },
                                    }
                                },
                                "plotType": "STACKED_AREA",
                                "legendTemplate": "5xx Server Error",
                            },
                        ],
                        "yAxis": {"label": "Requests/sec", "scale": "LINEAR"},
                    },
                },
            },
        ],
    },
}


def create_dashboard():
    """Create the monitoring dashboard"""
    print("🎨 Creating FGate dashboard...")

    # Get auth token
    try:
        token_process = subprocess.run(
            ["gcloud", "auth", "print-access-token"],
            capture_output=True,
            text=True,
            check=True,
        )
        token = token_process.stdout.strip()
    except Exception as e:
        print(f"❌ Error getting gcloud token: {e}")
        return None

    # URL
    url = f"https://monitoring.googleapis.com/v1/projects/{PROJECT_ID}/dashboards"

    # Headers
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # Use httpx if available, otherwise curl via subprocess safely
    try:
        import httpx

        with httpx.Client() as client:
            response = client.post(url, headers=headers, json=dashboard_config)
            if response.status_code == 200:
                data = response.json()
                dashboard_name = data.get("name", "")
                print("✅ Dashboard created successfully!")
                print("\n📊 View your dashboard:")
                print(
                    f"https://console.cloud.google.com/monitoring/dashboards/custom/{dashboard_name.split('/')[-1]}?project={PROJECT_ID}"
                )
                return data
            else:
                print(f"❌ Error creating dashboard (HTTP {response.status_code}):")
                print(response.text)
                return None
    except ImportError:
        # Fallback to safe subprocess curl
        import tempfile

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json") as tmp:
            json.dump(dashboard_config, tmp)
            tmp.flush()

            cmd = [
                "curl",
                "-s",
                "-X",
                "POST",
                "-H",
                f"Authorization: Bearer {token}",
                "-H",
                "Content-Type: application/json",
                "-d",
                f"@{tmp.name}",
                url,
            ]

            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                response = json.loads(result.stdout)
                dashboard_name = response.get("name", "")
                print("✅ Dashboard created successfully!")
                return response
            else:
                print(f"❌ Error: {result.stderr}")
                return None


if __name__ == "__main__":
    create_dashboard()
