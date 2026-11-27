/*
 * analytics_dashboard.js
 *
 * Controls the dashboard tabs. When a tab is activated:
 *   1. it loads the tab script (js/tabs/<key>.js) the first time,
 *   2. it leaves the charts in the "loading" state (preview "Cargando..."),
 *   3. it asks the tab endpoint for the data (data-endpoint of the panel),
 *   4. it draws each chart, or leaves it in "empty" / "error" if there is no data or it failed.
 *
 * Each tab script registers itself with EOLDashboard.registerTab(key, { load }).
 */
(function (window, document) {
    'use strict';

    var root = document.getElementById('eol-dashboard');
    if (!root) { return; }

    var buttons = Array.prototype.slice.call(root.querySelectorAll('.eol-tab-btn'));
    var definitions = {};   // tabs registered by their scripts
    var scripts = {};       // script loading promises, by URL
    var inFlight = {};      // data loads in progress, by tab
    var loaded = {};        // tabs that already showed data

    /* ---------- utilities ---------- */

    function panelOf(key) {
        return document.getElementById('tabpanel-' + key);
    }

    function loadScript(src) {
        if (!src) { return Promise.resolve(); }
        if (!scripts[src]) {
            scripts[src] = new Promise(function (resolve, reject) {
                var el = document.createElement('script');
                el.src = src;
                el.async = true;
                el.onload = resolve;
                el.onerror = function () {
                    delete scripts[src];
                    reject(new Error('Could not load ' + src));
                };
                document.head.appendChild(el);
            });
        }
        return scripts[src];
    }

    // Resolves null when there is no data yet (no endpoint, HTTP 204 or 404).
    function fetchData(url) {
        if (!url) { return Promise.resolve(null); }
        return fetch(url, {
            credentials: 'same-origin',
            headers: { 'Accept': 'application/json' }
        }).then(function (response) {
            if (response.status === 204 || response.status === 404) { return null; }
            if (!response.ok) { throw new Error('HTTP ' + response.status); }
            return response.json();
        });
    }

    function hasContent(value) {
        if (value === null || value === undefined) { return false; }
        if (Array.isArray(value)) { return value.length > 0; }
        if (typeof value === 'object') { return Object.keys(value).length > 0; }
        return true;
    }

    function setWrapperState(wrapper, state) {
        if (!wrapper) { return; }
        wrapper.setAttribute('data-state', state);
        wrapper.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false');
    }

    function setChartState(panel, chart, state) {
        setWrapperState(panel.querySelector('#' + chart.wrapperId), state);
    }

    function markPanelError(panel) {
        Array.prototype.forEach.call(panel.querySelectorAll('.chart-scroll-wrap'), function (wrapper) {
            setWrapperState(wrapper, 'error');
        });
    }

    // Only to check the connection while the real chart does not exist yet.
    function renderPlaceholder(container, data) {
        if (!container) { return; }
        var size = Array.isArray(data) ? data.length : Object.keys(data).length;
        container.textContent = 'Data received (' + size + ').';
    }

    /*
     * Creates the load() function of a tab.
     * charts: [{ key, wrapperId, containerId, render(container, data) }]
     * `key` is the key under which the endpoint delivers the data of that chart.
     * Returns a promise that resolves true if at least one chart received data.
     */
    function createTabLoader(charts) {
        return function (panel, endpoint) {
            charts.forEach(function (chart) { setChartState(panel, chart, 'loading'); });

            return fetchData(endpoint).then(function (data) {
                var anyData = false;
                charts.forEach(function (chart) {
                    var chartData = data ? data[chart.key] : null;
                    if (!hasContent(chartData)) {
                        setChartState(panel, chart, 'empty');
                        return;
                    }
                    try {
                        (chart.render || renderPlaceholder)(panel.querySelector('#' + chart.containerId), chartData);
                        setChartState(panel, chart, 'ready');
                        anyData = true;
                    } catch (error) {
                        console.error('[EOLDashboard] Error drawing "' + chart.key + '"', error);
                        setChartState(panel, chart, 'error');
                    }
                });
                return anyData;
            }).catch(function (error) {
                console.error('[EOLDashboard] Error loading the data', error);
                charts.forEach(function (chart) { setChartState(panel, chart, 'error'); });
                return false;
            });
        };
    }

    /* ---------- tab loading ---------- */

    function ensureTabLoaded(key, force) {
        if (loaded[key] && !force) { return Promise.resolve(); }
        if (inFlight[key]) { return inFlight[key]; }

        var button = document.getElementById('tab-' + key);
        var panel = panelOf(key);

        inFlight[key] = loadScript(button.getAttribute('data-script'))
            .then(function () {
                var definition = definitions[key];
                if (!definition) { throw new Error('The tab "' + key + '" was not registered.'); }
                return definition.load(panel, panel.getAttribute('data-endpoint'));
            })
            .then(function (hasData) {
                // If there is no data yet, it is tried again the next time the tab is opened.
                loaded[key] = hasData === true;
            })
            .catch(function (error) {
                console.error('[EOLDashboard]', error);
                markPanelError(panel);
            })
            .then(function () {
                delete inFlight[key];
            });

        return inFlight[key];
    }

    /* ---------- tab switching ---------- */

    function showTab(key, options) {
        options = options || {};

        buttons.forEach(function (button) {
            var tabKey = button.getAttribute('data-tab');
            var active = tabKey === key;
            button.classList.toggle('active', active);
            button.setAttribute('aria-selected', active ? 'true' : 'false');
            button.setAttribute('tabindex', active ? '0' : '-1');
            panelOf(tabKey).hidden = !active;
        });

        if (options.updateHash !== false && window.history && window.history.replaceState) {
            window.history.replaceState(null, '', '#' + key);
        }

        return ensureTabLoaded(key, options.force);
    }

    /* ---------- events ---------- */

    root.addEventListener('click', function (event) {
        var tab = event.target.closest('.eol-tab-btn');
        if (tab) {
            showTab(tab.getAttribute('data-tab'));
            return;
        }
        var retry = event.target.closest('.chart-retry');
        if (retry) {
            var panel = retry.closest('.eol-tab-panel');
            showTab(panel.getAttribute('data-tab'), { force: true });
        }
    });

    root.addEventListener('keydown', function (event) {
        var current = event.target.closest('.eol-tab-btn');
        if (!current) { return; }

        var index = buttons.indexOf(current);
        var next = null;
        if (event.key === 'ArrowRight') { next = buttons[(index + 1) % buttons.length]; }
        else if (event.key === 'ArrowLeft') { next = buttons[(index - 1 + buttons.length) % buttons.length]; }
        else if (event.key === 'Home') { next = buttons[0]; }
        else if (event.key === 'End') { next = buttons[buttons.length - 1]; }

        if (next) {
            event.preventDefault();
            next.focus();
            showTab(next.getAttribute('data-tab'));
        }
    });

    /* ---------- API for the tab scripts ---------- */

    /*
     * Shared box plot loader, for any tab that shows a box plot by week.
     * It reads its data from the tab's config block (a <script type="application/json"> whose id is
     * options.configId) and draws the chart with EOLBoxPlot. No request is made from the browser.
     *
     *   options.configId    id of the JSON config block of the tab
     *   options.chartId     chart id used by _chart_body.html (e.g. 'tiempo-acumulado')
     *   options.configKey   key of the config block that holds the chart data ({ "weeks": [...] })
     *   options.yLabel      function returning the translated y axis title
     *
     * The config block must also carry the script URLs as attributes: data-d3-src,
     * data-chart-data-src and data-box-plot-src. Resolves true when the chart was drawn.
     */
    function loadBoxPlotChart(panel, options) {
        var node = document.getElementById(options.configId);
        var config = {};
        var wrapper = panel.querySelector('#' + options.chartId + '-chart-wrapper');
        var container = panel.querySelector('#' + options.chartId + '-chart');

        function ensure(src, isReady) {
            return isReady() ? Promise.resolve() : loadScript(src);
        }

        setWrapperState(wrapper, 'loading');

        try {
            config = node ? (JSON.parse(node.textContent) || {}) : {};
        } catch (error) {
            console.error('[EOLDashboard] Invalid config block "' + options.configId + '"', error);
        }

        return Promise.all([
            ensure(node && node.getAttribute('data-d3-src'), function () { return !!window.d3; }),
            ensure(node && node.getAttribute('data-chart-data-src'), function () { return !!window.EOLChartData; }),
            ensure(node && node.getAttribute('data-box-plot-src'), function () { return !!window.EOLBoxPlot; })
        ]).then(function () {
            return window.EOLChartData.load({ useApi: false, cumulativeTimeData: config[options.configKey] });
        }).then(function (data) {
            var items = window.EOLChartData.getCourseWeeks(data, config.courseId);
            if (!items.length) {
                setWrapperState(wrapper, 'empty');
                return false;
            }

            // Mark it ready before drawing, so the container is visible and has a width.
            setWrapperState(wrapper, 'ready');
            window.EOLBoxPlot.render(window.d3, container, items, { yLabel: options.yLabel() });
            return true;
        }).catch(function (error) {
            console.error('[EOLDashboard] Could not show "' + options.chartId + '"', error);
            setWrapperState(wrapper, 'error');
            return false;
        });
    }

    window.EOLDashboard = {
        registerTab: function (key, definition) { definitions[key] = definition; },
        createTabLoader: createTabLoader,
        renderPlaceholder: renderPlaceholder,
        loadBoxPlotChart: loadBoxPlotChart,
        showTab: showTab
    };

    /* ---------- start ---------- */

    var requested = window.location.hash.replace('#', '');
    var isValid = buttons.some(function (button) {
        return button.getAttribute('data-tab') === requested;
    });
    showTab(isValid ? requested : buttons[0].getAttribute('data-tab'), { updateHash: isValid });

})(window, document);
