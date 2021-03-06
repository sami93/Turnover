import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {DataService} from '.././services/data.service';
import {HttpClient} from '@angular/common/http';
import {MatDialog, MatPaginator, MatSort} from '@angular/material';
import {Issue} from '.././models/issue';
import {Headers, Http, Response, URLSearchParams} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {DataSource} from '@angular/cdk/collections';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import {AddDialogComponent} from '.././dialogs/add/add.dialog.component';
import {EditDialogComponent} from '.././dialogs/edit/edit.dialog.component';
import {DeleteDialogComponent} from '.././dialogs/delete/delete.dialog.component';
import {DataSetService} from '../services/dataset.service';
import swal from 'sweetalert2';
import {PredictionService} from '../services/prediction.service';
import {Router} from '@angular/router';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
    selector: 'app-turnover',
    templateUrl: './turnover.component.html',
    styleUrls: ['./turnover.component.css']
})
export class TurnoverComponent implements OnInit {
    displayedColumns = ['Matricule', 'Name', 'Civilite', 'SITUATION_FAMILIALE', 'DateEmbauche', 'actions'];
    exampleDatabase: DataService | null;
    dataSource: ExampleDataSource | null;
    index: number;
    Matricule2: number;
    predict_value: any;
    name_value: any;
    column_names: any[];

    /* Declaration Adding  DataSet */
    addDataSetForm: FormGroup;
    Name = new FormControl('', Validators.required);
    Age = new FormControl('', Validators.required);
    Civilite = new FormControl('', Validators.required);
    DateEmbauche = new FormControl('', Validators.required);
    SITUATION_FAMILIALE = new FormControl('', Validators.required);
    EXPERIENCE_AVANT_SOFRECOM = new FormControl('', Validators.required);
    EXPERIENCE_SOFRECOM = new FormControl('', Validators.required);
    EXPERIENCE_Totale = new FormControl('', Validators.required);
    Ecole = new FormControl('', Validators.required);
    Manager = new FormControl('', Validators.required);
    Matricule = new FormControl('', Validators.required);
    Metier = new FormControl('', Validators.required);
    Pole = new FormControl('', Validators.required);
    Poste = new FormControl('', Validators.required);
    C1 = new FormControl('', Validators.required);
    C2 = new FormControl('', Validators.required);
    C3 = new FormControl('', Validators.required);

    /* End Declaration for Adding DataSet */

    constructor(public httpClient: HttpClient,
                public http: Http,
                public dialog: MatDialog,
                public dataService: DataService,
                public datasetService: DataSetService,
                public predictionservice: PredictionService,
                private router: Router,
                private formBuilder: FormBuilder) {
    }

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('filter') filter: ElementRef;

    ngOnInit() {
        this.addDataSetForm = this.formBuilder.group({
            Name: this.Name,
            Age: this.Age,
            Civilite: this.Civilite,
            SITUATION_FAMILIALE: this.SITUATION_FAMILIALE,
            DateEmbauche: this.DateEmbauche,
            EXPERIENCE_AVANT_SOFRECOM: this.EXPERIENCE_AVANT_SOFRECOM,
            EXPERIENCE_SOFRECOM: this.EXPERIENCE_SOFRECOM,
            EXPERIENCE_Totale: this.EXPERIENCE_Totale,
            Ecole: this.Ecole,
            Manager: this.Manager,
            Matricule: this.Matricule,
            Metier: this.Metier,
            Pole: this.Pole,
            Poste: this.Poste,
            C1: this.C1,
            C2: this.C2,
            C3: this.C3
        });
        this.loadData();
    }

    refresh() {
        this.loadData();
    }

