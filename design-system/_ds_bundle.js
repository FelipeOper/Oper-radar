/* @ds-bundle: {"format":4,"namespace":"OperRadarDesignSystem_f1ea51","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"LiveIndicator","sourcePath":"components/core/LiveIndicator.jsx"},{"name":"Logo","sourcePath":"components/core/Logo.jsx"},{"name":"SectionTag","sourcePath":"components/core/SectionTag.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"AreaChart","sourcePath":"components/data/AreaChart.jsx"},{"name":"BarChart","sourcePath":"components/data/BarChart.jsx"},{"name":"Card","sourcePath":"components/data/Card.jsx"},{"name":"DataTable","sourcePath":"components/data/DataTable.jsx"},{"name":"ListRow","sourcePath":"components/data/ListRow.jsx"},{"name":"ProgressBar","sourcePath":"components/data/ProgressBar.jsx"},{"name":"Sparkline","sourcePath":"components/data/Sparkline.jsx"},{"name":"StatCard","sourcePath":"components/data/StatCard.jsx"},{"name":"Alert","sourcePath":"components/feedback/Alert.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"BottomNav","sourcePath":"components/navigation/BottomNav.jsx"},{"name":"Pagination","sourcePath":"components/navigation/Pagination.jsx"},{"name":"NavItem","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"Sidebar","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"Topbar","sourcePath":"components/navigation/Topbar.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"54b0a5685ef0","components/core/Badge.jsx":"bce5215bfd68","components/core/Button.jsx":"48f3981cb0cf","components/core/Icon.jsx":"dcc2c7933a9d","components/core/IconButton.jsx":"d9a58e706f3c","components/core/LiveIndicator.jsx":"294761df4c5c","components/core/Logo.jsx":"aba55ffb5bc9","components/core/SectionTag.jsx":"0b82068d40bf","components/core/Tag.jsx":"65ce7922e732","components/data/AreaChart.jsx":"6925c654cea4","components/data/BarChart.jsx":"ec569f544d81","components/data/Card.jsx":"fff2b63b71c2","components/data/DataTable.jsx":"e61e77d3fae9","components/data/ListRow.jsx":"372792dee3fa","components/data/ProgressBar.jsx":"6ac5505c5a25","components/data/Sparkline.jsx":"3573ddef3adb","components/data/StatCard.jsx":"9952f532b405","components/feedback/Alert.jsx":"ae57970f30bf","components/feedback/Dialog.jsx":"e10a7e847548","components/feedback/Toast.jsx":"ea4acad0e608","components/feedback/Tooltip.jsx":"1ed8f424a690","components/forms/Checkbox.jsx":"e721b97e2c77","components/forms/Input.jsx":"76008d8d719d","components/forms/Radio.jsx":"e4ff42c92dba","components/forms/Select.jsx":"1eba3b68d4d1","components/forms/Switch.jsx":"0bb45b3b2906","components/navigation/BottomNav.jsx":"e645dc2a61d0","components/navigation/Pagination.jsx":"0ce17a5c4337","components/navigation/Sidebar.jsx":"3ba13c3d28a6","components/navigation/Tabs.jsx":"a929d1e7a9ba","components/navigation/Topbar.jsx":"f8873bda5b93","ui_kits/oper-radar-admin/AlertsScreen.jsx":"db07a69810e0","ui_kits/oper-radar-admin/App.jsx":"f1d56ca08c58","ui_kits/oper-radar-admin/ListingDialog.jsx":"be0360ec6ad6","ui_kits/oper-radar-admin/ListingsScreen.jsx":"7d73b84f61db","ui_kits/oper-radar-admin/LoginScreen.jsx":"3efa283571a0","ui_kits/oper-radar-admin/OverviewScreen.jsx":"70b339c5b3ca","ui_kits/oper-radar-admin/SettingsScreen.jsx":"b483072a27c4","ui_kits/oper-radar-admin/SourcesScreen.jsx":"576d9ae72778","ui_kits/oper-radar-admin/data.js":"25f23d7d44c6","ui_kits/oper-radar-admin/shared.jsx":"7eafadd765d9"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.OperRadarDesignSystem_f1ea51 = window.OperRadarDesignSystem_f1ea51 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const cx = (...a) => a.filter(Boolean).join(' ');
function Avatar({
  src,
  name = '',
  size = 36,
  ring,
  tone,
  className,
  style,
  ...rest
}) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cx('or-avatar', ring && 'or-avatar--ring', tone === 'accent' && 'or-avatar--accent', className),
    style: {
      width: size,
      height: size,
      fontSize: Math.round(size * 0.38),
      ...style
    },
    title: name
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name
  }) : initials);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const cx = (...a) => a.filter(Boolean).join(' ');
function Badge({
  tone = 'neutral',
  size = 'sm',
  dot,
  className,
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cx('or-badge', 'or-badge--' + tone, size === 'md' && 'or-badge--md', className)
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    className: "or-badge__dot"
  }), children != null && /*#__PURE__*/React.createElement("span", null, children));
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Icon({
  name,
  weight = 'regular',
  size,
  color,
  className,
  style,
  label,
  ...rest
}) {
  const w = weight === 'fill' ? 'ph-fill' : weight === 'bold' ? 'ph-bold' : 'ph';
  return /*#__PURE__*/React.createElement("i", _extends({
    className: [w, 'ph-' + name, className].filter(Boolean).join(' '),
    style: {
      fontSize: size,
      color,
      lineHeight: 1,
      ...style
    },
    "aria-hidden": label ? undefined : true,
    "aria-label": label,
    role: label ? 'img' : undefined
  }, rest));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const cx = (...a) => a.filter(Boolean).join(' ');
function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconEnd,
  endCircle,
  block,
  as,
  className,
  children,
  ...rest
}) {
  const Tag = as || (rest.href ? 'a' : 'button');
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: cx('or-btn', 'or-btn--' + variant, size !== 'md' && 'or-btn--' + size, block && 'or-btn--block', className)
  }, Tag === 'button' ? {
    type: rest.type || 'button'
  } : {}, rest), icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon
  }), children != null && /*#__PURE__*/React.createElement("span", null, children), iconEnd && !endCircle && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconEnd
  }), endCircle && /*#__PURE__*/React.createElement("span", {
    className: "or-btn__end"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconEnd || 'arrow-right',
    weight: "bold"
  })));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const cx = (...a) => a.filter(Boolean).join(' ');
function IconButton({
  icon,
  variant = 'secondary',
  size = 'md',
  weight = 'regular',
  dot,
  label,
  className,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    title: label,
    className: cx('or-iconbtn', 'or-iconbtn--' + variant, size !== 'md' && 'or-iconbtn--' + size, className)
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    weight: weight
  }), dot && /*#__PURE__*/React.createElement("span", {
    className: "or-iconbtn__dot"
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/LiveIndicator.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const cx = (...a) => a.filter(Boolean).join(' ');
function LiveIndicator({
  status = 'live',
  variant = 'dot',
  size = 28,
  className,
  children,
  ...rest
}) {
  if (variant === 'radar') {
    return /*#__PURE__*/React.createElement("span", _extends({
      className: cx('or-radar', className),
      style: {
        width: size,
        height: size
      },
      role: "img",
      "aria-label": children || 'Ao vivo'
    }, rest), /*#__PURE__*/React.createElement("span", {
      className: "or-radar__sweep"
    }), /*#__PURE__*/React.createElement("span", {
      className: "or-radar__c"
    }));
  }
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cx('or-live', status !== 'live' && 'or-live--' + status, className)
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "or-live__dot"
  }), children != null && /*#__PURE__*/React.createElement("span", null, children));
}
Object.assign(__ds_scope, { LiveIndicator });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/LiveIndicator.jsx", error: String((e && e.message) || e) }); }

