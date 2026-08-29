import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetricsFeed } from './metrics-feed';

describe('MetricsFeed', () => {
  let component: MetricsFeed;
  let fixture: ComponentFixture<MetricsFeed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetricsFeed],
    }).compileComponents();

    fixture = TestBed.createComponent(MetricsFeed);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
