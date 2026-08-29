import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccessProtocol } from './access-protocol';

describe('AccessProtocol', () => {
  let component: AccessProtocol;
  let fixture: ComponentFixture<AccessProtocol>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccessProtocol],
    }).compileComponents();

    fixture = TestBed.createComponent(AccessProtocol);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
