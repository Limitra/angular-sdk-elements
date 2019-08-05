/*
 * Public API Surface of sdk-elements
 */

import {ModuleWithProviders, NgModule} from '@angular/core';
import {InputDateComponent} from './lib/inputs/input-date/input-date.component';
import { DatatableComponent } from './lib/outputs/datatable/datatable.component';
import { InputTextComponent } from './lib/inputs/input-text/input-text.component';
import { InputPasswordComponent } from './lib/inputs/input-password/input-password.component';
import { InputPhoneComponent } from './lib/inputs/input-phone/input-phone.component';
import { InputEmailComponent } from './lib/inputs/input-email/input-email.component';
import { SelectClientComponent } from './lib/inputs/select-client/select-client.component';
import {OutsideClickDirective} from './lib/directives/outside-click/outside-click.directive';
import { SelectServerComponent } from './lib/inputs/select-server/select-server.component';
import { InputNumberComponent } from './lib/inputs/input-number/input-number.component';
import { InputChoiceComponent } from './lib/inputs/input-choice/input-choice.component';
import { InputFileComponent } from './lib/inputs/input-file/input-file.component';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {RouterModule} from '@angular/router';
import { PageInfoComponent } from './lib/outputs/page-info/page-info.component';
import { CardComponent } from './lib/outputs/card/card.component';
import { FormComponent } from './lib/outputs/form/form.component';
import { NotificationComponent } from './lib/outputs/notification/notification.component';

export * from './lib/extends/input-extend';
export * from './lib/inputs/input-text/input-text.component';
export * from './lib/inputs/input-date/input-date.component';
export * from './lib/inputs/input-password/input-password.component';
export * from './lib/inputs/input-phone/input-phone.component';
export * from './lib/inputs/input-email/input-email.component';
export * from './lib/inputs/input-number/input-number.component';
export * from './lib/inputs/input-choice/input-choice.component';
export * from './lib/inputs/select-client/select-client.component';
export * from './lib/inputs/select-server/select-server.component';
export * from './lib/outputs/datatable/datatable.component';

@NgModule({
  imports: [
    FormsModule,
    BrowserModule,
    RouterModule
  ],
  providers: [],
  declarations: [
    OutsideClickDirective, InputDateComponent, DatatableComponent, InputTextComponent,
    InputPasswordComponent, InputPhoneComponent, InputEmailComponent, SelectClientComponent,
    SelectServerComponent, InputNumberComponent, InputChoiceComponent, InputFileComponent, PageInfoComponent,
    CardComponent, FormComponent, NotificationComponent],
  exports: [FormsModule, BrowserModule, RouterModule,
    OutsideClickDirective, InputDateComponent, DatatableComponent, InputTextComponent,
    InputPasswordComponent, InputPhoneComponent, InputEmailComponent, SelectClientComponent,
    SelectServerComponent, InputNumberComponent, InputChoiceComponent, InputFileComponent, PageInfoComponent,
    CardComponent, FormComponent, NotificationComponent]
})
export class SdkElementsModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: SdkElementsModule,
      providers: []
    };
  }
}