    addNew(issue: Issue) {
        const dialogRef = this.dialog.open(AddDialogComponent, {
            data: {issue: issue}
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result === 1) {
                console.log(this.dataService.getDialogData())
                this.exampleDatabase.dataChange.value.push(this.dataService.getDialogData());
                this.refreshTable();
            }
        });
    }

    getDataSets() {
        this.datasetService.getDataSets().subscribe(
            data => console.log(data),
            error => console.log(error),
            () => console.log('refreshed')
        );
    }

    predictPerson(predict_name) {

        this.predictionservice.PredictionPerPerson(predict_name).subscribe(
            PathFileResult => {
                console.log('PathFile');
                const File = this.predictionservice.pathFile;
                // const File = PathFileResult._body + '/predict.csv';
                // const File="/home/ubuntu/h2o/titanic3_csv.csv";
                console.log(File);

                // ******** GET 3/IMPORT with pathFile From server
                this.http.get(this.predictionservice.url + '/3/ImportFiles?path=' + File)
                    .map(res => res.json())
                    .subscribe(ImportFile => {
                            const DestinationFrame = ImportFile.destination_frames[0];
                            console.log('Destination Frame');
                            console.log(DestinationFrame);
                            // this.predictionservice.Parse_predictPerPersonCsv(DestinationFrame);
                            this.Parse_predictPerPersonCsv(predict_name, DestinationFrame);
                        },
                        error2 => {

                            // ******** Import Error
                            console.log(error2);
                            this.erreur(error2, 'Import Error');
                        });

            },
            error => {
                // ******** Error GenerateCsvFile
                console.log(error);
                this.erreur(error, 'GenerateCsvFile Error ');
            }
        );
    }

    erreur(err, NameOfError) {
        swal(
            '' + NameOfError,
            '' + JSON.stringify(err),
            'error'
        )
    }


    Parse_predictPerPersonCsv(predict_name, PostFileResult) {
        console.log('erreuuur');
        console.log(predict_name);
        console.log(PostFileResult);
        const parseSetup = new URLSearchParams();
        parseSetup.append('source_frames', '["' + PostFileResult + '"]');
        console.log(parseSetup);
        this.http.post(this.predictionservice.url + '/3/ParseSetup', parseSetup)
            .map(res => res.json())
            .subscribe(
                ParseSetupResult => {
                    console.log(PostFileResult);
                    console.log(ParseSetupResult.column_names);
                    this.column_names = ParseSetupResult.column_names;
                    console.log(this.column_names);
                    //console.log(ParseSetupResult.column_types.length);
                    //console.log(ParseSetupResult.column_types[length]);
                    //console.log(typeof ParseSetupResult.column_types[ParseSetupResult.column_types.length - 1]);
                    console.log('*********');
                    console.log(ParseSetupResult.destination_frame);
                    const parse = new URLSearchParams();
                    parse.append('destination_frame', ParseSetupResult.destination_frame);
                    parse.append('source_frames', '["' + PostFileResult + '"]');
                    // parse.append('source_frames', '["' + this.Nomfichier + '"]');
                    parse.append('parse_type', ParseSetupResult.parse_type);
                    parse.append('separator', ParseSetupResult.separator);
                    parse.append('number_columns', ParseSetupResult.number_columns);
                    parse.append('single_quotes', ParseSetupResult.single_quotes);
                    // convert tab object to string with JSON.stringify()
                    parse.append('column_names', JSON.stringify(ParseSetupResult.column_names));
                    /* the type of the predict variable (last item in column_types table) must be Enum */
                    // ParseSetupResult.column_types[ParseSetupResult.column_types.length - 1] = 'Enum';
                    /* for (var index_column_name = 0; index_column_name < ParseSetupResult.column_names.length; index_column_name++) {
                     if (ParseSetupResult.column_names[index_column_name] === 'EXPERIENCE_AVANT_SOFRECOM') {
                     ParseSetupResult.column_types[index_column_name] = 'int';
                     }
                     if (ParseSetupResult.column_names[index_column_name] === 'EXPERIENCE_SOFRECOM') {
                     ParseSetupResult.column_types[index_column_name] = 'int';

                     }
                     if (ParseSetupResult.column_names[index_column_name] === 'EXPERIENCE_Totale') {
                     ParseSetupResult.column_types[index_column_name] = 'int';
                     }
                     if (ParseSetupResult.column_names[index_column_name] === 'Age') {
                     ParseSetupResult.column_types[index_column_name] = 'int';
                     }

                     }
                     */
                    /* convert tab object to string with JSON.stringify() */
                    parse.append('column_types', JSON.stringify(ParseSetupResult.column_types));
                    parse.append('check_header', ParseSetupResult.check_header);
                    parse.append('delete_on_done', 'true');
                    parse.append('chunk_size', ParseSetupResult.chunk_size);
                    /* format of parse */
                    /*destination_frame:Key_Frame__titanic_csv.hex
                     source_frames:["titanic_csv.csv"]
                     parse_type:CSV
                     separator:59
                     number_columns:15
                     single_quotes:false
                     column_names:["pclass","survived","name","sex","age","sibsp","parch","ticket","fare","cabin","embarked","boat","body","home.dest","etat"]
                     column_types:["Numeric","Numeric","String","Enum","Numeric","Numeric","Numeric","Numeric","Enum","Enum","Enum","Numeric","Numeric","Enum","Enum"]
                     check_header:1
                     delete_on_done:true
                     chunk_size:4194304 */

                    /*   sami ghorbel */

                    this.http.post(this.predictionservice.url + '/3/Parse', parse)
                        .map(res => res.json())
                        .subscribe(
                            ParseResult => {
                                console.log('**********');
                                const DataSet = ParseResult.destination_frame.name;
                                // const DataSet = ParseSetupResult.destination_frame;
                                /* **********Choose Model ******* */
                                console.log('Choose a Model');
                                this.http.get(this.predictionservice.url + '/3/Models')
                                    .map(this.extractDataModel)
                                    .subscribe(models => {
                                            var ModelNameObject = {};
                                            const FirstModel = models[0].model_id.name;
                                            //console.log(this.models);

                                            for (const model of models) {
                                                const id_Model = model.model_id;
                                                ModelNameObject[id_Model.name] = id_Model.name;
                                            }
                                            console.log(typeof FirstModel);
                                            console.log(FirstModel);

                                            swal({
                                                title: 'Select Model',
                                                input: 'select',
                                                inputOptions: ModelNameObject,
                                                inputPlaceholder: 'Select Model',
                                                inputValue: FirstModel,
                                                showCancelButton: false,
                                            }).then((ModelResult) => {
                                                const ModelSelected = ModelResult;
                                                swal({
                                                    title: 'Model <span style="color:#6495ED;font-weight:bold">'
                                                    + ModelResult + '</span> Selected',
                                                    timer: 1000,
                                                    showConfirmButton: false,
                                                    type: 'success'
                                                }).catch(swal.noop);

                                                /* do prediction */
                                                this.insert_prediction(predict_name, ModelSelected, DataSet);

                                            })


                                        },
                                        error4 => {
                                            this.erreur(error4, 'Model Erreur');

                                            this.erreur(error4, 'Model Erreur');
                                            this.http.delete(this.predictionservice.url + '/3/Frames/' + DataSet)
                                                .subscribe(DeleteFrame => {
                                                        console.log('DeleteFrame');
                                                        console.log(DeleteFrame);
                                                    },
                                                    errordelete => {
                                                        console.log(errordelete);
                                                    });
                                        }
                                    );


                            },
                            error3 => {
                                console.log(error3);
                                this.erreur(error3, 'Parse Error');
                            });
                },
                error2 => {
                    console.log(error2);
                    this.erreur(error2, 'ParseSetup Error');
                });

    }

    insert_prediction(predict_name, NameOfModel, NameOfFrame) {
        const predict_id = 'predict_id';
        const data = new URLSearchParams();
        data.append('predictions_frame', predict_id);

        this.http.post(this.predictionservice.url + '/3/Predictions/models/' + NameOfModel + '/frames/' + NameOfFrame, data)
            .subscribe(PredictionResult => {
                swal({
                    imageUrl: 'assets/logo.png',
                    title: '<br>Loading....',
                    timer: 1000,
                    type: 'success',
                    showConfirmButton: false

                }).then((x) => {

                }).catch(swal.noop);
                const combined = new URLSearchParams();
                this.predictionservice.combined_prediction = 'combined-' + predict_id;
                combined.append('ast', '(assign ' + this.predictionservice.combined_prediction + ' (cbind ' + predict_id + ' ' + NameOfFrame + '))');
                this.http.post(this.predictionservice.url + '/99/Rapids', combined)
                    .subscribe(CombinedResult => {
                        /*swal(
                         'Prediction added!',
                         '',
                         'success'
                         );*/
                        this.http.get(this.predictionservice.url + '/3/Frames/' + this.predictionservice.combined_prediction + '?column_offset=0&column_count=20')
                            .map(this.extractData2)
                            .subscribe(frames => {
                                console.log(frames[0].columns);
                                var InfoPers = {};

                                for (const column_frame of  frames[0].columns) {
                                    console.log(column_frame);

                                    if (column_frame.label === 'predict') {
                                        this.predict_value = column_frame.data[0];
                                        InfoPers[column_frame.label] = column_frame.data[0];
                                    }
                                    if (column_frame.label === 'Name') {
                                        this.name_value = column_frame.domain[column_frame.data[0]];

                                    }

                                    for (const column_name of this.column_names) {
                                        if (column_frame.label === column_name) {
                                            if (column_frame.type === 'int') {
                                                InfoPers[column_name] = column_frame.data[0];
                                            }
                                            if (column_frame.type === 'real') {
                                                InfoPers[column_name] = column_frame.data[0];
                                            }
                                            if (column_frame.type === 'enum') {
                                                InfoPers[column_name] = column_frame.domain[column_frame.data[0]];
                                            }
                                            if (column_frame.type === 'time') {
                                                const dateToConvert = new Date(column_frame.data[0]);
                                                const ConvertedDate = dateToConvert.getDate() + '/' + (dateToConvert.getMonth() + 1) + '/'
                                                    + dateToConvert.getFullYear();
                                                InfoPers[column_name] = ConvertedDate;
                                            }
                                        }

                                    }


                                }

                                console.log('heeeeere');
                                console.log(InfoPers);
                                console.log(this.predict_value);
                                console.log(this.name_value);
                                const todayTime = new Date();

                                const hour = ('0' + todayTime.getHours()).slice(-2);
                                const minute = ('0' + todayTime.getMinutes()).slice(-2);
                                const sec = ('0' + todayTime.getSeconds()).slice(-2);
                                const timeNow = hour + ':' + minute + ':' + sec;


                                const year = ('0' + todayTime.getFullYear()).slice(-2);
                                const month = ('0' + (todayTime.getMonth() + 1)).slice(-2);
                                const day = ('0' + todayTime.getDate()).slice(-2);
                                const datefull = day + '/' + month + '/' + year;
                                const obj = {
                                    'predict': this.predict_value,
                                    'name': this.name_value,
                                    'date': datefull,
                                    'time': timeNow
                                };
                                InfoPers['date'] = datefull;
                                InfoPers['time'] = timeNow;
                                console.log('obj');
                                console.log(obj);
                                console.log(InfoPers);
                                this.predictionservice.editPrediction(InfoPers).subscribe(
                                    EditPerPersonResult => {
                                        this.http.get('http:localhost:4200/api/datasetsMat/' + InfoPers['Matricule'])
                                            .map(this.extractData3)
                                            .subscribe(ObjectSendToPredictionList => {
                                                this.predictionservice.showInfoPerson = ObjectSendToPredictionList;
                                                /* DELETE*/
                                                this.http.delete(this.predictionservice.url + '/3/Frames/' + 'predict_id')
                                                    .subscribe(PredictDelete => {
                                                    }, errorPredictDelete => {
                                                        console.log(errorPredictDelete);
                                                    });
                                                this.http.delete(this.predictionservice.url + '/3/Frames/' + NameOfFrame)
                                                    .subscribe(DeleteFrame => {
                                                            this.http.delete(this.predictionservice.url + '/3/Frames/' + this.predictionservice.combined_prediction)
                                                                .subscribe(DeleteFrameCombined => {
                                                                        console.log('DeleteFrameCombined');
                                                                        console.log(DeleteFrameCombined);
                                                                        this.router.navigate(['/prediction_list']);
                                                                        console.log('sami');
                                                                    },
                                                                    errordeletecombined => {
                                                                        console.log(errordeletecombined);
                                                                    });
                                                        },
                                                        errordelete => {
                                                            console.log(errordelete);
                                                        });


                                            });
                                    },
                                    EditPerPersonError => {
                                        console.log(EditPerPersonError.json());
                                        this.erreur(EditPerPersonError, 'errorFrame');
                                    }
                                );

                            }, errorFrame => {
                                console.log(errorFrame.json());
                                this.erreur(errorFrame, 'errorFrame');
                                this.http.delete(this.predictionservice.url + '/3/Frames/' + NameOfFrame)
                                    .subscribe(DeleteFrame => {
                                            console.log('DeleteFrame');
                                            console.log(DeleteFrame);
                                        },
                                        errordelete => {
                                            console.log(errordelete);
                                        });
                            });
                        /*
                         let n = 1;
                         setTimeout(function () {
                         console.log('timeouuuuuut');
                         n = n + 10000;
                         }, 100000);
                         */


                    }, errorCombined => {
                        console.log(errorCombined.json());
                        this.erreur(errorCombined, 'errorCombined');
                    });


            }, errorPrediction => {
                console.log(errorPrediction.json());
                this.erreur(errorPrediction, 'errorPrediction');
            });
    }

    private extractData2(res: Response) {

        const body = res.json();
        const sami = body.frames;


        return sami || {};
    }


    private extractDataModel(res: Response) {

        const body = res.json();
        const sami = body.models;


        return sami || {};
    }

    private extractData3(res: Response) {

        const body = res.json();


        return body || {};
    }

    public infoPersonne(dataset: any) {
        console.log(dataset);
        this.datasetService.getDataSetbyMatricule(dataset).subscribe(
            data => {
                const DataInfo = data;
                swal({
                    title: '  <span style="color:#6495ED;font-weight:bold">'
                    + DataInfo.Name + '</span> ',
                    showConfirmButton: true,
                    width: '825px',
                    html: `<center><table id="table" border=1 class="table table-bordered  table-striped">
        <tbody>
            <tr>
            <td>Age</td>
                <td>` + DataInfo.Age + `</td>
      </tr>
       <tr>
            <td>Civilite</td>
                <td>` + DataInfo.Civilite + `</td>
      </tr>
        <tr>
            <td>SITUATION_FAMILIALE</td>
                <td>` + DataInfo.SITUATION_FAMILIALE + `</td>
      </tr>
             <tr>
            <td>DateEmbauche</td>
                <td>` + DataInfo.DateEmbauche + `</td>
      </tr>
     
      
      
    <tr>
            <td>EXPERIENCE_AVANT_SOFRECOM</td>
                <td>` + DataInfo.EXPERIENCE_AVANT_SOFRECOM + `</td>
      </tr>
        <tr>
            <td>EXPERIENCE_SOFRECOM</td>
                <td>` + DataInfo.EXPERIENCE_SOFRECOM + `</td>
      </tr>
           <tr>
            <td>EXPERIENCE_Totale</td>
                <td>` + DataInfo.EXPERIENCE_Totale + `</td>
      </tr>
         </tr>
           <tr>
            <td>Ecole</td>
                <td>` + DataInfo.Ecole + `</td>
      </tr>
         <tr>
            <td>Manager</td>
                <td>` + DataInfo.Manager + `</td>
      </tr>
   
      <tr>
            <td>Matricule</td>
                <td>` + DataInfo.Matricule + `</td>
      </tr>
      
      <tr>
            <td>Metier</td>
                <td>` + DataInfo.Metier + `</td>
      </tr>
         <tr>
            <td>Pole</td>
                <td>` + DataInfo.Pole + `</td>
      </tr>
           <tr>
            <td>Poste</td>
                <td>` + DataInfo.Poste + `</td>
      </tr>     
         </tr>
    
           <tr>
            <td>C1</td>
                <td>` + DataInfo.C1 + `</td>
      </tr>  
        </tr>
           <tr>
            <td>C2</td>
                <td>` + DataInfo.C2 + `</td>
      </tr>  
        </tr>
           <tr>
            <td>C3</td>
                <td>` + DataInfo.C3 + `</td>
      </tr>  
          </tbody>
</table>
</center>`,

                    type: 'info'
                });

            },
            error => console.log(error),
            () => console.log('')
        );


    }

    startEdit(i: number, dataset: any) {
        this.index = i;
        this.Matricule2 = dataset.Matricule;
        const dialogRef = this.dialog.open(EditDialogComponent, {
            height: '80%',
            width: '70%',
                data: {
                    _id: dataset._id,
                    Matricule: dataset.Matricule,
                    Name: dataset.Name,
                    Civilite: dataset.Civilite,
                    SITUATION_FAMILIALE: dataset.SITUATION_FAMILIALE,
                    DateEmbauche: dataset.DateEmbauche,
                    EXPERIENCE_AVANT_SOFRECOM: dataset.EXPERIENCE_AVANT_SOFRECOM,
                    EXPERIENCE_SOFRECOM: dataset.EXPERIENCE_SOFRECOM,
                    EXPERIENCE_Totale: dataset.EXPERIENCE_Totale,
                    Ecole: dataset.Ecole,
                    Manager: dataset.Manager,
                    Metier: dataset.Metier,
                    Pole: dataset.Pole,
                    Poste: dataset.Poste,
                    C1: dataset.C1,
                    C2: dataset.C2,
                    C3: dataset.C3,
                }
            })
        ;

        dialogRef.afterClosed().subscribe(result => {
            if (result === 1) {
                // Part where we do frontend update, first you need to find record using id
                const foundIndex = this.exampleDatabase.dataChange.value.findIndex(x => x.Matricule === this.Matricule2);
                // Then you update that record using dialogData
                this.exampleDatabase.dataChange.value[foundIndex] = this.dataService.getDialogData();

                // And lastly refresh table
                this.refreshTable();
            }
        });
    }

    deleteItem(i: number, dataset: any) {
        this.index = i;
        this.Matricule2 = dataset.Matricule;
        const dialogRef = this.dialog.open(DeleteDialogComponent, {
            data: {
                Matricule: dataset.Matricule,
                Name: dataset.Name,
                Civilite: dataset.Civilite,
                SITUATION_FAMILIALE: dataset.SITUATION_FAMILIALE
            }
        });

        dialogRef.afterClosed().subscribe(result => {

            if (result === 1) {
                this.datasetService.deleteDataSet(dataset).subscribe(
                    res => {


                        const foundIndex = this.exampleDatabase.dataChange.value.findIndex(x => x.Matricule === this.Matricule2);
                        console.log(foundIndex);
                        this.exampleDatabase.dataChange.value.splice(foundIndex, 1);
                        this.refreshTable();

                    },
                    error => console.log(error)
                );
            }
        });
    }

    private refreshTable() {
        // If there's no data in filter we do update using pagination, next page or previous page
        if (this.dataSource._filterChange.getValue() === '') {

            if (this.dataSource._paginator.pageIndex === 0) {
                this.dataSource._paginator.nextPage();
                this.dataSource._paginator.previousPage();
            } else {
                this.dataSource._paginator.previousPage();
                this.dataSource._paginator.nextPage();
            }
            // If there's something in filter, we reset it to 0 and then put back old value
        } else {
            this.dataSource.filter = '';
            this.dataSource.filter = this.filter.nativeElement.value;

        }
    }

    public loadData() {
        this.exampleDatabase = new DataService(this.httpClient);
        this.dataSource = new ExampleDataSource(this.exampleDatabase, this.paginator, this.sort);
        Observable.fromEvent(this.filter.nativeElement, 'keyup')
            .debounceTime(150)
            .distinctUntilChanged()
            .subscribe(() => {
                if (!this.dataSource) {
                    return;
                }
                this.dataSource.filter = this.filter.nativeElement.value;
            });
    }

    addDataSet() {
        console.log(this.addDataSetForm.value);
        console.log('success')
        this.datasetService.addDataSet(this.addDataSetForm.value).subscribe(
            res => {
                console.log(typeof res)
                console.log(res)
                console.log(JSON.parse(res._body));
                console.log('222222');
                this.exampleDatabase.dataChange.value.push(JSON.parse(res._body));
                this.refreshTable();
            },
            error => {
                console.log(error);
                console.log('erreuuur');
                this.erreur(error, 'Error, Verify if Matricule is Unique');
            }
        );
    }


}