// components/core/Logo.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Logo({
  variant = 'lockup',
  theme = 'dark',
  base = 'assets/',
  height = 28,
  className,
  style,
  ...rest
}) {
  const b = base.endsWith('/') ? base : base + '/';
  const mark = b + (theme === 'light' ? 'mark-light.png' : 'mark-dark.png');
  const word = b + (theme === 'light' ? 'wordmark-light.png' : 'wordmark-dark.png');
  if (variant === 'mark') return /*#__PURE__*/React.createElement("img", _extends({
    src: mark,
    alt: "Oper Radar",
    className: className,
    style: {
      height,
      width: 'auto',
      ...style
    }
  }, rest));
  if (variant === 'wordmark') return /*#__PURE__*/React.createElement("img", _extends({
    src: word,
    alt: "Oper Radar",
    className: className,
    style: {
      height,
      width: 'auto',
      ...style
    }
  }, rest));
  return /*#__PURE__*/React.createElement("span", _extends({
    className: className,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: height * 0.35,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("img", {
    src: mark,
    alt: "",
    style: {
      height: height * 1.25,
      width: 'auto'
    }
  }), /*#__PURE__*/React.createElement("img", {
    src: word,
    alt: "Oper Radar",
    style: {
      height: height * 0.62,
      width: 'auto'
    }
  }));
}
Object.assign(__ds_scope, { Logo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Logo.jsx", error: String((e && e.message) || e) }); }

// components/core/SectionTag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const cx = (...a) => a.filter(Boolean).join(' ');
function SectionTag({
  variant = 'outline',
  className,
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cx('or-sectiontag', variant !== 'outline' && 'or-sectiontag--' + variant, className)
  }, rest), children);
}
Object.assign(__ds_scope, { SectionTag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/SectionTag.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const cx = (...a) => a.filter(Boolean).join(' ');
function Tag({
  selected,
  tone,
  icon,
  count,
  onRemove,
  className,
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-pressed": !!selected,
    className: cx('or-tag', selected && 'or-tag--selected', tone === 'accent' && 'or-tag--accent', className)
  }, rest), icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon
  }), /*#__PURE__*/React.createElement("span", null, children), count != null && /*#__PURE__*/React.createElement("span", {
    className: "or-tag__count"
  }, count), onRemove && /*#__PURE__*/React.createElement("span", {
    role: "button",
    "aria-label": "Remover",
    className: "or-tag__x",
    onClick: e => {
      e.stopPropagation();
      onRemove(e);
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    weight: "bold"
  })));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/data/AreaChart.jsx
try { (() => {
function AreaChart({
  series = [],
  labels = [],
  height = 220,
  yTicks = 4,
  format = v => v.toLocaleString('pt-BR'),
  legend = true,
  baseline = 'zero',
  className,
  style
}) {
  const uid = React.useMemo(() => 'ac' + Math.random().toString(36).slice(2, 8), []);
  const all = series.flatMap(s => s.data);
  if (!all.length) return null;
  const lo = Math.min(...all),
    hi = Math.max(...all),
    pad = (hi - lo || hi || 1) * 0.12;
  const max = hi + pad,
    min = baseline === 'auto' ? lo - pad : Math.min(0, lo);
  const n = Math.max(1, (series[0]?.data.length || 1) - 1);
  const y = v => 100 - (v - min) / (max - min || 1) * 100;
  const ticks = Array.from({
    length: yTicks + 1
  }, (_, i) => min + (max - min) * i / yTicks).reverse();
  return /*#__PURE__*/React.createElement("div", {
    className: className,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      ...style
    }
  }, legend && series.length > 1 && /*#__PURE__*/React.createElement("div", {
    className: "or-legend"
  }, series.map((s, i) => /*#__PURE__*/React.createElement("span", {
    key: i
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      background: s.color || 'var(--chart-' + (i + 1) + ')'
    }
  }), s.name))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height,
      font: '500 10.5px var(--font-sans)',
      color: 'var(--chart-axis)',
      textAlign: 'right',
      fontVariantNumeric: 'tabular-nums',
      margin: '-6px 0'
    }
  }, ticks.map((t, i) => /*#__PURE__*/React.createElement("span", {
    key: i
  }, format(Math.round(t))))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      flex: 1,
      height,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }
  }, ticks.map((_, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      borderTop: '1px dashed var(--chart-grid)'
    }
  }))), /*#__PURE__*/React.createElement("svg", {
    className: "or-chart",
    viewBox: "0 0 100 100",
    preserveAspectRatio: "none",
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%'
    },
    "aria-hidden": true
  }, /*#__PURE__*/React.createElement("defs", null, series.map((s, i) => /*#__PURE__*/React.createElement("linearGradient", {
    key: i,
    id: uid + i,
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0",
    stopColor: s.color || 'var(--chart-' + (i + 1) + ')',
    stopOpacity: i === 0 ? '.30' : '.08'
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "1",
    stopColor: s.color || 'var(--chart-' + (i + 1) + ')',
    stopOpacity: "0"
  })))), series.map((s, i) => {
    const d = s.data.map((v, j) => (j ? 'L' : 'M') + (j / n * 100).toFixed(2) + ' ' + y(v).toFixed(2)).join(' ');
    const c = s.color || 'var(--chart-' + (i + 1) + ')';
    return /*#__PURE__*/React.createElement("g", {
      key: i
    }, s.area !== false && /*#__PURE__*/React.createElement("path", {
      d: d + ' L100 100 L0 100 Z',
      fill: 'url(#' + uid + i + ')'
    }), /*#__PURE__*/React.createElement("path", {
      d: d,
      fill: "none",
      stroke: c,
      strokeWidth: i === 0 ? 2.25 : 1.5,
      strokeDasharray: s.dashed ? '4 4' : undefined,
      vectorEffect: "non-scaling-stroke",
      strokeLinejoin: "round"
    }));
  })))), labels.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      paddingLeft: 40,
      font: '500 10.5px var(--font-sans)',
      color: 'var(--chart-axis)'
    }
  }, labels.map((l, i) => /*#__PURE__*/React.createElement("span", {
    key: i
  }, l))));
}
Object.assign(__ds_scope, { AreaChart });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/AreaChart.jsx", error: String((e && e.message) || e) }); }

