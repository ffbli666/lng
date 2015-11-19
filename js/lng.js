'use strict';

var Expression = (function() {
    var isFunction = function(string) {
        if (!string) {
            return false;
        }
        var regex = /^([\w\d.]+)[ ]*\(([\w\d, .]*)\)$/;
        var match = string.trim().match(regex);
        if (match === null) {
            return false;
        };
        return true;
    };
    var func = function (string) {
        var regex = /^([\w\d.]+)[ ]*\(([\w\d, .]*)\)$/;
        var match = string.trim().match(regex);
        if (match === null) {
            throw 'Function expression parse error e.g. helloWorld()';
        };
        return {
            name: match[1].trim(),
            attrs: match[2].trim()
        };
    };

    var repeat = function (string) {
        var regex = /^([\w\d]+)[ ]*in[ ]([\w\d.]+)$/;
        var match = string.trim().match(regex);
        if (match === null) {
            throw 'Repeat expression parse error e.g. element in array';
        };
        return {
            lhs: match[1].trim(),
            rhs: match[2].trim()
        };
    };
    return {
        isFunction: isFunction,
        func: func,
        repeat: repeat
    };
})();

var LngScope = function() {
    var _alias = [];
    var _watch = [];
    var _watchlast = 0;
    var watch = function(string, handler) {
        var find = getWatchVariable.call(this, string);
        // console.log(find);
        if (!find) {
            throw '$watch can not found the property:' + string;
            return false;
        }
        var needWatch = find.variable;
        var prop = find.prop;
        var id;
        if (needWatch[prop + 'handlerID']) {
            id = needWatch[prop + 'handlerID'];
            var index = _watch.map(function(e) { return e.id; }).indexOf(id);
            if (index >= 0) {
                var watch = _watch[index];
                watch.handler.push(handler);
                return true;
            }
        }

        id = ++_watchlast;
        needWatch[prop + 'handlerID'] = id;
        var watch = {
            id: id,
            needWatch: needWatch,
            prop: prop,
            handler: [handler]
        };
        _watch.push(watch);
        needWatch.watch(prop, function(prop, oldval, newval) {
            for(var i=0; i<watch.handler.length; i++) {
                newval = watch.handler[i].call(this, prop, oldval, newval);
            }
            return newval;
        });
        //console.log(_watch);
        return true;
    };

    var unwatch = function(string) {
        var find = getWatchVariable.call(this, string);
        if (!find) {
            throw '$unwatch can not found the property:' + string;
            return false;
        }
        var needUnwatch = find.variable;
        var prop = find.prop;
        var id;

        if (needUnwatch[prop + 'handlerID']) {
            id = needUnwatch[prop + 'handlerID'];
            var index = _watch.map(function(e) { return e.id; }).indexOf(id);
            if (index >= 0) {
                _watch.splice(index, 1);
            }
            delete  needUnwatch[prop + 'handlerID'];
        }
        needUnwatch.unwatch(prop);
    };

    var _observe = [];
    var observe = function(string, hander) {
        var find = getWatchVariable.call(this, string);
        if (!find) {
            throw '$watch can not found the property:' + string;
            return false;
        }
        var needWatch = find.variable;
        var prop = find.prop;
        // if (typeof needWatch[prop] !== 'object') {
        //     throw 'this property is not object';
        //     return false;
        // }
        if (Object.prototype.toString.call(needWatch[prop]) !== '[object Array]') {
            throw 'this property is not object';
            return false;
        }
        Array.observe(needWatch[prop], function(changes) {
            hander.call(this, changes);
        });
    }


    var unobserve = function(variable) {
        //console.log(_observe);
        var index = _observe.indexOf(variable);
        //console.log('un: ' + index);
        if (index < 0) return;
        _observe.splice(index, 1);
    }

    var getWatchVariable = function (string) {
        if (!string) {
            return false;
        }

        var props = string.trim().split('.');

        var name = props.splice(0, 1)[0].trim();
        if (!name) {
            return false;
        }
        if (this[name] !== undefined) {
            if (props.length <= 0) {
                return {
                    variable: this,
                    prop: name
                };
            }
            var prop = props.pop();
            var find = _findValue(this[name], props);
            if (find[prop] !== undefined) {
                return {
                    variable: find,
                    prop: prop
                };
            }
        } else {
            var index = findAlias(name);
            if (index >= 0) {
                //var variable = _alias[index].variable;
                if (props.length <= 0) {
                    return false;
                    // return {
                    //     variable: _alias[index],
                    //     prop: 'variable'
                    // }
                }
                var prop = props.pop();
                var find = _findValue(_alias[index].variable, props);
                if (find[prop] !== undefined) {
                    return {
                        variable: find,
                        prop: prop
                    };
                }
            }
        }
        return false;
    };
    var getVariable = function(string) {
        if (!string) {
            return false;
        }
        var props = string.trim().split('.');
        var name = props.splice(0, 1).toString().trim();
        if (!name) {
            return false;
        }

        if (this[name]) {
            return _findValue(this[name], props);
        }
        var find = findAlias(name);
        if (find >= 0) {
            return _findValue(_alias[find].variable, props);
        }
        return false;
    };

    var _findValue = function(variable, props) {
        if (!variable) {
            return false;
        }

        if (!props) {
            return variable;
        }
        var firstProp = props.splice(0, 1).toString().trim();
        if (firstProp == '') {
            return variable;
        }

        if (!variable[firstProp]) {
            return false;
        }

        return _findValue(variable[firstProp], props);
    };

    var getFunction = function(string) {
        if (!string) {
            return false;
        }
        var attrs = [];
        var ep = Expression.func(string);
        var func = getVariable.call(this, ep.name);
        if (!func) {
            return false;
        }

        if ( typeof func !== 'function') {
            return false;
        }

        var funcAttrs = ep.attrs.split(',');
        for (var i in funcAttrs ) {
            var variable = this.getVariable(funcAttrs[i]);
            if (variable) {
                attrs.push(variable);
            }
            else {
                attrs.push(funcAttrs[i]);
            }
        }
        return {
            func: func,
            attrs: attrs
        }
    };
    //todo
    //maybe memory leak
    var setAlias = function(alias, variable) {
        if(!alias || !variable) {
            return ;
        }
        var index = findAlias(alias);
        if (index >=0 ) {
             _alias.splice(index, 1);
        }
        _alias.push({alias: alias, variable: variable});
    };

    var findAlias = function(alias) {
        return _alias.map(function(e) { return e.alias; }).indexOf(alias)
    };

    var setModel = function(variable, prop, set, get) {
        if (!prop) {
            throw 'prop is empty';
        }
        if (typeof set !== 'function' || typeof get !== 'function') {
            throw 'set or get not function';
        }
        var value = variable[prop];
        var setter = function (val) {
                value = set.call(variable, val);
            };
        var getter = function () {
                return get.call(variable, value);
            };
        if (delete variable[prop]) {
            Object.defineProperty(variable, prop, {
                set: setter,
                get: getter,
                enumerable: true,
                configurable: true
            });
        }
    };

    return {
        getVariable: getVariable,
        getFunction: getFunction,
        getWatchVariable: getWatchVariable,
        setAlias: setAlias,
        setModel: setModel,
        $watch: watch,
        $unwatch: unwatch,
        $observe: observe,
        $unobserve: unobserve
    };
};

