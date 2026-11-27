# Python Standard Libraries
import os
import json
import logging
import requests
import six
from urllib.parse import quote

# Installed packages (via pip)
from django.conf import settings

logger = logging.getLogger(__name__)

# ==========================================
# Path API
# ==========================================
def get_api_headers():
    api_token = getattr(settings, "EOL_ANALYTICS_API_TOKEN", "")
    return {"accept": "application/json", "X-API-KEY": api_token}

def get_base_url():
    return getattr(settings, "EOL_ANALYTICS_API_URL", "").rstrip("/")

def check_api_availability():
    url = get_base_url() + "/"
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        logger.warning("Successful connection to the API: %s", response.json())
        return True
    except Exception as e:
        logger.exception("Connection to the API failed: %s", str(e))
        return False

def get_api_cumulative_completion(course_id):
    url = "{}/metrics/overview/completion/{}/".format(get_base_url(), quote(six.text_type(course_id), safe=""))
    try:
        response = requests.get(url, headers=get_api_headers(), timeout=15)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.exception("ERROR API (cumulative completion): %s", str(e))
        return {}

def get_api_cumulative_time(course_id):
    url = "{}/metrics/overview/time/{}/".format(get_base_url(), quote(six.text_type(course_id), safe=""))
    try:
        response = requests.get(url, headers=get_api_headers(), timeout=15)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.exception("ERROR API (cumulative time): %s", str(e))
        return {}

# TODO: ADD REAL ENDPOINT 
def get_api_weekly_dedication(course_id):
    url = "{}/metrics/overview/time/{}/".format(get_base_url(), quote(six.text_type(course_id), safe=""))
    try:
        response = requests.get(url, headers=get_api_headers(), timeout=15)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.exception("ERROR API (cumulative time): %s", str(e))
        return {}

def get_api_section_dedication(course_id):
    url = "{}/metrics/overview/time/{}/".format(get_base_url(), quote(six.text_type(course_id), safe=""))
    try:
        response = requests.get(url, headers=get_api_headers(), timeout=15)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.exception("ERROR API (cumulative time): %s", str(e))
        return {}






# ==========================================
# JSON local
# ==========================================


def get_local_metrics_data():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    metrics_path = os.path.join(current_dir, 'data', 'dashboard_data.json')
    
    if not os.path.exists(metrics_path):
        return []

    with open(metrics_path, 'r', encoding='utf-8') as f:
        return json.load(f)
