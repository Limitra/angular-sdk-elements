import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
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

  @Input() includeImage: Array<any> = [];
  @Input() includeDocument: Array<any> = [];
  @Input() includeAudio: Array<any> = [];
  @Input() includeVideo: Array<any> = [];

  @Input() excludeImage: Array<any> = [];
  @Input() excludeDocument: Array<any> = [];
  @Input() excludeAudio: Array<any> = [];
  @Input() excludeVideo: Array<any> = [];

  private imageTypes: Array<any> = ['image/png', 'image/jpeg', 'image/bmp', 'image/gif'];
  private documentTypes: Array<any> = ['text/plain', 'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel'];
  private audioTypes: Array<any> = ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/3gpp',
    'audio/3gpp2', 'audio/mpeg4-generic', 'audio/mp4'];
  private videoTypes: Array<any> = ['video/mp4', 'video/webm', 'video/ogg', 'video/MP4V-ES',
    'video/3gpp', 'video/3gpp2', 'video/3gpp-tt', 'video/mpeg4-generic'];

  private preview: any;
  private canClear: boolean;
  private canUpload: boolean;
  private files: Array<any>;

  @ViewChild('imagePreview', { static: false }) imagePreview: ElementRef;
  @ViewChild('audioPreview', { static: false }) audioPreview: ElementRef;
  @ViewChild('videoPreview', { static: false }) videoPreview: ElementRef;
  @ViewChild('documentPreview', { static: false }) documentPreview: ElementRef;

  ngOnInit() {
    this.files = Array.isArray(this.value) ? this.value.map(x => {
      return { Path: x };
    }) : (this.value ? [{ Path: this.value }] : [{}]);

    this.imageTypes = this.image;
    this.videoTypes = this.video;
    this.audioTypes = this.audio;
    this.documentTypes = this.document;

    this.imageTypes = this.imageTypes.concat(this.includeImage);
    this.videoTypes = this.videoTypes.concat(this.includeVideo);
    this.audioTypes = this.audioTypes.concat(this.includeAudio);
    this.documentTypes = this.documentTypes.concat(this.includeDocument);

    this.imageTypes = this.imageTypes.filter(x => !this.excludeImage.includes(x));
    this.videoTypes = this.videoTypes.filter(x => !this.excludeVideo.includes(x));
    this.audioTypes = this.audioTypes.filter(x => !this.excludeAudio.includes(x));
    this.documentTypes = this.documentTypes.filter(x => !this.excludeDocument.includes(x));

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

  forceValue() {
    this.value = this.files.filter(x => x.Uploaded && x.Path).map(x => x.Path);
    this.valueChange.emit(this.value);
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
      if (accept.includes('image')) { types = types.concat(this.imageTypes); }
      if (accept.includes('video')) { types = types.concat(this.videoTypes); }
      if (accept.includes('audio')) { types = types.concat(this.audioTypes); }
      if (accept.includes('document')) { types = types.concat(this.documentTypes); }

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
    const files = this.files.filter(x => !x.Uploaded && x.File);
    files.forEach(file => {

    });
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
    let can = type.substring(0, 6).includes('image/');
    switch (type) {
      case 'application/pdf':
      case 'video/mp4':
      case 'video/webm':
      case 'video/ogg':
      case 'audio/mpeg':
      case 'audio/ogg':
      case 'audio/wav': {
        can = true;
        break;
      }
    }
    return can;
  }

  private showPreview(file: any) {
    if (file && file.CanPreview) {
      this.preview = file;
      setTimeout(() => {
        if (file.Uploaded) {
          if (this.imageTypes.includes(file.Type)) {
            this.imagePreview.nativeElement.src = this.source + this.preview.Path;
          } else if (this.audioTypes.includes(file.Type)) {
            this.audioPreview.nativeElement.src = this.source + this.preview.Path;
          } else if (this.videoTypes.includes(file.Type)) {
            this.videoPreview.nativeElement.src = this.source + this.preview.Path;
          } else if (this.documentTypes.includes(file.Type)) {
            this.documentPreview.nativeElement.src = this.source + this.preview.Path;
          }
        } else {
          if (this.imageTypes.includes(file.Type)) {
            this.loadFile(file.File, (result) => { this.imagePreview.nativeElement.src = result; });
          } else if (this.audioTypes.includes(file.Type)) {
            this.loadFile(file.File, (result) => { this.audioPreview.nativeElement.src = result; });
          } else if (this.videoTypes.includes(file.Type)) {
            this.loadFile(file.File, (result) => { this.videoPreview.nativeElement.src = result; });
          } else if (this.documentTypes.includes(file.Type)) {
            this.loadFile(file.File, (result) => { this.documentPreview.nativeElement.src = result; });
          }
        }
      });
    }
  }

  private loadFile(file: any, call: (result) => void) {
    const reader = new FileReader();
    reader.onload = (event: any) => {
      call(event.target.result);
    };
    reader.readAsDataURL(file);
  }

  private downloadFile(path: string, call: (response, success) => void) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', this.source + path);
    xhr.responseType = 'blob';
    xhr.onload = () => {
      call(xhr.response, xhr);
    };
    xhr.onerror = (err) => {
      call(undefined, { status: 500 });
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
