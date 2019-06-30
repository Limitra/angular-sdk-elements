import { NgModule } from '@angular/core';
import {InputDateComponent} from './input-date/input-date.component';
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
    FormsModule
  ],
  providers: [SdkProviders],
  declarations: [InputDateComponent, DatatableComponent],
  exports: [InputDateComponent, DatatableComponent]
})
export class SdkElementsModule { }
