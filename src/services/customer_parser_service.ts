import { EventEmitter } from 'events';
import { validate } from 'uuid';

import CRMFileParserService, { ICRMParseError, ICRMRecord } from './crm_file_parser_service';
import EventLocationService from './event_location_service';

interface IParsedCRMRecord {
  id: string;
  lat: number;
  long: number;
}

interface ICustomer extends IParsedCRMRecord {
  distance: number;
}

interface CustomerParserService {
   emit(event: 'done', errors: [number, string][], customers: ICustomer[]): boolean;
   emit(event: 'close', lines: number, errors: number): boolean;
   on(event: 'done', listener: (errors: [number, string][], customers: ICustomer[]) => void): this;
   on(event: 'close', listener: (lines: number, errors: 'number') => void): this;
}

class CustomerParserService extends EventEmitter {
  filePath: string;
  errors: [number, string][];
  customers: ICustomer[];

  constructor(filePath: string) {
    super();

    this.filePath = filePath;

    this.errors = [];
    this.customers = [];
    this.crmService = new CRMFileParserService(filePath);
    this.crmService.on('error', this.parseError.bind(this));
    this.crmService.on('record', this.parseCustomer.bind(this));
    this.crmService.on('done', this.sortCustomers.bind(this));
  }

  private crmService: CRMFileParserService;

  private parseError(line: number, { message }: ICRMParseError) {
    this.errors.push([line, message]);
  }

  private parseCustomer(line: number, record: ICRMRecord): void {
    const parsedRecord = this.parseRecord(line, record);

    if (parsedRecord) {
      const distance = EventLocationService.calculateDistance({
        lat: parsedRecord.lat, long: parsedRecord.long
      });

      if (distance <= 100) {
        this.customers.push({
          distance,
          id: parsedRecord.id,
          lat: parsedRecord.lat,
          long: parsedRecord.long,
        });
      }
    }
  }

  private parseRecord(line: number, record: ICRMRecord): IParsedCRMRecord | null {
    const parsedRecord: IParsedCRMRecord = {
      id: record.id,
      lat: parseFloat(record.lat),
      long: parseFloat(record.long),
    };

    if (!this.validate(line, parsedRecord)) {
      return null;
    }

    return parsedRecord;
  }

  private validate(line:number, parsedRecord: IParsedCRMRecord): boolean {
    const errors: [number, string][] = [];

    if (!parsedRecord.id) {
      errors.push([line, 'empty ID']);
    } else if (!validate(parsedRecord.id)) {
      errors.push([line, 'invalid ID']);
    }

    if (isNaN(parsedRecord.lat)) {
      errors.push([line, 'invalid lat.']);
    }

    if (isNaN(parsedRecord.long)) {
      errors.push([line, 'invalid long.']);
    }

    if (errors.length) {
      this.errors.push(...errors);
      return false;
    }

    return true;
  }

  private sortCustomers(): void {
    this.customers = this
      .customers
      .sort((c1, c2) => c1.id.localeCompare(c2.id));

    this.emit('done', this.errors, this.customers);
  }
}

export default CustomerParserService