// components/data/BarChart.jsx
try { (() => {
function BarChart({
  data = [],
  height = 200,
  highlight,
  format = v => v.toLocaleString('pt-BR'),
  showValues,
  className,
  style
}) {
  const max = Math.max(1, ...data.map(d => d.value));
  return /*#__PURE__*/React.createElement("div", {
    className: className,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: '6%',
      height
    }
  }, data.map((d, i) => {
    const hi = highlight == null ? i === data.findIndex(x => x.value === max) : highlight === i;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      title: d.label + ': ' + format(d.value),
      style: {
        flex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 6,
        minWidth: 0
      }
    }, (showValues || hi) && /*#__PURE__*/React.createElement("span", {
      style: {
        font: '600 11px var(--font-sans)',
        color: hi ? 'var(--text-primary)' : 'var(--text-tertiary)',
        fontVariantNumeric: 'tabular-nums'
      }
    }, format(d.value)), /*#__PURE__*/React.createElement("div", {
      style: {
        width: '100%',
        maxWidth: 44,
        height: d.value / max * 100 + '%',
        minHeight: 4,
        borderRadius: 'var(--radius-pill)',
        background: hi ? 'var(--chart-1)' : 'var(--surface-3)',
        transition: 'height var(--dur-slow) var(--ease-out)'
      }
    }));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '6%'
    }
  }, data.map((d, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      flex: 1,
      textAlign: 'center',
      font: '500 10.5px var(--font-sans)',
      color: 'var(--chart-axis)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, d.label))));
}
Object.assign(__ds_scope, { BarChart });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/BarChart.jsx", error: String((e && e.message) || e) }); }

// components/data/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const cx = (...a) => a.filter(Boolean).join(' ');
function Card({
  title,
  subtitle,
  actions,
  variant = 'default',
  flush,
  interactive,
  className,
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("section", _extends({
    className: cx('or-card', variant !== 'default' && 'or-card--' + variant, flush && 'or-card--flush', interactive && 'or-card--interactive', className)
  }, rest), (title || actions) && /*#__PURE__*/React.createElement("div", {
    className: "or-card__head"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("h3", {
    className: "or-card__title"
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    className: "or-card__sub"
  }, subtitle)), actions && /*#__PURE__*/React.createElement("div", {
    className: "or-card__actions"
  }, actions)), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Card.jsx", error: String((e && e.message) || e) }); }

// components/data/DataTable.jsx
try { (() => {
const cx = (...a) => a.filter(Boolean).join(' ');
function DataTable({
  columns = [],
  rows = [],
  rowKey = 'id',
  sort,
  onSort,
  onRowClick,
  selectedKey,
  dense,
  stackOnMobile = true,
  empty,
  className,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: cx('or-table-wrap', className),
    style: style
  }, /*#__PURE__*/React.createElement("table", {
    className: cx('or-table', dense && 'or-table--dense', stackOnMobile && 'or-table--stack')
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map(c => {
    const s = sort && sort.key === c.key ? sort.dir : null;
    return /*#__PURE__*/React.createElement("th", {
      key: c.key,
      className: cx(c.align === 'right' && 'or-r', c.sortable && 'or-sortable'),
      style: {
        width: c.width
      },
      onClick: c.sortable && onSort ? () => onSort({
        key: c.key,
        dir: s === 'asc' ? 'desc' : 'asc'
      }) : undefined,
      "aria-sort": s ? s === 'asc' ? 'ascending' : 'descending' : undefined
    }, c.header, c.sortable && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: s === 'asc' ? 'caret-up' : s === 'desc' ? 'caret-down' : 'caret-up-down',
      weight: "bold"
    }));
  }))), /*#__PURE__*/React.createElement("tbody", null, rows.length === 0 && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: columns.length,
    style: {
      textAlign: 'center',
      padding: 40,
      color: 'var(--text-tertiary)'
    }
  }, empty || 'Nenhum resultado')), rows.map((r, i) => {
    const k = r[rowKey] != null ? r[rowKey] : i;
    return /*#__PURE__*/React.createElement("tr", {
      key: k,
      className: cx(selectedKey === k && 'or-selected'),
      onClick: onRowClick ? () => onRowClick(r) : undefined,
      style: {
        cursor: onRowClick ? 'pointer' : undefined
      }
    }, columns.map((c, ci) => /*#__PURE__*/React.createElement("td", {
      key: c.key,
      "data-label": typeof c.header === 'string' ? c.header : '',
      "data-primary": c.primary || ci === 0 && !columns.some(x => x.primary) ? '' : undefined,
      className: cx(c.align === 'right' && 'or-r', c.muted && 'or-muted')
    }, c.render ? c.render(r) : r[c.key])));
  }))));
}
Object.assign(__ds_scope, { DataTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/DataTable.jsx", error: String((e && e.message) || e) }); }

// components/data/ListRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const cx = (...a) => a.filter(Boolean).join(' ');
function ListRow({
  title,
  subtitle,
  icon,
  leading,
  trailing,
  arrow,
  variant = 'filled',
  onClick,
  href,
  className,
  style
}) {
  const Tag = href ? 'a' : onClick ? 'button' : 'div';
  return /*#__PURE__*/React.createElement(Tag, _extends({
    href: href,
    onClick: onClick,
    className: cx('or-listrow', variant === 'plain' && 'or-listrow--plain', Tag === 'div' && 'or-listrow--static', className),
    style: style
  }, Tag === 'button' ? {
    type: 'button'
  } : {}), leading || icon && /*#__PURE__*/React.createElement("span", {
    className: "or-listrow__lead"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon
  })), /*#__PURE__*/React.createElement("span", {
    className: "or-listrow__body"
  }, /*#__PURE__*/React.createElement("span", {
    className: "or-listrow__t"
  }, title), subtitle && /*#__PURE__*/React.createElement("span", {
    className: "or-listrow__s"
  }, subtitle)), (trailing || arrow) && /*#__PURE__*/React.createElement("span", {
    className: "or-listrow__trail"
  }, trailing, arrow && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-right",
    weight: "bold",
    className: "or-listrow__arrow"
  })));
}
Object.assign(__ds_scope, { ListRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ListRow.jsx", error: String((e && e.message) || e) }); }

// components/data/ProgressBar.jsx
try { (() => {
const cx = (...a) => a.filter(Boolean).join(' ');
function ProgressBar({
  value = 0,
  max = 100,
  label,
  valueLabel,
  tone = 'accent',
  size = 'md',
  className,
  style
}) {
  const pct = Math.max(0, Math.min(100, value / max * 100));
  return /*#__PURE__*/React.createElement("div", {
    className: cx('or-progress', tone !== 'accent' && 'or-progress--' + tone, size === 'lg' && 'or-progress--lg', className),
    style: style
  }, (label || valueLabel) && /*#__PURE__*/React.createElement("div", {
    className: "or-progress__top"
  }, /*#__PURE__*/React.createElement("span", null, label), /*#__PURE__*/React.createElement("b", null, valueLabel != null ? valueLabel : Math.round(pct) + '%')), /*#__PURE__*/React.createElement("div", {
    className: "or-progress__track",
    role: "progressbar",
    "aria-valuenow": value,
    "aria-valuemin": 0,
    "aria-valuemax": max
  }, /*#__PURE__*/React.createElement("div", {
    className: "or-progress__bar",
    style: {
      width: pct + '%'
    }
  })));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/data/Sparkline.jsx
try { (() => {
function Sparkline({
  data = [],
  height = 36,
  color = 'var(--chart-1)',
  area = true,
  className,
  style
}) {
  const gid = React.useMemo(() => 'sp' + Math.random().toString(36).slice(2, 8), []);
  if (!data.length) return null;
  const min = Math.min(...data),
    max = Math.max(...data),
    r = max - min || 1,
    n = data.length - 1 || 1;
  const pts = data.map((v, i) => [i / n * 100, 100 - (v - min) / r * 90 - 5]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join(' ');
  return /*#__PURE__*/React.createElement("svg", {
    className: className,
    style: {
      display: 'block',
      width: '100%',
      height,
      overflow: 'visible',
      ...style
    },
    viewBox: "0 0 100 100",
    preserveAspectRatio: "none",
    "aria-hidden": true
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: gid,
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0",
    stopColor: color,
    stopOpacity: ".28"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "1",
    stopColor: color,
    stopOpacity: "0"
  }))), area && /*#__PURE__*/React.createElement("path", {
    d: d + ' L100 100 L0 100 Z',
    fill: 'url(#' + gid + ')'
  }), /*#__PURE__*/React.createElement("path", {
    d: d,
    fill: "none",
    stroke: color,
    strokeWidth: "2",
    vectorEffect: "non-scaling-stroke",
    strokeLinejoin: "round",
    strokeLinecap: "round"
  }));
}
Object.assign(__ds_scope, { Sparkline });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Sparkline.jsx", error: String((e && e.message) || e) }); }

// components/data/StatCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const cx = (...a) => a.filter(Boolean).join(' ');
function StatCard({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  trend,
  icon,
  spark,
  variant = 'default',
  footer,
  className,
  ...rest
}) {
  const dir = trend || (typeof delta === 'number' ? delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat' : 'flat');
  const dtxt = typeof delta === 'number' ? (delta > 0 ? '+' : '') + delta.toLocaleString('pt-BR', {
    maximumFractionDigits: 1
  }) + '%' : delta;
  return /*#__PURE__*/React.createElement(__ds_scope.Card, _extends({
    variant: variant,
    className: cx('or-stat', className)
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "or-stat__top"
  }, /*#__PURE__*/React.createElement("span", {
    className: "or-stat__label"
  }, label), icon && /*#__PURE__*/React.createElement("span", {
    className: "or-stat__ic"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon
  }))), /*#__PURE__*/React.createElement("div", {
    className: "or-stat__row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "or-stat__value"
  }, value, unit && /*#__PURE__*/React.createElement("span", {
    className: "or-stat__unit"
  }, unit)), spark && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 88,
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Sparkline, {
    data: spark,
    height: 34,
    color: variant === 'accent' ? 'var(--black-950)' : undefined
  }))), (delta != null || footer) && /*#__PURE__*/React.createElement("div", {
    className: "or-stat__foot"
  }, delta != null && /*#__PURE__*/React.createElement("span", {
    className: 'or-stat__delta or-stat__delta--' + dir
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: dir === 'up' ? 'arrow-up-right' : dir === 'down' ? 'arrow-down-right' : 'minus',
    weight: "bold"
  }), dtxt), deltaLabel && /*#__PURE__*/React.createElement("span", null, deltaLabel), footer));
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Alert.jsx
try { (() => {
const cx = (...a) => a.filter(Boolean).join(' ');
const IC = {
  info: 'info',
  success: 'check',
  warning: 'exclamation-mark',
  danger: 'warning'
};
function Alert({
  tone = 'info',
  title,
  children,
  icon,
  actions,
  className,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: tone === 'danger' ? 'alert' : 'status',
    className: cx('or-alert', 'or-alert--' + tone, className),
    style: style
  }, /*#__PURE__*/React.createElement("span", {
    className: "or-alert__ic"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon || IC[tone],
    weight: "bold"
  })), /*#__PURE__*/React.createElement("div", {
    className: "or-alert__body"
  }, title && /*#__PURE__*/React.createElement("span", {
    className: "or-alert__t"
  }, title), children && /*#__PURE__*/React.createElement("span", {
    className: "or-alert__d"
  }, children)), actions && /*#__PURE__*/React.createElement("div", {
    className: "or-alert__act"
  }, actions));
}
Object.assign(__ds_scope, { Alert });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Alert.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
const cx = (...a) => a.filter(Boolean).join(' ');
function Dialog({
  open = true,
  title,
  description,
  children,
  footer,
  onClose,
  size = 'md',
  inline,
  className
}) {
  React.useEffect(() => {
    if (!open || !onClose) return;
    const k = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: cx('or-dialog-scrim', inline && 'or-dialog-scrim--inline'),
    onMouseDown: e => e.target === e.currentTarget && onClose && onClose()
  }, /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    className: cx('or-dialog', size === 'lg' && 'or-dialog--lg', className)
  }, /*#__PURE__*/React.createElement("div", {
    className: "or-dialog__head"
  }, /*#__PURE__*/React.createElement("div", null, title && /*#__PURE__*/React.createElement("h2", {
    className: "or-dialog__t"
  }, title), description && /*#__PURE__*/React.createElement("p", {
    className: "or-dialog__d"
  }, description)), onClose && /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "x",
    label: "Fechar",
    size: "sm",
    onClick: onClose
  })), children, footer && /*#__PURE__*/React.createElement("div", {
    className: "or-dialog__foot"
  }, footer)));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
const cx = (...a) => a.filter(Boolean).join(' ');
function Toast({
  tone = 'success',
  icon,
  title,
  description,
  time,
  action,
  className,
  style
}) {
  const def = {
    success: 'check-circle',
    warning: 'warning',
    danger: 'x-circle',
    info: 'bell-simple'
  }[tone];
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    className: cx('or-toast', tone !== 'success' && 'or-toast--' + tone, className),
    style: style
  }, /*#__PURE__*/React.createElement("span", {
    className: "or-toast__ic"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon || def,
    weight: "fill"
  })), /*#__PURE__*/React.createElement("div", {
    className: "or-toast__body"
  }, /*#__PURE__*/React.createElement("span", {
    className: "or-toast__t"
  }, title), description && /*#__PURE__*/React.createElement("span", {
    className: "or-toast__d"
  }, description)), action, time && /*#__PURE__*/React.createElement("span", {
    className: "or-toast__time"
  }, time));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
const cx = (...a) => a.filter(Boolean).join(' ');
function Tooltip({
  content,
  placement = 'top',
  open,
  children,
  className,
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: cx('or-tooltip', placement === 'bottom' && 'or-tooltip--bottom', open && 'or-tooltip--open', className),
    style: style
  }, children, /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    className: "or-tooltip__b"
  }, content));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const cx = (...a) => a.filter(Boolean).join(' ');
function Checkbox({
  label,
  description,
  disabled,
  className,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: cx('or-check', disabled && 'or-check--disabled', className),
    style: style
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    disabled: disabled
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "or-check__box"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    weight: "bold"
  })), label && /*#__PURE__*/React.createElement("span", null, label, description && /*#__PURE__*/React.createElement("span", {
    className: "or-check__desc"
  }, description)));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const cx = (...a) => a.filter(Boolean).join(' ');
function Input({
  label,
  hint,
  error,
  icon,
  trailing,
  kbd,
  size = 'md',
  pill,
  disabled,
  id,
  className,
  style,
  ...rest
}) {
  const fid = id || (label ? 'in-' + String(label).replace(/\W+/g, '-').toLowerCase() : undefined);
  return /*#__PURE__*/React.createElement("label", {
    className: cx('or-field', error && 'or-field--error', className),
    style: style,
    htmlFor: fid
  }, label && /*#__PURE__*/React.createElement("span", {
    className: "or-field__label"
  }, label), /*#__PURE__*/React.createElement("span", {
    className: cx('or-input', size !== 'md' && 'or-input--' + size, pill && 'or-input--pill', disabled && 'or-input--disabled')
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon
  }), /*#__PURE__*/React.createElement("input", _extends({
    id: fid,
    disabled: disabled,
    "aria-invalid": !!error
  }, rest)), kbd && /*#__PURE__*/React.createElement("span", {
    className: "or-input__kbd"
  }, kbd), trailing), (error || hint) && /*#__PURE__*/React.createElement("span", {
    className: "or-field__hint"
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const cx = (...a) => a.filter(Boolean).join(' ');
function Radio({
  label,
  description,
  disabled,
  className,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: cx('or-check', 'or-check--radio', disabled && 'or-check--disabled', className),
    style: style
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "radio",
    disabled: disabled
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "or-check__box"
  }), label && /*#__PURE__*/React.createElement("span", null, label, description && /*#__PURE__*/React.createElement("span", {
    className: "or-check__desc"
  }, description)));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const cx = (...a) => a.filter(Boolean).join(' ');
function Select({
  label,
  hint,
  error,
  icon,
  options = [],
  size = 'md',
  pill,
  placeholder,
  disabled,
  className,
  style,
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: cx('or-field', error && 'or-field--error', className),
    style: style
  }, label && /*#__PURE__*/React.createElement("span", {
    className: "or-field__label"
  }, label), /*#__PURE__*/React.createElement("span", {
    className: cx('or-input', size !== 'md' && 'or-input--' + size, pill && 'or-input--pill', disabled && 'or-input--disabled')
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon
  }), /*#__PURE__*/React.createElement("select", _extends({
    disabled: disabled
  }, rest), placeholder && /*#__PURE__*/React.createElement("option", {
    value: ""
  }, placeholder), options.map(o => typeof o === 'string' ? /*#__PURE__*/React.createElement("option", {
    key: o,
    value: o
  }, o) : /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label)), children), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "caret-down",
    className: "or-input__caret"
  })), (error || hint) && /*#__PURE__*/React.createElement("span", {
    className: "or-field__hint"
  }, error || hint));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const cx = (...a) => a.filter(Boolean).join(' ');
