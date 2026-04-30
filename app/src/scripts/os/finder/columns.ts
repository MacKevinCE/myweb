const SEP_W = 5;
const COL_PAD = 8; // breathing room added to measured min widths

/**
 * Each column is described by its CSS variable, a row cell selector for
 * measuring min-width, a floor minimum, and a default width hint.
 */
interface ColDef {
  cssVar: string;
  headerSelector: string;
  rowSelector: string;
  floorMin: number;
}

/** Return ordered column definitions for a filelist. Last entry is the filler. */
function getColDefs(filelist: HTMLElement): ColDef[] {
  const base: ColDef[] = [
    {
      cssVar: '--finder-name-w',
      headerSelector: '.finder-col-name',
      rowSelector: '.finder-row-name',
      floorMin: 120,
    },
  ];
  if (filelist.classList.contains('finder-filelist--3col')) {
    base.push({
      cssVar: '--finder-date-w',
      headerSelector: '.finder-col-date',
      rowSelector: '.finder-row-date',
      floorMin: 80,
    });
  }
  // Last column (filler) -- Tags
  base.push({
    cssVar: '--finder-tags-w',
    headerSelector: '.finder-col-second',
    rowSelector: '.finder-row-second',
    floorMin: 80,
  });
  return base;
}

/** Total space available for column content (panel width minus all separators). */
function getPanelAvail(filelist: HTMLElement): number {
  const panel = filelist.closest<HTMLElement>('.finder-panel');
  const panelW = panel ? panel.offsetWidth : filelist.offsetWidth;
  const sepCount = filelist.querySelectorAll('.finder-col-sep').length;
  return panelW - sepCount * SEP_W;
}

/**
 * Measure the TRUE minimum content width by temporarily removing constraints.
 * Returns a Map from cssVar -> measured minimum width.
 */
function measureColMins(filelist: HTMLElement): Map<string, number> {
  const cols = getColDefs(filelist);

  // Save current values
  const saved = new Map<string, string>();
  for (const col of cols) {
    saved.set(col.cssVar, filelist.style.getPropertyValue(col.cssVar));
    filelist.style.setProperty(col.cssVar, 'max-content');
  }

  // Force layout recalc
  filelist.offsetHeight; // eslint-disable-line @typescript-eslint/no-unused-expressions

  const mins = new Map<string, number>();
  for (const col of cols) {
    let min = col.floorMin;
    // Measure header width
    const header = filelist.querySelector<HTMLElement>(col.headerSelector);
    if (header) min = Math.max(min, header.scrollWidth + COL_PAD);
    // Measure row cells
    filelist.querySelectorAll<HTMLElement>(col.rowSelector).forEach((el) => {
      min = Math.max(min, el.scrollWidth + COL_PAD);
    });
    mins.set(col.cssVar, min);
  }

  // Restore
  for (const col of cols) {
    const prev = saved.get(col.cssVar)!;
    if (prev) filelist.style.setProperty(col.cssVar, prev);
    else filelist.style.removeProperty(col.cssVar);
  }

  return mins;
}

/** Read current width of a column from its CSS variable. */
function readColW(
  filelist: HTMLElement,
  cssVar: string,
  fallback: number
): number {
  const raw = filelist.style.getPropertyValue(cssVar);
  return parseFloat(raw) || fallback;
}

/**
 * Calculate default column widths and apply them.
 * - First column (Name): splits remaining space with filler.
 * - Middle columns (Date, etc.): start at their measured minimum.
 * - Last column (filler/Tags): takes whatever remains.
 */
export function applyDefaultWidths(filelist: HTMLElement) {
  if (!filelist.offsetWidth) return;
  const cols = getColDefs(filelist);
  const mins = measureColMins(filelist);
  const availW = getPanelAvail(filelist);

  const widths = new Map<string, number>();

  // Middle columns (neither first nor last) get their measured min
  let middleW = 0;
  for (let i = 1; i < cols.length - 1; i++) {
    const w = mins.get(cols[i].cssVar)!;
    widths.set(cols[i].cssVar, w);
    middleW += w;
  }

  // First and last split the remaining space
  const remaining = availW - middleW;
  const firstMin = mins.get(cols[0].cssVar)!;
  const lastMin = mins.get(cols[cols.length - 1].cssVar)!;
  const firstW = Math.max(firstMin, Math.floor(remaining / 2));
  const lastW = Math.max(lastMin, remaining - firstW);

  widths.set(cols[0].cssVar, firstW);
  widths.set(cols[cols.length - 1].cssVar, lastW);

  // Apply
  for (const col of cols) {
    filelist.style.setProperty(col.cssVar, `${widths.get(col.cssVar)}px`);
  }
}

