#!/usr/bin/env python3
"""
Create TeleGate monitoring dashboard in Cloud Monitoring
"""
import json
import subprocess

PROJECT_ID = "full-techno-channels"
SERVICE_NAME = "membership-backend"

# Dashboard configuration
dashboard_config = {
    "displayName": "TeleGate - Production Dashboard",
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
                        "dataSets": [{
                            "timeSeriesQuery": {
                                "timeSeriesFilter": {
                                    "filter": f'resource.type="cloud_run_revision" AND resource.labels.service_name="{SERVICE_NAME}" AND metric.type="run.googleapis.com/request_count"',
                                    "aggregation": {
                                        "alignmentPeriod": "60s",
                                        "perSeriesAligner": "ALIGN_RATE"
                                    }
                                }
                            },
                            "plotType": "LINE"
                        }],
                        "yAxis": {"label": "Requests/sec", "scale": "LINEAR"}
                    }
                }
            },
            {
                "width": 4,
                "height": 4,
                "xPos": 4,
                "widget": {
                    "title": "Response Time (p95)",
                    "xyChart": {
                        "dataSets": [{
                            "timeSeriesQuery": {
                                "timeSeriesFilter": {
                                    "filter": f'resource.type="cloud_run_revision" AND resource.labels.service_name="{SERVICE_NAME}" AND metric.type="run.googleapis.com/request_latencies"',
                                    "aggregation": {
                                        "alignmentPeriod": "60s",
                                        "perSeriesAligner": "ALIGN_DELTA",
                                        "crossSeriesReducer": "REDUCE_PERCENTILE_95"
                                    }
                                }
                            },
                            "plotType": "LINE"
                        }],
                        "yAxis": {"label": "Milliseconds", "scale": "LINEAR"}
                    }
                }
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
                                            "perSeriesAligner": "ALIGN_RATE"
                                        }
                                    }
                                },
                                "plotType": "LINE"
                            }
                        ],
                        "yAxis": {"label": "Errors/sec", "scale": "LINEAR"}
                    }
                }
            },
            
            # Row 2: Resource utilization
            {
                "width": 6,
                "height": 4,
                "yPos": 4,
                "widget": {
                    "title": "CPU Utilization",
                    "xyChart": {
                        "dataSets": [{
                            "timeSeriesQuery": {
                                "timeSeriesFilter": {
                                    "filter": f'resource.type="cloud_run_revision" AND resource.labels.service_name="{SERVICE_NAME}" AND metric.type="run.googleapis.com/container/cpu/utilizations"',
                                    "aggregation": {
                                        "alignmentPeriod": "60s",
                                        "perSeriesAligner": "ALIGN_MEAN"
                                    }
                                }
                            },
                            "plotType": "LINE"
                        }],
                        "yAxis": {"label": "Utilization", "scale": "LINEAR"}
                    }
                }
            },
            {
                "width": 6,
                "height": 4,
                "xPos": 6,
                "yPos": 4,
                "widget": {
                    "title": "Memory Utilization",
                    "xyChart": {
                        "dataSets": [{
                            "timeSeriesQuery": {
                                "timeSeriesFilter": {
                                    "filter": f'resource.type="cloud_run_revision" AND resource.labels.service_name="{SERVICE_NAME}" AND metric.type="run.googleapis.com/container/memory/utilizations"',
                                    "aggregation": {
                                        "alignmentPeriod": "60s",
                                        "perSeriesAligner": "ALIGN_MEAN"
                                    }
                                }
                            },
                            "plotType": "LINE"
                        }],
                        "yAxis": {"label": "Utilization", "scale": "LINEAR"}
                    }
                }
            },
            
            # Row 3: Instance metrics
            {
                "width": 6,
                "height": 4,
                "yPos": 8,
                "widget": {
                    "title": "Container Instance Count",
                    "xyChart": {
                        "dataSets": [{
                            "timeSeriesQuery": {
                                "timeSeriesFilter": {
                                    "filter": f'resource.type="cloud_run_revision" AND resource.labels.service_name="{SERVICE_NAME}" AND metric.type="run.googleapis.com/container/instance_count"',
                                    "aggregation": {
                                        "alignmentPeriod": "60s",
                                        "perSeriesAligner": "ALIGN_MAX"
                                    }
                                }
                            },
                            "plotType": "LINE"
                        }],
                        "yAxis": {"label": "Instances", "scale": "LINEAR"}
                    }
                }
            },
            {
                "width": 6,
                "height": 4,
                "xPos": 6,
                "yPos": 8,
                "widget": {
                    "title": "Startup Latency (Cold Starts)",
                    "xyChart": {
                        "dataSets": [{
                            "timeSeriesQuery": {
                                "timeSeriesFilter": {
                                    "filter": f'resource.type="cloud_run_revision" AND resource.labels.service_name="{SERVICE_NAME}" AND metric.type="run.googleapis.com/container/startup_latencies"',
                                    "aggregation": {
                                        "alignmentPeriod": "60s",
                                        "perSeriesAligner": "ALIGN_DELTA"
                                    }
                                }
                            },
                            "plotType": "LINE"
                        }],
                        "yAxis": {"label": "Milliseconds", "scale": "LINEAR"}
                    }
                }
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
                                            "perSeriesAligner": "ALIGN_RATE"
                                        }
                                    }
                                },
                                "plotType": "STACKED_AREA",
                                "legendTemplate": "2xx Success"
                            },
                            {
                                "timeSeriesQuery": {
                                    "timeSeriesFilter": {
                                        "filter": f'resource.type="cloud_run_revision" AND resource.labels.service_name="{SERVICE_NAME}" AND metric.type="run.googleapis.com/request_count" AND metric.labels.response_code_class="4xx"',
                                        "aggregation": {
                                            "alignmentPeriod": "60s",
                                            "perSeriesAligner": "ALIGN_RATE"
                                        }
                                    }
                                },
                                "plotType": "STACKED_AREA",
                                "legendTemplate": "4xx Client Error"
                            },
                            {
                                "timeSeriesQuery": {
                                    "timeSeriesFilter": {
                                        "filter": f'resource.type="cloud_run_revision" AND resource.labels.service_name="{SERVICE_NAME}" AND metric.type="run.googleapis.com/request_count" AND metric.labels.response_code_class="5xx"',
                                        "aggregation": {
                                            "alignmentPeriod": "60s",
                                            "perSeriesAligner": "ALIGN_RATE"
                                        }
                                    }
                                },
                                "plotType": "STACKED_AREA",
                                "legendTemplate": "5xx Server Error"
                            }
                        ],
                        "yAxis": {"label": "Requests/sec", "scale": "LINEAR"}
                    }
                }
            }
        ]
    }
}

def create_dashboard():
    """Create the monitoring dashboard"""
    # Save config to file
    with open('/tmp/dashboard_config.json', 'w') as f:
        json.dump(dashboard_config, f, indent=2)
    
    # Create dashboard via API
    cmd = f"""
    curl -X POST \
      -H "Authorization: Bearer $(gcloud auth print-access-token)" \
      -H "Content-Type: application/json" \
      -d @/tmp/dashboard_config.json \
      "https://monitoring.googleapis.com/v1/projects/{PROJECT_ID}/dashboards"
    """
    
    print(f"🎨 Creating TeleGate dashboard...")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    
    if result.returncode == 0:
        response = json.loads(result.stdout)
        dashboard_name = response.get('name', '')
        print(f"✅ Dashboard created successfully!")
        print(f"\n📊 View your dashboard:")
        print(f"https://console.cloud.google.com/monitoring/dashboards/custom/{dashboard_name.split('/')[-1]}?project={PROJECT_ID}")
        return response
    else:
        print(f"❌ Error creating dashboard:")
        print(result.stderr)
        return None

if __name__ == "__main__":
    create_dashboard()
