import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_APP_CONTEXT,
  buildAppUrl,
  detectBasePath,
  normalizeAppContext,
  parseAppLocation,
} from './navigation.js';

function scrollContainer() {
  return document.getElementById('app-scroll-container');
}

function currentScrollTop() {
  return scrollContainer()?.scrollTop || 0;
}

function initialRoute(configuredBasePath) {
  const configured = configuredBasePath && configuredBasePath !== './'
    ? configuredBasePath
    : undefined;
  const parsed = parseAppLocation(window.location.pathname, window.location.search, configured);
  return {
    ...parsed,
    basePath: configured == null ? detectBasePath(window.location.pathname) : parsed.basePath,
    scrollTop: Number(window.history.state?.operRadarScrollTop || 0),
  };
}

export function useBrowserRoute(configuredBasePath = './') {
  const initialRef = useRef(null);
  if (!initialRef.current) initialRef.current = initialRoute(configuredBasePath);
  const basePathRef = useRef(initialRef.current.basePath);
  const [route, setRoute] = useState(initialRef.current);
  const routeRef = useRef(initialRef.current);
  routeRef.current = route;

  const saveCurrentScroll = useCallback(() => {
    const previous = window.history.state || {};
    window.history.replaceState(
      { ...previous, operRadar: true, operRadarScrollTop: currentScrollTop() },
      '',
      window.location.href,
    );
  }, []);

  const commit = useCallback((page, nextContext, options = {}) => {
    const context = normalizeAppContext(nextContext || DEFAULT_APP_CONTEXT);
    const replace = Boolean(options.replace);
    const preserveScroll = Boolean(options.preserveScroll);
    saveCurrentScroll();

    const previousState = window.history.state || {};
    const previousEntry = Number(previousState.operRadarEntry || 0);
    const nextEntry = replace ? previousEntry : previousEntry + 1;
    const nextScrollTop = preserveScroll ? currentScrollTop() : 0;
    const state = {
      ...previousState,
      operRadar: true,
      operRadarEntry: nextEntry,
      operRadarScrollTop: nextScrollTop,
    };
    const url = buildAppUrl(page, context, basePathRef.current);
    window.history[replace ? 'replaceState' : 'pushState'](state, '', url);
    const parsed = parseAppLocation(window.location.pathname, window.location.search, basePathRef.current);
    setRoute({ ...parsed, scrollTop: nextScrollTop });
  }, [saveCurrentScroll]);

  const navigate = useCallback((page, options = {}) => {
    commit(page, options.context || routeRef.current.context, options);
  }, [commit]);

  const updateContext = useCallback((patch, options = {}) => {
    commit(routeRef.current.page, { ...routeRef.current.context, ...patch }, {
      replace: options.replace !== false,
      preserveScroll: options.preserveScroll !== false,
    });
  }, [commit]);

  const goBack = useCallback(() => {
    saveCurrentScroll();
    const entry = Number(window.history.state?.operRadarEntry || 0);
    if (entry > 0) window.history.back();
    else commit('hoje', routeRef.current.context, { replace: true });
  }, [commit, saveCurrentScroll]);

  useEffect(() => {
    const previous = window.history.state || {};
    window.history.replaceState({
      ...previous,
      operRadar: true,
      operRadarEntry: Number(previous.operRadarEntry || 0),
      operRadarScrollTop: Number(previous.operRadarScrollTop || 0),
    }, '', window.location.href);

    const onPopState = event => {
      const parsed = parseAppLocation(window.location.pathname, window.location.search, basePathRef.current);
      setRoute({ ...parsed, scrollTop: Number(event.state?.operRadarScrollTop || 0) });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      scrollContainer()?.scrollTo({ top: route.scrollTop || 0 });
      document.title = route.page === 'hoje' ? 'OPER RADAR' : `${route.title} · OPER RADAR`;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [route.page, route.scrollTop, route.title]);

  return { ...route, navigate, updateContext, goBack };
}
