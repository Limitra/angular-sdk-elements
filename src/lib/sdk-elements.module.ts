import { NgModule } from '@angular/core';
import {InputComponent} from './input/input.component';
import { DatatableComponent } from './datatable/datatable.component';
import {BrowserModule} from '@angular/platform-browser';
import {HttpClientModule} from '@angular/common/http';
import {SdkProviders} from '../../../sdk-core/src/lib/providers';
import {SdkCoreModule} from '../../../sdk-core/src/lib/sdk-core.module';
import {FormsModule} from '@angular/forms';

@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule,
    SdkCoreModule,
    SdkCoreModule,
    FormsModule
  ],
  providers: [SdkProviders],
  declarations: [InputComponent, DatatableComponent],
  exports: [InputComponent, DatatableComponent]
})
export class SdkElementsModule { }
