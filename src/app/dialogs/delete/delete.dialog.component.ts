import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material';
import {Component, Inject} from '@angular/core';
import {DataService} from '../../services/data.service';
import swal from 'sweetalert2';
import {PredictionService} from '../../services/prediction.service';
import {Router} from '@angular/router';
import {Http} from '@angular/http';
import {DataSetService} from '../../services/dataset.service';


@Component({
  selector: 'app-delete.dialog',
  templateUrl: '../../dialogs/delete/delete.dialog.html',
  styleUrls: ['../../dialogs/delete/delete.dialog.css']
})
export class DeleteDialogComponent {

  constructor(public http: Http,
              public dialog: MatDialog,
              public datasetService: DataSetService,
              public predictionservice: PredictionService,
              private router: Router,
      public dialogRef: MatDialogRef<DeleteDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any, public dataService: DataService) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

  confirmDelete(): void {
    console.log('11111111111')
  }
}
