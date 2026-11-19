# -*- coding: utf-8 -*-

# Python Standard Libraries
import logging

# Installed packages (via pip)
from django.apps import AppConfig

# Edx dependencies
from openedx.core.djangoapps.plugins.constants import PluginSettings, PluginURLs, ProjectType, SettingsType

logger = logging.getLogger(__name__)

class EolDashboardAnalyticsConfig(AppConfig):
    name = 'eol_analytics_dashboard'

    plugin_app = {
        PluginURLs.CONFIG: {
            ProjectType.LMS: {
                PluginURLs.NAMESPACE: '',
                PluginURLs.REGEX: r'^',
                PluginURLs.RELATIVE_PATH: 'urls',
            }},
        PluginSettings.CONFIG: {
            ProjectType.CMS: {
                SettingsType.COMMON: {
                    PluginSettings.RELATIVE_PATH: 'settings.common'},
            },
            ProjectType.LMS: {
                SettingsType.COMMON: {
                    PluginSettings.RELATIVE_PATH: 'settings.common'},
            },
        },
        'mako_template_dirs': {
            ProjectType.LMS: 'templates',
            ProjectType.CMS: 'templates',
        }
    }

