import {Component, ElementRef, Input, OnInit} from '@angular/core';
import {InputExtend} from '../../extends/InputExtend';
import {SdkProviders} from '../../../../../sdk-core/src/lib/providers';

@Component({
  selector: 'lim-input-file',
  templateUrl: './input-file.component.html',
  styleUrls: ['./input-file.component.css']
})
export class InputFileComponent extends InputExtend implements OnInit {
  constructor(protected providers: SdkProviders) { super(providers); }

  @Input() source: string;
  @Input() multiple: boolean;

  private files: Array<any>;

  ngOnInit() {
    this.files = Array.isArray(this.value) ? this.value.map(x => {
      return { Path: x };
    }) : (this.value ? [{ Path: this.value }] : [{}]);

    this.init(() => {
      this.source = this.source || (this.validationMessages ? this.validationMessages.FileUploadSource : '');
    });

    this.files.forEach(file => {
      const index = this.files.indexOf(file);
      if (file.Path) {
        file.Name = file.Path.substring(file.Path.lastIndexOf('/') + 1);
        file.Text = file.Name;
        this.downloadFile(file.Path, (response, xhr) => {
          file.Uploaded = true;
          file.Valid = true;
          if (xhr.status >= 200 && xhr.status <= 220) {
            file.Size = response.size;
            file.Type = response.type;
            file.CanPreview = response.type.substring(0, 6).includes('image/');
            file.Text = file.Text + ' (' + this.formatBytes(file.Size) + ')' + ' ' + file.Type;
          } else {
            file.Text = file.Text + ' [E: ' + xhr.status + ']';
          }

          if (index === this.files.length - 1) {
            this.validate();
          }
        });
      }
    });
  }

  preview(file: string) {

  }

  choice(input: any) {
    input.click();
  }

  remove(file: any) {
    const index = this.files.indexOf(file);
    if (this.files.length > 1) {
      this.files.splice(index, 1);
    } else {
      this.files[index] = {};
    }
    this.validate();
  }

  fileChange(file: any, input: any) {
    const index = this.files.indexOf(file);
    if (input.files && input.files.length > 0) {
      const selected = input.files[0];
      const obj = {
        Name: selected.name,
        Size: selected.size,
        Type: selected.type,
        CanPreview: selected.type.substring(0, 6).includes('image/'),
        Text: selected.name + ' (' + this.formatBytes(selected.size) + ')' + ' ' + selected.type,
        Valid: true,
        File: selected
      };
      this.files[index] = obj;
      console.log(obj)
    } else {
      this.files[index] = {};
    }
    this.validate();
  }

  validate() {
    this.input.nativeElement.value = 'valid';
    super.validate();
    this.input.nativeElement.value = '';
  }

  validation() {
    const upLen = this.files.filter(x => x.Uploaded).length;
    const validLen = this.files.filter(x => x.Valid).length;

    if (this.required && validLen === 0) {
      this.addFormError('Required');
    } else {
      this.removeFormError('Required');
    }

    if (upLen !== this.files.length) {
      this.addFormError('FileNotReadyYet');
    } else {
      this.removeFormError('FileNotReadyYet');
    }
  }

  private downloadFile(path: string, call: (response, success) => void) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', this.source + path);
    xhr.responseType = 'blob';
    xhr.onload = () => {
      call(xhr.response, xhr);
    };
    xhr.send();
  }

  private formatBytes(value: number, decimals = 2): string {
    if (value === 0) { return '0 Bytes'; }

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(value) / Math.log(k));

    return parseFloat((value / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
