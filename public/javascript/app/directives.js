
app.directive('focusme', function ($timeout, $parse) {
    return {
        link: function (scope, element, attrs) {
            var model = $parse(attrs.focusme);
            $timeout(function () {
                element[0].focus();
            }, 1000);
        }
    };
})
        
.directive("repeatDelimiter", function () {
    function compile(element, attributes) {
        var delimiter = (attributes.repeatDelimiter || ", ");
        var delimiterHtml = (
            "<span ng-show=' ! $last '>" +
            delimiter + 
        "</span>"
);
        var html = element.html().replace(/(\s*$)/i, function (whitespace) {
            return (delimiterHtml + whitespace );
        });
        
        element.html(html);
    }
    return ({
        compile: compile,
        priority: 1001,
        restirct: "A"
    });
})

.directive('pwCheck', function () {
    return {
        require: 'ngModel',
        link: function (scope, elem, attrs, ctrl) {
            var password = "#" + attrs.pwCheck;
            document.querySelector(password).onkeyup = function () {
                scope.$apply(function () {
                    ctrl.$setValidity('pwmatch', elem.val() === document.querySelector(password).value);
                });
            };
        }
    };
})

.directive('slideableDown', function () {
    return {
        restrict: 'C',
        compile: function (element, attr) {
            var contents = element.html();
            element.html('<div id="' + attr.slideableDown + '_content" style="margin:0 !important; padding:0 !important" >' + contents + '</div>');
            
            return function postLink(scope, element, attrs) {
                if (!scope.slidesdown) {
                    scope.slidesdown = [];
                }
                scope.slidesdown[attrs.slideableDown] = false;
                attrs.duration = (!attrs.duration) ? '1s' : attrs.duration;
                attrs.easing = (!attrs.easing) ? 'ease-in-out' : attrs.easing;
                element.css({
                    'overflow': 'hidden',
                    'height': '0px',//top
                    'transitionProperty': 'all',
                    'transitionDuration': attrs.duration,
                    'transitionTimingFunction': attrs.easing
                });
            };
        }
    };
})

.directive('slideableUp', function () {
    return {
        restrict: 'A',
        compile: function (element, attr) {
            var contents = element.html();
            element.addClass('app-detail-up');
            element.html('<div id="' + attr.slideableUp + '_content" style="margin:0 !important; padding:0 !important; " >' + contents + '</div>');
            
            return function postLink(scope, element, attrs) {
                scope[attrs.slideableUp] = false;
                attrs.duration = (!attrs.duration) ? '0.4s' : attrs.duration;
                attrs.easing = (!attrs.easing) ? 'cubic-bezier(.4,0,.2,1)' : attrs.easing;
                element.css({
                    'overflow': 'hidden',
                    'top': '100%',
                    'transitionProperty': 'all',
                    'transitionDuration': attrs.duration,
                    'transitionTimingFunction': attrs.easing,
                    '-webkit-overflow-scrolling': 'touch',
                });

            };
        }
    };
})

.directive('slideDownToggle', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var target, content;
            
            element.bind('click', function () {
                if (!target) target = document.querySelector('#' + attrs.slideDownToggle);
                if (!content) content = target.querySelector('#' + attrs.slideDownToggle + '_content');
                var scope = angular.element(target).scope();
                
                if (!scope.slidesdown.slideDownToggle) {
                    content.style.border = '1px solid rgba(0,0,0,0)';
                    var y = content.clientHeight;
                    content.style.border = 0;
                    target.style.height = y + 'px';
                } else {
                    target.style.height = '0px';
                }
                scope.slidesdown.slideDownToggle = !scope.slidesdown.slideDownToggle;
                scope.$apply();
            });
        }
    }
})

.directive('slideUpToggle', function ($debounce) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var target, content;//, scr = document.querySelector('.app-page');
            
            
            element.bind('click', function () {
                if (!target) target = document.querySelector('#' + attrs.slideUpToggle);
                if (!content) content = target.querySelector('#' + attrs.slideUpToggle + '_content');
                
                var scope = angular.element(target).scope()
                  , h = content.clientHeight;
                if (!scope.slideUpToggle) {
                    content.style.border = '1px solid rgba(0,0,0,0)';
                    content.style.border = 0;
                    target.style.top = 0;
                    target.style.clientHeight = '100%';
                    angular.element(target).parent().addClass('blur-content');
                } else {
                    target.style.top = '100%';
                    angular.element(target).parent().removeClass('blur-content');
                }
                scope.slideUpToggle = !scope.slideUpToggle;
                scope.$apply();
            });
        }
    }
})