function Switch({
  label,
  disabled,
  className,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: cx('or-switch', disabled && 'or-switch--disabled', className),
    style: style
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    role: "switch",
    disabled: disabled
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "or-switch__track"
  }), label && /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/BottomNav.jsx
try { (() => {
const cx = (...a) => a.filter(Boolean).join(' ');
function BottomNav({
  items = [],
  value,
  onChange,
  floating,
  showLabels = true,
  className,
  style
}) {
  return /*#__PURE__*/React.createElement("nav", {
    className: cx('or-bottomnav', floating && 'or-bottomnav--floating', className),
    style: style,
    "aria-label": "Principal"
  }, items.map(it => {
    const active = it.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      type: "button",
      "aria-label": it.label,
      "aria-current": active ? 'page' : undefined,
      className: cx('or-bottomnav__item', active && 'or-bottomnav__item--active'),
      onClick: () => onChange && onChange(it.value)
    }, /*#__PURE__*/React.createElement("span", {
      className: "or-bottomnav__ic"
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: it.icon,
      weight: "fill"
    })), showLabels && !floating && /*#__PURE__*/React.createElement("span", null, it.label));
  }));
}
Object.assign(__ds_scope, { BottomNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/BottomNav.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Pagination.jsx
try { (() => {
const cx = (...a) => a.filter(Boolean).join(' ');
function Pagination({
  page = 1,
  pageCount = 1,
  onChange,
  info,
  className,
  style
}) {
  const go = p => onChange && p >= 1 && p <= pageCount && onChange(p);
  const pages = [];
  for (let p = 1; p <= pageCount; p++) if (p === 1 || p === pageCount || Math.abs(p - page) <= 1) pages.push(p);else if (pages[pages.length - 1] !== '…') pages.push('…');
  return /*#__PURE__*/React.createElement("div", {
    className: cx('or-pagination', className),
    style: style
  }, info && /*#__PURE__*/React.createElement("span", {
    className: "or-pagination__info"
  }, info), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "or-pagination__pg",
    "aria-label": "Anterior",
    disabled: page <= 1,
    onClick: () => go(page - 1)
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "caret-left",
    weight: "bold"
  })), pages.map((p, i) => p === '…' ? /*#__PURE__*/React.createElement("span", {
    key: 'e' + i,
    className: "or-pagination__pg",
    "aria-hidden": true
  }, "\u2026") : /*#__PURE__*/React.createElement("button", {
    key: p,
    type: "button",
    "aria-current": p === page ? 'page' : undefined,
    className: cx('or-pagination__pg', p === page && 'or-pagination__pg--active'),
    onClick: () => go(p)
  }, p)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "or-pagination__pg",
    "aria-label": "Pr\xF3xima",
    disabled: page >= pageCount,
    onClick: () => go(page + 1)
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "caret-right",
    weight: "bold"
  })));
}
Object.assign(__ds_scope, { Pagination });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Pagination.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Sidebar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const cx = (...a) => a.filter(Boolean).join(' ');
function NavItem({
  icon,
  label,
  active,
  badge,
  href,
  onClick,
  collapsed
}) {
  const Tag = href ? 'a' : 'button';
  return /*#__PURE__*/React.createElement(Tag, _extends({
    href: href,
    onClick: onClick,
    title: collapsed ? label : undefined,
    "aria-current": active ? 'page' : undefined,
    className: cx('or-navitem', active && 'or-navitem--active')
  }, Tag === 'button' ? {
    type: 'button'
  } : {}), icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    weight: active ? 'fill' : 'regular'
  }), /*#__PURE__*/React.createElement("span", {
    className: "or-navitem__label"
  }, label), badge != null && /*#__PURE__*/React.createElement("span", {
    className: "or-navitem__badge"
  }, badge));
}
function Sidebar({
  brand,
  sections = [],
  value,
  onNavigate,
  collapsed,
  footer,
  className,
  style
}) {
  return /*#__PURE__*/React.createElement("nav", {
    className: cx('or-sidebar', collapsed && 'or-sidebar--collapsed', className),
    style: style,
    "aria-label": "Principal"
  }, brand && /*#__PURE__*/React.createElement("div", {
    className: "or-sidebar__brand"
  }, brand), sections.map((s, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, s.title && /*#__PURE__*/React.createElement("div", {
    className: "or-sidebar__section"
  }, s.title), s.items.map(it => /*#__PURE__*/React.createElement(NavItem, _extends({
    key: it.value
  }, it, {
    collapsed: collapsed,
    active: it.value === value,
    onClick: () => onNavigate && onNavigate(it.value)
  }))))), footer && /*#__PURE__*/React.createElement("div", {
    className: "or-sidebar__foot"
  }, footer));
}
Object.assign(__ds_scope, { NavItem, Sidebar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Sidebar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const cx = (...a) => a.filter(Boolean).join(' ');
function Tabs({
  items = [],
  value,
  onChange,
  variant = 'chips',
  className,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "tablist",
    className: cx('or-tabs', variant !== 'chips' && 'or-tabs--' + variant, className)
  }, rest), items.map(it => {
    const t = typeof it === 'string' ? {
      value: it,
      label: it
    } : it;
    const active = t.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: t.value,
      role: "tab",
      type: "button",
      "aria-selected": active,
      className: cx('or-tab', active && 'or-tab--active'),
      onClick: () => onChange && onChange(t.value)
    }, t.icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: t.icon
    }), t.label, t.count != null && /*#__PURE__*/React.createElement("span", {
      className: "or-tab__count"
    }, t.count));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Topbar.jsx
