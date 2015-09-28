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
        var find = getWatchVariable.bind(this)(string);
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
            needWatch: find.variable,
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
        var find = getWatchVariable.bind(this)(string);
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
    var observe = function(variable, hander) {
        //console.log(_observe);
        var index = _observe.indexOf(variable);
        //console.log('on: ' + index);
        if (index >= 0)
            return;
        _observe.push(variable);
        Array.observe(variable, hander);
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
        var func = getVariable.bind(this)(ep.name);
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

    var setModel = function(prop, set, get) {
        if (!prop) {
            throw 'prop is empty';
        }
        if (typeof set !== 'function' || typeof get !== 'function') {
            throw 'set or get not function';
        }
        var value = this[prop];
        var setter = function (val) {
                value = set.call(this, val);
            };
        var getter = function () {
                return get.call(this, value);
            };
        if (delete this[prop]) {
            Object.defineProperty(this, prop, {
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
                        //console.log(watch);
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
                        findfunc.attrs.unshift(e);
                        findfunc.func.apply(this, findfunc.attrs);
                    });
                });
            };
            //ng-model
            var model = function(dom) {
                var items = dom.find('[ng-model]');
                items.each( function( index, element ) {
                    var modelObj = $(element);
                    var prop = modelObj.attr('ng-model').trim();
                    $scope[prop] = modelObj.val();
                    modelObj.on('keyup', function(e) {
                        $scope[prop] = modelObj.val();
                    });
                    //prop, setter, getter
                    $scope.setModel(
                        prop,
                        function(value) {
                            modelObj.val(value);
                            return value;
                        },
                        function(value) {
                            return value;
                        }
                    );
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
                    //todo
                    //maybe do the diff
                    //it is rerender, now
                    var obs = function(changes){
                        //unbind
                        console.log(changes);
                        var event = changes[0];
                        if (event.removed) {
                            event.removed.forEach(function(item){
                                $scope.setAlias(repeatEp.lhs, item);
                                unbind(renderObj.dom);
                            });
                        }
                        event.object.forEach(function(item){
                            $scope.setAlias(repeatEp.lhs, item);
                            unbind(renderObj.dom);
                        });

                        //re render
                        var watch = $scope.getWatchVariable(repeatEp.rhs);
                        var newval = watch.variable[watch.prop].slice(0, watch.variable[watch.prop].length);
                        watch.variable[watch.prop] = newval;
                    }
                    $scope.$watch (repeatEp.rhs, function(prop, oldval, newval) {
                        //console.log(oldval);
                        renderObj.parent.empty();
                        newval.forEach( function(item) {
                            var temp = renderObj.dom.clone();
                            //console.log(item);
                            $scope.setAlias(repeatEp.lhs, item);
                            render(temp);
                            renderObj.parent.append(temp);
                        });
                        $scope.$unobserve(oldval);
                        $scope.$observe(newval, obs);
                        //Array.observe(newval, obs);
                        //console.log(newval);
                        return newval;
                    });
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
                //watch.variable[watch.prop] = watch.variable[watch.prop];
                var newval = watch.variable[watch.prop].slice(0, watch.variable[watch.prop].length);
                watch.variable[watch.prop] = newval;
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