export class ExampleDataSource extends DataSource<Issue> {
    _filterChange = new BehaviorSubject('');

    get filter(): string {
        return this._filterChange.value;
    }

    set filter(filter: string) {
        this._filterChange.next(filter);
    }

    filteredData: Issue[] = [];
    renderedData: Issue[] = [];

    constructor(public _exampleDatabase: DataService,
                public _paginator: MatPaginator,
                public _sort: MatSort) {
        super();
        // Reset to the first page when the user changes the filter.
        this._filterChange.subscribe(() => this._paginator.pageIndex = 0);
    }

    /** Connect function called by the table to retrieve one stream containing the data to render. */
    connect(): Observable<Issue[]> {
        // Listen for any changes in the base data, sorting, filtering, or pagination
        const displayDataChanges = [
            this._exampleDatabase.dataChange,
            this._sort.sortChange,
            this._filterChange,
            this._paginator.page
        ];

        this._exampleDatabase.getAllIssues();

        return Observable.merge(...displayDataChanges).map(() => {
            // Filter data
            this.filteredData = this._exampleDatabase.data.slice().filter((issue: Issue) => {
                //    const searchStr = (issue.Name + issue.SITUATION_FAMILIALE + issue.DateEmbauche).toLowerCase();
                const searchStr = (issue.Name + issue.DateEmbauche).toLowerCase();
                return searchStr.indexOf(this.filter) !== -1;
            });

            // Sort filtered data
            const sortedData = this.sortData(this.filteredData.slice());
            // Grab the page's slice of the filtered sorted data.
            const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
            this.renderedData = sortedData.splice(startIndex, this._paginator.pageSize);
            return this.renderedData;
        });
    }

    disconnect() {
    }


    /** Returns a sorted copy of the database data. */
    sortData(data: Issue[]): Issue[] {
        if (!this._sort.active || this._sort.direction === '') {
            return data;
        }

        return data.sort((a, b) => {
            let propertyA: number | string = '';
            let propertyB: number | string = '';

            switch (this._sort.active) {
                case 'Matricule':
                    [propertyA, propertyB] = [a.Matricule, b.Matricule];
                    break;
                case 'Name':
                    [propertyA, propertyB] = [a.Name, b.Name];
                    break;
                case 'Civilite':
                    [propertyA, propertyB] = [a.Civilite, b.Civilite];
                    break;
                case 'SITUATION_FAMILIALE':
                    [propertyA, propertyB] = [a.SITUATION_FAMILIALE, b.SITUATION_FAMILIALE];
                    break;
                case 'DateEmbauche':
                    [propertyA, propertyB] = [a.DateEmbauche, b.DateEmbauche];
                    break;

            }

            const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
            const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

            return (valueA < valueB ? -1 : 1) * (this._sort.direction === 'asc' ? 1 : -1);
        });
    }
}
