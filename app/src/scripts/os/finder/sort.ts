/* ---- Column sort ---- */
type SortCol = 'name' | 'date' | 'tags';
export const sortState = new Map<HTMLElement, { col: SortCol; asc: boolean }>();

/** Month abbreviation -> 0-based index (supports en/es/pt). */
const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
  ene: 0,
  dic: 11,
  abr: 3, // es
  dez: 11,
  out: 9,
  ago: 7,
  set: 8,
  fev: 1,
  mai: 4, // pt
};

/** Parse "Jun 2022" -> numeric sortable value, or Infinity for unknown. */
function parseDateStr(raw: string): number {
  const parts = raw.trim().split(/\s+/);
  if (parts.length < 2) return Infinity;
  const monthKey = parts[0].toLowerCase().replace(/\.$/, '');
  const month = MONTH_INDEX[monthKey] ?? 0;
  const year = parseInt(parts[1], 10) || 0;
  return year * 12 + month;
}

export function sortRows(filelist: HTMLElement, col: SortCol, asc: boolean) {
  const rowsContainer = filelist.querySelector<HTMLElement>('.finder-rows');
  if (!rowsContainer) return;
  const rows = Array.from(
    rowsContainer.querySelectorAll<HTMLElement>('.finder-row')
  );

  rows.sort((a, b) => {
    if (col === 'date') {
      const dateA = parseDateStr(a.dataset.rowStartDate || '');
      const dateB = parseDateStr(b.dataset.rowStartDate || '');
      return asc ? dateA - dateB : dateB - dateA;
    }
    const valA = (col === 'name' ? a.dataset.rowName : a.dataset.rowTags) || '';
    const valB = (col === 'name' ? b.dataset.rowName : b.dataset.rowTags) || '';
    return asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });

  rows.forEach((row) => rowsContainer.appendChild(row));
}

export function initColumnSort() {
  document
    .querySelectorAll<HTMLElement>('.finder-filelist')
    .forEach((filelist) => {
      const nameHeader =
        filelist.querySelector<HTMLElement>('.finder-col-name');
      const dateHeader =
        filelist.querySelector<HTMLElement>('.finder-col-date');
      const tagsHeader =
        filelist.querySelector<HTMLElement>('.finder-col-second');
      if (!nameHeader) return;

      sortState.set(filelist, { col: 'name', asc: true });

      const allHeaders = [nameHeader, dateHeader, tagsHeader].filter(
        Boolean
      ) as HTMLElement[];

      const resetArrows = () => {
        allHeaders.forEach((h) => {
          const svg = h.querySelector('svg');
          if (svg) {
            svg.style.transition = 'transform 0.2s ease';
            svg.style.transform = '';
          }
        });
      };

      const handleSort = (header: HTMLElement, col: SortCol) => {
        const state = sortState.get(filelist)!;
        const asc = state.col === col ? !state.asc : true;
        sortState.set(filelist, { col, asc });

        resetArrows();
        const svg = header.querySelector('svg');
        if (svg) {
          svg.style.transition = 'transform 0.2s ease';
          svg.style.transform = asc ? '' : 'rotate(180deg)';
        }

        sortRows(filelist, col, asc);
      };

      nameHeader.style.cursor = 'pointer';
      nameHeader.addEventListener('click', () =>
        handleSort(nameHeader, 'name')
      );

      if (dateHeader) {
        dateHeader.style.cursor = 'pointer';
        dateHeader.addEventListener('click', () =>
          handleSort(dateHeader, 'date')
        );
      }

      if (tagsHeader) {
        tagsHeader.style.cursor = 'pointer';
        tagsHeader.addEventListener('click', () =>
          handleSort(tagsHeader, 'tags')
        );
      }
    });
}
