import { TestBed, inject } from '@angular/core/testing';

import { FileHandleService } from './file-handle.service';

describe('FileHandleService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FileHandleService]
    });
  });

  it('should be created', inject([FileHandleService], (service: FileHandleService) => {
    expect(service).toBeTruthy();
  }));
});
