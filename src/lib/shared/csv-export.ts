/**
 * RFC 4180 compliant CSV formatting and streaming utilities.
 */

export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }
  const str = String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

export function formatCsvRow(cells: unknown[]): string {
  return cells.map(escapeCsvCell).join(',');
}

export interface CsvStreamOptions {
  headers: string[];
  rowGenerator: () => AsyncGenerator<unknown[], void, unknown>;
}

export function createCsvStream({
  headers,
  rowGenerator,
}: CsvStreamOptions): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let iterator: AsyncGenerator<unknown[], void, unknown> | null = null;
  let headerSent = false;

  return new ReadableStream<Uint8Array>({
    async start() {
      iterator = rowGenerator();
    },
    async pull(controller) {
      if (!headerSent) {
        headerSent = true;
        controller.enqueue(encoder.encode(formatCsvRow(headers) + '\r\n'));
        return;
      }

      if (!iterator) {
        controller.close();
        return;
      }

      try {
        const { value, done } = await iterator.next();
        if (done) {
          controller.close();
        } else if (value) {
          controller.enqueue(encoder.encode(formatCsvRow(value) + '\r\n'));
        }
      } catch (err) {
        controller.error(err);
      }
    },
    async cancel() {
      if (iterator?.return) {
        await iterator.return();
      }
    },
  });
}
