import { Routes } from '@angular/router';

import { TurnoverComponent } from './turnover.component';

export const TurnoverRoutes: Routes = [
    {

        path: '',
        children: [ {
            path: 'turnover',
            component: TurnoverComponent
        }]
    }
];
