import React from 'react';
import { Icon } from '../core/Icon.jsx';
const cx=(...a)=>a.filter(Boolean).join(' ');
export function DataTable({ columns = [], rows = [], rowKey = 'id', sort, onSort, onRowClick, selectedKey, dense, stackOnMobile = true, empty, className, style }) {
  return (
    <div className={cx('or-table-wrap', className)} style={style}>
      <table className={cx('or-table', dense && 'or-table--dense', stackOnMobile && 'or-table--stack')}>
        <thead><tr>{columns.map((c) => {
          const s = sort && sort.key === c.key ? sort.dir : null;
          return <th key={c.key} className={cx(c.align === 'right' && 'or-r', c.sortable && 'or-sortable')} style={{ width: c.width }} onClick={c.sortable && onSort ? () => onSort({ key: c.key, dir: s === 'asc' ? 'desc' : 'asc' }) : undefined} aria-sort={s ? (s === 'asc' ? 'ascending' : 'descending') : undefined}>
            {c.header}{c.sortable && <Icon name={s === 'asc' ? 'caret-up' : s === 'desc' ? 'caret-down' : 'caret-up-down'} weight="bold" />}
          </th>;
        })}</tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>{empty || 'Nenhum resultado'}</td></tr>}
          {rows.map((r, i) => {
            const k = r[rowKey] != null ? r[rowKey] : i;
            return <tr key={k} className={cx(selectedKey === k && 'or-selected')} onClick={onRowClick ? () => onRowClick(r) : undefined} style={{ cursor: onRowClick ? 'pointer' : undefined }}>
              {columns.map((c, ci) => <td key={c.key} data-label={typeof c.header === 'string' ? c.header : ''} data-primary={c.primary || (ci === 0 && !columns.some((x) => x.primary)) ? '' : undefined} className={cx(c.align === 'right' && 'or-r', c.muted && 'or-muted')}>{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  );
}