.directive('slidetarget', function ($debounce) {
    return {
        restrict: 'A',
        compile: function (element, attr) {
            var contents = element.html();
            element.html('<div class="slideable_content" style="margin:0 !important; padding:0 !important" >' + contents + '</div>');
            
            return function postLink(scope, element, attrs) {
                var slideelements = function () {
                    var target, content;
                    try {
                        target = document.querySelector('#' + attrs.slidetarget);
                        if (!content) content = target.querySelector('.slideable_content');
                        
                        if (!attrs.expanded) {
                            content.style.border = '1px solid rgba(0,0,0,0)';
                            var y = content.clientHeight;
                            content.style.border = 0;
                            target.style.height = y + 'px';
                        } else {
                            target.style.height = '0px';
                        }
                    } catch (e) {
                    }
                    attrs.expanded = !attrs.expanded;
                };
                
                attrs.duration = (!attrs.duration) ? '0.5s' : attrs.duration;
                
                element.css({
                    'overflow': 'hidden',
                    'height': '0px',
                    'transitionProperty': 'height',
                    '-webkit-transition-property': 'height',
                    'transitionDuration': attrs.duration,
                    '-webkit-transition-duration': attrs.duration,
                    'transitionTimingFunction': 'ease-in-out'
                });
                
                attrs.expanded = false;
                $debounce(slideelements, 0);
            }
        }
    }
})

.directive('domOnCreate', function ($parse, $timeout) {
    return {
        link: function postLink(scope, element, attrs) {
            $timeout(function () {
                if (attrs.domOnCreate) {
                    $parse(attrs.domOnCreate)(scope);
                }
            });
        }
    };
})

.directive('domOnDestroy', function ($parse) {
    return {
        link: function postLink(scope, element, attrs) {
            var destroyHandler;
            if (attrs.domOnDestroy) {
                destroyHandler = $parse(attrs.domOnDestroy);
                element.on('$destroy', function () {
                    destroyHandler(scope);
                });
            }
        }
    };
})

.directive('datapanel', function ($compile, dataCache) {
    return {
        restrict: 'A',
        priority: 1001,
        compile: function (element, attrs) {
            var html = dataCache.get(attrs.datapanel);
            if (attrs.ngClass) {
                html = html.split('ng-class=""').join('ng-class="' + attrs.ngClass + '"');
            }
            if (attrs.dataname) {
                html = html.replace(new RegExp('panel.', 'g'), 'panels.' + attrs.dataname + '.');
                element.removeAttr('dataname');
            }
            element.removeAttr('datapanel');
            element.html(html);
            return function postLink(scope, element, attrs) {
            }
        }
    }
})

.directive('pikadayfocus', function () {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (elem, $scope, attrs, ngModel) {
            var curscope = $scope;
            curscope.bind('mouseenter', function () {
                curscope[0].focus();
            });
        }
    }
})

.directive('fileUpload', function () {
    return {
        scope: true,       
        link: function (scope, el, attrs) {
            el.bind('change', function (event) {
                var files = event.target.files;
                for (var i = 0; i < files.length; i++) {
                    scope.$emit("fileSelected", { file: files[i] });
                }
            });
        }
    }
})


.directive('boardtable', function ($compile, dataCache) {
    return {
        restrict: 'A',
        compile: function (element, attrs) {
            var html = dataCache.get('boardtable');
            html = html.replace(new RegExp('BOARDPOSITION', 'g'), attrs.position);
            html = html.replace(new RegExp('BOARDCOLUMN', 'g'), attrs.column);
            element.removeAttr('boardtable');
            element.html(html);
            return function postLink(scope, element, attrs) {
            }
        }
    }
})

