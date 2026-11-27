/*
 * chart_data_source.js
 *
 * Data layer shared by the charts. It knows where the data comes from (API or local values)
 * and how to pick a course out of it. It knows nothing about D3 or about how a chart is drawn.
 *
 * Supported data formats (each week has the same shape in both):
 *   API (one course):   { "weeks": [ WEEK, ... ] }
 *   Local (example_api.json, several courses; the course is picked by course_id):
 *                       { "courses": [ { "course_id": "...", "weeks": [ WEEK, ... ] } ] }
 *   WEEK = { "week_start_date": "03-08-2026", "week_number": 1,
 *            "chart_data": [ { "minimum", "first_quartile", "median", "third_quartile", "maximum" } ] }
 *
 */
(function (root) {
    'use strict';

    /**
     * Loads the raw data from the API or from the local values.
     * Resolves null when there is nothing to show yet (no URL, HTTP 204 or 404).
     */
    function load(options) {
        options = options || {};

        if (!options.useApi) {
            var local = options.cumulativeTimeData;
            if (typeof local === 'string') { local = JSON.parse(local); }
            return Promise.resolve(local || null);
        }

        if (!options.apiUrl) { return Promise.resolve(null); }

        return fetch(options.apiUrl, {
            credentials: 'same-origin',
            headers: { 'Accept': 'application/json' }
        }).then(function (response) {
            if (response.status === 204 || response.status === 404) { return null; }
            if (!response.ok) { throw new Error('HTTP ' + response.status); }
            return response.json();
        });
    }

    /**
     * Returns the list of raw weeks for a course, accepting the two supported shapes:
     *   - API (one course):  { "weeks": [ ... ] }  -> used as is, courseId is not needed
     *   - Local (many):      { "courses": [ { "course_id", "weeks": [ ... ] } ] }
     *                        -> the course is picked by courseId
     */
    function pickWeeks(data, courseId) {
        if (!data) { return []; }

        if (Array.isArray(data.weeks)) { return data.weeks; }

        if (Array.isArray(data.courses)) {
            var course = data.courses.filter(function (item) {
                return item.course_id === courseId;
            })[0];
            return course && Array.isArray(course.weeks) ? course.weeks : [];
        }

        return [];
    }

    /**
     * Picks the weeks of one course and converts them to the generic box plot item format:
     *   { label, order, minimum, firstQuartile, median, thirdQuartile, maximum }
     * Returns an empty array when the course is not found. The values are used as they come.
     */
    function getCourseWeeks(data, courseId) {
        return pickWeeks(data, courseId).map(function (week, index) {
            var stats = Array.isArray(week.chart_data) ? week.chart_data[0] : week.chart_data;
            // Field names: current API uses week_start_date / week_number,
            // the older format used week / order. Both are accepted.
            var label = week.week_start_date !== undefined ? week.week_start_date : week.week;
            var order = Number(week.week_number !== undefined ? week.week_number : week.order);
            return {
                label: label,
                order: isFinite(order) ? order : index,
                minimum: Number(stats.minimum),
                firstQuartile: Number(stats.first_quartile),
                median: Number(stats.median),
                thirdQuartile: Number(stats.third_quartile),
                maximum: Number(stats.maximum)
            };
        }).sort(function (a, b) {
            return a.order - b.order;
        });
    }

    /* ---------- UI state of a chart (works with _chart_body.html) ---------- */

    function wrapperOf(container) {
        return container && container.closest ? container.closest('.chart-scroll-wrap') : null;
    }

    function setState(container, state) {
        var wrapper = wrapperOf(container);
        if (!wrapper) { return; }
        wrapper.setAttribute('data-state', state);
        wrapper.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false');
    }

    function setRetryHandler(container, handler) {
        var wrapper = wrapperOf(container);
        var button = wrapper && wrapper.querySelector('.chart-retry');
        if (button) { button.onclick = handler; }
    }

    root.EOLChartData = {
        load: load,
        getCourseWeeks: getCourseWeeks,
        setState: setState,
        setRetryHandler: setRetryHandler
    };
})(typeof window !== 'undefined' ? window : globalThis);
