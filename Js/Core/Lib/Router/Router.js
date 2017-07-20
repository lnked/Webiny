import _ from 'lodash';
import $ from 'jquery';
import Webiny from 'Webiny';
import RouterEvent from './RouterEvent';
import Utils from './RouterUtils';
import Dispatcher from './../Core/Dispatcher';
import 'jquery-deparam';
import {createBrowserHistory} from 'history';

/**
 * ROUTER
 * Router class is responsible for HTML5 URLs and serving view components
 */
class Router {

    constructor() {
        this.baseUrl = null;
        this.appUrl = '';
        this.history = createBrowserHistory();
        this.routes = [];
        this.defaultComponents = {};
        this.layouts = {};
        this.defaultRoute = null; // If router didn't match anything, it will reroute here
        this.titlePattern = '%s';
        this.activeRoute = null;
        this.beforeStart = [];
        this.routeWillChange = [];
        this.routeChanged = [];
        this.routeNotMatched = [];
        this.started = false;

        Utils.setHistory(this.history);
    }

    setHistory(history) {
        if (history) {
            this.history = history;
            Utils.setHistory(this.history);
        }

        return this;
    }

    start() {
        if (!this.baseUrl) {
            return Promise.resolve();
        }

        if (!this.started) {
            this.started = true;
            const $this = this;
            $(document).on('click', 'a', function handleClick(e) {
                $this.handleAnchorClick(this, e);
            });

            this.history.listen(location => {
                this.activeRoute = null;
                let url = location.pathname;
                url = url.replace(this.appUrl, '');
                if (url === '') {
                    url = '/';
                }

                if (!url.startsWith(this.baseUrl)) {
                    return Utils.handleRouteNotMatched(url, this.routeNotMatched);
                }
                const matched = Utils.matchRoute(this, url);
                if (!matched) {
                    return Utils.handleRouteNotMatched(url, this.routeNotMatched);
                }

                this.activeRoute = matched;
                if (_.has(this.history, 'location.state.title')) {
                    this.activeRoute.setTitle(_.get(this.history, 'location.state.title'));
                }

                Utils.routeWillChange(matched, this.routeWillChange).then(routerEvent => {
                    if (!routerEvent.isStopped()) {
                        Utils.renderRoute(matched).then(route => {
                            Dispatcher.dispatch('RouteChanged', new RouterEvent(route));
                        });
                    }
                }).catch(Utils.exceptionHandler);
            });

            // Listen for "RouteChanged" event and process callbacks
            Dispatcher.on('RouteChanged', (event) => {
                if (_.isNumber(_.get(this.history, 'location.state.scrollY'))) {
                    window.scrollTo(0, this.history.location.state.scrollY);
                }
                let chain = Promise.resolve(event);
                this.routeChanged.forEach(callback => {
                    chain = chain.then(() => {
                        return callback(event);
                    }).catch(Utils.exceptionHandler);
                });
                return chain;
            });
        }

        const url = this.history.location.pathname;
        const matchedRoute = Utils.matchRoute(this, url);
        this.activeRoute = matchedRoute;

        /**
         * Execute beforeStart callbacks in a chain and see if start is prevented
         */
        const routerEvent = new RouterEvent(matchedRoute, true);
        let beforeStartChain = Promise.resolve(routerEvent);
        this.beforeStart.forEach(callback => {
            beforeStartChain = beforeStartChain.then(() => {
                return callback(routerEvent);
            }).catch(Utils.exceptionHandler);
        });

        beforeStartChain = beforeStartChain.then(event => {
            if (!event.isStopped() || event.goTo === null) {
                if (!matchedRoute) {
                    return Utils.handleRouteNotMatched(url, this.routeNotMatched);
                }
                Utils.renderRoute(event.route).then(route => {
                    Dispatcher.dispatch('RouteChanged', new RouterEvent(route, true));
                });
            } else {
                if (event.goTo !== null) {
                    this.goToRoute(event.goTo, event.goToParams);
                }
            }
        });

        return beforeStartChain;
    }

    onBeforeStart(callback) {
        const itemIndex = this.beforeStart.push(callback) - 1;
        const _this = this;

        return function off() {
            _this.beforeStart.splice(itemIndex);
        };
    }

    onRouteWillChange(callback) {
        const itemIndex = this.routeWillChange.push(callback) - 1;
        const _this = this;

        return function off() {
            _this.routeWillChange.splice(itemIndex);
        };
    }

    onRouteChanged(callback) {
        const itemIndex = this.routeChanged.push(callback) - 1;
        const _this = this;

        return function off() {
            _this.routeChanged.splice(itemIndex);
        };
    }

    onRouteNotMatched(callback) {
        const itemIndex = this.routeNotMatched.push(callback) - 1;
        const _this = this;

        return function off() {
            _this.routeNotMatched.splice(itemIndex);
        };
    }

