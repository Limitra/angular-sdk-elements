import {Component, Input, OnInit} from '@angular/core';
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

  @Input() minlength: number;
  @Input() maxlength = 5;

  @Input() min = 1;
  @Input() max = 5242880;

  @Input() accept = 'image';

  @Input() image: Array<any> = [];
  @Input() document: Array<any> = [];
  @Input() audio: Array<any> = [];
  @Input() video: Array<any> = [];

  private imageTypes: Array<any> = ['image/png', 'image/jpeg', 'image/bmp', 'image/gif'];
  private documentTypes: Array<any> = ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.ms-excel'];
  private audioTypes: Array<any> = ['audio/3gpp', 'audio/3gpp2', 'audio/mpeg', 'audio/mpeg4-generic', 'audio/ogg', 'audio/mp4'];
  private videoTypes: Array<any> = ['video/mp4', 'video/MP4V-ES', 'video/3gpp', 'video/3gpp2', 'video/3gpp-tt', 'video/mpeg4-generic']

  private canClear: boolean;
  private canUpload: boolean;
  private files: Array<any>;

  ngOnInit() {
    this.files = Array.isArray(this.value) ? this.value.map(x => {
      return { Path: x };
    }) : (this.value ? [{ Path: this.value }] : [{}]);

    this.init(() => {
      this.source = this.source || (this.validationMessages ? this.validationMessages.FileUploadSource : '');

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
              file.CanPreview = this.canPreview(response.type);
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
    });
  }

  validate() {
    this.input.nativeElement.value = 'validate';
    super.validate();
    this.input.nativeElement.value = '';
  }

  validation() {
    const invalidAnyLen = this.files.filter(x => !x.Name).length;
    const upLen = this.files.filter(x => x.Uploaded).length;
    const typeInvalidLen = this.files.filter(x => x.Type ? !this.fileTypeIsValid(x.Type) : false).length;
    const sizeInvalidLen = this.files.filter(x => x.Size ? !this.fileSizeIsValid(x.Size) : false).length;

    if (this.required && invalidAnyLen > 0 || (this.files.length > 1 && !this.required && invalidAnyLen > 0)) {
      this.addFormError('Required');
    } else {
      this.removeFormError('Required');
    }

    if (invalidAnyLen < this.files.length && upLen !== this.files.length) {
      this.addFormError('FileReadyError');
    } else {
      this.removeFormError('FileReadyError');
    }

    if (typeInvalidLen > 0) {
      this.addFormError('FileTypeError');
    } else {
      this.removeFormError('FileTypeError');
    }

    if (sizeInvalidLen > 0) {
      this.addFormError('FileSize');
    } else {
      this.removeFormError('FileSize');
    }

    if (invalidAnyLen < this.files.length && this.minlength && this.files.length < this.minlength) {
      this.addFormError('FileMinLength');
    } else {
      this.removeFormError('FileMinLength');
    }

    if (this.maxlength && this.files.length > this.maxlength) {
      this.addFormError('FileMaxLength');
    } else {
      this.removeFormError('FileMaxLength');
    }

    if (this.files.length === 1 && !this.required) {
      if (!this.files[0].Name) {
        this.files[0].Valid = true;
        this.removeFormError(null, true);
      }
    } else if (this.files.length > 1) {
      if (!this.files[0].Name && this.files[0].Valid) {
        this.files[0].Valid = undefined;
      }
    }

    this.canUpload = invalidAnyLen === 0 && sizeInvalidLen === 0 && typeInvalidLen === 0 && upLen !== this.files.length
    && (this.minlength ? this.files.length >= this.minlength : true) && this.files.length <= this.maxlength;
    this.canClear = (this.files.length > 1 ? invalidAnyLen > 0 : false) || sizeInvalidLen > 0
      || typeInvalidLen > 0 || this.files.length > this.maxlength;
  }

  localizeReplace(message: string): string {
    message = this.providers.String.Replace(message, '[$MinLength]', this.minlength ? this.minlength.toString() : '');
    message = this.providers.String.Replace(message, '[$MaxLength]', this.maxlength ? this.maxlength.toString() : '');
    message = this.providers.String.Replace(message, '[$MinSize]', this.min ? this.formatBytes(this.min) : '');
    message = this.providers.String.Replace(message, '[$MaxSize]', this.max ? this.formatBytes(this.max) : '');
    return message;
  }

  private fileChange(file: any, input: any) {
    const index = this.files.indexOf(file);
    if (input.files && input.files.length > 0) {
      const selected = input.files[0];
      const obj = {
        Name: selected.name,
        Size: selected.size,
        Type: selected.type,
        CanPreview: this.canPreview(selected.type),
        Text: selected.name + ' (' + this.formatBytes(selected.size) + ')' + ' ' + selected.type,
        Valid: this.fileTypeIsValid(selected.type) && this.fileSizeIsValid(selected.size),
        File: selected
      };
      this.files[index] = obj;
    } else {
      this.files[index] = {};
    }
    this.validate();
  }

  private fileTypeIsValid(type: string): boolean {
    if (this.accept) {
      const accept = this.accept.split(',');
      let types: Array<string> = [];
      if (accept.includes('image')) { types = types.concat(this.imageTypes).concat(this.image); }
      if (accept.includes('video')) { types = types.concat(this.videoTypes).concat(this.video); }
      if (accept.includes('audio')) { types = types.concat(this.audioTypes).concat(this.audio); }
      if (accept.includes('document')) { types = types.concat(this.documentTypes).concat(this.document); }

      return types.includes(type);
    } else {
      return false;
    }
  }

  private fileSizeIsValid(size: number): boolean {
    return size >= this.min && size <= this.max;
  }

  private addFile() {
    if (this.files.length < this.max + 1) {
      this.files.push({});
    }

    this.validate();
  }

  private clearFiles() {
    this.files = this.files.filter(x => x.Valid);
    if (this.files.length === 0) {
      this.files = [{}];
    } else if (this.files.length > this.maxlength) {
      this.files.splice(this.files.length - 1, 1);
    }
    this.validate();
  }

  private uploadFiles() {

  }

  private preview(file: string) {

  }

  private choice(input: any) {
    input.click();
  }

  private remove(file: any) {
    const index = this.files.indexOf(file);
    const refFile = this.files[index];
    if (this.files.length > 1) {
      if (refFile.Name) {
        this.files[index] = {};
      } else {
        this.files.splice(index, 1);
      }
    } else {
      this.files[index] = {};
    }
    this.validate();
  }

  private canPreview(type: string): boolean {
    return type.substring(0, 6).includes('image/');
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
