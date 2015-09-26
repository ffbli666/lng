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
            throw "Function expression parse error e.g. helloWorld()";
        };
        return {
            name: match[1].trim(),
            attrs: match[2].trim()
        };
    };

    var repeat = function (string) {
        var regex = /^([\w\d]+)[ ]*in[ ]([\w\d]+)$/;
        var match = string.trim().match(regex);
        if (match === null) {
            throw "Repeat expression parse error e.g. element in array";
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
    var _alias = {};
    var _watch = [];
    var _watchlast = 0;
    var watch = function(string, handler) {
        var find = getWatchVariable.bind(this)(string);
        // console.log(_watch);
        console.log(find);
        // console.log(_alias);
        if (!find) {
            throw "can not found the property:" + string;
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

        return true;
    };

    var unwatch = function(string) {
        var find = getWatchVariable.bind(this)(string);
        if (!find) {
            throw "can not found the property:" + string;
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

    var observe = function(string, hander) {
        var find = getWatchVariable.bind(this)(string);
        if (!find) {
            throw "can not found the property:" + string;
            return false;
        }
        var needWatch = find.variable;
        var prop = find.prop;
        if (typeof needWatch[prop] !== "object") {
            throw "this property is not object";
            return false;
        }
        Object.observe(needWatch[prop], function(changes) {
            hander.call(this, changes);
        });
    }
    var getWatchVariable = function (string) {
        if (!string) {
            return false;
        }
        var props = string.trim().split('.');
        var name = props[0].toString().trim();
        if (!name) {
            return false;
        }
        var prop = props.pop();
        var needbind;
        if (this[name] !== undefined) {
            var find = _findValue(this, props);
            if (find[prop] !== undefined) {
                return {
                    variable: find,
                    prop: prop
                };
            }
        } else if (_alias[name] !== undefined) {
            var find = _findValue(_alias, props);
            if (find[prop] !== undefined) {
                return {
                    variable: find,
                    prop: prop
                };
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

        if (_alias[name]) {
            return _findValue(_alias[name], props);
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
        if (firstProp == "") {
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
            var variable = getVariable.bind(this)(funcAttrs[i]);
            if (variable) {
                attrs.push(variable);
            }
        }
        return {
            func: func,
            attrs: attrs
        };
    };
    var setAlias = function(alias, variable) {
        if(!alias || !variable) {
            return ;
        }
        _alias[alias] = variable;
    };

    var setModel = function(prop, set, get) {
        if (!prop) {
            throw "prop is empty";
        }
        if (typeof set !== 'function' || typeof get !== 'function') {
            throw "set or get not function";
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
        $watch:watch,
        $unwatch:unwatch,
        $observe:observe
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
                'mouseup'
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
                        if (!watch || typeof watch[watch.prop] === 'function') {
                            return ;
                        }
                        //console.log(watch);
                        $scope.$watch (value, function(prop, oldval, newval){
                            //console.log(newval);
                            $(element).html(newval);
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
                    $scope.$unwatch(value);
                });
            }

            var registerEvent = function (dom, event) {
                var items = dom.find('[ng-' + event + ']');
                items.each( function( index, element ) {
                    var findfunc = $scope.getFunction($(this).attr('ng-' + event));
                    if (!findfunc) {
                        return;
                    }

                    $(element).on(event, function(e) {
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
                    //prop, setter, getter
                    $scope.setModel(
                        prop,
                        function(value) {
                            modelObj.val(value);
                            return value;
                        },
                        function(value) {
                            return modelObj.val();
                        }
                    );
                });
            }

            var render = function(dom) {
                bind(dom);
                eventList.forEach( function(event) {
                    registerEvent(renderObj.dom, event);
                });
                model(dom);
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
                        renderObj.parent.empty();
                        newval.forEach( function(item) {
                            var temp = renderObj.dom.clone();
                            //console.log(repeatEp.lhs);
                            $scope.setAlias(repeatEp.lhs, item);
                            bind(temp);
                            eventList.forEach( function(event) {
                                registerEvent(temp, event);
                            });
                            model(temp);
                            renderObj.parent.append(temp);
                        });
                        return newval;
                    });
                    //init render
                    var index = renderWatch.indexOf(repeatEp.rhs);
                    if (index < 0) {
                        renderWatch.push(repeatEp.rhs);

                        $scope.$observe (repeatEp.rhs, function(changes){
                            //unbind
                            var lastevent = changes.pop();
                            if (lastevent.type === "delete") {
                                $scope.setAlias(repeatEp.lhs, lastevent.oldValue);
                                unbind(renderObj.dom);
                            }
                            var newval = lastevent.object;
                            for(var j=0; j < newval.length; j++) {
                                var item = newval[j];
                                $scope.setAlias(repeatEp.lhs, item);
                                unbind(renderObj.dom);
                            };
                            //re render
                            var watch = $scope.getWatchVariable(repeatEp.rhs);
                            watch.variable[watch.prop] = watch.variable[watch.prop];
                        });
                    }
                }
                else {
                    bind(renderObj.dom);
                    eventList.forEach( function(event) {
                        registerEvent(renderObj.dom, event);
                    });
                    model(renderObj.dom);
                }
            });
            //init watch render
            renderWatch.forEach( function( item ) {
                var watch = $scope.getWatchVariable(item);
                watch.variable[watch.prop] = watch.variable[watch.prop];
            });

            //copy customer function to the jquery object
            for(var key in customer) {
                if (key !=="val" && self[key] !== undefined) continue;
                self[key] = customer[key];
            };

            return self;
        }
    });
})(jQuery);