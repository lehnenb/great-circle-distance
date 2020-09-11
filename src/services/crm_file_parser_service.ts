import { createInterface, Interface as ReadLineInterface } from 'readline';
import { createReadStream } from 'fs';
import { EventEmitter } from 'events';

export interface ICRMRecord {
  [key: string]: string
}

export interface ICRMParseError {
  code: 'EMPTY_LINE_ERROR' | 'INVALID_FORMAT_ERROR';
  message: string;
}

interface CRMFileParserService {
   emit(event: 'record', line: number, customer: ICRMRecord): boolean;
   emit(event: 'error', line: number, error: ICRMParseError): boolean;
   emit(event: 'done', lines: number, errors: number): boolean;
   on(event: 'record', listener: (line: number, record: ICRMRecord) => void): this;
   on(event: 'error', listener: (line: number, error: ICRMParseError) => void): this;
   on(event: 'done', listener: (lines: number, errors: 'number') => void): this;
}

class CRMFileParserService extends EventEmitter  {
  filePath: string;
  totalLines = 0;
  totalErrors = 0;

  constructor(filePath: string) {
    super();

    this.filePath = filePath;

    this.lineReader = createInterface({ input: createReadStream(this.filePath) });

    this.lineReader.on('line', (line) => {
      this.parseLine(line);
      this.totalLines += 1;
    });

    this.lineReader.on('close', this.emitDone.bind(this));
  }

  private lineReader: ReadLineInterface;

  private parseLine(line: string): void {
    if (line !== '') {
      const fields = this.parseFields(line);

      if (Object.keys(fields).length === 0) {
        this.emitError('INVALID_FORMAT_ERROR', 'invalid line format');
        this.totalErrors += 1;
      }

      this.emit('record', this.totalLines + 1, fields);
    } else {
      this.emitError('EMPTY_LINE_ERROR', 'line is empty');
      this.totalErrors += 1;
    }
  }

  private parseFields (line: string): ICRMRecord {
    const segments = line.split(/,\s?/);

    const fieldReducer = (acc: ICRMRecord, segment: string) => {
      const [replaceable, fieldName] = segment.match(/([a-z]+):/) || [];
      const value = segment.replace(replaceable, '');

      if (fieldName && value) {
        acc[fieldName] = value.trim();
      }

      return acc;
    };

    return segments.reduce(fieldReducer, {});
  }

  private emitError(code: ICRMParseError['code'], message: string): void {
    this.emit('error', this.totalLines + 1, { code, message });
  }

  private emitDone(): void {
    this.emit('done', this.totalLines, this.totalErrors)
  }
}

export default CRMFileParserService