try { (() => {
const cx = (...a) => a.filter(Boolean).join(' ');
function Topbar({
  title,
  breadcrumb,
  leading,
  actions,
  children,
  className,
  style
}) {
  return /*#__PURE__*/React.createElement("header", {
    className: cx('or-topbar', className),
    style: style
  }, leading, /*#__PURE__*/React.createElement("div", {
    className: "or-topbar__title"
  }, breadcrumb && /*#__PURE__*/React.createElement("div", {
    className: "or-topbar__crumb"
  }, breadcrumb), title && /*#__PURE__*/React.createElement("h1", {
    className: "or-topbar__h"
  }, title)), children, actions && /*#__PURE__*/React.createElement("div", {
    className: "or-topbar__actions"
  }, actions));
}
Object.assign(__ds_scope, { Topbar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Topbar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/oper-radar-admin/AlertsScreen.jsx
try { (() => {
function AlertsScreen() {
  const {
    Card,
    Tabs,
    ListRow,
    Button,
    Badge,
    Switch,
    IconButton
  } = ORK;
  const D = window.OR_DATA;
  const [tab, setTab] = React.useState('all');
  const [read, setRead] = React.useState({});
  const items = D.alerts.filter(a => tab === 'all' || tab === 'unread' && a.unread && !read[a.id]);
  const toneBg = {
    success: 'var(--accent)',
    warning: 'var(--warning)',
    danger: 'var(--danger)',
    info: 'var(--surface-inverse)'
  };
  const toneFg = {
    success: 'var(--text-on-accent)',
    warning: 'var(--black-950)',
    danger: '#fff',
    info: 'var(--text-inverse)'
  };
  const rules = [['Abaixo da FIPE > 10%', 'Todas as marcas · Brasil', true], ['Queda de preço > 3%', 'Scania, Volvo · Sul e Sudeste', true], ['Novos concorrentes', 'Lojistas com 20+ anúncios', true], ['Saúde das fontes', 'Falhas e atrasos de coleta', true], ['Resumo diário por e-mail', 'Todo dia às 07:00', false]];
  return /*#__PURE__*/React.createElement("div", {
    className: "kit-page"
  }, /*#__PURE__*/React.createElement(PageHead, {
    eyebrow: "Alertas",
    title: "O que mudou desde ontem"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: "checks",
    onClick: () => setRead(Object.fromEntries(D.alerts.map(a => [a.id, 1])))
  }, "Marcar como lidos")), /*#__PURE__*/React.createElement("div", {
    className: "kit-grid-main"
  }, /*#__PURE__*/React.createElement(Card, {
    style: {
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    items: [{
      value: 'all',
      label: 'Todos'
    }, {
      value: 'unread',
      label: 'Não lidos',
      count: D.alerts.filter(a => a.unread && !read[a.id]).length
    }]
  }), items.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '40px 0',
      textAlign: 'center',
      color: 'var(--text-tertiary)'
    }
  }, "Tudo em dia. Nenhum alerta n\xE3o lido."), items.map(a => /*#__PURE__*/React.createElement(ListRow, {
    key: a.id,
    onClick: () => setRead(r => ({
      ...r,
      [a.id]: 1
    })),
    leading: /*#__PURE__*/React.createElement("span", {
      className: "or-listrow__lead",
      style: {
        background: toneBg[a.tone],
        color: toneFg[a.tone]
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: 'ph-fill ph-' + a.icon
    })),
    title: a.title,
    subtitle: a.desc,
    trailing: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: 'var(--text-tertiary)'
      }
    }, a.time), a.unread && !read[a.id] && /*#__PURE__*/React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: 8,
        background: 'var(--accent)',
        boxShadow: 'var(--glow-dot)'
      }
    }))
  }))), /*#__PURE__*/React.createElement(Card, {
    title: "Regras ativas",
    subtitle: "Quando avisar",
    actions: /*#__PURE__*/React.createElement(IconButton, {
      icon: "plus",
      variant: "primary",
      size: "sm",
      label: "Nova regra"
    }),
    style: {
      gap: 6
    }
  }, rules.map(([t, s, on]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 0',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--text-tertiary)',
      marginTop: 3
    }
  }, s)), /*#__PURE__*/React.createElement(Switch, {
    defaultChecked: on,
    "aria-label": t
  }))))));
}
window.AlertsScreen = AlertsScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/oper-radar-admin/AlertsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/oper-radar-admin/App.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function App() {
  const {
    Sidebar,
    Topbar,
    BottomNav,
    IconButton,
    Avatar,
    Input,
    Logo,
    LiveIndicator,
    Toast,
    Tooltip
  } = ORK;
  const saved = (() => {
    try {
      return JSON.parse(localStorage.getItem('or-kit') || '{}');
    } catch (e) {
      return {};
    }
  })();
  const [authed, setAuthed] = React.useState(saved.authed !== false);
  const [screen, setScreen] = React.useState(saved.screen || 'overview');
  const [theme, setTheme] = React.useState(saved.theme || 'dark');
  const [open, setOpen] = React.useState(null);
  const [toasts, setToasts] = React.useState([]);
  const mobile = useMedia('(max-width: 899px)');
  const compact = useMedia('(max-width: 1199px)');
  React.useEffect(() => {
    localStorage.setItem('or-kit', JSON.stringify({
      authed,
      screen,
      theme
    }));
    document.documentElement.setAttribute('data-theme', theme);
  }, [authed, screen, theme]);
  const toast = t => {
    const id = Date.now();
    setToasts(x => [...x, {
      ...t,
      id
    }]);
    setTimeout(() => setToasts(x => x.filter(y => y.id !== id)), 4500);
  };
  const go = s => {
    setScreen(s);
    document.querySelector('.kit-main')?.scrollTo(0, 0);
  };
  const logoBase = '../../assets/';
  const lt = theme === 'light' ? 'light' : 'dark';
  if (!authed) return /*#__PURE__*/React.createElement(LoginScreen, {
    onLogin: () => {
      setAuthed(true);
      setScreen('overview');
    }
  });
  const nav = [{
    value: 'overview',
    label: 'Visão geral',
    icon: 'gauge'
  }, {
    value: 'ads',
    label: 'Anúncios',
    icon: 'tag',
    badge: '1,2k'
  }, {
    value: 'alerts',
    label: 'Alertas',
    icon: 'bell-simple',
    badge: 3
  }, {
    value: 'sources',
    label: 'Fontes',
    icon: 'plugs-connected'
  }, {
    value: 'settings',
    label: 'Configurações',
    icon: 'gear-six'
  }];
  const titles = {
    overview: 'Visão geral',
    ads: 'Anúncios',
    alerts: 'Alertas',
    sources: 'Fontes',
    settings: 'Configurações'
  };
  const Screen = {
    overview: OverviewScreen,
    ads: ListingsScreen,
    alerts: AlertsScreen,
    sources: SourcesScreen,
    settings: SettingsScreen
  }[screen];
  return /*#__PURE__*/React.createElement("div", {
    className: "kit-app"
  }, !mobile && /*#__PURE__*/React.createElement(Sidebar, {
    collapsed: compact,
    value: screen,
    onNavigate: go,
    brand: compact ? /*#__PURE__*/React.createElement(Logo, {
      variant: "mark",
      theme: lt,
      base: logoBase,
      height: 32
    }) : /*#__PURE__*/React.createElement(Logo, {
      theme: lt,
      base: logoBase,
      height: 20
    }),
    sections: [{
      items: nav.slice(0, 2)
    }, {
      title: 'Operação',
      items: nav.slice(2)
    }],
    footer: compact ? /*#__PURE__*/React.createElement(LiveIndicator, {
      variant: "radar",
      size: 32
    }) : /*#__PURE__*/React.createElement("div", {
      className: "kit-sidefoot"
    }, /*#__PURE__*/React.createElement(LiveIndicator, {
      variant: "radar",
      size: 34
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 600,
        fontSize: 13
      }
    }, "Coleta ativa"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--text-tertiary)',
        marginTop: 3
      }
    }, "6 de 7 fontes \xB7 h\xE1 2 min")))
  }), /*#__PURE__*/React.createElement("div", {
    className: "kit-main"
  }, /*#__PURE__*/React.createElement(Topbar, {
    leading: mobile ? /*#__PURE__*/React.createElement(Logo, {
      variant: "mark",
      theme: lt,
      base: logoBase,
      height: 30
    }) : null,
    breadcrumb: mobile ? null : 'Oper Radar / Caminhões e implementos',
    title: titles[screen],
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, !mobile && /*#__PURE__*/React.createElement(Input, {
      icon: "magnifying-glass",
      pill: true,
      size: "sm",
      kbd: "\u2318K",
      placeholder: "Buscar an\xFAncio, lojista\u2026",
      style: {
        width: 280
      }
    }), mobile && /*#__PURE__*/React.createElement(IconButton, {
      icon: "magnifying-glass",
      label: "Buscar",
      variant: "ghost"
    }), /*#__PURE__*/React.createElement(Tooltip, {
      content: theme === 'dark' ? 'Tema claro' : 'Tema escuro',
      placement: "bottom"
    }, /*#__PURE__*/React.createElement(IconButton, {
      icon: theme === 'dark' ? 'sun' : 'moon',
      label: "Alternar tema",
      variant: "ghost",
      onClick: () => setTheme(theme === 'dark' ? 'light' : 'dark')
    })), /*#__PURE__*/React.createElement(IconButton, {
      icon: "bell-simple",
      label: "Alertas",
      dot: true,
      onClick: () => go('alerts')
    }), !mobile && /*#__PURE__*/React.createElement(Avatar, {
      name: "Felipe Souza",
      size: 36,
      onClick: () => go('settings'),
      style: {
        cursor: 'pointer'
      }
    }))
  }), /*#__PURE__*/React.createElement("main", {
    className: "kit-content"
  }, /*#__PURE__*/React.createElement(Screen, {
    onOpen: setOpen,
    go: go,
    toast: toast,
    theme: theme,
    setTheme: setTheme,
    onLogout: () => setAuthed(false)
  }))), mobile && /*#__PURE__*/React.createElement("div", {
    className: "kit-bottom"
  }, /*#__PURE__*/React.createElement(BottomNav, {
    value: screen,
    onChange: go,
    items: nav.map(({
      value,
      label,
      icon
    }) => ({
      value,
      label: label === 'Configurações' ? 'Conta' : label === 'Visão geral' ? 'Início' : label,
      icon: icon === 'gauge' ? 'house' : icon === 'gear-six' ? 'user' : icon
    }))
  })), /*#__PURE__*/React.createElement(ListingDialog, {
    listing: open,
    onClose: () => setOpen(null),
    onAlert: l => {
      setOpen(null);
      toast({
        title: 'Alerta criado',
        description: 'Vamos avisar quando o ' + l.model + ' mudar de preço.',
        time: 'agora',
        icon: 'bell-simple-ringing'
      });
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "kit-toasts"
  }, toasts.map(t => /*#__PURE__*/React.createElement(Toast, _extends({
    key: t.id
  }, t)))));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/oper-radar-admin/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/oper-radar-admin/ListingDialog.jsx
try { (() => {
function ListingDialog({
  listing,
  onClose,
  onAlert
}) {
  const {
    Dialog,
    Button,
    Badge,
    Card,
    AreaChart,
    ListRow
  } = ORK;
  const D = window.OR_DATA;
  if (!listing) return null;
  const l = listing,
    diff = vsFipe(l);
  return /*#__PURE__*/React.createElement(Dialog, {
    size: "lg",
    title: l.model,
    description: l.year + ' · ' + l.km.toLocaleString('pt-BR') + ' km · ' + l.city,
    onClose: onClose,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      icon: "arrow-square-out"
    }, "Abrir na ", l.src), /*#__PURE__*/React.createElement(Button, {
      icon: "bell-simple-ringing",
      onClick: () => onAlert(l)
    }, "Monitorar pre\xE7o"))
  }, /*#__PURE__*/React.createElement("div", {
    className: "kit-detail"
  }, /*#__PURE__*/React.createElement(Card, {
    variant: "sunken",
    style: {
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 12px var(--font-sans)',
      color: 'var(--text-secondary)'
    }
  }, "Pre\xE7o anunciado"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '700 32px/1 var(--font-sans)',
      letterSpacing: '-0.025em',
      fontVariantNumeric: 'tabular-nums'
    }
  }, D.fmtBRL(l.price)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: diff < 0 ? 'success' : 'warning'
  }, pct(diff), " vs. FIPE"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--text-tertiary)'
    }
  }, "FIPE ", D.fmtBRL(l.fipe)))), /*#__PURE__*/React.createElement(Card, {
    variant: "sunken",
    style: {
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 12px var(--font-sans)',
      color: 'var(--text-secondary)'
    }
  }, "Hist\xF3rico de pre\xE7o (mil R$)"), /*#__PURE__*/React.createElement(AreaChart, {
    height: 92,
    yTicks: 2,
    baseline: "auto",
    series: [{
      name: 'Preço',
      data: l.hist
    }],
    labels: ['30d', '15d', 'hoje']
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(ListRow, {
    icon: "storefront",
    title: l.dealer,
    subtitle: "Anunciante \xB7 214 an\xFAncios ativos",
    arrow: true,
    onClick: () => {}
  }), /*#__PURE__*/React.createElement(ListRow, {
    icon: "clock",
    title: l.days === 0 ? 'Publicado hoje' : 'No ar há ' + l.days + ' dias',
    subtitle: 'Fonte: ' + l.src + ' · coletado há 4 min',
    trailing: /*#__PURE__*/React.createElement(StatusBadge, {
      s: l.status
    })
  })));
}
window.ListingDialog = ListingDialog;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/oper-radar-admin/ListingDialog.jsx", error: String((e && e.message) || e) }); }

