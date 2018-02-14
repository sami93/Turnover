import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MdModule } from '../md/md.module';
import { MaterialModule } from '../app.module';


import { TurnoverRoutes } from './turnover.routing';
import {TurnoverComponent} from './turnover.component';
import {HttpClientModule} from '@angular/common/http';
import {BrowserModule} from '@angular/platform-browser';
import {AddDialogComponent} from '../dialogs/add/add.dialog.component';
import {EditDialogComponent} from '../dialogs/edit/edit.dialog.component';
import {DeleteDialogComponent} from 'app/dialogs/delete/delete.dialog.component';
import {DataService} from '../services/data.service';
import {DataSetService} from '../services/dataset.service';
import {PredictionService} from '../services/prediction.service';


@NgModule({
    declarations: [
        TurnoverComponent,
        AddDialogComponent,
        EditDialogComponent,
        DeleteDialogComponent
    ],
    imports: [
        CommonModule,
        RouterModule.forChild(TurnoverRoutes),
        FormsModule,
        MdModule,
        MaterialModule,
        ReactiveFormsModule,
        HttpClientModule,

    ],

    entryComponents: [
        AddDialogComponent,
        EditDialogComponent,
        DeleteDialogComponent
    ],
    providers: [
        DataService,
        DataSetService,
        PredictionService
    ],
})

export class TurnoverModule {}
