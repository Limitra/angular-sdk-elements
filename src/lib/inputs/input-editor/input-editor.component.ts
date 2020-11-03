import {AfterViewInit, Component} from '@angular/core';
import {SdkProviders} from '@limitra/sdk-core';
import {InputExtend} from '../../extends/input-extend';
import {BeforeOnDestroy} from '../../definitions/before-destroy';

declare let CKSource;
declare let window: any;

@Component({
  selector: 'lim-input-editor',
  templateUrl: './input-editor.component.html',
  styleUrls: ['./input-editor.component.css']
})
export class InputEditorComponent extends InputExtend implements AfterViewInit, BeforeOnDestroy {
  wordCount = 0;
  charCount = 0;
  maximized = false;

  private ckeditor;

  constructor(public providers: SdkProviders) { super(providers); }

  public onChange(data) {
    setTimeout(() => {
      this.input.nativeElement.value = data;
      this.validate();
    });
  }

  preInit(changed?: boolean) {
    if (changed && this.ckeditor) {
      this.ckeditor.setData(this.value);
    }
  }

  ngBeforeOnDestroy() {
    window.watchdog.destroy();
  }

  ngAfterViewInit() {
    const watchdog = new CKSource.Watchdog();
    window.watchdog = watchdog;
    watchdog.setCreator(( element, config ) => {
      return CKSource.Editor
        .create( element, config )
        .then( editor => {
          this.ckeditor = editor;
          editor.model.document.on('change:data', (evt, data) => {
            const dataVal = editor.getData();
            if (dataVal != this.value) {
              this.onChange(dataVal);
            }
          });
          editor.editing.view.document.on('change:isFocused', (evt, name, value) => {
            this.focus = value;
          });
          document.querySelector('.document-editor__toolbar').appendChild( editor.ui.view.toolbar.element );
          document.querySelector('.ck-toolbar').classList.add( 'ck-reset_all' );
          return editor;
        } )
    } );

    watchdog.setDestructor( editor => {
      document.querySelector('.document-editor__toolbar').removeChild(editor.ui.view.toolbar.element);
      return editor.destroy();
    } );

    watchdog
      .create(document.querySelector('.editor'), {
        removePlugins: ['Title'],
        placeholder: this.placeholder,
        toolbar: {
          items: [
            'undo',
            'redo',
            'removeFormat',
            '|',
            'heading',
            '|',
            'fontSize',
            'fontFamily',
            '|',
            'bold',
            'italic',
            'underline',
            'strikethrough',
            'highlight',
            'fontColor',
            'fontBackgroundColor',
            'link',
            '|',
            'alignment',
            'indent',
            'outdent',
            'horizontalLine',
            'pageBreak',
            '|',
            'numberedList',
            'bulletedList',
            'todoList',
            '|',
            'imageUpload',
            'imageInsert',
            'insertTable',
            'mediaEmbed',
            'blockQuote',
            'codeBlock',
            '|',
            'superscript',
            'subscript',
            'MathType',
            'ChemType',
            'specialCharacters',
            '|',
            'code'
          ]
        },
        language: 'tr',
        image: {
          toolbar: [
            'imageTextAlternative',
            'imageStyle:full',
            'imageStyle:side'
          ]
        },
        table: {
          contentToolbar: [
            'tableColumn',
            'tableRow',
            'mergeTableCells',
            'tableCellProperties',
            'tableProperties'
          ]
        },
        wordCount: {
          onUpdate: stats => {
            this.charCount = stats.characters;
            this.wordCount = stats.words;
          }
        }
      });
    this.init();
  }
}