/**
 * Recalculate the last (filler) column to fill remaining space,
 * keeping all other columns at their current widths.
 */
function adjustFillerCol(filelist: HTMLElement) {
  if (!filelist.offsetWidth) return;
  const cols = getColDefs(filelist);
  const mins = measureColMins(filelist);
  const availW = getPanelAvail(filelist);

  // Sum widths of all non-filler columns
  let usedW = 0;
  for (let i = 0; i < cols.length - 1; i++) {
    usedW += readColW(filelist, cols[i].cssVar, cols[i].floorMin);
  }

  const filler = cols[cols.length - 1];
  const fillerW = Math.max(mins.get(filler.cssVar)!, availW - usedW);
  filelist.style.setProperty(filler.cssVar, `${fillerW}px`);
}

// Track whether user has dragged a separator (per filelist)
export const userResized = new WeakSet<HTMLElement>();

export function initColumnSizing() {
  document
    .querySelectorAll<HTMLElement>('.finder-filelist')
    .forEach((filelist) => {
      applyDefaultWidths(filelist);

      let prevW = 0;
      let resizeTimer: ReturnType<typeof setTimeout>;
      const ro = new ResizeObserver((entries) => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          for (const entry of entries) {
            const w = entry.contentRect.width;
            if (w > 0 && w !== prevW) {
              if (prevW === 0) {
                applyDefaultWidths(filelist);
              } else {
                adjustFillerCol(filelist);
              }
              prevW = w;
            }
          }
        }, 100);
      });
      ro.observe(filelist);
    });
}

/**
 * Generic column resize: each separator controls the column to its LEFT.
 * The last column always adjusts to fill remaining space.
 */
export function initColumnResize() {
  document
    .querySelectorAll<HTMLElement>('.finder-filelist')
    .forEach((filelist) => {
      const seps = Array.from(
        filelist.querySelectorAll<HTMLElement>('.finder-col-sep')
      );
      if (!seps.length) return;

      const cols = getColDefs(filelist);

      seps.forEach((sep, sepIndex) => {
        // This separator controls the column at sepIndex (0-based)
        const col = cols[sepIndex];
        if (!col) return;

        let startX = 0;
        let startW = 0;

        const onStart = (clientX: number) => {
          const mins = measureColMins(filelist);
          const colMin = mins.get(col.cssVar)!;
          startX = clientX;
          startW = readColW(filelist, col.cssVar, col.floorMin);
          document.body.style.userSelect = 'none';
          document.body.style.cursor = 'col-resize';

          // Max: available - other non-filler cols - filler min
          const filler = cols[cols.length - 1];
          const fillerMin = mins.get(filler.cssVar)!;
          const availW = getPanelAvail(filelist);
          let othersW = 0;
          for (let i = 0; i < cols.length - 1; i++) {
            if (i !== sepIndex) {
              othersW += readColW(filelist, cols[i].cssVar, cols[i].floorMin);
            }
          }
          const colMax = availW - othersW - fillerMin;

          const onMove = (cx: number) => {
            const dx = cx - startX;
            const newW = Math.max(colMin, Math.min(colMax, startW + dx));
            filelist.style.setProperty(col.cssVar, `${newW}px`);
            adjustFillerCol(filelist);
          };

          const onEnd = () => {
            userResized.add(filelist);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
          };

          const handleMouseMove = (ev: MouseEvent) => onMove(ev.clientX);
          const handleMouseUp = () => onEnd();
          const handleTouchMove = (ev: TouchEvent) => {
            if (ev.touches.length > 0) onMove(ev.touches[0].clientX);
          };
          const handleTouchEnd = () => onEnd();

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
          document.addEventListener('touchmove', handleTouchMove, {
            passive: true,
          });
          document.addEventListener('touchend', handleTouchEnd);
        };

        sep.addEventListener('mousedown', (e) => {
          e.preventDefault();
          onStart(e.clientX);
        });

        sep.addEventListener(
          'touchstart',
          (e) => {
            if (e.touches.length > 0) {
              e.preventDefault();
              onStart(e.touches[0].clientX);
            }
          },
          { passive: false }
        );
      });
    });
}