var LngCore = function(selecton, lngScope) {
};

(function($) {
    $.fn.extend({
        lng: function(cb) {
            var eventList = [
                'blur',
                'change',
                'click',
                'dbclick',
                'focus',
                'keydown',
                'keypress',
                'keyup',
                'mousedown',
                'mouseenter',
                'mouseleave',
                'mousemove',
                'mouseover',
                'mouseup',
                'submit'
            ];
            var self = this;
            var $scope = new LngScope();
            var lng = new LngScope(self, $scope);

            var customer = cb.call(self, $scope);

            var bind = function (dom) {
                var items = dom.find('[ng-bind]');
                items.each( function( index, element ) {
                    var value = $(element).attr('ng-bind').trim();
                    if(Expression.isFunction(value)) {
                        var findfunc = $scope.getFunction(value);
                        $(element).html(findfunc.func.apply(this, findfunc.attrs));
                    }
                    else {
                        var watch = $scope.getWatchVariable(value);
                        if (!watch) {
                            var variable = $scope.getVariable(value);
                            //variable that is string can not watch
                            if (variable) {
                                if (typeof variable === 'object') {
                                    $(element).html(variable.toSource());
                                }
                                else {
                                    $(element).html(variable);
                                }
                            }
                            return ;
                        }
                        //variable that is function can not watch
                        if (typeof watch.variable[watch.prop] === 'function') {
                            $(element).html(watch.variable[watch.prop] .apply(this));
                            return ;
                        }
                        $scope.$watch(value, function(prop, oldval, newval){
                            //console.log(newval);
                            if (typeof newval === 'object') {
                                $(element).html(newval.toSource());
                            }
                            else {
                                $(element).html(newval);
                            }
                            return newval;
                        });
                        //init render
                        watch.variable[watch.prop] = watch.variable[watch.prop];
                    }
                });
            };
            var unbind = function(dom){
                var items = dom.find('[ng-bind]');
                items.each( function( index, element ) {
                    var value = $(element).attr('ng-bind').trim();
                    var watch = $scope.getWatchVariable(value);
                    if (watch) {
                        $scope.$unwatch(value);
                    }
                });
            };

            var registerEvent = function (dom, event) {
                var items = dom.find('[ng-' + event + ']');
                items.each( function( index, element ) {
                    var findfunc = $scope.getFunction($(this).attr('ng-' + event));
                    if (!findfunc) {
                        return;
                    }
                    $(element).on(event, function(e) {
                        if (event === 'submit' || event === 'click') {
                            e.preventDefault();
                        };
                        findfunc.func.apply(this, [e].concat(findfunc.attrs));
                    });
                });
            };
            //ng-model
            var model = function(dom) {
                var items = dom.find('[ng-model]');
                items.each( function( index, element ) {
                    var modelObj = $(element);
                    var value = modelObj.attr('ng-model').trim();
                    //console.log(value);
                    var watch = $scope.getWatchVariable(value);
                    if (!watch) {
                        $scope[value] = '';
                        watch = $scope.getWatchVariable(value);
                    }
                    //variable, prop, setter, getter
                    $scope.setModel(
                        watch.variable,
                        watch.prop,
                        function(value) {
                            if (modelObj.is(':checkbox')){
                                element.checked = value;
                            }
                            else {
                                modelObj.val(value);
                            }
                            return value;
                        },
                        function(value) {
                            return value;
                        }
                    );
                    //init ui render
                    watch.variable[watch.prop] = watch.variable[watch.prop];

                    //event
                    if (modelObj.is(':checkbox')){
                        modelObj.on('change', function(e) {
                            watch.variable[watch.prop] = element.checked;
                        });
                    }
                    else { //input text, password
                        //todo
                        // need change event
                        // keyup not good event
                        modelObj.on('keyup', function(e) {
                            watch.variable[watch.prop] = modelObj.val();
                        });
                    }
                });
            };

            var render = function(dom) {
                model(dom);
                bind(dom);
                eventList.forEach( function(event) {
                    registerEvent(dom, event);
                });
            };

            // init get need render dom
            var renderQueue = new Array();
            var renderWatch = new Array();
            var items = self.find('[ng-repeat]');

            items.each( function( index, element ) {
                var template = $(this).clone();
                renderQueue.push({dom: $(this).clone(), parent: $(this).parent(), type: 'repeat'});
                $(this).remove();
            });
            renderQueue.push({dom: self, type: 'root'});

            renderQueue.reverse().forEach(function( renderObj ) {
                if (renderObj.type == 'repeat') {
                    var repeatEp = Expression.repeat(renderObj.dom.attr('ng-repeat'));
                    var rhs = $scope.getVariable(repeatEp.rhs);

                    if (!rhs || !rhs instanceof Array) {
                        return ;
                    }

                    $scope.$watch (repeatEp.rhs, function(prop, oldval, newval) {
                        var value = newval.slice(0, newval.length);
                        renderObj.parent.empty();
                        //oldval.length = 0; // can not trigger observe
                        oldval.splice(0, oldval.length);
                        value.forEach(function(item){
                            oldval.push(item);
                        });
                        return oldval;
                    });
                    var obs = function() {
                        var map = new Map();
                        var handler = function(changes) {
                            //console.log(changes);
                            changes.forEach(function(event){
                                if (event.removed.length > 0) {
                                    event.removed.forEach(function(item){
                                        var dom = map.get(item);
                                        if (dom) {
                                            $scope.setAlias(repeatEp.lhs, item);
                                            //todo
                                            // need remove the dom event
                                            // but now is remove all the variable event
                                            unbind(dom);
                                            dom.remove();
                                        }
                                    });
                                }
                                if (event.addedCount > 0) {
                                    var max = (event.index + event.addedCount);
                                    for (var i = event.index; i < max; i++) {
                                        var item = event.object[i];
                                        var temp = renderObj.dom.clone();
                                        $scope.setAlias(repeatEp.lhs, item);
                                        render(temp);
                                        renderObj.parent.append(temp);
                                        map.set(item, temp);
                                    }
                                }
                            });
                        };
                        return {
                            handler: handler
                        };
                    }();

                    $scope.$observe (repeatEp.rhs, obs.handler);

                    //init render
                    var index = renderWatch.indexOf(repeatEp.rhs);
                    if (index < 0) {
                        renderWatch.push(repeatEp.rhs);
                    }
                }
                else {
                    render(renderObj.dom);
                }
            });
            //init watch render
            renderWatch.forEach( function( item ) {
                var watch = $scope.getWatchVariable(item);
                watch.variable[watch.prop] = watch.variable[watch.prop];
            });

            //copy customer function to the jquery object
            for(var key in customer) {
                if (key !=='val' && self[key] !== undefined) continue;
                self[key] = customer[key];
            };

            return self;
        }
    });
})(jQuery);