.directive('selvalues', function ($compile, dataCache) {
    return {
        restrict: 'A',
        compile: function (element, attrs) {
            var html = dataCache.get('selvalues');
            html = html.replace(new RegExp('SELVALUES', 'g'), attrs.selvalues);
            html = html.replace(new RegExp('SELCLASS', 'g'), attrs.class);
            element.removeAttr('selvalues');
            element.html(html);
            return function postLink(scope, element, attrs) {
            }
        }
    }
})
.directive('datevalue', ['$timeout', '$filter', function ($timeout, $filter) {
        return {
            require: 'ngModel',
            
            link: function ($scope, $element, $attrs, $ctrl) {
                $ctrl.$parsers.push(function (viewValue) {
                    var pDate = dateStringParse(viewValue);
                    if (pDate) return pDate;
                    return undefined;

                });
                $ctrl.$formatters.push(function (modelValue) {
                    var pDate = dateStringParse(modelValue,true);
                    if (pDate) return pDate;
                    return undefined;
                });
                $element.on('blur', function () {
                    var pDate = dateStringParse($element.val());// Date.parse($ctrl.$modelValue);

                    if (isNaN(pDate) === true) {
                        $ctrl.$setViewValue(null);
                        $ctrl.$render();
                    } else $ctrl.$render();
                });
            }
        };
    }])



.directive('chartview', function () {
    var linkFn = function (scope, elm, attrs) {
        var data, options, responsiveOptions, selector, updateChart, deepWatchData, deepWatchOptions, deepwatch, charttype, onDrawFn;
        data = scope.data;
        options = scope.options;
        responsiveOptions = scope.responsiveOptions;
        deepwatch = scope.deepWatch;
        selector = "#" + scope.chartid;
        charttype = scope.charttype || 'line';
        onDrawFn = scope.onDrawFn || function (data) { };
        elm.attr('id', scope.chartid);
        
        updateChart = function () {
            switch (charttype) {
                case 'line':
                    Chartist.Line(selector, data, options, responsiveOptions);
                    break;
                case 'bar':
                    Chartist.Bar(selector, data, options, responsiveOptions);
                    break;
                case 'pie':
                    Chartist.Pie(selector, data, options, responsiveOptions);
                    break;
                case 'stackedbar':
                    Chartist.Bar(selector, data, options).on('draw', onDrawFn);
                    break;
                case 'gauge':
                    Chartist.Pie(selector, data, options);
                    break;
                case 'bpline':
                    Chartist.Line(selector, data, options);
                    break;
                case 'hbar':
                    Chartist.Bar(selector, data, options);
                    break;
            }
        };
        
        scope.$watch('data', function (newValue, oldValue) {
            data = newValue;
            updateChart();
        }, deepWatchData);
        
        scope.$watch('options', function (newValue, oldValue) {
            options = newValue;
            updateChart();
        }, deepWatchOptions);
        
        elm.addClass(scope.size);

        updateChart();
    };
    
    return {
        restrict: 'EA',
        template: '<div class="ct-chart "></div>',
        replace: true,
        scope: {
            data: '=',
            options: '=',
            chartid: '=',
            charttype: '=',
            size: '=',
            onDrawFn: '=',
            responsiveOptions: '=',
            deepWatchData: '=',
            deepWatchOptions: '='
        },
        link: linkFn
    };
})

.directive('stringToNumber', function () {
    return {
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            ngModel.$parsers.push(function (value) {
                return '' + value;
            });
            ngModel.$formatters.push(function (value) {
                return parseFloat(value);
            });
        }
    };
})

 .directive('showHideToggle', function ($debounce) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var target, content;
            
            element.bind('click', function () {
                if (!target) target = document.querySelector('#' + attrs.showHideToggle);
                if (!content) content = target.querySelector('#' + attrs.showHideToggle + '_content');
                
                var scope = angular.element(target).scope();
                if (!scope.showHideToggle) {
                    content.style.border = '1px solid rgba(0,0,0,0)';
                    content.style.border = 0;
                    target.style.visibility = 'visible';
                    angular.element(target).parent().addClass('blur-content');
                } else {
                    target.style.visibility = 'hidden';
                    angular.element(target).parent().removeClass('blur-content');
                }
                scope.showHideToggle = !scope.showHideToggle;
                scope.$apply();
            });
        }
    }
})

