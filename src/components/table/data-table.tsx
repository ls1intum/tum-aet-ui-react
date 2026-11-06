import type { HTMLAttributes, Key, ReactNode, Ref } from 'react';
import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { cx } from '../../internal/cx';
import { useTranslate } from '../../internal/i18n';
import { SearchIcon, SortDownIcon, SortIcon, SortUpIcon } from '../../internal/icons';
import { Paginator } from '../paginator/paginator';
import {
  Tooltip,
  TooltipArrow,
  TooltipPopup,
  TooltipPortal,
  TooltipPositioner,
  TooltipTrigger,
} from '../tooltip/tooltip';
import { CircleQuestionIcon } from './icons';
import {
  ariaSortFor,
  columnName,
  formatCellValue,
  getByPath,
  lastPageIndex,
  nextSort,
  type ColumnDef,
  type SortDirection,
  type SortState,
  type TableQuery,
} from './table-utils';

const SEARCH_DEBOUNCE_MS = 300;

/** True for a string that is neither missing nor empty. */
function nonEmpty(value: string | undefined): value is string {
  return value !== undefined && value !== '';
}

/** True for anything React would render as visible content (not nullish, boolean, empty string or 0). */
function hasContent(node: ReactNode): boolean {
  return node !== undefined && node !== null && node !== false && node !== '' && node !== 0;
}

function sortGlyphFor(sort: SortState | undefined, field: string | undefined) {
  if (sort === undefined || sort.field !== field) {
    return SortIcon;
  }
  return sort.direction === 'asc' ? SortUpIcon : SortDownIcon;
}

export interface DataTableApi {
  /** Jumps back to the first page and requests data. For consumers that own filtering themselves (`showSearch` off). */
  resetPage: () => void;
}

export interface DataTableProps<T> extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Columns in display order. Nested field paths use `a.b[0].c` syntax. */
  columns: Array<ColumnDef<T>>;
  /** Rows of the current page. Sorting and filtering are not applied locally. */
  rows: T[];
  /** Total number of records on the server, for the paginator. */
  totalRecords?: number;
  /** Shows a spinner overlay, sets `aria-busy` and disables the paginator. */
  loading?: boolean;
  /** Renders the content of an extra trailing actions column. */
  rowActions?: (row: T) => ReactNode;
  /** Identifies rows to highlight. */
  rowHighlighted?: (row: T) => boolean;
  /** Stable key per row; defaults to the row index. */
  getRowKey?: (row: T, index: number) => Key;
  /** Alternating row background. */
  striped?: boolean;
  /** Scrolls vertically inside the table and keeps the header row sticky. */
  scrollable?: boolean;
  /** Max height of the scroll area (any CSS length), or `'flex'` to fill a flex parent. */
  scrollHeight?: string;
  /** Shows the search field (debounced by 300 ms). */
  showSearch?: boolean;
  /** Translation key or text. */
  searchPlaceholder?: string;
  /** Translation key or text shown when there are no rows. */
  emptyMessage?: string;
  /** Initial rows per page. */
  pageSize?: number;
  /** Choices of the rows-per-page select. */
  pageSizeOptions?: number[];
  /** Shows the rows-per-page select. */
  showRowsPerPage?: boolean;
  /** Shows the "Showing x to y of z" text. */
  showCurrentPageReport?: boolean;
  /** Field sorted at first, reported with the first data request. */
  initialSortField?: string;
  /** Direction of the initial sort. */
  initialSortDirection?: SortDirection;
  /** Visually hidden caption that names the table. Alternatively pass `aria-label` or `aria-labelledby`. */
  caption?: ReactNode;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  /** Called on mount and whenever page, page size, sort or the (debounced) search term changes. */
  onDataRequest?: (query: TableQuery) => void;
  /** Receives the imperative API (`resetPage`). */
  apiRef?: Ref<DataTableApi>;
  ref?: Ref<HTMLDivElement>;
}

