import { describe, it } from 'node:test';
import assert from 'node:assert';
import { escapeCsvCell, formatCsvRow, createCsvStream } from './csv-export';

describe('CSV Export Utilities', () => {
  it('escapes standard cells', () => {
    assert.strictEqual(escapeCsvCell('hello'), '"hello"');
    assert.strictEqual(escapeCsvCell(''), '""');
    assert.strictEqual(escapeCsvCell(null), '""');
    assert.strictEqual(escapeCsvCell(undefined), '""');
    assert.strictEqual(escapeCsvCell(123), '"123"');
  });

  it('escapes cells containing double quotes (RFC 4180)', () => {
    assert.strictEqual(escapeCsvCell('He said "Hello"'), '"He said ""Hello"""');
    assert.strictEqual(escapeCsvCell('"quoted"'), '"""quoted"""');
  });

  it('handles cells containing commas and newlines safely', () => {
    assert.strictEqual(escapeCsvCell('Smith, John'), '"Smith, John"');
    assert.strictEqual(escapeCsvCell('line 1\nline 2'), '"line 1\nline 2"');
    assert.strictEqual(escapeCsvCell('line 1\r\nline 2'), '"line 1\r\nline 2"');
  });

  it('formats full CSV row with multiple columns', () => {
    const row = ['101', 'user@example.com', 'Doe, Jane', 'admin', 'Active'];
    const formatted = formatCsvRow(row);
    assert.strictEqual(formatted, '"101","user@example.com","Doe, Jane","admin","Active"');
  });

  it('streams CSV rows correctly through ReadableStream', async () => {
    const headers = ['ID', 'Name', 'Email'];
    const rows = [
      ['1', 'Alice "Ace"', 'alice@example.com'],
      ['2', 'Bob, Jr.', 'bob@example.com'],
      ['3', 'Charlie', 'charlie@example.com'],
    ];

    async function* generateRows() {
      for (const r of rows) {
        yield r;
      }
    }

    const stream = createCsvStream({
      headers,
      rowGenerator: generateRows,
    });

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let result = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value, { stream: true });
    }
    result += decoder.decode();

    const expected = [
      '"ID","Name","Email"',
      '"1","Alice ""Ace""","alice@example.com"',
      '"2","Bob, Jr.","bob@example.com"',
      '"3","Charlie","charlie@example.com"',
      '',
    ].join('\r\n');

    assert.strictEqual(result, expected);
  });
});
