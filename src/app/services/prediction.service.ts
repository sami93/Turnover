import {Http, Response, URLSearchParams, Headers, RequestOptions} from '@angular/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import swal from 'sweetalert2';

@Injectable()
export class PredictionService {
    private headers = new Headers({'Content-Type': 'application/json', 'charset': 'UTF-8'});
    private options = new RequestOptions({headers: this.headers});

    predict_detail: any;

    tab_predict: any[];
    url = 'http://10.242.195.171:54321';
    /* url = 'http://10.241.107.26:54321'; */

    /* url = 'http://10.241.107.54:54321'; */
    name: string;
    // pathFile = 'C:/Users/s.ghorbel/Desktop/test/predict.csv';
    pathFile = 'C:/Users/s.ghorbel/Desktop/GenerateFile/predict.csv';
    pathFileAllPerson = 'C:/Users/s.ghorbel/Desktop/GenerateFile/datasetAll.csv';
    showInfoPerson: any;

    predict_value: any;

    name_value: any;

    combined_prediction: string;
    today = new Date();
    minute = this.today.getMinutes();
    hour = this.today.getHours();
    sec = this.today.getSeconds();
    timeNow = this.hour + ' : ' + this.minute + ' : ' + this.sec;
    dd = this.today.getDate();
    mm = this.today.getMonth() + 1;
    yyyy = this.today.getFullYear();
    datefull: string;
    d: string;
    m: string;
    Api_url = 'http://localhost:4200/';

    constructor(private http: Http) {
    }

    predict_post(predictions): Observable<any> {
        return this.http.post(this.Api_url + 'api/prediction', JSON.stringify(predictions), this.options);
    }

    editPrediction(predict): Observable<any> {
        return this.http.patch(this.Api_url + `api/prediction_update`, JSON.stringify(predict), this.options);
    }

    editPredictionAll(predict): Observable<any> {
        return this.http.patch(this.Api_url + `api/prediction_update_all`, JSON.stringify(predict), this.options);
    }

    getPrediction(prediction): Observable<any> {
        return this.http.get(this.Api_url + `api/prediction/${prediction._id}`).map(res => res.json());
    }


    getPredictionMatricule(prediction): Observable<any> {
        return this.http.get(this.Api_url + `/api/predictionMat/${prediction.Matricule}`).map(res => res.json());
    }

    getPredictionAll(predictions): Observable<any> {
        return this.http.post(this.Api_url + 'api/prediction/allPerson', JSON.stringify(predictions), this.options);
    }

    PredictionPerPerson(predictions): Observable<any> {
        return this.http.post(this.Api_url + 'api/prediction/getPathOfCsvPersonToPredict', JSON.stringify(predictions), this.options);
    }


    Parse_predictPerPersonCsv(PostFileResult) {
        const parseSetup = new URLSearchParams();
        parseSetup.append('source_frames', '["' + PostFileResult + '"]');
        this.http.post(this.url + '/3/ParseSetup', parseSetup)
            .map(res => res.json())
            .subscribe(
                ParseSetupResult => {
                    console.log(PostFileResult);
                    console.log(ParseSetupResult.column_names);

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

                    this.http.post(this.url + '/3/Parse', parse)
                        .map(res => res.json())
                        .subscribe(
                            ParseResult => {
                                console.log('**********');
                                const DataSet = ParseResult.destination_frame.name;
                                // const DataSet = ParseSetupResult.destination_frame;
                                /* **********Choose Model ******* */
                                console.log('Choose a Model');
                                this.http.get(this.url + '/3/Models')
                                    .map(this.extractData)
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
                                                this.insert_prediction(ModelSelected, DataSet);

                                            })


                                        },
                                        error4 => {
                                            this.erreur(error4, 'Model Erreur');
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


    erreur(err, NameOfError) {
        swal(
            '' + NameOfError,
            '' + JSON.stringify(err),
            'error'
        )
    }

    private extractData(res: Response) {

        const body = res.json();
        const sami = body.models;


        return sami || {};
    }

    private extractData2(res: Response) {

        const body = res.json();
        const sami = body.frames;


        return sami || {};
    }

    insert_prediction(NameOfModel, NameOfFrame) {
        const predict_id = 'predict_id';
        const data = new URLSearchParams();
        data.append('predictions_frame', predict_id);
        if (this.dd < 10) {
            this.d = '0' + this.dd;
        }

        if (this.mm < 10) {
            this.m = '0' + this.mm;
        }
        this.datefull = this.dd + '/' + this.m + '/' + this.yyyy;

        this.http.post(this.url + '/3/Predictions/models/' + NameOfModel + '/frames/' + NameOfFrame, data)
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
                this.combined_prediction = 'combined-' + predict_id;
                combined.append('ast', '(assign ' + this.combined_prediction + ' (cbind ' + predict_id + ' ' + NameOfFrame + '))');
                this.http.post(this.url + '/99/Rapids', combined)
                    .subscribe(CombinedResult => {
                        /*swal(
                         'Prediction added!',
                         '',
                         'success'
                         );*/
                        this.http.get(this.url + '/3/Frames/' + this.combined_prediction + '?column_offset=0&column_count=20')
                            .map(this.extractData2)
                            .subscribe(frames => {
                                console.log(frames[0].columns);
                                for (const column_frame of  frames[0].columns) {
                                    if (column_frame.label === 'predict') {
                                        this.predict_value = column_frame.data[0];

                                    }
                                    if (column_frame.label === 'name') {
                                        this.name_value = column_frame.domain[0];

                                    }

                                }
                                console.log(this.predict_value);
                                console.log(this.name_value);
                                const obj = {
                                    'predict': this.predict_value,
                                    'name': this.name_value,
                                    'date': this.datefull,
                                    'time': this.timeNow
                                };

                                this.editPrediction(obj).subscribe(
                                    EditPerPersonResult => {
                                        console.log('sami');
                                    },
                                    EditPerPersonError => {
                                        console.log(EditPerPersonError.json());
                                        this.erreur(EditPerPersonError, 'errorFrame');
                                    }
                                );

                            }, errorFrame => {
                                console.log(errorFrame.json());
                                this.erreur(errorFrame, 'errorFrame');
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

}