/** Server-driven table: the consumer owns the rows and answers `onDataRequest`. Sorting, search and paging only request data. */
export function DataTable<T>({
  columns,
  rows,
  totalRecords = 0,
  loading = false,
  rowActions,
  rowHighlighted,
  getRowKey,
  striped = false,
  scrollable = false,
  scrollHeight,
  showSearch = true,
  searchPlaceholder = 'tumAetUi.table.searchPlaceholder',
  emptyMessage = 'tumAetUi.table.noResults',
  pageSize = 50,
  pageSizeOptions,
  showRowsPerPage = true,
  showCurrentPageReport = true,
  initialSortField,
  initialSortDirection = 'asc',
  caption,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  onDataRequest,
  apiRef,
  className,
  style,
  ...rest
}: DataTableProps<T>) {
  const t = useTranslate();
  const [page, setPage] = useState(0);
  const [pageSizeState, setPageSizeState] = useState<number | undefined>(undefined);
  const [sort, setSort] = useState<SortState | undefined>(
    nonEmpty(initialSortField) ? { field: initialSortField, direction: initialSortDirection } : undefined,
  );
  const searchTerm = useRef('');
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const requested = useRef(false);

  const effectivePageSize = pageSizeState ?? pageSize;
  const lastPage = lastPageIndex(totalRecords, effectivePageSize);
  const currentPage = Math.min(page, lastPage);

  const latest = useRef({ page, effectivePageSize, sort, onDataRequest });
  // Keeps the latest values for the emitters below; layout effects run before the effects that read them.
  useLayoutEffect(() => {
    latest.current = { page, effectivePageSize, sort, onDataRequest };
  });

  const emit = (next: { page?: number; pageSize?: number; sort?: SortState | undefined } = {}) => {
    const state = latest.current;
    const trimmedTerm = searchTerm.current.trim();
    state.onDataRequest?.({
      pageIndex: next.page ?? state.page,
      pageSize: next.pageSize ?? state.effectivePageSize,
      sort: 'sort' in next ? next.sort : state.sort,
      searchTerm: nonEmpty(trimmedTerm) ? trimmedTerm : undefined,
    });
  };

  useEffect(() => {
    if (!requested.current) {
      requested.current = true;
      emit();
    }
    return () => clearTimeout(searchTimer.current);
  }, []);

  // A shrinking result set can leave the page past the end: step back and request that page.
  // The page is stepped back while rendering; `clampCount` then triggers the data request for it after the commit.
  const [clampCount, setClampCount] = useState(0);
  if (page > lastPage) {
    setPage(lastPage);
    setClampCount(clampCount + 1);
  }
  useEffect(() => {
    if (clampCount > 0) {
      emit({ page: latest.current.page });
    }
  }, [clampCount]);

  useImperativeHandle(apiRef, () => ({
    resetPage: () => {
      if (latest.current.page === 0) return;
      setPage(0);
      emit({ page: 0 });
    },
  }));

  const sortColumn = (field: string) => {
    const next = nextSort(sort, field);
    setSort(next);
    setPage(0);
    emit({ page: 0, sort: next });
  };

  const onSearchInput = (value: string) => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      searchTerm.current = value;
      setPage(0);
      emit({ page: 0 });
    }, SEARCH_DEBOUNCE_MS);
  };

  const columnCount = columns.length + (rowActions ? 1 : 0);
  const empty = rows.length === 0;
  const scrollStyle = {
    overflowY: scrollable ? 'auto' : undefined,
    flex: scrollHeight === 'flex' ? '1 1 0%' : undefined,
    minHeight: scrollHeight === 'flex' ? 0 : undefined,
    maxHeight: nonEmpty(scrollHeight) && scrollHeight !== 'flex' ? scrollHeight : undefined,
  } as const;

  return (
    <div {...rest} style={style} className={cx('tumaet-ui-data-table', className)}>
      {showSearch ? (
        <div className="tumaet-ui-data-table-search">
          <SearchIcon className="tumaet-ui-icon tumaet-ui-data-table-search-icon" />
          <input
            type="search"
            placeholder={t(searchPlaceholder)}
            aria-label={t(searchPlaceholder)}
            onChange={(event) => onSearchInput(event.target.value)}
          />
        </div>
      ) : null}

      <div className="tumaet-ui-data-table-scroll" style={scrollStyle}>
        <table
          className="tumaet-ui-data-table-table"
          data-striped={striped || undefined}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-busy={loading || undefined}
          data-sticky={scrollable || undefined}
        >
          {hasContent(caption) ? <caption className="tumaet-ui-data-table-sr-only">{caption}</caption> : null}
          <thead>
            <tr>
              {columns.map((col, index) => {
                const sortField = col.sort === true && nonEmpty(col.field) ? col.field : undefined;
                const heading = nonEmpty(col.headerKey) ? t(col.headerKey) : col.header;
                const tooltip = nonEmpty(col.headerTooltip) ? t(col.headerTooltip) : undefined;
                const SortGlyph = sortGlyphFor(sort, col.field);
                return (
                  <th
                    key={columnName(col, index)}
                    scope="col"
                    style={nonEmpty(col.width) ? { minWidth: col.width } : undefined}
                    aria-sort={sortField !== undefined ? ariaSortFor(sort, sortField) : undefined}
                    data-hide-below={col.hideBelow}
                    data-wrap={col.wrapHeader === true ? true : undefined}
                  >
                    <span className="tumaet-ui-data-table-heading">
                      {sortField !== undefined ? (
                        <button
                          type="button"
                          className="tumaet-ui-data-table-sort"
                          onClick={() => sortColumn(sortField)}
                        >
                          <span>{heading}</span>
                          <SortGlyph className="tumaet-ui-icon tumaet-ui-data-table-sort-icon" />
                        </button>
                      ) : (
                        <span>{heading}</span>
                      )}
                      {tooltip !== undefined && tooltip !== '' ? (
                        <Tooltip>
                          <TooltipTrigger
                            render={<button type="button" className="tumaet-ui-data-table-help" aria-label={tooltip} />}
                          >
                            <CircleQuestionIcon />
                          </TooltipTrigger>
                          <TooltipPortal>
                            <TooltipPositioner>
                              <TooltipPopup>
                                {tooltip}
                                <TooltipArrow />
                              </TooltipPopup>
                            </TooltipPositioner>
                          </TooltipPortal>
                        </Tooltip>
                      ) : null}
                    </span>
                  </th>
                );
              })}
              {rowActions ? (
                <th scope="col">
                  <span className="tumaet-ui-data-table-sr-only">{t('tumAetUi.table.actions')}</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={getRowKey ? getRowKey(row, rowIndex) : rowIndex}
                data-highlighted={rowHighlighted?.(row) === true ? true : undefined}
              >
                {columns.map((col, index) => {
                  const value = nonEmpty(col.field) ? getByPath(row, col.field) : undefined;
                  return (
                    <td key={columnName(col, index)} data-hide-below={col.hideBelow}>
                      {col.cell ? col.cell({ data: row, col, value, rowIndex }) : formatCellValue(value)}
                    </td>
                  );
                })}
                {rowActions ? <td className="tumaet-ui-data-table-actions">{rowActions(row)}</td> : null}
              </tr>
            ))}
            {empty ? (
              <tr>
                <td colSpan={Math.max(1, columnCount)} className="tumaet-ui-data-table-empty">
                  {t(emptyMessage)}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        {loading ? (
          <div className="tumaet-ui-data-table-loading" aria-hidden="true">
            <span className="tumaet-ui-data-table-spinner" />
          </div>
        ) : null}
      </div>

      {/* Announces an empty result; the paginator announces the range. */}
      <div role="status" className="tumaet-ui-data-table-sr-only">
        {empty && !loading ? t(emptyMessage) : ''}
      </div>

      <Paginator
        totalRecords={totalRecords}
        page={currentPage}
        pageSize={effectivePageSize}
        pageSizeOptions={pageSizeOptions}
        showRowsPerPage={showRowsPerPage}
        showCurrentPageReport={showCurrentPageReport}
        disabled={loading}
        onPageChange={(next) => {
          setPage(next);
          emit({ page: next });
        }}
        onPageSizeChange={(size) => {
          setPageSizeState(size);
          setPage(0);
          emit({ page: 0, pageSize: size });
        }}
      />
    </div>
  );
}
