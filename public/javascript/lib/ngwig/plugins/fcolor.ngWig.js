angular.module('ngWig')
    .config(['ngWigToolbarProvider', function (ngWigToolbarProvider) {
       ngWigToolbarProvider.addCustomButton('fcolor', 'nw-fcolor-button');
    }])
    .component('nwFcolorButton', {
        bindings: {
            execCommand: '=',
            editMode: '=',
            disabled: '='
        },
        template: '<select class="nw-select" '+
                  '         ng-model="$ctrl.fcolor" '+
                  '         ng-change="$ctrl.execCommand(\'ForeColor\', $ctrl.fcolor.value)" '+
                  '         ng-options="fcolor.name for fcolor in $ctrl.fcolors" '+
                  '         ng-disabled="$ctrl.editMode || $ctrl.disabled"></select>',
        controller: function() {

        var fcolors = [
            { name: '0', value: '#7bd148' },
            { name: '1', value: '#5484ed' },
            { name: '2', value: '#a4bdfc' },
            { name: '3', value: '#46d6db' },
            { name: '4', value: '#7ae7bf' },
            { name: '5', value: '#51b749' },
            { name: '6', value: '#fbd75b' },
            { name: '7', value: '#ffb878' },
            { name: '8', value: '#ff887c' },
            { name: '9', value: '#dc2127' },
            { name: '10', value: '#dbadff' },
            { name: '11', value: '#e1e1e1' }
        ];
            this.fcolor = this.fcolors[0];
        }
    });

