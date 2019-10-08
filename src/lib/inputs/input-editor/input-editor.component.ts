import {Component, OnInit, ViewChild} from '@angular/core';
import * as DocumentEditor from '@ckeditor/ckeditor5-build-decoupled-document';
import {SdkProviders} from '@limitra/sdk-core';
import {ChangeEvent, CKEditorComponent} from '@ckeditor/ckeditor5-angular';
import {InputExtend} from '../../extends/input-extend';

@Component({
  selector: 'lim-input-editor',
  templateUrl: './input-editor.component.html',
  styleUrls: ['./input-editor.component.css']
})
export class InputEditorComponent extends InputExtend implements OnInit {
  @ViewChild('ckeditor', { static: false }) ckeditor: CKEditorComponent;

  constructor(public providers: SdkProviders) { super(providers); }

  public Editor = DocumentEditor;

  public config: any = { };

  public onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(
      editor.ui.view.toolbar.element,
      editor.ui.getEditableElement()
    );
  }

  public onChange( { editor }: ChangeEvent) {
    setTimeout(() => {
      this.input.nativeElement.value = editor.getData();
      this.validate();
    });
  }

  preInit(changed?: boolean) {
    if (changed && this.ckeditor.editorInstance) {
      this.ckeditor.editorInstance.setData(this.value);
    }
  }

  ngOnInit() {
    this.config.toolbar = [ 'fontSize', 'heading', 'bold', 'italic', 'link', 'alignment', 'bulletedList', 'numberedList', 'blockQuote', 'insertTable', 'undo', 'redo' ];
    let lang = this.providers.Storage.Get('Localization_Settings', 'Language');
    if (lang) {
      lang = lang.split('-')[0];
      if (lang) {
        this.config.language = lang;
      }
    }
    this.config.placeholder = this.placeholder;
    this.init();
  }
}
