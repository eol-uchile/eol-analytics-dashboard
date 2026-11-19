import setuptools

setuptools.setup(
    name="eol_analytics_dashboard",
    version="0.1.0",
    author="Oficina EOL UChile",
    author_email="eol-ing@uchile.cl",
    description="Eol Analytics Dashboard",
    long_description="Eol Analytics Dashboard",
    url="https://eol.uchile.cl",
    packages=setuptools.find_packages(),
    include_package_data=True,
    package_data={
        "eol_analytics_dashboard": [
            "templates/eol_analytics_dashboard/*.html",
            "static/eol_analytics_dashboard/css/*.css",
            "static/eol_analytics_dashboard/js/*.js",
        ],
    },
    classifiers=[
        "Programming Language :: Python :: 2",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    entry_points={
        "lms.djangoapp": [
            "eol_analytics_dashboard = eol_analytics_dashboard.apps:EolDashboardAnalyticsConfig",
        ],
        "cms.djangoapp": [
            "eol_analytics_dashboard = eol_analytics_dashboard.apps:EolDashboardAnalyticsConfig",
        ],
        "openedx.course_tab": [
            "eol_analytics_dashboard = eol_analytics_dashboard.plugins:EolDashboardAnalyticsTab",
        ],
        
    },
)
