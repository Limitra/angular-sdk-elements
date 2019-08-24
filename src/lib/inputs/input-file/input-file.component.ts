import {Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {InputExtend} from '../../extends/input-extend';
import {SdkProviders} from '@limitra/sdk-core';

@Component({
  selector: 'lim-input-file',
  templateUrl: './input-file.component.html',
  styleUrls: ['./input-file.component.css']
})
export class InputFileComponent extends InputExtend implements OnInit, OnDestroy {
  constructor(public providers: SdkProviders) { super(providers); }

  @Input() domain: string;
  @Input() upload: string;
  @Input() download: string;

  @Input() multiple: boolean;

  @Input() minlength: number;
  @Input() maxlength = 5;

  @Input() imageMaxLength;
  @Input() audioMaxLength;
  @Input() videoMaxLength;
  @Input() documentMaxLength;

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

  public imageTypes: Array<any> = ['image/png', 'image/jpeg', 'image/bmp', 'image/gif'];
  public documentTypes: Array<any> = ['text/plain', 'application/pdf'];
  public audioTypes: Array<any> = ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/3gpp', 'audio/mp3', 'audio/mp4'];
  public videoTypes: Array<any> = ['video/mp4', 'video/webm', 'video/ogg'];

  private dragging: any;
  private source: string;

  private fileProvider: any = {};

  public preview: any;
  public canUpload: boolean;
  public canClear: boolean;
  public progress: boolean;
  public sortable: boolean;
  public files: Array<any>;

  @ViewChild('imagePreview', { static: false }) imagePreview: ElementRef;
  @ViewChild('audioPreview', { static: false }) audioPreview: ElementRef;
  @ViewChild('videoPreview', { static: false }) videoPreview: ElementRef;
  @ViewChild('documentPreview', { static: false }) documentPreview: ElementRef;

  ngOnInit() {
    this.preInit(true);
    const apiSettings = this.providers.Storage.Get('API_Settings') || {};
    const fileProvider = apiSettings.File ? apiSettings.File : {};
    this.fileProvider = {
      Domain: apiSettings.Domain,
      Upload: fileProvider.Upload,
      Download: fileProvider.Download,
      Settings: {
        MaxLength: {
          Image: fileProvider.Settings && fileProvider.Settings.MaxLength ? fileProvider.Settings.MaxLength.Image : 5242880,
          Audio: fileProvider.Settings && fileProvider.Settings.MaxLength ? fileProvider.Settings.MaxLength.Audio : 5242880,
          Video: fileProvider.Settings && fileProvider.Settings.MaxLength ? fileProvider.Settings.MaxLength.Video : 5242880,
          Document: fileProvider.Settings && fileProvider.Settings.MaxLength ? fileProvider.Settings.MaxLength.Document : 5242880
        }
      }
    };

    this.imageTypes = this.image.length > 0 ? this.image : this.imageTypes;
    this.videoTypes = this.video.length > 0 ? this.video : this.videoTypes;
    this.audioTypes = this.audio.length > 0 ? this.audio : this.audioTypes;
    this.documentTypes = this.document.length > 0 ? this.document : this.documentTypes;

    this.imageTypes = this.imageTypes.concat(this.includeImage);
    this.videoTypes = this.videoTypes.concat(this.includeVideo);
    this.audioTypes = this.audioTypes.concat(this.includeAudio);
    this.documentTypes = this.documentTypes.concat(this.includeDocument);

    this.imageTypes = this.imageTypes.filter(x => !this.excludeImage.includes(x));
    this.videoTypes = this.videoTypes.filter(x => !this.excludeVideo.includes(x));
    this.audioTypes = this.audioTypes.filter(x => !this.excludeAudio.includes(x));
    this.documentTypes = this.documentTypes.filter(x => !this.excludeDocument.includes(x));

    this.init(() => {
      this.domain = this.domain || this.fileProvider.Domain;
      this.upload = this.upload || this.fileProvider.Upload;
      this.download = this.download || this.fileProvider.Download;
      this.source = this.domain + '/' + this.download;

      this.imageMaxLength = this.imageMaxLength || this.fileProvider.Settings.MaxLength.Image;
      this.audioMaxLength = this.audioMaxLength || this.fileProvider.Settings.MaxLength.Audio;
      this.videoMaxLength = this.videoMaxLength || this.fileProvider.Settings.MaxLength.Video;
      this.documentMaxLength = this.documentMaxLength || this.fileProvider.Settings.MaxLength.Document;
    });
  }

  ngOnDestroy() {
    if (this.files && this.files.length > 0) {
      this.files.forEach(file => {
        clearInterval(file.Interval);
      });
    }
  }

  preInit(changed: boolean) {
    if (changed) {
      if (this.files && Array.isArray(this.files)) {
        this.files.forEach(file => {
          clearInterval(file.Interval);
        });
      }

      this.files = Array.isArray(this.value) ? this.value.map(x => {
        return {Path: x};
      }) : (this.value ? [{Path: this.value}] : [{}]);

      if (Array.isArray(this.files) && this.files.length === 0) {
        this.files = [{}];
      }

      this.downloadFiles();
    }
  }

  forceValue() {
    const values = this.files.filter(x => x.Uploaded && x.Path).map(x => x.Path);
    this.value = this.multiple ? values : values[0];
    this.valueChange.emit(this.value);
  }

  validate() {
    this.input.nativeElement.value = 'validate';
    super.validate(false);
    this.input.nativeElement.value = '';
    this.initSortable();
  }

  validation() {
    const invalidAnyLen = this.files.filter(x => !x.Name).length;
    const upLen = this.files.filter(x => x.Uploaded).length;
    const typeInvalidLen = this.files.filter(x => x.Type ? !this.fileTypeIsValid(x.Type) : false).length;
    const imageInvalidLen = this.files.filter(x => this.imageTypes.includes(x.Type)
      && (x.Size ? !this.fileSizeIsValid(x.Type, x.Size) : false)).length;
    const audioInvalidLen = this.files.filter(x => this.audioTypes.includes(x.Type)
      && (x.Size ? !this.fileSizeIsValid(x.Type, x.Size) : false)).length;
    const videoInvalidLen = this.files.filter(x => this.videoTypes.includes(x.Type)
      && (x.Size ? !this.fileSizeIsValid(x.Type, x.Size) : false)).length;
    const documentInvalidLen = this.files.filter(x => this.documentTypes.includes(x.Type)
      && (x.Size ? !this.fileSizeIsValid(x.Type, x.Size) : false)).length;

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

    if (imageInvalidLen > 0) {
      this.addFormError('ImageMaxLength');
    } else {
      this.removeFormError('ImageMaxLength', true);
    }

    if (audioInvalidLen > 0) {
      this.addFormError('AudioMaxLength');
    } else {
      this.removeFormError('AudioMaxLength', true);
    }

    if (videoInvalidLen > 0) {
      this.addFormError('VideoMaxLength');
    } else {
      this.removeFormError('VideoMaxLength', true);
    }

    if (documentInvalidLen > 0) {
      this.addFormError('DocumentMaxLength');
    } else {
      this.removeFormError('DocumentMaxLength', true);
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

    this.canUpload = invalidAnyLen === 0 && imageInvalidLen === 0 && audioInvalidLen === 0 && videoInvalidLen === 0
      && documentInvalidLen === 0 && typeInvalidLen === 0 && upLen !== this.files.length
    && (this.minlength ? this.files.length >= this.minlength : true) && this.files.length <= this.maxlength;
    this.canClear = (this.files.length > 1 ? invalidAnyLen > 0 : false) || imageInvalidLen === 0
      || audioInvalidLen === 0 || videoInvalidLen === 0 || documentInvalidLen === 0 || typeInvalidLen > 0
      || this.files.length > this.maxlength;
  }

  localizeReplace(message: string): string {
    message = this.providers.String.Replace(message, '[$MinLength]', this.minlength ? this.minlength.toString() : '');
    message = this.providers.String.Replace(message, '[$MaxLength]', this.maxlength ? this.maxlength.toString() : '');
    message = this.providers.String.Replace(message, '[$ImageMaxLength]', this.imageMaxLength ? this.formatBytes(this.imageMaxLength) : '');
    message = this.providers.String.Replace(message, '[$AudioMaxLength]', this.audioMaxLength ? this.formatBytes(this.audioMaxLength) : '');
    message = this.providers.String.Replace(message, '[$VideoMaxLength]', this.videoMaxLength ? this.formatBytes(this.videoMaxLength) : '');
    message = this.providers.String.Replace(message, '[$DocumentMaxLength]',
      this.documentMaxLength ? this.formatBytes(this.documentMaxLength) : '');
    return message;
  }

  public fileChange(file: any, input: any) {
    if (!this.progress) {
      clearInterval(file.Interval);
      const index = this.files.indexOf(file);
      if (input.files && input.files.length > 0 && input.files[0].name) {
        const selected = input.files[0];
        const obj = {
          Name: selected.name,
          Size: selected.size,
          Type: selected.type,
          CanPreview: this.canPreview(selected.type),
          Text: selected.name + ' (' + this.formatBytes(selected.size) + ')' + ' ' + selected.type,
          Valid: this.fileTypeIsValid(selected.type) && this.fileSizeIsValid(selected.type, selected.size),
          File: selected
        };
        this.files[index] = obj;
      } else {
        this.files[index] = {};
      }
      this.validate();
    }
    this.focus = false;
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

  private fileSizeIsValid(type: string, size: number): boolean {
    const check = (length): boolean => {
      return size <= length;
    };
    if (this.imageTypes.includes(type)) {
      return check(this.imageMaxLength);
    } else if (this.audioTypes.includes(type)) {
      return check(this.audioMaxLength);
    } else if (this.videoTypes.includes(type)) {
      return check(this.videoMaxLength);
    } else if (this.documentTypes.includes(type)) {
      return check(this.documentMaxLength);
    } else {
      return false;
    }
  }

  public addFile() {
    if (!this.progress && this.multiple && this.files.length <= this.maxlength) {
      if (this.files.length < this.maxlength + 1) {
        this.files.push({});
      }

      this.validate();
    }
  }

  public clearFiles() {
    if (!this.progress && this.canClear) {
      this.files = this.files.filter(x => x.Valid);
      if (this.files.length === 0) {
        this.files = [{}];
      } else if (this.files.length > this.maxlength) {
        this.files.splice(this.files.length - 1, 1);
      }
      this.validate();
    }
  }

  public choice(input: any) {
    input.click();
  }

  public remove(file: any) {
    clearInterval(file.Interval);
    if (!this.progress) {
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
      this.preview = undefined;
    } else {
      this.focus = false;
      file.Xhr.abort();
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
      case 'audio/mp3':
      case 'audio/mpeg':
      case 'audio/ogg':
      case 'audio/wav': {
        can = true;
        break;
      }
    }
    return can;
  }

  public showPreview(file: any) {
    if (file && file.CanPreview) {
      this.preview = file;
      setTimeout(() => {
        if (file.Uploaded) {
          if (this.imageTypes.includes(file.Type)) {
            this.imagePreview.nativeElement.src = this.source + '/' + this.preview.Path;
          } else if (this.audioTypes.includes(file.Type)) {
            this.audioPreview.nativeElement.src = this.source + '/' + this.preview.Path;
          } else if (this.videoTypes.includes(file.Type)) {
            this.videoPreview.nativeElement.src = this.source + '/' + this.preview.Path;
          } else if (this.documentTypes.includes(file.Type)) {
            this.documentPreview.nativeElement.src = this.source + '/' + this.preview.Path;
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

  public downloadFiles() {
    let counter = 0;
    this.files.forEach(file => {
      clearInterval(file.Interval);
      if (file.Path) {
        file.Name = file.Path.substring(file.Path.lastIndexOf('/') + 1);
        file.Text = file.Name;
        this.downloadFile(file.Path, false, (xhr) => {
          file.Uploaded = true;
          file.Valid = true;
          if (xhr.status === 200) {
            file.Size = xhr.response.size;
            file.Type = xhr.response.type;
            file.CanPreview = this.canPreview(xhr.response.type);
            file.Text = file.Text + ' (' + this.formatBytes(file.Size) + ')' + ' ' + file.Type;
          } else {
            file.Text = file.Text + ' [E: ' + xhr.status + ']';
          }
          counter++;

          if (counter === this.files.length) {
            this.validate();
          }
        });
      }
    });
  }

  public uploadFiles() {
    if (!this.progress && this.canUpload) {
      const files = this.files.filter(x => !x.Uploaded && x.File);
      let counter = 0;
      const recursive = () => {
        this.uploadFile(files[counter], () => {
          counter++;
          if (counter < files.length) {
            recursive();
          } else {
            this.forceValue();
          }
        });
      };
      recursive();
    }
  }

  private loadFile(file: any, call: (result) => void) {
    const reader = new FileReader();
    reader.onload = (event: any) => {
      call(event.target.result);
    };
    reader.readAsDataURL(file);
  }

  private uploadFile(file: any, load: () => void) {
    if (this.source && file && !file.UploadPercent) {
      const xhr = new XMLHttpRequest();
      xhr.responseType = 'json';
      const formData = new FormData();
      formData.append('file', file.File);
      xhr.onloadstart = () => {
        file.Xhr = xhr;
        file.Uploaded = undefined;
        file.UploadPercent = 0;
        this.progress = true;
      };
      xhr.onloadend = () => {
        file.UploadPercent = undefined;
        if (xhr.status === 200) {
          file.Uploaded = true;
          file.Path = xhr.response.Path;
          file.Name = xhr.response.Name;
          file.Size = xhr.response.Size;
          file.Text = xhr.response.Name + ' (' + this.formatBytes(file.Size) + ')' + ' ' + file.Type;
          clearInterval(file.Interval);
          file.Interval = setInterval(() => {
            this.downloadFile(xhr.response.Path, true, (download) => {
              if (download.status === 200) {
                file.Uploaded = true;
              } else {
                this.uploadFile(file, () => {});
              }
              this.validate();
            });
          }, 10000);
        }
        this.progress = false;
        this.validate();
        load();
      };
      xhr.onerror = () => {
        file.UploadPercent = undefined;
        this.progress = false;
        this.validate();
      }
      xhr.upload.addEventListener('progress', (evt) => {
        if (evt.lengthComputable) {
          file.UploadPercent = evt.loaded / (evt.total / 100);
        }
      }, false);

      xhr.open('POST', this.domain + '/' + this.upload);
      this.setAuthHeader(xhr);
      xhr.send(formData);
    }
  }

  private downloadFile(path: string, ping: boolean, call: (response) => void) {
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = () => {
      call(xhr);
    };
    xhr.onerror = () => {
      call({ status: 500 });
    };

    xhr.open('GET', this.source + path + (ping ? '?type=ping' : ''));
    this.setAuthHeader(xhr);
    xhr.send();
  }

  private setAuthHeader(xhr: XMLHttpRequest) {
    const jwt = this.providers.Http.Initialize();
    const localization = this.providers.Storage.Get('Localization_Settings') || {};

    if (jwt && jwt.Token) {
      xhr.setRequestHeader('Authorization', jwt.Token);
    }
    if (localization.Language) {
      xhr.setRequestHeader('Language', localization.Language);
    }
    if (localization.TimeZone || localization.TimeZone === 0) {
      xhr.setRequestHeader('TimeZone', localization.TimeZone.toString());
    }
  }

  public onDrag(file: any, event: any) {
    this.dragging = file;
    event.dataTransfer.setData('...', event.target.id);
  }

  public onDrop(file: any) {
    const oldIndex = this.dragging.Index;
    const targetIndex = file.Index;
    if (this.dragging.Index > file.Index) {
      this.files.filter(x => x.Index >= file.Index && x.Index < oldIndex).forEach(sort => {
        sort.Index++;
      });
    } else {
      this.files.filter(x => x.Index > oldIndex && x.Index <= file.Index).forEach(sort => {
        sort.Index--;
      });
    }
    this.dragging.Index = targetIndex;
    this.files = this.files.sort((x, y) => x.Index - y.Index);
    this.validate();
  }

  private initSortable() {
    this.files = this.files.map((x, i) => { x.Index = i; return x; });
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