.directive('modalview', function () {
    return {
        restrict: 'A',
        compile: function (element, attr) {
            var contents = element.html();
            element.addClass('app-modal');
            element.id = attr.modalview;
            element.html('<div id="' + attr.modalview + '_content" style="margin:0 !important; padding:20px !important;overflow-y: auto; max-height: 98vh;margin: auto;" >' + contents + '</div>');
            
            return function postLink(scope, element, attrs) {
                scope[attrs.showhide] = false;
                element.css({
                    'visibility': 'hidden',
                    'transitionProperty': 'all',
                    'transitionDuration': attrs.duration,
                    'transitionTimingFunction': attrs.easing,
                    '-webkit-overflow-scrolling': 'touch'
                });

            };
        }
    };
})
   

.directive('ngEsc', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress keyup", function (event) {
            if (event.which === 27) {
                scope.$apply(function () {
                    scope.$eval(attrs.ngEsc);
                });            
                event.preventDefault();
            }
        });
    };
})

.directive("onscrollredraw", function ($window) {
    return function (scope, element, attrs) {
        angular.element($window).bind("scroll", function (evnt) {
            console.log(evt.offsetX + ':' + evt.offsetY);
        });
    };
})


.directive('multipleEmails', function () {
    return {
        require: 'ngModel',
        link: function (scope, element, attrs, ctrl) {
            ctrl.$parsers.unshift(function (viewValue) {               
                if (viewValue) {
                    var emails = viewValue.split(';');
                    var re = /\S+@\S+\.\S+/;
                
                    var validityArr = emails.map(function (str) {
                        return re.test(str.trim());
                    }); 
                    var atLeastOneInvalid = false;
                    angular.forEach(validityArr, function (value) {
                        if (value === false)
                            atLeastOneInvalid = true;
                    });
                    if (!atLeastOneInvalid) {
                        ctrl.$setValidity('multipleEmails', true);
                        return viewValue;
                    } else {
                        ctrl.$setValidity('multipleEmails', false);
                        return viewValue;
                    } 
                } else {
                    ctrl.$setValidity('multipleEmails', true);
                    return '';
                }
            });
        }
    };
})

.directive('numbersOnly', function () {
    return {
        require: 'ngModel',
        link: function (scope, element, attr, ngModelCtrl) {
            function fromUser(text) {
                if (text) {
                    var transformedInput = text.replace(/[^0-9,-]/g, '');
                    if (transformedInput !== text ) {
                        ngModelCtrl.$setViewValue(transformedInput);
                        ngModelCtrl.$render();
                    }
                    
                    return transformedInput;
                }
                return undefined;
            }
            ngModelCtrl.$parsers.push(fromUser);
        }
    };
})

.directive('hotkeyclick', ['hotkeys', '$timeout', function (hotkeys, $timeout) {
    return {
        restrict: 'A',
        link: function (scope, el, attrs) {
            var allowIn,
                hotkey=attrs.hotkeyclick;
                
            allowIn = typeof attrs.hotkeyAllowIn === "string" ? attrs.hotkeyAllowIn.split(/[\s,]+/) : ['INPUT', 'SELECT', 'TEXTAREA'];
                                          
            hotkeys.add({
                combo: hotkey,
                description: attrs.hotkeyDescription,
                callback: function (event, hotkey) {
                    $timeout(function () {
                        el.triggerHandler('click');
                    }, 0);
                },
                action: attrs.hotkeyAction,
                allowIn: allowIn
            });
                
        }
    };
}])


.directive('ondlgclick', function ($parse) {
    return function (scope, element, attrs) {        
        
        if (!scope.doModalDlg) {
            scope.doModalDlg = function (iddlg, okFn, data) {
                var dialog = document.querySelector('#'+ iddlg);
                var closeListener = function (event) {
                    dialog.close();
                    deleteListeners();
                };
                var deleteListener = function (event) {
                    closeListener(event);
                    okFn(data);
                };
                var deleteListeners = function () {
                    dialog.querySelector('.pgDelButtonClose').removeEventListener('click', closeListener);
                    dialog.querySelector('.pgDelButton').removeEventListener('click', deleteListener);
                }
        
                if (!dialog.showModal) {
                    dialogPolyfill.registerDialog(dialog);
                }
                dialog.showModal();
                dialog.querySelector('.pgDelButtonClose').addEventListener('click', closeListener);
                dialog.querySelector('.pgDelButton').addEventListener('click', deleteListener);
        
                event.preventDefault();
                event.stopPropagation();
            };
        
        }

        element.bind('click', function () {
            scope.$eval(attrs.ondlgclick);
        })
    }
})

;