    addLayout(name, component) {
        this.layouts[name] = component;
        return this;
    }

    getLayout(name) {
        if (!_.has(this.layouts, name)) {
            console.warn('Layout "' + name + '" not found in Webiny.Router! Make sure you have registered your layout before using it.');
        }
        return this.layouts[name] || null;
    }

    setDefaultComponents(components) {
        _.assign(this.defaultComponents, components);
        return this;
    }

    getDefaultComponents() {
        return this.defaultComponents;
    }

    addRoute(route) {
        const index = _.findIndex(this.routes, {name: route.name});
        if (index > -1) {
            this.routes[index] = route;
        } else {
            this.routes.push(route);
        }
        return this;
    }

    deleteRoute(name) {
        const index = _.findIndex(this.routes, {name});
        if (index > -1) {
            this.routes.splice(index, 1);
        }
        return this;
    }

    routeExists(name) {
        return !!_.find(this.routes, {name});
    }

    getRoute(name) {
        const route = _.find(this.routes, {name});
        if (!route) {
            return false;
        }
        return route;
    }

    getRouteByPattern(pattern) {
        const route = _.find(this.routes, {pattern});
        if (!route) {
            return false;
        }
        return route;
    }

    getParams(param) {
        return this.activeRoute.getParams(param);
    }

    getQueryParams(param) {
        return this.activeRoute.getQueryParams(param);
    }

    setQueryParams(params) {
        this.goToRoute('current', params);
    }

    getHref(params = {}) {
        return this.getActiveRoute().getHref(params);
    }

    goToRoute(route, params = {}, options = {}) {
        if (_.isString(route)) {
            route = route !== 'current' ? _.find(this.routes, {name: route}) : this.activeRoute;
        }

        if (!route) {
            return null;
        }

        if (route === this.activeRoute && _.isEqual(params, this.activeRoute.getParams())) {
            console.warn('Route will not change!');
            return null;
        }
        return this.goToUrl(route.getHref(params, null), false, options);
    }

    goToUrl(url, replace = false, options = {}) {
        // Strip app URL if present
        url = url.replace(this.appUrl, '');
        if (url.indexOf(this.baseUrl) !== 0) {
            url = this.baseUrl + url;
        }

        const state = {
            url,
            replace,
            scrollY: options.preventScroll ? window.scrollY : false,
            title: options.title,
            prevTitle: window.document.title
        };

        if (replace) {
            this.history.replace(url, state);
        } else {
            this.history.push(url, state);
        }
        return url;
    }

    goBack() {
        return this.history.goBack();
    }

    getActiveRoute() {
        return this.activeRoute;
    }

    setBaseUrl(url) {
        if (!this.baseUrl) {
            this.baseUrl = url;
            this.appUrl = window.location.origin + this.baseUrl;
        }
        Utils.setBaseUrl(this.baseUrl);
        return this;
    }

    setTitle(title) {
        Webiny.Page.setTitle(this.getTitlePattern().replace('%s', title));
    }

    setTitlePattern(pattern) {
        this.titlePattern = pattern;
        return this;
    }

    getTitlePattern() {
        return this.titlePattern;
    }

    /**
     * Route name
     * @param route
     * @returns {Router}
     */
    setDefaultRoute(route) {
        this.defaultRoute = route;
        return this;
    }

    getDefaultRoute() {
        return _.isString(this.defaultRoute) ? this.getRoute(this.defaultRoute) : this.defaultRoute;
    }

    getBaseUrl() {
        return this.baseUrl;
    }

    // TODO: make this function configurable (overridable)
    handleAnchorClick(a, e) {
        let url = a.href;

        // _blank links should not be intercepted
        if (a.target === '_blank') {
            return;
        }

        // Prevent scrolling to top when clicking on '#' link
        if (_.endsWith(url, '#')) {
            e.preventDefault();
            return;
        }

        // Check if it's an anchor link
        if (url.indexOf('#') > -1) {
            return;
        }

        // Push state and let the Router process the rest
        if (url.startsWith(webinyWebPath) || url.startsWith('file://')) {
            e.preventDefault();
            url = url.replace(webinyWebPath, '').replace('file://', '');
            this.history.push(url, {
                title: a.getAttribute('data-document-title') || null,
                prevTitle: window.document.title,
                scrollY: a.getAttribute('data-prevent-scroll') === 'true' ? window.scrollY : false
            });
        }
    }

    sortersToString(sorters) {
        const sort = [];
        _.each(sorters, (value, field) => {
            if (value === 1) {
                sort.push(field);
            } else {
                sort.push('-' + field);
            }
        });
        return sort.length ? sort.join(',') : null;
    }
}

export default new Router;
