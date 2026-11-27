/*
 * Tab "Monitoreo general".
 *
 * Both charts are box plots by week and use the shared loader EOLDashboard.loadBoxPlotChart
 * (see analytics_dashboard.js). Their data comes from the view, through the JSON block
 * #general_monitoring_config rendered by general_monitoring.html:
 *   - completitud_acumulada -> key "cumulativeCompletionData"
 *   - tiempo_acumulado      -> key "cumulativeTimeData"
 * The scripts of the box plot (D3, chart_data_source.js, box_plot_chart.js) are loaded the first
 * time this tab is opened.
 */
(function (window) {
    'use strict';

    var dashboard = window.EOLDashboard;
    if (!dashboard) { return; }

    var CONFIG_ID = 'general_monitoring_config';

    // Resolved at call time so the translation catalog can be loaded after this file.
    function gettext(msgid) {
        return typeof window.gettext === 'function' ? window.gettext(msgid) : msgid;
    }

    dashboard.registerTab('general_monitoring', {
        // The retry button of the dashboard calls this function again for the whole tab.
        load: function (panel) {
            return Promise.all([
                dashboard.loadBoxPlotChart(panel, {
                    configId: CONFIG_ID,
                    chartId: 'completitud-acumulada',
                    configKey: 'cumulativeCompletionData',
                    yLabel: function () { return gettext('Completitud acumulada'); }
                }),
                dashboard.loadBoxPlotChart(panel, {
                    configId: CONFIG_ID,
                    chartId: 'tiempo-acumulado',
                    configKey: 'cumulativeTimeData',
                    yLabel: function () { return gettext('Horas de conexión acumuladas'); }
                })
            ]).then(function (results) {
                return results.some(Boolean);
            });
        }
    });
})(window);
