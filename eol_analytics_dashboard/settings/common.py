""" Common settings for eol_analytics_dashboard."""

def plugin_settings(settings):
    # HTTP request timeout (seconds)
    settings.eol_analytics_dashboard_REQUEST_TIMEOUT = 15
    # API service URL for eol_analytics
    settings.EOL_ANALYTICS_API_URL = ''
    # Token to access the eol_analytics API service
    settings.EOL_ANALYTICS_API_TOKEN = ''
    # Use local or API info
    settings.USE_API = True
