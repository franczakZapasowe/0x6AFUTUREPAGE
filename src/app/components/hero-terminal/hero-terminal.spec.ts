import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeroTerminal } from './hero-terminal';

describe('HeroTerminal', () => {
  let component: HeroTerminal;
  let fixture: ComponentFixture<HeroTerminal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroTerminal],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroTerminal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