// ui_kits/oper-radar-admin/ListingsScreen.jsx
try { (() => {
function ListingsScreen({
  onOpen
}) {
  const {
    Card,
    DataTable,
    Tabs,
    Tag,
    Input,
    Select,
    Pagination,
    Button,
    IconButton,
    Sparkline
  } = ORK;
  const D = window.OR_DATA;
  const [tab, setTab] = React.useState('all');
  const [q, setQ] = React.useState('');
  const [brands, setBrands] = React.useState(['Scania', 'Volvo']);
  const [sort, setSort] = React.useState({
    key: 'price',
    dir: 'desc'
  });
  const [page, setPage] = React.useState(1);
  const all = ['Scania', 'Volvo', 'Mercedes-Benz', 'DAF', 'Iveco', 'Volkswagen'];
  let rows = D.listings.filter(l => (tab === 'all' || l.status === tab) && (!q || (l.model + l.dealer + l.city).toLowerCase().includes(q.toLowerCase())));
  if (brands.length) rows = rows.filter(l => brands.includes(l.brand));
  rows = [...rows].sort((a, b) => (sort.dir === 'asc' ? 1 : -1) * ((a[sort.key] > b[sort.key]) - (a[sort.key] < b[sort.key])));
  const count = s => D.listings.filter(l => s === 'all' || l.status === s).length;
  return /*#__PURE__*/React.createElement("div", {
    className: "kit-page"
  }, /*#__PURE__*/React.createElement(PageHead, {
    eyebrow: "An\xFAncios",
    title: "18.742 an\xFAncios monitorados"
  }, /*#__PURE__*/React.createElement(Button, {
    icon: "bell-simple-ringing",
    variant: "secondary",
    className: "kit-hide-sm"
  }, "Criar alerta"), /*#__PURE__*/React.createElement(Button, {
    icon: "export"
  }, "Exportar CSV")), /*#__PURE__*/React.createElement(Card, {
    style: {
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "kit-filters"
  }, /*#__PURE__*/React.createElement(Input, {
    icon: "magnifying-glass",
    pill: true,
    placeholder: "Modelo, lojista ou cidade",
    value: q,
    onChange: e => setQ(e.target.value),
    style: {
      flex: 2,
      minWidth: 220
    }
  }), /*#__PURE__*/React.createElement(Select, {
    pill: true,
    icon: "map-pin",
    options: ['Todo o Brasil', 'Sul', 'Sudeste', 'Centro-Oeste', 'Nordeste', 'Norte'],
    style: {
      flex: 1,
      minWidth: 160
    }
  }), /*#__PURE__*/React.createElement(Select, {
    pill: true,
    icon: "calendar-blank",
    options: ['Ano: todos', '2022+', '2019–2021', 'Até 2018'],
    style: {
      flex: 1,
      minWidth: 140
    }
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "sliders-horizontal",
    variant: "outline",
    label: "Mais filtros"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, all.map(b => /*#__PURE__*/React.createElement(Tag, {
    key: b,
    selected: brands.includes(b),
    onClick: () => setBrands(x => x.includes(b) ? x.filter(y => y !== b) : [...x, b])
  }, b)), brands.length > 0 && /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    onClick: () => setBrands([])
  }, "Limpar"))), /*#__PURE__*/React.createElement(Card, {
    flush: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 16px 4px'
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    items: [{
      value: 'all',
      label: 'Todos',
      count: count('all')
    }, {
      value: 'opportunity',
      label: 'Oportunidades',
      count: count('opportunity')
    }, {
      value: 'drop',
      label: 'Preço caiu',
      count: count('drop')
    }, {
      value: 'new',
      label: 'Novos',
      count: count('new')
    }, {
      value: 'sold',
      label: 'Vendidos',
      count: count('sold')
    }]
  })), /*#__PURE__*/React.createElement(DataTable, {
    onRowClick: onOpen,
    sort: sort,
    onSort: setSort,
    rows: rows,
    empty: "Nenhum an\xFAncio com esses filtros",
    columns: [{
      key: 'model',
      header: 'Modelo',
      primary: true,
      sortable: true,
      render: l => /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }
      }, /*#__PURE__*/React.createElement("b", {
        style: {
          fontWeight: 600
        }
      }, l.model), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12,
          color: 'var(--text-tertiary)'
        }
      }, l.dealer))
    }, {
      key: 'year',
      header: 'Ano',
      sortable: true,
      muted: true
    }, {
      key: 'km',
      header: 'Km',
      align: 'right',
      sortable: true,
      muted: true,
      render: l => l.km.toLocaleString('pt-BR')
    }, {
      key: 'city',
      header: 'Cidade',
      muted: true
    }, {
      key: 'src',
      header: 'Fonte',
      muted: true
    }, {
      key: 'hist',
      header: 'Preço 30d',
      render: l => /*#__PURE__*/React.createElement("div", {
        style: {
          width: 72
        }
      }, /*#__PURE__*/React.createElement(Sparkline, {
        data: l.hist,
        height: 22,
        area: false,
        color: l.hist[0] > l.hist[6] ? 'var(--warning)' : 'var(--chart-3)'
      }))
    }, {
      key: 'price',
      header: 'Preço',
      align: 'right',
      sortable: true,
      render: l => /*#__PURE__*/React.createElement("b", {
        style: {
          fontWeight: 600
        }
      }, D.fmtBRL(l.price))
    }, {
      key: 'status',
      header: 'Status',
      align: 'right',
      render: l => /*#__PURE__*/React.createElement(StatusBadge, {
        s: l.status
      })
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      borderTop: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement(Pagination, {
    page: page,
    pageCount: 937,
    onChange: setPage,
    info: 'Mostrando ' + rows.length + ' de 18.742'
  }))));
}
window.ListingsScreen = ListingsScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/oper-radar-admin/ListingsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/oper-radar-admin/LoginScreen.jsx
try { (() => {
function LoginScreen({
  onLogin
}) {
  const {
    Input,
    Button,
    Checkbox,
    LiveIndicator,
    Logo
  } = ORK;
  const [loading, setLoading] = React.useState(false);
  const submit = e => {
    e.preventDefault();
    setLoading(true);
    setTimeout(onLogin, 700);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "kit-login"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kit-login__brand"
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-dark-transparent.png",
    alt: "Oper Radar",
    style: {
      width: 'min(360px, 70%)',
      height: 'auto'
    }
  }), /*#__PURE__*/React.createElement("p", {
    className: "kit-display",
    style: {
      fontSize: 'clamp(28px, 3.2vw, 44px)',
      textAlign: 'center',
      maxWidth: 520
    }
  }, "O mercado de pesados ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-accent)'
    }
  }, "em tempo real."), " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-tertiary)'
    }
  }, "Sem ru\xEDdo.")), /*#__PURE__*/React.createElement(LiveIndicator, null, "7 fontes monitoradas agora")), /*#__PURE__*/React.createElement("form", {
    className: "kit-login__form",
    onSubmit: submit
  }, /*#__PURE__*/React.createElement("div", {
    className: "kit-login__mobilelogo"
  }, /*#__PURE__*/React.createElement(Logo, {
    base: "../../assets/",
    height: 22
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "kit-display",
    style: {
      fontSize: 32
    }
  }, "Entrar"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-secondary)',
      margin: '8px 0 0'
    }
  }, "Acesse o painel de intelig\xEAncia de mercado.")), /*#__PURE__*/React.createElement(Input, {
    label: "E-mail",
    type: "email",
    size: "lg",
    defaultValue: "felipe@oper.com.br",
    autoComplete: "email"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Senha",
    type: "password",
    size: "lg",
    defaultValue: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    autoComplete: "current-password"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    label: "Manter conectado",
    defaultChecked: true
  }), /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Esqueci a senha")), /*#__PURE__*/React.createElement(Button, {
    type: "submit",
    size: "lg",
    block: true,
    endCircle: true,
    disabled: loading
  }, loading ? 'Entrando…' : 'Entrar no painel')));
}
window.LoginScreen = LoginScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/oper-radar-admin/LoginScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/oper-radar-admin/OverviewScreen.jsx
try { (() => {
function OverviewScreen({
  onOpen,
  go
}) {
  const {
    StatCard,
    Card,
    AreaChart,
    BarChart,
    ProgressBar,
    DataTable,
    Tabs,
    IconButton,
    Button,
    LiveIndicator,
    Badge
  } = ORK;
  const D = window.OR_DATA;
  const [range, setRange] = React.useState('30d');
  const opps = D.listings.filter(l => vsFipe(l) < -4).sort((a, b) => vsFipe(a) - vsFipe(b));
  return /*#__PURE__*/React.createElement("div", {
    className: "kit-page"
  }, /*#__PURE__*/React.createElement(PageHead, {
    eyebrow: "Vis\xE3o geral",
    title: /*#__PURE__*/React.createElement(React.Fragment, null, "Mercado de pesados ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-accent)'
      }
    }, "hoje."))
  }, /*#__PURE__*/React.createElement(Tabs, {
    variant: "segmented",
    items: ['7d', '30d', '90d', '12m'],
    value: range,
    onChange: setRange
  }), /*#__PURE__*/React.createElement(Button, {
    icon: "export",
    variant: "secondary",
    className: "kit-hide-sm"
  }, "Exportar")), /*#__PURE__*/React.createElement("div", {
    className: "kit-grid-4"
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "An\xFAncios ativos",
    value: "18.742",
    delta: 4.8,
    deltaLabel: "vs. semana ant.",
    icon: "tag",
    spark: [12, 13, 13, 15, 14, 16, 17, 18.7]
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Novos hoje",
    value: "884",
    delta: 9.2,
    deltaLabel: "vs. ontem",
    icon: "plus-circle",
    spark: [610, 655, 690, 702, 754, 801, 856, 884]
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Pre\xE7o m\xE9dio",
    value: "R$ 412",
    unit: "mil",
    delta: -1.9,
    deltaLabel: "30 dias",
    icon: "currency-circle-dollar"
  }), /*#__PURE__*/React.createElement(StatCard, {
    variant: "accent",
    label: "Oportunidades",
    value: "37",
    delta: 12,
    deltaLabel: "abaixo da FIPE",
    icon: "lightning",
    onClick: () => go('ads'),
    style: {
      cursor: 'pointer'
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "kit-grid-main"
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Novos an\xFAncios por dia",
    subtitle: "Setembro 2026 \xB7 todas as fontes",
    actions: /*#__PURE__*/React.createElement(IconButton, {
      icon: "dots-three",
      variant: "ghost",
      size: "sm",
      label: "Mais op\xE7\xF5es"
    })
  }, /*#__PURE__*/React.createElement(AreaChart, {
    height: 230,
    labels: ['01/09', '08/09', '15/09', '22/09', '30/09'],
    series: [{
      name: 'Este mês',
      data: D.daily
    }, {
      name: 'Mês anterior',
      data: D.prev,
      dashed: true,
      area: false
    }]
  })), /*#__PURE__*/React.createElement(Card, {
    title: "Participa\xE7\xE3o por fonte",
    subtitle: "An\xFAncios ativos",
    actions: /*#__PURE__*/React.createElement(LiveIndicator, null, "Ao vivo"),
    style: {
      gap: 14
    }
  }, D.sources.slice(0, 5).map((s, i) => /*#__PURE__*/React.createElement(ProgressBar, {
    key: s.id,
    label: s.name,
    value: s.share,
    max: 45,
    valueLabel: s.ads.toLocaleString('pt-BR'),
    tone: i === 0 ? 'accent' : 'neutral'
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    iconEnd: "arrow-right",
    onClick: () => go('sources'),
    style: {
      alignSelf: 'flex-start',
      marginLeft: -10
    }
  }, "Ver fontes"))), /*#__PURE__*/React.createElement("div", {
    className: "kit-grid-main kit-grid-main--rev"
  }, /*#__PURE__*/React.createElement(Card, {
    title: "An\xFAncios por marca",
    subtitle: "Cavalos mec\xE2nicos \xB7 30 dias"
  }, /*#__PURE__*/React.createElement(BarChart, {
    height: 180,
    data: D.byBrand
  })), /*#__PURE__*/React.createElement(Card, {
    flush: true,
    title: "Oportunidades abaixo da FIPE",
    subtitle: "Ordenado pela maior diferen\xE7a",
    actions: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary",
      onClick: () => go('ads')
    }, "Ver todas")
  }, /*#__PURE__*/React.createElement(DataTable, {
    onRowClick: onOpen,
    rows: opps,
    columns: [{
      key: 'model',
      header: 'Modelo',
      primary: true,
      render: l => /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }
      }, /*#__PURE__*/React.createElement("b", {
        style: {
          fontWeight: 600
        }
      }, l.model), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12,
          color: 'var(--text-tertiary)'
        }
      }, l.year, " \xB7 ", l.city))
    }, {
      key: 'src',
      header: 'Fonte',
      muted: true
    }, {
      key: 'price',
      header: 'Preço',
      align: 'right',
      render: l => D.fmtBRL(l.price)
    }, {
      key: 'fipe',
      header: 'vs. FIPE',
      align: 'right',
      render: l => /*#__PURE__*/React.createElement(Badge, {
        tone: "success"
      }, pct(vsFipe(l)))
    }]
  }))));
}
window.OverviewScreen = OverviewScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/oper-radar-admin/OverviewScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/oper-radar-admin/SettingsScreen.jsx
try { (() => {
function SettingsScreen({
  theme,
  setTheme,
  onLogout
}) {
  const {
    Card,
    ListRow,
    Avatar,
    Button,
    Input,
    Select,
    Tabs
  } = ORK;
  return /*#__PURE__*/React.createElement("div", {
    className: "kit-page",
    style: {
      maxWidth: 880
    }
  }, /*#__PURE__*/React.createElement(PageHead, {
    eyebrow: "Configura\xE7\xF5es",
    title: "Sua conta"
  }), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Felipe Souza",
    size: 56,
    ring: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 160
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      fontSize: 16
    }
  }, "Felipe Souza"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-tertiary)',
      marginTop: 4
    }
  }, "Administrador \xB7 Ag\xEAncia Oper")), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    icon: "pencil-simple"
  }, "Editar perfil")), /*#__PURE__*/React.createElement("div", {
    className: "kit-grid-2"
  }, /*#__PURE__*/React.createElement(Input, {
    label: "E-mail",
    defaultValue: "felipe@oper.com.br"
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Regi\xE3o padr\xE3o",
    options: ['Todo o Brasil', 'Sul', 'Sudeste', 'Centro-Oeste']
  }))), /*#__PURE__*/React.createElement(Card, {
    title: "Apar\xEAncia"
  }, /*#__PURE__*/React.createElement(Tabs, {
    variant: "segmented",
    value: theme,
    onChange: setTheme,
    items: [{
      value: 'dark',
      label: 'Escuro',
      icon: 'moon'
    }, {
      value: 'light',
      label: 'Claro',
      icon: 'sun'
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(ListRow, {
    icon: "users-three",
    title: "Usu\xE1rios e permiss\xF5es",
    subtitle: "6 usu\xE1rios \xB7 2 parceiros",
    arrow: true,
    onClick: () => {}
  }), /*#__PURE__*/React.createElement(ListRow, {
    icon: "key",
    title: "Integra\xE7\xF5es e API",
    subtitle: "Token ativo \xB7 expira em 12/2026",
    arrow: true,
    onClick: () => {}
  }), /*#__PURE__*/React.createElement(ListRow, {
    icon: "bell-simple",
    title: "Notifica\xE7\xF5es",
    subtitle: "E-mail e push",
    arrow: true,
    onClick: () => {}
  }), /*#__PURE__*/React.createElement(ListRow, {
    icon: "shield-check",
    title: "Seguran\xE7a",
    subtitle: "Autentica\xE7\xE3o em 2 etapas ativa",
    arrow: true,
    onClick: () => {}
  }), /*#__PURE__*/React.createElement(ListRow, {
    icon: "lifebuoy",
    title: "Ajuda e suporte",
    subtitle: "Seg\u2013sex, 8h \xE0s 18h",
    arrow: true,
    onClick: () => {}
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "danger",
    size: "lg",
    block: true,
    icon: "sign-out",
    onClick: onLogout,
    style: {
      marginTop: 6
    }
  }, "Sair")));
}
window.SettingsScreen = SettingsScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/oper-radar-admin/SettingsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/oper-radar-admin/SourcesScreen.jsx
try { (() => {
function SourcesScreen({
  toast
}) {
  const {
    Card,
    LiveIndicator,
    Switch,
    Button,
    Badge,
    Alert,
    ProgressBar,
    IconButton
  } = ORK;
  const D = window.OR_DATA;
  const [running, setRunning] = React.useState(false);
  const [prog, setProg] = React.useState(0);
  React.useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setProg(p => {
      if (p >= 100) {
        clearInterval(t);
        setRunning(false);
        toast({
          title: 'Coleta concluída',
          description: '1.284 anúncios novos · 6 fontes'
        });
        return 100;
      }
      return p + 5;
    }), 120);
    return () => clearInterval(t);
  }, [running]);
  const st = {
    live: ['live', 'Coletando'],
    warning: ['warning', 'Atrasado'],
    idle: ['idle', 'Pausado']
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "kit-page"
  }, /*#__PURE__*/React.createElement(PageHead, {
    eyebrow: "Fontes",
    title: "Coleta de dados"
  }, /*#__PURE__*/React.createElement(Button, {
    icon: running ? undefined : 'play',
    disabled: running,
    onClick: () => {
      setProg(0);
      setRunning(true);
    }
  }, running ? 'Coletando… ' + prog + '%' : 'Coletar agora')), /*#__PURE__*/React.createElement(Alert, {
    tone: "warning",
    title: "Webmotors respondendo com atraso",
    actions: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary"
    }, "Tentar de novo")
  }, "\xDAltima coleta completa h\xE1 3 h. As demais fontes est\xE3o normais."), running && /*#__PURE__*/React.createElement(Card, {
    style: {
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(ProgressBar, {
    size: "lg",
    label: "Coleta manual em andamento",
    value: prog
  })), /*#__PURE__*/React.createElement("div", {
    className: "kit-grid-3"
  }, D.sources.map(s => /*#__PURE__*/React.createElement(Card, {
    key: s.id,
    style: {
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "or-listrow__lead",
    style: {
      background: 'var(--surface-2)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph ph-globe-simple"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600
    }
  }, s.name), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement(LiveIndicator, {
    status: st[s.status][0]
  }, st[s.status][1], " \xB7 ", s.last))), /*#__PURE__*/React.createElement(Switch, {
    defaultChecked: s.on,
    "aria-label": 'Ativar ' + s.name
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--text-tertiary)'
    }
  }, "An\xFAncios ativos"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '700 24px/1 var(--font-sans)',
      letterSpacing: '-0.02em',
      marginTop: 6,
      fontVariantNumeric: 'tabular-nums'
    }
  }, s.ads.toLocaleString('pt-BR'))), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral"
  }, s.share, "% do total"))))));
}
window.SourcesScreen = SourcesScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/oper-radar-admin/SourcesScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/oper-radar-admin/data.js
try { (() => {
// Oper Radar admin — sample data (fictional; realistic shapes for the truck/implement market in BR)
window.OR_DATA = (() => {
  const fmtBRL = v => 'R$ ' + v.toLocaleString('pt-BR');
  const sources = [{
    id: 'olx',
    name: 'OLX',
    ads: 7812,
    status: 'live',
    last: 'há 2 min',
    share: 42,
    on: true
  }, {
    id: 'ml',
    name: 'Mercado Livre',
    ads: 5806,
    status: 'live',
    last: 'há 4 min',
    share: 31,
    on: true
  }, {
    id: 'wm',
    name: 'Webmotors',
    ads: 2143,
    status: 'warning',
    last: 'há 3 h',
    share: 11,
    on: true
  }, {
    id: 'cc',
    name: 'Caminhões e Carretas',
    ads: 1590,
    status: 'live',
    last: 'há 9 min',
    share: 8,
    on: true
  }, {
    id: 'sc',
    name: 'Só Caminhões',
    ads: 902,
    status: 'live',
    last: 'há 12 min',
    share: 5,
    on: true
  }, {
    id: 'np',
    name: 'Na Pista',
    ads: 489,
    status: 'idle',
    last: 'ontem 23:10',
    share: 3,
    on: false
  }];
  const listings = [{
    id: 1,
    model: 'Scania R450 6x2',
    brand: 'Scania',
    year: 2021,
    km: 312000,
    price: 489900,
    fipe: 552000,
    src: 'OLX',
    city: 'Curitiba/PR',
    dealer: 'Transnorte Seminovos',
    status: 'drop',
    days: 3,
    hist: [540, 535, 528, 520, 510, 498, 490]
  }, {
    id: 2,
    model: 'Volvo FH 540 6x4',
    brand: 'Volvo',
    year: 2020,
    km: 402000,
    price: 512000,
    fipe: 575000,
    src: 'Webmotors',
    city: 'Campinas/SP',
    dealer: 'Rodoeste Caminhões',
    status: 'new',
    days: 0,
    hist: [512, 512, 512, 512, 512, 512, 512]
  }, {
    id: 3,
    model: 'MB Actros 2651 6x4',
    brand: 'Mercedes-Benz',
    year: 2019,
    km: 455000,
    price: 398500,
    fipe: 410000,
    src: 'Mercado Livre',
    city: 'Goiânia/GO',
    dealer: 'Central Diesel',
    status: 'stable',
    days: 18,
    hist: [399, 399, 398, 398, 398, 398, 398]
  }, {
    id: 4,
    model: 'DAF XF 480 6x2',
    brand: 'DAF',
    year: 2022,
    km: 198000,
    price: 578000,
    fipe: 610000,
    src: 'OLX',
    city: 'Uberlândia/MG',
    dealer: 'Particular',
    status: 'opportunity',
    days: 1,
    hist: [600, 598, 590, 585, 580, 578, 578]
  }, {
    id: 5,
    model: 'VW Constellation 24.280',
    brand: 'Volkswagen',
    year: 2018,
    km: 520000,
    price: 259000,
    fipe: 268000,
    src: 'Caminhões e Carretas',
    city: 'Chapecó/SC',
    dealer: 'Oeste Pesados',
    status: 'stable',
    days: 26,
    hist: [262, 261, 260, 259, 259, 259, 259]
  }, {
    id: 6,
    model: 'Iveco S-Way 540 6x4',
    brand: 'Iveco',
    year: 2023,
    km: 96000,
    price: 689000,
    fipe: 705000,
    src: 'Mercado Livre',
    city: 'Cuiabá/MT',
    dealer: 'Matogrosso Trucks',
    status: 'new',
    days: 0,
    hist: [689, 689, 689, 689, 689, 689, 689]
  }, {
    id: 7,
    model: 'Scania R540 6x4',
    brand: 'Scania',
    year: 2020,
    km: 388000,
    price: 468000,
    fipe: 530000,
    src: 'Só Caminhões',
    city: 'Rondonópolis/MT',
    dealer: 'Transnorte Seminovos',
    status: 'opportunity',
    days: 5,
    hist: [530, 520, 505, 495, 482, 470, 468]
  }, {
    id: 8,
    model: 'Volvo FH 460 6x2',
    brand: 'Volvo',
    year: 2019,
    km: 478000,
    price: 402000,
    fipe: 415000,
    src: 'OLX',
    city: 'Londrina/PR',
    dealer: 'Particular',
    status: 'sold',
    days: 41,
    hist: [420, 418, 415, 410, 405, 402, 402]
  }];
  const alerts = [{
    id: 'a1',
    tone: 'success',
    icon: 'lightning',
    title: 'Oportunidade: Scania R540 6x4',
    desc: '11,7% abaixo da FIPE · Rondonópolis/MT',
    time: '08:42',
    unread: true,
    rule: 'Abaixo da FIPE > 10%'
  }, {
    id: 'a2',
    tone: 'warning',
    icon: 'trend-down',
    title: 'Preço caiu: Scania R450 6x2',
    desc: 'R$ 510.000 → R$ 489.900 (−3,9%)',
    time: '07:15',
    unread: true,
    rule: 'Queda de preço > 3%'
  }, {
    id: 'a3',
    tone: 'danger',
    icon: 'plugs',
    title: 'Webmotors sem resposta',
    desc: 'Coleta atrasada há 3 h — 3 tentativas',
    time: '06:02',
    unread: true,
    rule: 'Saúde das fontes'
  }, {
    id: 'a4',
    tone: 'info',
    icon: 'storefront',
    title: 'Novo lojista: Matogrosso Trucks',
    desc: '38 anúncios publicados · Cuiabá/MT',
    time: 'Ontem',
    unread: false,
    rule: 'Novos concorrentes'
  }, {
    id: 'a5',
    tone: 'success',
    icon: 'lightning',
    title: 'Oportunidade: DAF XF 480 6x2',
    desc: '5,2% abaixo da FIPE · Uberlândia/MG',
    time: 'Ontem',
    unread: false,
    rule: 'Abaixo da FIPE > 5%'
  }];
  const daily = [410, 452, 438, 501, 476, 520, 498, 560, 544, 588, 602, 571, 640, 622, 655, 690, 648, 702, 731, 710, 754, 769, 742, 801, 788, 824, 812, 856, 870, 884];
  const prev = [380, 402, 395, 420, 410, 432, 440, 452, 448, 470, 466, 480, 492, 488, 505, 512, 508, 520, 531, 528, 540, 552, 548, 560, 566, 571, 580, 588, 594, 602];
  const byBrand = [{
    label: 'Scania',
    value: 4820
  }, {
    label: 'Volvo',
    value: 4310
  }, {
    label: 'MB',
    value: 3960
  }, {
    label: 'VW',
    value: 2780
  }, {
    label: 'DAF',
    value: 1620
  }, {
    label: 'Iveco',
    value: 1252
  }];
  return {
    fmtBRL,
    sources,
    listings,
    alerts,
    daily,
    prev,
    byBrand
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/oper-radar-admin/data.js", error: String((e && e.message) || e) }); }

// ui_kits/oper-radar-admin/shared.jsx
try { (() => {
// Shared helpers for screens
const ORK = window.OperRadarDesignSystem_f1ea51;
const {
  Badge: KBadge
} = ORK;
function useMedia(q) {
  const [m, setM] = React.useState(() => window.matchMedia(q).matches);
  React.useEffect(() => {
    const mq = window.matchMedia(q);
    const f = () => setM(mq.matches);
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, [q]);
  return m;
}
const STATUS = {
  new: {
    tone: 'info',
    label: 'Novo',
    dot: true
  },
  drop: {
    tone: 'warning',
    label: 'Preço caiu'
  },
  opportunity: {
    tone: 'accent',
    label: 'Oportunidade'
  },
  stable: {
    tone: 'neutral',
    label: 'Estável'
  },
  sold: {
    tone: 'neutral',
    label: 'Vendido'
  }
};
function StatusBadge({
  s
}) {
  const x = STATUS[s];
  return /*#__PURE__*/React.createElement(KBadge, {
    tone: x.tone,
    dot: x.dot
  }, x.label);
}
function vsFipe(l) {
  return (l.price - l.fipe) / l.fipe * 100;
}
function pct(v) {
  return (v > 0 ? '+' : '') + v.toLocaleString('pt-BR', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1
  }) + '%';
}
function PageHead({
  eyebrow,
  title,
  children
}) {
  const {
    SectionTag
  } = ORK;
  return /*#__PURE__*/React.createElement("div", {
    className: "kit-pagehead"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      minWidth: 0
    }
  }, eyebrow && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionTag, null, eyebrow)), /*#__PURE__*/React.createElement("h1", {
    className: "kit-display"
  }, title)), children && /*#__PURE__*/React.createElement("div", {
    className: "kit-pagehead__act"
  }, children));
}
Object.assign(window, {
  ORK,
  useMedia,
  StatusBadge,
  vsFipe,
  pct,
  PageHead
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/oper-radar-admin/shared.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.LiveIndicator = __ds_scope.LiveIndicator;

__ds_ns.Logo = __ds_scope.Logo;

__ds_ns.SectionTag = __ds_scope.SectionTag;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.AreaChart = __ds_scope.AreaChart;

__ds_ns.BarChart = __ds_scope.BarChart;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.DataTable = __ds_scope.DataTable;

__ds_ns.ListRow = __ds_scope.ListRow;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.Sparkline = __ds_scope.Sparkline;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.Alert = __ds_scope.Alert;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.BottomNav = __ds_scope.BottomNav;

__ds_ns.Pagination = __ds_scope.Pagination;

__ds_ns.NavItem = __ds_scope.NavItem;

__ds_ns.Sidebar = __ds_scope.Sidebar;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Topbar = __ds_scope.Topbar;

})();
