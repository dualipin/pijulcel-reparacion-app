import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UploadVideoPage } from './upload-video.page';

describe('UploadVideoPage', () => {
  let component: UploadVideoPage;
  let fixture: ComponentFixture<UploadVideoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadVideoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
