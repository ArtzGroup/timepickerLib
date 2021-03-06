/*
 * JTSage-DateBox-5.3.3 (noframe)
 * Date: 2020-09-21T19:55:04.051Z
 * Modes: datebox
 * http://datebox.jtsage.dev/
 * https://github.com/jtsage/jtsage-datebox
 *
 * Copyright 2010, 2020 JTSage and other contributors
 * Released under the MIT license.
 * https://github.com/jtsage/jtsage-datebox/blob/master/LICENSE.txt
 *
 */


(function(factory) {
    if (typeof define === "function" && define.amd) {
        define([ "jquery" ], factory);
    } else {
        factory(jQuery);
    }
})(function($) {
    if (typeof $.widget !== "undefined") {
        return false;
    }
    var widgetUuid = 0, widgetSlice = Array.prototype.slice;
    $.widget = function(name, base, prototype) {
        var existingConstructor, constructor, basePrototype;
        var proxiedPrototype = {};
        var namespace = name.split(".")[0];
        name = name.split(".")[1];
        var fullName = namespace + "-" + name;
        if (!prototype) {
            prototype = base;
            base = $.Widget;
        }
        if ($.isArray(prototype)) {
            prototype = $.extend.apply(null, [ {} ].concat(prototype));
        }
        $.expr[":"][fullName.toLowerCase()] = function(elem) {
            return !!$.data(elem, fullName);
        };
        $[namespace] = $[namespace] || {};
        existingConstructor = $[namespace][name];
        constructor = $[namespace][name] = function(options, element) {
            if (!this._createWidget) {
                return new constructor(options, element);
            }
            if (arguments.length) {
                this._createWidget(options, element);
            }
        };
        $.extend(constructor, existingConstructor, {
            version: prototype.version,
            _proto: $.extend({}, prototype),
            _childConstructors: []
        });
        basePrototype = new base();
        basePrototype.options = $.widget.extend({}, basePrototype.options);
        $.each(prototype, function(prop, value) {
            if (typeof value !== "function") {
                proxiedPrototype[prop] = value;
                return;
            }
            proxiedPrototype[prop] = function() {
                function _super() {
                    return base.prototype[prop].apply(this, arguments);
                }
                function _superApply(args) {
                    return base.prototype[prop].apply(this, args);
                }
                return function() {
                    var __super = this._super;
                    var __superApply = this._superApply;
                    var returnValue;
                    this._super = _super;
                    this._superApply = _superApply;
                    returnValue = value.apply(this, arguments);
                    this._super = __super;
                    this._superApply = __superApply;
                    return returnValue;
                };
            }();
        });
        constructor.prototype = $.widget.extend(basePrototype, {
            widgetEventPrefix: existingConstructor ? basePrototype.widgetEventPrefix || name : name
        }, proxiedPrototype, {
            constructor: constructor,
            namespace: namespace,
            widgetName: name,
            widgetFullName: fullName
        });
        if (existingConstructor) {
            $.each(existingConstructor._childConstructors, function(i, child) {
                var childPrototype = child.prototype;
                $.widget(childPrototype.namespace + "." + childPrototype.widgetName, constructor, child._proto);
            });
            delete existingConstructor._childConstructors;
        } else {
            base._childConstructors.push(constructor);
        }
        $.widget.bridge(name, constructor);
        return constructor;
    };
    $.widget.extend = function(target) {
        var input = widgetSlice.call(arguments, 1);
        var inputIndex = 0;
        var inputLength = input.length;
        var key;
        var value;
        for (;inputIndex < inputLength; inputIndex++) {
            for (key in input[inputIndex]) {
                value = input[inputIndex][key];
                if (input[inputIndex].hasOwnProperty(key) && value !== undefined) {
                    if ($.isPlainObject(value)) {
                        target[key] = $.isPlainObject(target[key]) ? $.widget.extend({}, target[key], value) : $.widget.extend({}, value);
                    } else {
                        target[key] = value;
                    }
                }
            }
        }
        return target;
    };
    $.widget.bridge = function(name, object) {
        var fullName = object.prototype.widgetFullName || name;
        $.fn[name] = function(options) {
            var isMethodCall = typeof options === "string";
            var args = widgetSlice.call(arguments, 1);
            var returnValue = this;
            if (isMethodCall) {
                if (!this.length && options === "instance") {
                    returnValue = undefined;
                } else {
                    this.each(function() {
                        var methodValue;
                        var instance = $.data(this, fullName);
                        if (options === "instance") {
                            returnValue = instance;
                            return false;
                        }
                        if (!instance) {
                            return false;
                        }
                        if (typeof instance[options] !== "function" || options.charAt(0) === "_") {
                            return false;
                        }
                        methodValue = instance[options].apply(instance, args);
                        if (methodValue !== instance && methodValue !== undefined) {
                            returnValue = methodValue && methodValue.jquery ? returnValue.pushStack(methodValue.get()) : methodValue;
                            return false;
                        }
                    });
                }
            } else {
                if (args.length) {
                    options = $.widget.extend.apply(null, [ options ].concat(args));
                }
                this.each(function() {
                    var instance = $.data(this, fullName);
                    if (instance) {
                        instance.option(options || {});
                        if (instance._init) {
                            instance._init();
                        }
                    } else {
                        $.data(this, fullName, new object(options, this));
                    }
                });
            }
            return returnValue;
        };
    };
    $.Widget = function() {};
    $.Widget._childConstructors = [];
    $.Widget.prototype = {
        widgetName: "widget",
        widgetEventPrefix: "",
        defaultElement: "<div>",
        options: {
            classes: {},
            disabled: false,
            create: null
        },
        _createWidget: function(options, element) {
            element = $(element || this.defaultElement || this)[0];
            this.element = $(element);
            this.uuid = widgetUuid++;
            this.eventNamespace = "." + this.widgetName + this.uuid;
            this.bindings = $();
            this.hoverable = $();
            this.focusable = $();
            this.classesElementLookup = {};
            if (element !== this) {
                $.data(element, this.widgetFullName, this);
                this.document = $(element.style ? element.ownerDocument : element.document || element);
                this.window = $(this.document[0].defaultView || this.document[0].parentWindow);
            }
            this.options = $.widget.extend({}, this.options, this._getCreateOptions(), options);
            this._create();
            this._trigger("create", null, this._getCreateEventData());
            this._init();
        },
        _getCreateOptions: function() {
            return {};
        },
        _getCreateEventData: $.noop,
        _create: $.noop,
        _init: $.noop,
        destroy: function() {
            this._destroy();
            this.element.off(this.eventNamespace).removeData(this.widgetFullName);
            this.widget().off(this.eventNamespace).removeAttr("aria-disabled");
            this.bindings.off(this.eventNamespace);
        },
        _destroy: $.noop,
        widget: function() {
            return this.element;
        },
        option: function(key, value) {
            var options = key;
            var parts;
            var curOption;
            var i;
            if (arguments.length === 0) {
                return $.widget.extend({}, this.options);
            }
            if (typeof key === "string") {
                options = {};
                parts = key.split(".");
                key = parts.shift();
                if (parts.length) {
                    curOption = options[key] = $.widget.extend({}, this.options[key]);
                    for (i = 0; i < parts.length - 1; i++) {
                        curOption[parts[i]] = curOption[parts[i]] || {};
                        curOption = curOption[parts[i]];
                    }
                    key = parts.pop();
                    if (arguments.length === 1) {
                        return curOption[key] === undefined ? null : curOption[key];
                    }
                    curOption[key] = value;
                } else {
                    if (arguments.length === 1) {
                        return this.options[key] === undefined ? null : this.options[key];
                    }
                    options[key] = value;
                }
            }
            this._setOptions(options);
            return this;
        },
        _setOptions: function(options) {
            var key;
            for (key in options) {
                this._setOption(key, options[key]);
            }
            return this;
        },
        _setOption: function(key, value) {
            this.options[key] = value;
            return this;
        },
        enable: function() {
            return this._setOptions({
                disabled: false
            });
        },
        disable: function() {
            return this._setOptions({
                disabled: true
            });
        },
        _trigger: function(type, event, data) {
            var prop, orig;
            var callback = this.options[type];
            data = data || {};
            event = $.Event(event);
            event.type = (type === this.widgetEventPrefix ? type : this.widgetEventPrefix + type).toLowerCase();
            event.target = this.element[0];
            orig = event.originalEvent;
            if (orig) {
                for (prop in orig) {
                    if (!(prop in event)) {
                        event[prop] = orig[prop];
                    }
                }
            }
            this.element.trigger(event, data);
            return !(typeof callback === "function" && callback.apply(this.element[0], [ event ].concat(data)) === false || event.isDefaultPrevented());
        }
    };
    var widget = $.widget;
});

(function($) {
    $.widget("jtsage.datebox", {
        initSelector: "input[data-role='datebox']",
        options: {
            mode: false,
            hideInput: false,
            lockInput: true,
            safeEdit: true,
            controlWidth: "290px",
            controlWidthImp: "",
            breakpointWidth: "567px",
            zindex: "1100",
            clickEvent: "click",
            disableWheel: false,
            useKinetic: true,
            flipSizeOverride: false,
            defaultValue: false,
            showInitialValue: false,
            linkedField: false,
            linkedFieldFormat: "%J",
            displayMode: "dropdown",
            displayDropdownPosition: "bottomRight",
            displayInlinePosition: "center",
            displayForcePosition: false,
            dismissOutsideClick: true,
            dismissOnEscape: false,
            useHeader: true,
            useImmediate: false,
            useButton: true,
            buttonIcon: false,
            useFocus: false,
            useSetButton: true,
            useCancelButton: false,
            useTodayButton: false,
            closeTodayButton: false,
            useTomorrowButton: false,
            closeTomorrowButton: false,
            useClearButton: false,
            useCollapsedBut: false,
            usePlaceholder: false,
            headerFollowsPlaceholder: true,
            headerFollowsTitle: true,
            headerFollowsLabel: true,
            beforeOpenCallback: false,
            beforeOpenCallbackArgs: [],
            openCallback: false,
            openCallbackArgs: [],
            closeCallback: false,
            closeCallbackArgs: [],
            runOnBlurCallback: false,
            startOffsetYears: false,
            startOffsetMonths: false,
            startOffsetDays: false,
            afterToday: false,
            beforeToday: false,
            notToday: false,
            maxDate: false,
            minDate: false,
            maxDays: false,
            minDays: false,
            maxYear: false,
            minYear: false,
            blackDates: false,
            blackDatesRec: false,
            blackDatesPeriod: false,
            blackDays: false,
            whiteDates: false,
            enableDates: false,
            validHours: false,
            minHour: false,
            maxHour: false,
            minTime: false,
            maxTime: false,
            maxDur: false,
            minDur: false,
            minuteStep: 1,
            minuteStepRound: 0,
            twoDigitYearCutoff: 38,
            flipboxLensAdjust: 9,
            rolloverMode: {
                m: true,
                d: true,
                h: true,
                i: true,
                s: true
            },
            useLang: "default",
            lang: {
                default: {
                    setDateButtonLabel: "Set Date",
                    setTimeButtonLabel: "Set Time",
                    setDurationButtonLabel: "Set Duration",
                    todayButtonLabel: "Jump to Today",
                    tomorrowButtonLabel: "Jump to Tomorrow",
                    titleDateDialogLabel: "Set Date",
                    titleTimeDialogLabel: "Set Time",
                    daysOfWeek: [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ],
                    daysOfWeekShort: [ "Su", "Mo", "Tu", "We", "Th", "Fr", "Sa" ],
                    monthsOfYear: [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ],
                    monthsOfYearShort: [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ],
                    durationLabel: [ "Days", "Hours", "Minutes", "Seconds" ],
                    durationDays: [ "Day", "Days" ],
                    timeFormat: 24,
                    headerFormat: "%A, %B %-d, %Y",
                    tooltip: "Open Date Picker",
                    nextMonth: "Next Month",
                    prevMonth: "Previous Month",
                    dateFieldOrder: [ "m", "d", "y" ],
                    timeFieldOrder: [ "h", "i", "a" ],
                    datetimeFieldOrder: [ "y", "m", "d", "h", "i", "s", "a" ],
                    slideFieldOrder: [ "y", "m", "d" ],
                    dateFormat: "%Y-%m-%d",
                    datetimeFormat: "%Y-%m-%dT%k:%M:%S",
                    useArabicIndic: false,
                    isRTL: false,
                    calStartDay: 0,
                    clearButton: "Clear",
                    cancelButton: "Cancel",
                    durationOrder: [ "d", "h", "i", "s" ],
                    meridiem: [ "AM", "PM" ],
                    timeOutput: "%k:%M",
                    durationFormat: "%Dd %DA, %Dl:%DM:%DS",
                    calDateListLabel: "Other Dates",
                    calHeaderFormat: "%B %Y"
                }
            },
            theme_clearBtn: [ "clear", "" ],
            theme_closeBtn: [ "check", "" ],
            theme_cancelBtn: [ "cancel", "" ],
            theme_tomorrowBtn: [ "goto", "" ],
            theme_todayBtn: [ "goto", "" ],
            theme_dropdownContainer: "",
            theme_modalContainer: "",
            theme_inlineContainer: "",
            theme_headerTheme: "",
            theme_headerBtn: [ "cancel", "" ],
            theme_openButton: "",
            theme_cal_Today: "",
            theme_cal_DayHigh: "",
            theme_cal_Selected: "",
            theme_cal_DateHigh: "",
            theme_cal_DateHighAlt: "",
            theme_cal_DateHighRec: "",
            theme_cal_Default: "",
            theme_cal_OutOfBounds: "",
            theme_cal_NextBtn: [ "next", "" ],
            theme_cal_PrevBtn: [ "prev", "" ],
            theme_cal_Pickers: "",
            theme_cal_DateList: "",
            theme_dbox_NextBtn: [ "plus", "" ],
            theme_dbox_PrevBtn: [ "minus", "" ],
            theme_dbox_Inputs: "",
            theme_fbox_Selected: "",
            theme_fbox_Default: "",
            theme_fbox_Forbidden: "",
            theme_fbox_RollHeight: "135px",
            theme_slide_Today: "",
            theme_slide_DayHigh: "",
            theme_slide_Selected: "",
            theme_slide_DateHigh: "",
            theme_slide_DateHighAlt: "",
            theme_slide_DateHighRec: "",
            theme_slide_Default: "",
            theme_slide_NextBtn: [ "plus", "" ],
            theme_slide_PrevBtn: [ "minus", "" ],
            theme_slide_NextDateBtn: [ "next", "" ],
            theme_slide_PrevDateBtn: [ "prev", "" ],
            theme_slide_Pickers: "",
            theme_slide_DateList: "",
            theme_backgroundMask: {
                position: "fixed",
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,.4)"
            },
            theme_headStyle: "",
            theme_spanStyle: false,
            buttonIconDate: "calendar",
            buttonIconTime: "clock",
            disabledState: "disabled",
            tranDone: "webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend",
            durationStep: 1,
            durationSteppers: {
                d: 1,
                h: 1,
                i: 1,
                s: 1
            }
        },
        icons: {
            getIcon: function(name) {
                var w = this, icnF = w.options.iconFactory;
                if (name === false) {
                    return false;
                }
                if (typeof icnF === "function") {
                    return icnF.call(w, name);
                }
                if (name.substr(0, 4) === "<svg") {
                    return name;
                }
                if (typeof w.icons[name] !== "undefined") {
                    return w.icons[name];
                }
                return w.icons.cancel;
            },
            next: '<svg width="12" height="12" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M9.8 6L4 11.8l-1.8-1.7L6.6 6 2.2 2 4 .1 9.8 6z" clip-rule="evenodd" fill-rule="evenodd"/></svg>',
            prev: '<svg width="12" height="12" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M2.2 6L8 .2l1.8 1.7L5.4 6l4.4 4L8 11.9 2.2 6z" clip-rule="evenodd" fill-rule="evenodd"/></svg>',
            plus: '<svg width="12" height="12" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M0 5v2h12V5H0z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M7 0H5v12h2V0z" fill="currentColor"/></svg>',
            minus: '<svg width="12" height="12" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M0 5v2h12V5H0z" clip-rule="evenodd" fill-rule="evenodd"/></svg>',
            check: '<svg width="12" height="12" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M12 2.8l-8 8-4-4 1.5-1.5L4 7.8l6.5-6.5L12 2.6z" clip-rule="evenodd" fill-rule="evenodd"/></svg>',
            cancel: '<svg width="12" height="12" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M11 2.5L9.4 1 1.1 9.5 2.5 11l8.4-8.4z" clip-rule="evenodd" fill-rule="evenodd"/><path fill="currentColor" d="M2.5 1L1 2.6l8.4 8.4L11 9.5 2.5 1.1z" clip-rule="evenodd" fill-rule="evenodd"/></svg>',
            goto: '<svg width="12" height="12" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M7 3.3C3.8 3.6.4 5.9.4 11.7c2-4.3 4-5 6.8-5v2.9l4.6-4.7L7.1.3v3z" fill-rule="evenodd"/></svg>',
            clear: '<svg width="12" height="12" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.8 1H8.1c0-.5-.4-1-.8-1H4.7C4.3 0 4 .6 4 1H2.2c-.4 0-.8.3-.8.8v.8c0 .5.4.8.8.8V11c0 .5.4.9.9.9H9c.4 0 .8-.4.8-.9V3.4c.5 0 .8-.3.8-.8v-.8c0-.5-.3-.9-.8-.9zM9 11H3V3.6H4v6.7h.8V3.5h.9v6.7h.8V3.5h.9v6.7H8V3.5h.8V11zm.8-8.4H2.2v-.8h7.6v.8z" fill="currentColor"/></svg>',
            clock: '<svg width="12" height="12" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M6.8 6h2.5v1.7H5.9a.8.8 0 0 1-.8-.8V2.6h1.7V6zM6 1.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6zM6 .1a6 6 0 0 0-6 6 6 6 0 0 0 6 6 6 6 0 0 0 6-6 6 6 0 0 0-6-6z" clip-rule="evenodd" fill-rule="evenodd"/></svg>',
            calendar: '<svg width="12" height="12" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M10.5 1h-.8v1.3c0 .2-.2.4-.4.4H7.6a.4.4 0 0 1-.4-.4V1H4.7v1.3c0 .2-.2.4-.4.4H2.6a.4.4 0 0 1-.4-.4V1h-.8c-.5 0-.8.4-.8.8V11c0 .5.4.8.8.8h9.3c.5 0 .8-.4.8-.8V1.8c0-.5-.4-.8-.8-.8zm0 10.1H1.2V3.5h9.3v7.6zM3.7 1.9h-.8V.2h.8v1.7zm5.1 0H8V.2h.8v1.7zM4.5 5.3h-.8v-.8h.8v.8zm1.7 0h-.8v-.8h.8v.8zm1.7 0h-.8v-.8h.8v.8zm1.7 0h-.8v-.8h.8v.8zM2.8 7H2v-.8h.8V7zm1.7 0h-.8v-.8h.8V7zm1.7 0h-.8v-.8h.8V7zm1.7 0h-.8v-.8h.8V7zm1.7 0h-.8v-.8h.8V7zM2.8 8.7H2v-.8h.8v.8zm1.7 0h-.8v-.8h.8v.8zm1.7 0h-.8v-.8h.8v.8zm1.7 0h-.8v-.8h.8v.8zm1.7 0h-.8v-.8h.8v.8zm-6.8 1.7H2v-.8h.8v.8zm1.7 0h-.8v-.8h.8v.8zm1.7 0h-.8v-.8h.8v.8zm1.7 0h-.8v-.8h.8v.8z"/></svg>'
        },
        styleFunctions: {},
        _getLongOptions: function(element) {
            var key, temp, returnObj = {}, prefix = "datebox", prefixLength = 7;
            for (key in element.data()) {
                if (key.substr(0, prefixLength) === prefix && key.length > prefixLength) {
                    temp = key.substr(prefixLength);
                    temp = temp.charAt(0).toLowerCase() + temp.slice(1);
                    if (temp !== "options") {
                        returnObj[temp] = element.data(key);
                    }
                }
            }
            return returnObj;
        },
        _setOption: function() {
            $.Widget.prototype._setOption.apply(this, arguments);
            this.refresh();
        },
        getOption: function(opt) {
            var i18nTester = this.__(opt);
            if (i18nTester !== "Err:NotFound") {
                return i18nTester;
            } else {
                return this.options[opt];
            }
        },
        _enhanceDate: function() {
            Object.assign(this._date.prototype, {
                copy: function(adjust, override) {
                    adjust = Object.assign([ 0, 0, 0, 0, 0, 0, 0 ], adjust);
                    override = Object.assign([ 0, 0, 0, 0, 0, 0, 0 ], override);
                    return new Date(override[0] > 0 ? override[0] : this.get(0) + adjust[0], override[1] > 0 ? override[1] : this.get(1) + adjust[1], override[2] > 0 ? override[2] : this.get(2) + adjust[2], override[3] > 0 ? override[3] : this.get(3) + adjust[3], override[4] > 0 ? override[4] : this.get(4) + adjust[4], override[5] > 0 ? override[5] : this.get(5) + adjust[5], override[6] > 0 ? override[5] : this.get(6) + adjust[6]);
                },
                adj: function(type, amount) {
                    if (typeof amount !== "number" || typeof type !== "number") {
                        throw new Error("Invalid Arguments");
                    }
                    switch (type) {
                      case 0:
                        this.setD(0, this.get(0) + amount);
                        break;

                      case 1:
                        this.setD(1, this.get(1) + amount);
                        break;

                      case 2:
                        this.setD(2, this.get(2) + amount);
                        break;

                      case 3:
                        amount *= 60;

                      case 4:
                        amount *= 60;

                      case 5:
                        amount *= 1e3;

                      case 6:
                        this.setTime(this.getTime() + amount);
                        break;
                    }
                    return this;
                },
                setD: function(type, amount) {
                    switch (type) {
                      case 0:
                        this.setFullYear(amount);
                        break;

                      case 1:
                        this.setMonth(amount);
                        break;

                      case 2:
                        this.setDate(amount);
                        break;

                      case 3:
                        this.setHours(amount);
                        break;

                      case 4:
                        this.setMinutes(amount);
                        break;

                      case 5:
                        this.setSeconds(amount);
                        break;

                      case 6:
                        this.setMilliseconds(amount);
                        break;
                    }
                    return this;
                },
                get: function(type) {
                    switch (type) {
                      case 0:
                        return this.getFullYear();

                      case 1:
                        return this.getMonth();

                      case 2:
                        return this.getDate();

                      case 3:
                        return this.getHours();

                      case 4:
                        return this.getMinutes();

                      case 5:
                        return this.getSeconds();

                      case 6:
                        return this.getMilliseconds();
                    }
                    return false;
                },
                get12hr: function() {
                    if (this.get(3) === 0) {
                        return 12;
                    }
                    if (this.get(3) < 13) {
                        return this.get(3);
                    }
                    return this.get(3) - 12;
                },
                iso: function() {
                    var arr = [ 0, 0, 0 ], i = 0;
                    for (i = 0; i < 3; i++) {
                        arr[i] = this.get(i);
                        if (i === 1) {
                            arr[i]++;
                        }
                        if (arr[i] < 10) {
                            arr[i] = "0" + String(arr[i]);
                        }
                    }
                    return arr.join("-");
                },
                comp: function() {
                    return parseInt(this.iso().replace(/-/g, ""), 10);
                },
                getEpoch: function() {
                    return Math.floor(this.getTime() / 1e3);
                },
                getEpochDays: function() {
                    return Math.floor(this.getTime() / (1e3 * 60 * 60 * 24));
                },
                getArray: function() {
                    var arr = [ 0, 0, 0, 0, 0, 0 ], i = 0;
                    for (i = 0; i < 6; i++) {
                        arr[i] = this.get(i);
                    }
                    return arr;
                },
                setFirstDay: function(day) {
                    this.setD(2, 1).adj(2, day - this.getDay());
                    if (this.get(2) > 10) {
                        this.adj(2, 7);
                    }
                    return this;
                },
                setDWeek: function(type, num) {
                    if (type === 4) {
                        return this.setD(1, 0).setD(2, 1).setFirstDay(4).adj(2, -3).adj(2, (num - 1) * 7);
                    }
                    return this.setD(1, 0).setD(2, 1).setFirstDay(type).adj(2, (num - 1) * 7);
                },
                getDWeek: function(type) {
                    var t1, t2;
                    switch (type) {
                      case 0:
                        t1 = this.copy([ 0, -1 * this.getMonth() ]).setFirstDay(0);
                        return Math.floor((this.getTime() - (t1.getTime() + (this.getTimezoneOffset() - t1.getTimezoneOffset()) * 6e4)) / 6048e5) + 1;

                      case 1:
                        t1 = this.copy([ 0, -1 * this.getMonth() ]).setFirstDay(1);
                        return Math.floor((this.getTime() - (t1.getTime() + (this.getTimezoneOffset() - t1.getTimezoneOffset()) * 6e4)) / 6048e5) + 1;

                      case 4:
                        if (this.getMonth() === 11 && this.getDate() > 28) {
                            return 1;
                        }
                        t1 = this.copy([ 0, -1 * this.getMonth() ], true).setFirstDay(4).adj(2, -3);
                        t2 = Math.floor((this.getTime() - (t1.getTime() + (this.getTimezoneOffset() - t1.getTimezoneOffset()) * 6e4)) / 6048e5) + 1;
                        if (t2 < 1) {
                            t1 = this.copy([ -1, -1 * this.getMonth() ]).setFirstDay(4).adj(2, -3);
                            return Math.floor((this.getTime() - t1.getTime()) / 6048e5) + 1;
                        }
                        return t2;

                      default:
                        return 0;
                    }
                }
            });
        },
        _ord: {
            default: function(num) {
                var ending = num % 10;
                if (num > 9 && num < 21 || ending > 3) {
                    return "th";
                }
                return [ "th", "st", "nd", "rd" ][ending];
            }
        },
        _customformat: {
            default: function(oper, date, o) {
                return false;
            }
        },
        _formatter: function(format, date, allowArIn) {
            var w = this, o = this.options, tmp, dur = 0;
            if (typeof allowArIn === "undefined") {
                allowArIn = true;
            }
            if (o.mode.substr(0, 4) === "dura") {
                dur = w._dur(this.theDate.getTime() - this.initDate.getTime());
                if (!format.match(/%Dd/)) {
                    dur[1] += dur[0] * 24;
                }
                if (!format.match(/%Dl/)) {
                    dur[2] += dur[1] * 60;
                }
                if (!format.match(/%DM/)) {
                    dur[3] += dur[2] * 60;
                }
            }
            format = format.replace(/%(D|X|0|-)*([1-9a-zA-Z])/g, function(match, pad, oper) {
                if (pad === "X") {
                    if (typeof w._customformat[o.mode] === "function") {
                        return w._customformat[o.mode](oper, date, o);
                    }
                    return match;
                }
                if (pad === "D") {
                    switch (oper) {
                      case "d":
                        return dur[0];

                      case "l":
                        return w._zPad(dur[1]);

                      case "M":
                        return w._zPad(dur[2]);

                      case "S":
                        return w._zPad(dur[3]);

                      case "A":
                        return w.__("durationDays")[dur[0] === 1 ? 0 : 1];

                      default:
                        return match;
                    }
                }
                switch (oper) {
                  case "a":
                    return w.__("daysOfWeekShort")[date.getDay()];

                  case "A":
                    return w.__("daysOfWeek")[date.getDay()];

                  case "b":
                    return w.__("monthsOfYearShort")[date.getMonth()];

                  case "B":
                    return w.__("monthsOfYear")[date.getMonth()];

                  case "C":
                    return parseInt(date.getFullYear() / 100);

                  case "d":
                    return w._zPad(date.getDate(), pad);

                  case "H":
                  case "k":
                    return w._zPad(date.getHours(), pad);

                  case "I":
                  case "l":
                    return w._zPad(date.get12hr(), pad);

                  case "m":
                    return w._zPad(date.getMonth() + 1, pad);

                  case "M":
                    return w._zPad(date.getMinutes(), pad);

                  case "p":
                  case "P":
                    tmp = w.__("meridiem")[date.get(3) < 12 ? 0 : 1].toUpperCase();
                    return oper === "P" ? tmp.toLowerCase() : tmp;

                  case "s":
                    return date.getEpoch();

                  case "S":
                    return w._zPad(date.getSeconds(), pad);

                  case "u":
                    return w._zPad(date.getDay() + 1, pad);

                  case "w":
                    return date.getDay();

                  case "y":
                    return w._zPad(date.getFullYear() % 100);

                  case "Y":
                    return date.getFullYear();

                  case "E":
                    return date.getFullYear() + 543;

                  case "V":
                    return w._zPad(date.getDWeek(4), pad);

                  case "U":
                    return w._zPad(date.getDWeek(0), pad);

                  case "W":
                    return w._zPad(date.getDWeek(1), pad);

                  case "o":
                    if (typeof w._ord[o.useLang] === "function") {
                        return w._ord[o.useLang](date.getDate());
                    }
                    return w._ord["default"](date.getDate());

                  case "j":
                    tmp = new w._date(date.getFullYear(), 0, 1);
                    tmp = "000" + String(Math.ceil((date - tmp) / 864e5) + 1);
                    return tmp.slice(-3);

                  case "J":
                    return date.toJSON();

                  case "G":
                    tmp = date.getFullYear();
                    if (date.getDWeek(4) === 1 && date.getMonth() > 0) {
                        return tmp + 1;
                    }
                    if (date.getDWeek(4) > 51 && date.getMonth() < 11) {
                        return tmp - 1;
                    }
                    return tmp;

                  case "g":
                    tmp = date.getFullYear % 100;
                    if (date.getDWeek(4) === 1 && date.getMonth() > 0) {
                        ++tmp;
                    }
                    if (date.getDWeek(4) > 51 && date.getMonth() < 11) {
                        --tmp;
                    }
                    return w._zpad(tmp);

                  default:
                    return match;
                }
            });
            if (w.__("useArabicIndic") === true && allowArIn === true) {
                format = w._dRep(format);
            }
            return format;
        },
        _minStepFix: function() {
            var newMinute = this.theDate.get(4), mstep = this.options.minuteStep, roundDirection = this.options.minStepRound, remainder = newMinute % mstep;
            if (mstep > 1 && remainder > 0) {
                if (roundDirection < 0) {
                    newMinute = newMinute - remainder;
                } else if (roundDirection > 0) {
                    newMinute = newMinute + (mstep - remainder);
                } else {
                    if (newMinute % mstep < mstep / 2) {
                        newMinute = newMinute - remainder;
                    } else {
                        newMinute = newMinute + (mstep - remainder);
                    }
                }
                this.theDate.setMinutes(newMinute);
            }
        },
        _newDateCheck: {
            enableDate: function(testDate) {
                return this.options.enableDates.indexOf(testDate.iso) > -1;
            },
            whiteDate: function(testDate) {
                if (this.options.whiteDates === false) {
                    return false;
                }
                return this.options.whiteDates.indexOf(testDate.iso) > -1;
            },
            notToday: function(testDate) {
                if (this.options.notToday === false) {
                    return false;
                }
                return this.realToday.comp() === testDate.comp();
            },
            maxYear: function(testDate) {
                var testOption = this.options.maxYear;
                if (testOption === false) {
                    return false;
                }
                return testDate.get(0) > testOption;
            },
            minYear: function(testDate) {
                var testOption = this.options.minYear;
                if (testOption === false) {
                    return false;
                }
                return testDate.get(0) < testOption;
            },
            minDate: function(testDate) {
                var testOption = this.options.minDate;
                if (testOption === false) {
                    return false;
                }
                testOption = this.parseISO(testOption);
                return testDate < testOption;
            },
            maxDate: function(testDate) {
                var testOption = this.options.maxDate;
                if (testOption === false) {
                    return false;
                }
                testOption = this.parseISO(testOption);
                testOption.adj(2, 1);
                return testOption < testDate;
            },
            afterToday: function(testDate) {
                var testOption = this.options.afterToday;
                if (testOption === false) {
                    return false;
                }
                return testDate < this.realToday;
            },
            beforeToday: function(testDate) {
                var testOption = this.options.beforeToday;
                if (testOption === false) {
                    return false;
                }
                return testDate > this.realToday;
            },
            minmaxDays: function(testDate) {
                var testOption1 = this.options.minDays, testOption2 = this.options.maxDays, validMin, validMax;
                if (testOption1 === false && testOption2 === false) {
                    return false;
                }
                validMin = testOption1 === false ? true : this.realToday.getEpochDays() - (testOption1 + 1) < testDate.getEpochDays();
                validMax = testOption2 === false ? true : this.realToday.getEpochDays() + (testOption2 + 1) > testDate.getEpochDays();
                return !(validMin && validMax);
            },
            minHour: function(testDate) {
                var testOption = this.options.minHour;
                if (testOption === false) {
                    return false;
                }
                return testDate.get(3) < testOption;
            },
            maxHour: function(testDate) {
                var testOption = this.options.maxHour;
                if (testOption === false) {
                    return false;
                }
                return testDate.get(3) > testOption;
            },
            minTime: function(testDate) {
                var testOption = this.options.minTime, splitOption = null, testHour = testDate.get(3);
                if (testOption === false) {
                    return false;
                }
                splitOption = this.options.minTime.split(":", 2);
                if (testHour < splitOption[0]) {
                    return true;
                }
                if (testHour > splitOption[0]) {
                    return false;
                }
                return testDate.get(4) < splitOption[1];
            },
            maxTime: function(testDate) {
                var testOption = this.options.maxTime, splitOption = null, testHour = testDate.get(3);
                if (testOption === false) {
                    return false;
                }
                splitOption = this.options.maxTime.split(":", 2);
                if (testHour < splitOption[0]) {
                    return false;
                }
                if (testHour > splitOption[0]) {
                    return true;
                }
                return testDate.get(4) > splitOption[1];
            },
            validHours: function(testDate) {
                return this.options.validHours.indexOf(testDate.get(3)) > -1;
            },
            blackDays: function(testDate) {
                var testOption = this.options.blackDays;
                if (testOption === false) {
                    return false;
                }
                return testOption.indexOf(testDate.getDay()) > -1;
            },
            blackDates: function(testDate) {
                var testOption = this.options.blackDates;
                if (testOption === false) {
                    return false;
                }
                return testOption.indexOf(testDate.iso()) > -1;
            },
            blackDatesRec: function(testDate) {
                var i, testOption = this.options.blackDatesRec;
                if (testOption === false) {
                    return false;
                }
                for (i = 0; i < testOption.length; i++) {
                    if ((testOption[i][0] === -1 || testOption[i][0] === testDate.get(0)) && (testOption[i][1] === -1 || testOption[i][1] === testDate.get(1)) && (testOption[i][2] === -1 || testOption[i][2] === testDate.get(2))) {
                        return true;
                    }
                }
                return false;
            },
            blackDatesPeriod: function(testDate) {
                var i, j, k, testOption = this.options.blackDatesPeriod;
                if (testOption === false) {
                    return false;
                }
                i = testOption[0].split("-");
                j = new Date(i[0], i[1] - 1, i[2], 12, 1, 1, 1);
                k = Math.round((testDate.getTime() - j.getTime()) / (1e3 * 3600 * 24));
                if (k % testOption[1] === 0) {
                    return true;
                } else {
                    return false;
                }
            }
        },
        _newDateChecker: function(testDate) {
            var w = this, itt, done = false, returnObject = {
                good: true,
                bad: false,
                failrule: false,
                passrule: false,
                dateObj: testDate.copy()
            }, badChecks = [ "blackDays", "blackDates", "blackDatesRec", "blackDatesPeriod", "notToday", "maxYear", "minYear", "afterToday", "beforeToday", "maxDate", "minDate", "minmaxDays", "minHour", "maxHour", "minTime", "maxTime" ];
            w.realToday = new w._date();
            if (this.options.enableDates !== false) {
                if (w._newDateCheck.whiteDate.call(w, testDate)) {
                    returnObject.passrule = "enableDates";
                } else {
                    returnObject.bad = true;
                    returnObject.good = false;
                    returnObject.failrule = "enableDates";
                }
                return returnObject;
            }
            if (this.options.validHours !== false) {
                if (w._newDateCheck.validHours.call(w, testDate)) {
                    returnObject.passrule = "validHours";
                } else {
                    returnObject.bad = true;
                    returnObject.good = false;
                    returnObject.failrule = "validHours";
                }
                return returnObject;
            }
            if (w._newDateCheck.whiteDate.call(w, testDate)) {
                returnObject.passrule = "whiteDates";
                return returnObject;
            }
            for (itt = 0; itt < badChecks.length && !done; itt++) {
                if (w._newDateCheck[badChecks[itt]].call(w, testDate)) {
                    returnObject.bad = true;
                    returnObject.good = false;
                    returnObject.failrule = badChecks[itt];
                    done = true;
                }
            }
            return returnObject;
        },
        _getCleanDur: function() {
            var w = this, o = this.options, thisDuration = w.theDate.getEpoch() - w.initDate.getEpoch();
            if (thisDuration < 0) {
                thisDuration = 0;
                w.theDate = w.initDate.copy();
            }
            if (o.minDur !== false && thisDuration < o.minDur) {
                w.theDate = new w._date(w.initDate.getTime() + o.minDur * 1e3);
                thisDuration = o.minDur;
            }
            if (o.maxDur !== false && thisDuration > o.maxDur) {
                w.theDate = new w._date(w.initDate.getTime() + o.maxDur * 1e3);
                thisDuration = o.maxDur;
            }
            w.lastDuration = thisDuration;
            w.lastDurationA = w._dur(thisDuration * 1e3);
            return [ thisDuration, w._dur(thisDuration * 1e3) ];
        },
        _check: function() {
            var checkObj = this._newDateChecker(this.theDate);
            this.dateOK = checkObj.good === true;
            return checkObj.good;
        },
        _fixstepper: function(order) {
            var step = this.options.durationSteppers, actual = this.options.durationStep;
            if (order.indexOf("d") > -1) {
                step.d = actual;
            }
            if (order.indexOf("h") > -1) {
                step.d = 1;
                step.h = actual;
            }
            if (order.indexOf("i") > -1) {
                step.h = 1;
                step.i = actual;
            }
            if (order.indexOf("s") > -1) {
                step.i = 1;
                step.s = actual;
            }
        },
        _ThemeDateCK: {
            selected: function(testDate) {
                if (this.options.slideHighPick === false) {
                    return false;
                }
                if (typeof this.originalDate === "undefined") {
                    return false;
                }
                return this.originalDate.iso() === testDate.iso();
            },
            today: function(testDate) {
                if (this.options.slideHighToday === false) {
                    return false;
                }
                return this.realToday.iso() === testDate.iso();
            },
            highDates: function(testDate) {
                var testOption = this.options.highDates;
                if (testOption === false) {
                    return false;
                }
                return testOption.indexOf(testDate.iso()) > -1;
            },
            highDatesAlt: function(testDate) {
                var testOption = this.options.highDatesAlt;
                if (testOption === false) {
                    return false;
                }
                return testOption.indexOf(testDate.iso()) > -1;
            },
            highDatesRec: function(testDate) {
                var i, testOption = this.options.highDatesRec;
                if (testOption === false) {
                    return false;
                }
                for (i = 0; i < testOption.length; i++) {
                    if ((testOption[i][0] === -1 || testOption[i][0] === testDate.get(0)) && (testOption[i][1] === -1 || testOption[i][1] === testDate.get(1)) && (testOption[i][2] === -1 || testOption[i][2] === testDate.get(2))) {
                        return true;
                    }
                }
                return false;
            },
            highDatesPeriod: function(testDate) {
                var i, j, k, testOption = this.options.highDatesPeriod;
                if (testOption === false) {
                    return false;
                }
                i = testOption[0].split("-");
                j = new Date(i[0], i[1] - 1, i[2], 12, 1, 1, 1);
                k = Math.round((testDate.getTime() - j.getTime()) / (1e3 * 3600 * 24));
                if (k % testOption[1] === 0) {
                    return true;
                } else {
                    return false;
                }
            },
            highDays: function(testDate) {
                var testOption = this.options.highDays;
                if (testOption === false) {
                    return false;
                }
                return testOption.indexOf(testDate.getDay()) > -1;
            }
        },
        _parser: {
            default: function(str) {
                return str;
            }
        },
        _makeDate: function(str, extd) {
            var i, exp_temp, exp_format, grbg, w = this, o = this.options, defVal = this.options.defaultValue, adv = w.__fmt(), exp_input = null, exp_names = [], faildate = false, date = new w._date(), d = {
                year: -1,
                mont: -1,
                date: -1,
                hour: -1,
                mins: -1,
                secs: -1,
                week: false,
                wtyp: 4,
                wday: false,
                yday: false,
                meri: 0
            };
            if (typeof extd === "undefined") {
                extd = false;
            }
            str = typeof str === "undefined" ? "" : (w.__("useArabicIndic") === true ? w._dRep(str, -1) : str).trim();
            if (typeof o.mode === "undefined") {
                return date;
            }
            if (typeof w._parser[o.mode] !== "undefined") {
                return w._parser[o.mode].call(w, str);
            }
            if (o.mode === "durationbox" || o.mode === "durationflipbox") {
                adv = adv.replace(/%D([a-z])/gi, function(match, oper) {
                    switch (oper) {
                      case "d":
                      case "l":
                      case "M":
                      case "S":
                        return "(" + match + "|[0-9]+)";

                      default:
                        return ".+?";
                    }
                });
                adv = new RegExp("^" + adv + "$");
                exp_input = adv.exec(str);
                exp_format = adv.exec(w.__fmt());
                if (exp_input === null || exp_input.length !== exp_format.length) {
                    if (typeof defVal === "number" && defVal > 0) {
                        return new w._date((w.initDate.getEpoch() + parseInt(defVal, 10)) * 1e3);
                    }
                    return new w._date(w.initDate.getTime());
                }
                exp_temp = w.initDate.getEpoch();
                for (i = 1; i < exp_input.length; i++) {
                    grbg = parseInt(exp_input[i], 10);
                    if (exp_format[i].match(/^%Dd$/i)) {
                        exp_temp = exp_temp + grbg * 86400;
                    }
                    if (exp_format[i].match(/^%Dl$/i)) {
                        exp_temp = exp_temp + grbg * 3600;
                    }
                    if (exp_format[i].match(/^%DM$/i)) {
                        exp_temp = exp_temp + grbg * 60;
                    }
                    if (exp_format[i].match(/^%DS$/i)) {
                        exp_temp = exp_temp + grbg;
                    }
                }
                return new w._date(exp_temp * 1e3);
            }
            if (adv === "%J") {
                date = new w._date(str);
                if (isNaN(date.getDate())) {
                    date = new w._date();
                }
                return date;
            }
            adv = adv.replace(/%(0|-)*([a-z])/gi, function(match, pad, oper) {
                exp_names.push(oper);
                switch (oper) {
                  case "p":
                  case "P":
                  case "b":
                  case "B":
                    return "(" + match + "|.+?)";

                  case "H":
                  case "k":
                  case "I":
                  case "l":
                  case "m":
                  case "M":
                  case "S":
                  case "V":
                  case "U":
                  case "u":
                  case "W":
                  case "d":
                    return "(" + match + "|[0-9]{" + (pad === "-" ? "1," : "") + "2})";

                  case "j":
                    return "(" + match + "|[0-9]{3})";

                  case "s":
                    return "(" + match + "|[0-9]+)";

                  case "g":
                  case "y":
                    return "(" + match + "|[0-9]{2})";

                  case "E":
                  case "G":
                  case "Y":
                    return "(" + match + "|[0-9]{1,4})";

                  default:
                    exp_names.pop();
                    return ".+?";
                }
            });
            adv = new RegExp("^" + adv + "$");
            exp_input = adv.exec(str);
            exp_format = adv.exec(w.__fmt());
            if (exp_input === null || exp_input.length !== exp_format.length) {
                if (str !== "") {
                    faildate = true;
                }
                if (defVal !== false && defVal !== "") {
                    switch (typeof defVal) {
                      case "object":
                        if (typeof defVal.getDay === "function") {
                            date = defVal;
                        } else {
                            if (defVal.length === 3) {
                                date = w._pa(defVal, o.mode.substr(0, 4) === "time" ? date : false);
                            }
                        }
                        break;

                      case "number":
                        date = new w._date(defVal * 1e3);
                        break;

                      case "string":
                        if (defVal.substr(0, 1) === "+") {
                            date = new w._date().adj(5, parseInt(defVal.substr(1), 10));
                        } else if (defVal.substr(0, 1) === "-") {
                            date = new w._date().adj(5, -1 * parseInt(defVal.substr(1), 10));
                        } else {
                            if (o.mode.substr(0, 4) === "time") {
                                exp_temp = Object.assign([ 0, 0, 0 ], defVal.split(":", 3));
                                date = w._pa(exp_temp, date);
                            } else {
                                exp_temp = Object.assign([ 0, 0, 0 ], defVal.split("-", 3));
                                exp_temp[1]--;
                                date = w._pa(exp_temp, false);
                            }
                        }
                        break;
                    }
                }
                if (isNaN(date.getDate())) {
                    date = new w._date();
                }
            } else {
                for (i = 1; i < exp_input.length; i++) {
                    grbg = parseInt(exp_input[i], 10);
                    switch (exp_names[i - 1]) {
                      case "s":
                        return new w._date(parseInt(exp_input[i], 10) * 1e3);

                      case "Y":
                      case "G":
                        d.year = grbg;
                        break;

                      case "E":
                        d.year = grbg - 543;
                        break;

                      case "y":
                      case "g":
                        if (o.afterToday || grbg < o.twoDigitYearCutoff) {
                            d.year = 2e3 + grbg;
                        } else {
                            d.year = 1900 + grbg;
                        }
                        break;

                      case "m":
                        d.mont = grbg - 1;
                        break;

                      case "d":
                        d.date = grbg;
                        break;

                      case "H":
                      case "k":
                      case "I":
                      case "l":
                        d.hour = grbg;
                        break;

                      case "M":
                        d.mins = grbg;
                        break;

                      case "S":
                        d.secs = grbg;
                        break;

                      case "u":
                        d.wday = grbg - 1;
                        break;

                      case "w":
                        d.wday = grbg;
                        break;

                      case "j":
                        d.yday = grbg;
                        break;

                      case "V":
                        d.week = grbg;
                        d.wtyp = 4;
                        break;

                      case "U":
                        d.week = grbg;
                        d.wtyp = 0;
                        break;

                      case "W":
                        d.week = grbg;
                        d.wtyp = 1;
                        break;

                      case "p":
                      case "P":
                        grbg = new RegExp("^" + exp_input[i] + "$", "i");
                        d.meri = grbg.test(w.__("meridiem")[0]) ? -1 : 1;
                        break;

                      case "b":
                        exp_temp = w.__("monthsOfYearShort").indexOf(exp_input[i]);
                        if (exp_temp > -1) {
                            d.mont = exp_temp;
                        }
                        break;

                      case "B":
                        exp_temp = w.__("monthsOfYear").indexOf(exp_input[i]);
                        if (exp_temp > -1) {
                            d.mont = exp_temp;
                        }
                        break;
                    }
                }
                if (d.meri !== 0) {
                    if (d.meri === -1 && d.hour === 12) {
                        d.hour = 0;
                    }
                    if (d.meri === 1 && d.hour !== 12) {
                        d.hour = d.hour + 12;
                    }
                }
                date = new w._date(w._n(d.year, 0), w._n(d.mont, 0), w._n(d.date, 1), w._n(d.hour, 0), w._n(d.mins, 0), w._n(d.secs, 0), 0);
                if (d.year < 100 && d.year !== -1) {
                    date.setFullYear(d.year);
                }
                if (d.mont > -1 && d.date > -1 || d.hour > -1 && d.mins > -1 && d.secs > -1) {
                    if (extd === true) {
                        return [ date, faildate ];
                    } else {
                        return date;
                    }
                }
                if (d.week !== false) {
                    date.setDWeek(d.wtyp, d.week);
                    if (d.date > -1) {
                        date.setDate(d.date);
                    }
                }
                if (d.yday !== false) {
                    date.setD(1, 0).setD(2, 1).adj(2, d.yday - 1);
                }
                if (d.wday !== false) {
                    date.adj(2, d.wday - date.getDay());
                }
            }
            if (extd === true) {
                return [ date, faildate ];
            } else {
                return date;
            }
        },
        _event: function(e, p) {
            var tmp, i, w = $(this).data("jtsage-datebox"), o = $(this).data("jtsage-datebox").options;
            if (!e.isPropagationStopped()) {
                switch (p.method) {
                  case "close":
                    if (typeof p.closeCancel === "undefined") {
                        p.closeCancel = false;
                    }
                    w.cancelClose = p.closeCancel;
                    w.close();
                    break;

                  case "open":
                    w.open();
                    break;

                  case "set":
                    if (typeof p.value === "object") {
                        w.theDate = p.value;
                        w._t({
                            method: "doset"
                        });
                    } else {
                        if (o.displayMode === "inline" || o.displayMode === "blind") {
                            w.originalDate = w.theDate;
                        }
                        $(this).val(p.value);
                        if (o.linkedField !== false) {
                            if (typeof o.linkedField === "string") {
                                $(o.linkedField).val(w.callFormat(o.linkedFieldFormat, w.theDate, false));
                            } else {
                                for (i = 0; i < o.linkedField.length; i++) {
                                    $(o.linkedField[i].id).val(w.callFormat(o.linkedField[i].format, w.theDate, false));
                                }
                            }
                        }
                        w.skipChange = true;
                        $(this).trigger("change");
                    }
                    break;

                  case "doset":
                    tmp = "_" + w.options.mode + "DoSet";
                    if (typeof w[tmp] === "function") {
                        w[tmp].call(w);
                    } else {
                        w._t({
                            method: "set",
                            value: w._formatter(w.__fmt(), w.theDate),
                            date: w.theDate
                        });
                    }
                    break;

                  case "dooffset":
                    if (p.type) {
                        w._offset(p.type, p.amount, true);
                    }
                    break;

                  case "dorefresh":
                    w.refresh();
                    break;

                  case "doclear":
                    $(this).val("").trigger("change");
                    break;

                  case "clear":
                    $(this).trigger("change");
                    break;
                }
            }
        },
        _build: {
            default: function() {
                this.d.headerText = "Error";
                if (this.d.intHTML !== false) {
                    this.d.intHTML.remove().empty();
                }
                this.d.intHTML = $("<div style='width:100%'><h2 style='text-align:center;color:red;'>Unknown Mode</h2></div>");
            },
            timebox: function() {
                this._build.datebox.call(this);
            },
            datetimebox: function() {
                this._build.datebox.call(this);
            },
            durationbox: function() {
                this._build.datebox.apply(this, []);
            },
            datebox: function() {
                var offAmount, i, ctrlWrk, ctrlRow, w = this, o = this.options, ctrlContainer = w.style_dboxCtr(), dur = o.mode === "durationbox" ? true : false, defDurOrder = [ "d", "h", "i", "s" ];
                if (typeof w.d.intHTML !== "boolean") {
                    w.d.intHTML.empty().remove();
                }
                w.d.headerText = w._grabLabel(o.mode === "datebox" || o.mode === "datetimebox" ? w.__("titleDateDialogLabel") : w.__("titleTimeDialogLabel"));
                w.d.intHTML = $("<span>");
                w.d.intHTML.addClass(o.theme_spanStyle);
                w.fldOrder = w._getFldOrder(o.mode);
                if (!dur) {
                    w._check();
                    w._minStepFix();
                } else {
                    w.dateOK = true;
                    w._fixstepper(w.fldOrder);
                }
                if (o.mode === "datebox" || o.mode === "datetimebox") {
                    w.style_subHead(w._formatter(w.__("headerFormat"), w.theDate)).appendTo(w.d.intHTML);
                }
                ctrlRow = w.style_dboxRow();
                for (i = 0; i < w.fldOrder.length; i++) {
                    if (w.fldOrder[i] === "a" && w.__("timeFormat") !== 12) {
                        continue;
                    }
                    if (dur) {
                        offAmount = o.durationSteppers[w.fldOrder[i]];
                    } else {
                        offAmount = w.fldOrder[i] === "i" ? o.minuteStep : 1;
                    }
                    ctrlWrk = w.style_dboxCtrl(o.theme_dbox_PrevBtn, o.theme_dbox_NextBtn, w.fldOrder[i], dur ? w.__("durationLabel")[defDurOrder.indexOf(w.fldOrder[i])] : null, o.theme_dbox_Inputs);
                    ctrlWrk.find("input").data({
                        field: w.fldOrder[i],
                        amount: offAmount
                    });
                    ctrlWrk.find(".dbBoxNext").data({
                        field: w.fldOrder[i],
                        amount: offAmount
                    });
                    ctrlWrk.find(".dbBoxPrev").data({
                        field: w.fldOrder[i],
                        amount: offAmount * -1
                    });
                    ctrlRow.append(ctrlWrk);
                }
                if (w.__("isRTL") === true) {
                    ctrlRow.children().each(function(i, item) {
                        ctrlRow.prepend(item);
                    });
                }
                ctrlContainer.append(ctrlRow);
                ctrlContainer.appendTo(w.d.intHTML);
                w._dbox_run_update(true);
                w.d.intHTML.append(w._doBottomButtons.call(w, true));
                w.d.intHTML.on("change", "input", function() {
                    w._dbox_enter($(this));
                }).on("keypress", "input", function(e) {
                    if (e.which === 13 && w.dateOK === true) {
                        w._dbox_enter($(this));
                        w._t({
                            method: "set",
                            value: w._formatter(w.__fmt(), w.theDate),
                            date: w.theDate
                        });
                        w._t({
                            method: "close"
                        });
                    }
                }).on(w.wheelEvent, "input", function(e, d) {
                    e.preventDefault();
                    d = typeof d === "undefined" ? Math.sign(e.originalEvent.wheelDelta) : d;
                    w._offset($(this).data("field"), (d < 0 ? -1 : 1) * $(this).data("amount"));
                }).on(o.clickEvent, ".dbBoxPrev, .dbBoxNext", function(e) {
                    w.d.intHTML.find(":focus").blur();
                    e.preventDefault();
                    w._offset($(this).data("field"), $(this).data("amount"));
                });
            }
        },
        _drag: {
            default: function() {
                return false;
            }
        },
        _offset: function(oper, amount, update) {
            var testCurrent, condHigh, condLow, condMulti, w = this, o = w.options, operNum = [ "y", "m", "d", "h", "i", "s" ].indexOf(oper), lastDate = 32 - w.theDate.copy([ 0 ], [ 0, 0, 32, 13 ]).getDate(), thisYear = [ 31, 32 - w.theDate.copy([ 0 ], [ 0, 1, 32, 13 ]).getDate(), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ], rolloverAllowed = oper !== "a" && (oper === "y" || typeof o.rolloverMode[oper] === "undefined" || o.rolloverMode[oper] === true);
            if (typeof update === "undefined") {
                update = true;
            }
            if (oper === "y" && w.theDate.get(1) === 1 && w.theDate.get(2) === 29) {
                w.theDate.setD(2, 28);
            }
            if (oper === "a") {
                if (amount % 2 !== 0) {
                    testCurrent = w.theDate.get(3) > 11 ? -12 : 12;
                    w.theDate.adj(3, testCurrent);
                }
            } else if (rolloverAllowed) {
                w.theDate.adj(operNum, amount);
            } else {
                switch (oper) {
                  case "m":
                    condHigh = 11;
                    condLow = 0;
                    condMulti = 12;
                    break;

                  case "d":
                    condHigh = lastDate;
                    condLow = 1;
                    condMulti = lastDate;
                    break;

                  case "h":
                    condHigh = 23;
                    condLow = 0;
                    condMulti = 24;
                    break;

                  case "i":
                  case "s":
                    condHigh = 59;
                    condLow = 0;
                    condMulti = 60;
                    break;
                }
                testCurrent = w.theDate.get(operNum) + amount;
                if (testCurrent < condLow) {
                    testCurrent = testCurrent % condMulti + condMulti;
                } else if (testCurrent > condHigh) {
                    testCurrent = testCurrent % condMulti;
                }
                if (oper === "m" && w.theDate.get(2) > thisYear[testCurrent]) {
                    w.theDate.setD(2, thisYear[testCurrent]);
                }
                w.theDate.setD(operNum, testCurrent);
            }
            if (update === true) {
                w.refresh();
            }
            if (o.useImmediate) {
                w._t({
                    method: "doset"
                });
            }
            if (o.mode === "calbox") {
                w._t({
                    method: "displayChange",
                    selectedDate: w.originalDate,
                    shownDate: w.theDate,
                    thisChange: oper,
                    thisChangeAmount: amount,
                    gridStart: w.getCalStartGrid(),
                    gridEnd: w.getCalEndGrid(),
                    selectedInGrid: w.isSelectedInCalGrid(),
                    selectedInBounds: w.isSelectedInBounds()
                });
            }
            w._t({
                method: "offset",
                type: oper,
                amount: amount,
                newDate: w.theDate
            });
        },
        _startOffset: function(date) {
            var o = this.options;
            if (o.startOffsetYears !== false) {
                date.adj(0, o.startOffsetYears);
            }
            if (o.startOffsetMonths !== false) {
                date.adj(1, o.startOffsetMonths);
            }
            if (o.startOffsetDays !== false) {
                date.adj(2, o.startOffsetDays);
            }
            return date;
        },
        _posZero: function(test) {
            return test < 0 ? 0 : test;
        },
        getModalPosition: function() {
            var w = this, fixed = this.options.displayForcePosition, widget = w.d.mainWrap[0].getBoundingClientRect();
            if (fixed !== false) {
                return {
                    position: "absolute",
                    top: fixed[0],
                    left: fixed[1]
                };
            }
            return {
                position: "fixed",
                top: "50%",
                left: "50%",
                "margin-left": -1 * (widget.width / 2),
                "margin-top": -1 * (widget.height / 2)
            };
        },
        getDropPosition: function(placement) {
            var w = this, compd, o = this.options, fixed = this.options.displayForcePosition, rect = w.d.wrap[0].getBoundingClientRect(), widget = w.d.mainWrap[0].getBoundingClientRect(), tOff = window.pageYOffset, lOff = window.pageXOffset, smallScr = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) <= o.breakpointWidth.replace("px", "");
            compd = {
                centerLeft: {
                    top: w._posZero(tOff + rect.top + rect.height / 2 - widget.height / 2),
                    left: w._posZero(lOff + rect.left)
                },
                centerRight: {
                    top: w._posZero(tOff + rect.top + rect.height / 2 - widget.height / 2),
                    left: w._posZero(lOff + rect.left + rect.width - widget.width)
                },
                centerMiddle: {
                    top: w._posZero(tOff + rect.top + rect.height / 2 - widget.height / 2),
                    left: w._posZero(lOff + rect.left + rect.width / 2 - widget.width / 2)
                },
                topLeft: {
                    top: w._posZero(tOff + rect.top - widget.height - 1),
                    left: w._posZero(lOff + rect.left)
                },
                topRight: {
                    top: w._posZero(tOff + rect.top - widget.height - 1),
                    left: w._posZero(lOff + rect.left + rect.width - widget.width)
                },
                topMiddle: {
                    top: w._posZero(tOff + rect.top - widget.height - 1),
                    left: w._posZero(lOff + rect.left + rect.width / 2 - widget.width / 2)
                },
                bottomLeft: {
                    top: w._posZero(tOff + rect.top + rect.height),
                    left: w._posZero(lOff + rect.left)
                },
                bottomRight: {
                    top: w._posZero(tOff + rect.top + rect.height),
                    left: w._posZero(lOff + rect.left + rect.width - widget.width)
                },
                bottomMiddle: {
                    top: w._posZero(tOff + rect.top + rect.height),
                    left: w._posZero(lOff + rect.left + rect.width / 2 - widget.width / 2)
                }
            };
            if (typeof compd[placement] === "undefined") {
                placement = "bottomRight";
            }
            if (fixed !== false) {
                return {
                    position: "absolute",
                    top: fixed[0],
                    left: fixed[1]
                };
            }
            return {
                position: "absolute",
                top: compd[placement].top,
                left: smallScr ? 0 : compd[placement].left
            };
        },
        getTheDate: function() {
            return this.theDate;
        },
        getSelectedDate: function() {
            return this.originalDate;
        },
        getLastDur: function() {
            return this.lastDuration;
        },
        dateVisible: function() {
            if (typeof this.isSelectedInCalGrid === "undefined") {
                return true;
            }
            return this.isSelectedInCalGrid();
        },
        setTheDate: function(newDate) {
            if (typeof newDate === "object") {
                this.theDate = newDate;
            } else {
                this.theDate = this._makeDate(newDate);
            }
            this.refresh();
            this._t({
                method: "doset"
            });
        },
        parseDate: function(format, strdate) {
            var retty, w = this;
            w.fmtOver = format;
            retty = w._makeDate(strdate);
            w.fmtOver = false;
            return retty;
        },
        parseISO: function(strDate) {
            return this.parseDate("%Y-%m-%d", strDate);
        },
        callFormat: function(format, date, allowArIn) {
            if (typeof allowArIn === "undefined") {
                allowArIn = false;
            }
            return this._formatter(format, date, allowArIn);
        },
        refresh: function() {
            var w = this, o = this.options;
            if (typeof w._build[o.mode] !== "function") {
                w._build["default"].call(w);
            } else {
                w._build[o.mode].call(w);
            }
            if (w.__("useArabicIndic") === true) {
                w._doIndic();
            }
            w.d.mainWrap.append(w.d.intHTML);
            w._t({
                method: "postrefresh"
            });
        },
        applyMinMax: function(refresh, override) {
            var valueFromAttr, w = this, o = this.options, ISOPattern = RegExp(/\d\d\d\d-\d\d-\d\d/);
            if (typeof refresh === "undefined") {
                refresh = true;
            }
            if (typeof override === "undefined") {
                override = true;
            }
            if (override === true || o.minDate === false) {
                valueFromAttr = w.d.input.attr("min");
                if (ISOPattern.test(valueFromAttr)) {
                    o.minDate = valueFromAttr;
                }
            }
            if (override === true || o.maxDate === false) {
                valueFromAttr = w.d.input.attr("max");
                if (ISOPattern.test(valueFromAttr)) {
                    o.maxDate = valueFromAttr;
                }
            }
            if (refresh === true) {
                w._t({
                    method: "refresh"
                });
            }
        },
        _dur: function(ms) {
            return [ Math.max(0, Math.floor(ms / (60 * 60 * 1e3 * 24))), Math.max(0, Math.floor(ms / (60 * 60 * 1e3) % 24)), Math.max(0, Math.floor(ms / (60 * 1e3) % 60)), Math.max(0, Math.floor(ms / 1e3 % 60)) ];
        },
        __: function(val) {
            var o = this.options, lang = o.lang[o.useLang], mode = o[o.mode + "lang"], oride = "override" + val.charAt(0).toUpperCase() + val.slice(1);
            if (typeof o[oride] !== "undefined") {
                return o[oride];
            }
            if (typeof lang !== "undefined" && typeof lang[val] !== "undefined") {
                return lang[val];
            }
            if (typeof mode !== "undefined" && typeof mode[val] !== "undefined") {
                return mode[val];
            }
            if (typeof o.lang["default"][val] !== "undefined") {
                return o.lang["default"][val];
            }
            return "Err:NotFound";
        },
        __fmt: function() {
            var w = this, o = this.options;
            if (typeof w.fmtOver !== "undefined" && w.fmtOver !== false) {
                return w.fmtOver;
            }
            switch (o.mode) {
              case "timebox":
              case "timeflipbox":
                return w.__("timeOutput");

              case "durationbox":
              case "durationflipbox":
                return w.__("durationFormat");

              case "datetimebox":
              case "datetimeflipbox":
                return w.__("datetimeFormat");

              default:
                return w.__("dateFormat");
            }
        },
        _zPad: function(number, pad) {
            if (typeof pad !== "undefined" && pad === "-") {
                return String(number);
            }
            return (number < 10 ? "0" : "") + String(number);
        },
        _dRep: function(oper, direction) {
            var ch, i, start = 48, end = 57, adder = 1584, newString = "";
            if (direction === -1) {
                start += adder;
                end += adder;
                adder = -1584;
            }
            for (i = 0; i < oper.length; i++) {
                ch = oper.charCodeAt(i);
                if (ch >= start && ch <= end) {
                    newString = newString + String.fromCharCode(ch + adder);
                } else {
                    newString = newString + String.fromCharCode(ch);
                }
            }
            return newString;
        },
        _doIndic: function() {
            var w = this;
            w.d.intHTML.find("*").each(function() {
                if ($(this).children().length < 1) {
                    $(this).html(w._dRep($(this).html()));
                }
            });
            w.d.intHTML.find("input").each(function() {
                $(this).val(w._dRep($(this).val()));
            });
        },
        _n: function(val, def) {
            return val < 0 ? def : val;
        },
        _pa: function(arr, date) {
            if (typeof date === "boolean") {
                return new this._date(arr[0], arr[1], arr[2], 0, 0, 0, 0);
            }
            return new this._date(date.get(0), date.get(1), date.get(2), arr[0], arr[1], arr[2], 0);
        },
        _btwn: function(value, low, high) {
            return value > low && value < high;
        },
        _grabLabel: function(deflt, isPlaceholder) {
            var inputPlaceholder, inputTitle, w = this, o = this.options, tmp = false;
            if (typeof isPlaceholder === "undefined") {
                isPlaceholder = false;
            }
            if (typeof o.overrideDialogLabel === "undefined") {
                inputPlaceholder = w.d.input.attr("placeholder");
                inputTitle = w.d.input.attr("title");
                if (typeof inputPlaceholder !== "undefined") {
                    if (isPlaceholder || o.headerFollowsPlaceholder) {
                        return inputPlaceholder;
                    }
                }
                if (typeof inputTitle !== "undefined") {
                    if (isPlaceholder || o.headerFollowsTitle) {
                        return inputTitle;
                    }
                }
                tmp = $(document).find("label[for='" + w.d.input.attr("id") + "']").text();
                if (isPlaceholder || o.headerFollowsLabel) {
                    return tmp === "" ? deflt : tmp;
                } else {
                    return deflt;
                }
            }
            return o.overrideDialogLabel;
        },
        _getFldOrder: function(mode) {
            switch (mode) {
              case "durationbox":
              case "durationflipbox":
                return this.__("durationOrder");

              case "timebox":
              case "timeflipbox":
                return this.__("timeFieldOrder");

              case "datetimebox":
              case "datetimeflipbox":
                return this.__("datetimeFieldOrder");

              default:
                return this.__("dateFieldOrder");
            }
        },
        _t: function(obj) {
            this.d.input.trigger("datebox", obj);
        },
        _prepFunc: function(func) {
            if (func === false || typeof func === "function") {
                return func;
            }
            if (typeof window[func] === "function") {
                return window[func];
            }
            return false;
        },
        _pickRanges: function(dispMonth, dispYear, realYear, relative) {
            var w = this, i, o = this.options, calcYear = relative === false ? realYear : dispYear, startYear = 0, endYear = 0, returnVal = {
                month: [],
                year: []
            };
            for (i = 0; i <= 11; i++) {
                if (i === dispMonth) {
                    returnVal.month.push([ i, w.__("monthsOfYear")[i], true ]);
                } else {
                    returnVal.month.push([ i, w.__("monthsOfYear")[i], false ]);
                }
            }
            if (o.calYearPickMin < 1) {
                startYear = calcYear + o.calYearPickMin;
            } else if (o.calYearPickMin < 1800) {
                startYear = calcYear - o.calYearPickMin;
            } else if (o.calYearPickMin === "NOW") {
                startYear = realYear;
            } else {
                startYear = o.calYearPickMin;
            }
            if (o.calYearPickMax < 1800) {
                endYear = calcYear + o.calYearPickMax;
            } else if (o.calYearPickMax === "NOW") {
                endYear = realYear;
            } else {
                endYear = o.calYearPickMax;
            }
            for (i = startYear; i <= endYear; i++) {
                if (i === dispYear) {
                    returnVal.year.push([ i, i, true ]);
                } else {
                    returnVal.year.push([ i, i, false ]);
                }
            }
            return returnVal;
        },
        _stdSel: function(data, id, cls) {
            var i, returnVal = "<select class='" + cls + "' id='" + id + "'>";
            for (i = 0; i < data.length; i++) {
                returnVal += "<option value='" + data[i][0] + "'" + (data[i][2] === true ? " selected='selected'" : "") + ">" + data[i][1] + "</option>";
            }
            returnVal += "</select>";
            return returnVal;
        },
        _stdBtn: {
            cancel: function() {
                var w = this, o = this.options;
                return $(w.style_btn(o.theme_cancelBtn, w.__("cancelButton"))).on(o.clickEvent, function(e) {
                    e.preventDefault();
                    w._t({
                        method: "close",
                        closeCancel: true
                    });
                });
            },
            clear: function() {
                var w = this, o = this.options;
                return $(w.style_btn(o.theme_clearBtn, w.__("clearButton"))).on(o.clickEvent, function(e) {
                    e.preventDefault();
                    w.d.input.val("");
                    w._t({
                        method: "clear"
                    });
                    w._t({
                        method: "close",
                        closeCancel: true
                    });
                });
            },
            close: function(txt, trigger) {
                var w = this, o = this.options;
                if (typeof trigger === "undefined") {
                    trigger = false;
                }
                return $(w.style_btn(o.theme_closeBtn, txt)).addClass("" + (w.dateOK === true ? "" : "disabled")).on(o.clickEvent, function(e) {
                    e.preventDefault();
                    if (w.dateOK === true) {
                        if (trigger === false) {
                            w._t({
                                method: "set",
                                value: w._formatter(w.__fmt(), w.theDate),
                                date: w.theDate
                            });
                        } else {
                            w._t(trigger);
                        }
                        w._t({
                            method: "close"
                        });
                    }
                });
            },
            today: function() {
                var w = this, o = this.options;
                return $(w.style_btn(o.theme_todayBtn, w.__("todayButtonLabel"))).on(o.clickEvent, function(e) {
                    e.preventDefault();
                    w.theDate = w._pa([ 0, 0, 0 ], new w._date());
                    w._t({
                        method: "dorefresh"
                    });
                    if (o.closeTodayButton !== false) {
                        w._t({
                            method: "doset"
                        });
                        w._t({
                            method: "close"
                        });
                    }
                });
            },
            tomorrow: function() {
                var w = this, o = this.options;
                return $(w.style_btn(o.theme_tomorrowBtn, w.__("tomorrowButtonLabel"))).on(o.clickEvent, function(e) {
                    e.preventDefault();
                    w.theDate = w._pa([ 0, 0, 0 ], new w._date()).adj(2, 1);
                    w._t({
                        method: "dorefresh"
                    });
                    if (o.closeTomorrowButton !== false) {
                        w._t({
                            method: "doset"
                        });
                        w._t({
                            method: "close"
                        });
                    }
                });
            }
        },
        _doBottomButtons: function(useSet) {
            var w = this, o = this.options, ctrlContainer, ctrlWrk;
            if (!(o.useSetButton && useSet || o.useTodayButton || o.useTomorrowButton || o.useClearButton || o.useCancelButton)) {
                return "";
            }
            ctrlContainer = w.style_btnGrp(o.useCollapsedBut);
            if (o.useSetButton && useSet) {
                switch (o.mode) {
                  case "timebox":
                  case "timeflipbox":
                    ctrlWrk = w.__("setTimeButtonLabel");
                    break;

                  case "durationbox":
                  case "duartionflipbox":
                    ctrlWrk = w.__("setDurationButtonLabel");
                    break;

                  default:
                    ctrlWrk = w.__("setDateButtonLabel");
                    break;
                }
                w.setBut = w._stdBtn.close.call(w, ctrlWrk);
                w.setBut.appendTo(ctrlContainer);
            }
            if (o.useTodayButton) {
                ctrlContainer.append(w._stdBtn.today.call(w));
            }
            if (o.useTomorrowButton) {
                ctrlContainer.append(w._stdBtn.tomorrow.call(w));
            }
            if (o.useClearButton) {
                ctrlContainer.append(w._stdBtn.clear.call(w));
            }
            if (o.useCancelButton) {
                ctrlContainer.append(w._stdBtn.cancel.call(w));
            }
            if (typeof w.style_btnGrpOut === "function") {
                ctrlContainer = w.style_btnGrpOut(o.useCollapsedBut, ctrlContainer);
            }
            return ctrlContainer;
        },
        close: function() {
            var w = this, o = this.options, basepop = {};
            o.closeCallback = w._prepFunc(o.closeCallback);
            if (o.closeCallback !== false) {
                basepop.afterclose = function() {
                    o.closeCallback.apply(w, [ {
                        initDate: w.initDate,
                        date: w.theDate,
                        duration: w.lastDuration,
                        cancelClose: w.cancelClose
                    } ].concat(o.closeCallbackArgs));
                };
            } else {
                basepop.afterclose = function() {
                    return true;
                };
            }
            switch (o.displayMode) {
              case "blind":
                w.d.mainWrap.slideUp();

              case "inline":
                basepop.afterclose.call();
                return true;

              default:
                $(".jtsage-datebox-backdrop-div").remove();
                w.d.mainWrap.removeClass("db-show");
                basepop.afterclose.call();
                w.d.mainWrap.hide();
                w.d.mainWrap.detach();
                break;
            }
            $(document).off(w.drag.eMove).off(w.drag.eEnd).off(w.drag.eEndA).off("resize" + w.eventNamespace).off("keydown" + w.eventNamespace);
            if (o.useFocus) {
                w.fastReopen = true;
                setTimeout(function(t) {
                    return function() {
                        t.fastReopen = false;
                    };
                }(w), 300);
            }
        },
        _create: function() {
            $(document).trigger("dateboxcreate");
            var w = this, runTmp, ranTmp, o = Object.assign(this.options, this._getLongOptions(this.element), this.element.data("options")), d = {
                input: this.element,
                wrap: this.element.parent(),
                mainWrap: $("<div class='dbContainer_" + this.uuid + "'>").css("zIndex", o.zindex),
                intHTML: false
            }, styleTag = "<style>" + ".dbContainer_" + this.uuid + " { " + "touch-action: none; width: " + o.controlWidth + o.controlWidthImp + "}" + " @media (max-width: " + o.breakpointWidth + ") { " + ".dbContainer_" + this.uuid + " { " + "width: 100% " + o.controlWidthImp + "} } " + (o.theme_headStyle !== false ? o.theme_headStyle : "") + "</style>", evtid = ".datebox" + this.uuid, drag = {
                eStart: "touchstart" + evtid + " mousedown" + evtid,
                eMove: "touchmove" + evtid + " mousemove" + evtid,
                eEnd: "touchend" + evtid + " mouseup" + evtid,
                eEndA: [ "mouseup", "touchend", "touchcancel", "touchmove" ].join(evtid + " ") + evtid,
                move: false,
                start: false,
                end: false,
                pos: false,
                target: false,
                delta: false,
                tmp: false
            };
            $("head").append($(styleTag));
            w.d = d;
            w.drag = drag;
            w.icons = this.icons;
            if (o.usePlaceholder !== false) {
                w.d.input.attr("placeholder", typeof o.usePlaceholder === "string" ? o.usePlaceholder : w._grabLabel("", true));
            }
            w.wheelEvent = o.disableWheel ? "nonsenseEvent" : typeof $.event.special.mousewheel !== "undefined" ? "mousewheel" : "wheel";
            w.firstOfGrid = false;
            w.lastOfGrid = false;
            w.selectedInGrid = false;
            w.skipChange = false;
            w.cancelClose = false;
            w.disabled = false;
            w._date = window.Date;
            w._enhanceDate();
            w.baseID = w.d.input.attr("id");
            w.initDate = new w._date();
            w.initDate.setMilliseconds(0);
            w.theDate = o.defaultValue ? w._makeDate() : w.d.input.val() !== "" ? w._makeDate(w.d.input.val()) : new w._date();
            if (w.d.input.val() === "") {
                w._startOffset(w.theDate);
            }
            w.initDone = false;
            if (o.showInitialValue) {
                w.d.input.val(w._formatter(w.__fmt(), w.theDate));
            }
            w.d.wrap = w.style_inWrap(w.d.input, o.theme_openButton);
            if (o.mode !== false) {
                if (o.buttonIcon === false) {
                    o.buttonIcon = o.mode.substr(0, 4) === "time" || o.mode.substr(0, 3) === "dur" ? o.buttonIconTime : o.buttonIconDate;
                }
            }
            if (o.useButton) {
                $(w.style_inBtn(o.buttonIcon, w.__("tooltip"), o.theme_openButton)).appendTo(w.d.wrap);
                w.d.wrap.on(o.clickEvent, ".dbOpenButton", function(e) {
                    e.preventDefault();
                    if (o.useFocus) {
                        w.d.input.focus();
                    } else {
                        if (!w.disabled) {
                            w._t({
                                method: "open"
                            });
                        }
                    }
                });
            } else {
                w.style_inNoBtn(w.d.wrap);
            }
            if (o.hideInput) {
                w.style_inHide();
            }
            o.runOnBlurCallback = w._prepFunc(o.runOnBlurCallback);
            w.d.input.on("focus.datebox", function() {
                if (w.disabled === false && o.useFocus) {
                    w._t({
                        method: "open"
                    });
                }
            }).on("change.datebox", function() {
                if (w.skipChange) {
                    w.skipChange = false;
                    return true;
                }
                if (o.runOnBlurCallback === false) {
                    if (o.safeEdit === true) {
                        runTmp = w._makeDate(w.d.input.val(), true);
                        if (runTmp[1] === false) {
                            w.theDate = runTmp[0];
                        } else {
                            w.theDate = w.originalDate;
                            w._t({
                                method: "doset"
                            });
                        }
                    } else {
                        w.theDate = w._makeDate(w.d.input.val());
                    }
                } else {
                    runTmp = w._makeDate(w.d.input.val(), true);
                    ranTmp = o.runOnBlurCallback.call(w, {
                        origDate: w.originalDate,
                        input: w.d.input.val(),
                        oldDate: w.theDate,
                        newDate: runTmp[0],
                        isGood: !runTmp[1],
                        isBad: runTmp[1]
                    });
                    if (typeof ranTmp !== "object") {
                        w.theDate = runTmp[0];
                    } else {
                        w.theDate = ranTmp;
                        w._t({
                            method: "doset"
                        });
                    }
                }
                w.originalDate = w.theDate.copy();
                w.refresh();
            }).on("datebox", w._event);
            if (o.lockInput) {
                w.d.input.attr("readonly", "readonly");
            }
            if (w.d.input.is(":disabled")) {
                w.disable();
            }
            w.applyMinMax(false, false);
            if (o.displayMode === "inline" || o.displayMode === "blind") {
                w.open();
            }
            $(document).trigger("dateboxaftercreate");
        },
        _destroy: function() {
            var w = this, o = this.options, button = w.d.wrap.find("dbOpenButton");
            if (o.useButton === true) {
                button.remove();
                w.d.input.unwrap();
            }
            if (o.lockInput) {
                w.d.input.removeAttr("readonly");
            }
            w.d.input.off("datebox").off("focus.datebox").off("blur.datebox").off("change.datebox");
            $(document).off(w.drag.eMove).off(w.drag.eStart).off(w.drag.eEnd).off(w.drag.eEndA).off("resize" + w.eventNamespace);
        },
        disable: function() {
            var w = this;
            w.d.input.attr("disabled", true);
            w.disabled = true;
            w._t({
                method: "disable"
            });
        },
        enable: function() {
            var w = this;
            w.d.input.attr("disabled", false);
            w.disabled = false;
            w._t({
                method: "enable"
            });
        },
        open: function() {
            var w = this, o = this.options, dMode = o.displayMode, basepop = {};
            if (o.useFocus && w.fastReopen === true) {
                w.d.input.blur();
                return false;
            }
            w.theDate = w._makeDate(w.d.input.val());
            w.originalDate = w.theDate.copy();
            if (w.d.input.val() === "") {
                w._startOffset(w.theDate);
            }
            w.d.input.blur();
            if (typeof w._build[o.mode] !== "function") {
                w._build["default"].call(w);
            } else {
                w._build[o.mode].call(w);
            }
            if (typeof w._drag[o.mode] === "function") {
                w._drag[o.mode].call(w);
            }
            w._t({
                method: "refresh"
            });
            if (w.__("useArabicIndic") === true) {
                w._doIndic();
            }
            if (w.d.intHTML.is(":visible")) {
                return false;
            }
            w.d.mainWrap.empty();
            if (o.useHeader) {
                w.d.mainWrap.append($(w.style_mainHead(w.d.headerText, o.theme_headerTheme, o.theme_headerBtn))).find(".dbCloser").on(o.clickEvent, function(e) {
                    e.preventDefault();
                    w._t({
                        method: "close",
                        closeCancel: true
                    });
                });
            }
            w.d.mainWrap.append(w.d.intHTML).css("zIndex", o.zindex);
            w._t({
                method: "postrefresh"
            });
            o.openCallback = w._prepFunc(o.openCallback);
            if (o.openCallback !== false) {
                basepop.afteropen = function() {
                    w._t({
                        method: "postrefresh"
                    });
                    if (o.openCallback.apply(w, [ {
                        initDate: w.initDate,
                        date: w.theDate,
                        duration: w.lastDuration
                    } ].concat(o.openCallbackArgs)) === false) {
                        w._t({
                            method: "close"
                        });
                    }
                };
            } else {
                basepop.afteropen = function() {
                    w._t({
                        method: "postrefresh"
                    });
                };
            }
            o.beforeOpenCallback = w._prepFunc(o.beforeOpenCallback);
            if (o.beforeOpenCallback !== false) {
                if (o.beforeOpenCallback.apply(w, [ {
                    initDate: w.initDate,
                    date: w.theDate,
                    duration: w.lastDuration
                } ].concat(o.beforeOpenCallbackArgs)) === false) {
                    return false;
                }
            }
            switch (o.displayMode) {
              case "inline":
              case "blind":
                if (w.initDone) {
                    if (o.displayMode === "blind") {
                        w.refresh();
                        w.d.mainWrap.slideDown();
                    }
                } else {
                    w.d.mainWrap.insertAfter(w.style_attach(true)).addClass(o.theme_inlineContainer).css({
                        zIndex: "auto",
                        marginRight: o.displayInlinePosition === "right" ? 0 : "auto",
                        marginLeft: o.displayInlinePosition === "left" ? 0 : "auto"
                    });
                    if (o.displayMode === "blind") {
                        w.d.mainWrap.hide();
                    }
                    w.initDone = true;
                }
                w._t({
                    method: "postrefresh"
                });
                break;

              default:
                w.d.mainWrap.show().css("zIndex", o.zindex).appendTo(w.style_attach(false)).addClass(o.theme_modalContainer).one(o.tranDone, function() {
                    if (w.d.mainWrap.is(":visible")) {
                        basepop.afteropen.call();
                    } else {
                        basepop.afterclose.call();
                        w.d.mainWrap.removeClass("db-show");
                    }
                });
                w.d.backdrop = $("<div class='jtsage-datebox-backdrop-div'></div>").css(o.theme_backgroundMask).css("zIndex", o.zindex - 1).appendTo(o.displayMode === "modal" ? w.style_attach(false) : "body").on(o.clickEvent, function(e) {
                    e.preventDefault();
                    if (o.dismissOutsideClick) {
                        w._t({
                            method: "close",
                            closeCancel: true
                        });
                    }
                });
                w.d.mainWrap.css(o.displayMode === "modal" ? w.getModalPosition.call(w) : w.getDropPosition.call(this, o.displayDropdownPosition));
                break;
            }
            if (dMode === "modal" || dMode === "dropdown") {
                $(document).on("resize" + w.eventNamespace, function() {
                    this.d.mainWarp.css(dMode === "modal" ? this.getModalPosition.call(this) : this.getDropPosition.call(this, this.options.displayDropdownPosition));
                }.bind(w));
                if (o.dismissOnEscape) {
                    $(document).on("keydown" + w.eventNamespace, function(e) {
                        var isEscape = false;
                        if ("key" in e) {
                            isEscape = e.key === "Escape" || e.key === "Esc";
                        } else {
                            isEscape = e.keyCode === 27;
                        }
                        if (isEscape) {
                            this._t({
                                method: "close",
                                closeCancel: true
                            });
                        }
                    }.bind(w));
                }
            }
            window.setTimeout(function() {
                w.d.mainWrap.addClass("db-show");
            }, 0);
            window.setTimeout(function() {
                w.d.mainWrap.trigger("oTransitionEnd");
            }, 200);
        },
        style_attach: function(isInline) {
            var w = this, possibleAttach = w.d.wrap.parent(), hardAttachPoint = $("body").find("#" + w.baseID + "-dbAttach");
            if (hardAttachPoint.length === 1) {
                return hardAttachPoint;
            }
            if (!isInline) {
                return $("body");
            }
            if (possibleAttach.hasClass("form-group")) {
                return possibleAttach;
            } else {
                return w.d.wrap;
            }
        },
        style_btn: function(theme, contents) {
            var retty;
            contents = typeof contents === "undefined" ? "" : contents;
            retty = "<a href='#' role='button' class='" + theme[1] + "'>";
            retty += theme[0] !== false ? "<span style='top: 3px; display: inline-block; position: relative;'>" + this.icons.getIcon.call(this, theme[0]) + "</span> " : "";
            retty += contents + "</a>";
            return retty;
        },
        style_btnGrp: function(collapse) {
            var cls = collapse === true ? "" : "";
            return $("<div style='padding: 5px;' class='" + cls + "'>");
        },
        style_inWrap: function(originalInput, theme) {
            originalInput.css({
                display: "inline"
            });
            return originalInput.wrap("<div style='display:inline-block' class='" + theme + "'>").parent();
        },
        style_inBtn: function(icon, title) {
            return "<div style='display:inline' class='dbOpenButton' title='" + title + "'>" + "<span>" + this.icons.getIcon.call(this, icon) + "</span>" + "</div>";
        },
        style_inNoBtn: function(originalInputWrap) {
            return true;
        },
        style_inHide: function() {
            var w = this, hideMe = w.d.wrap.parent();
            if (hideMe.hasClass("form-group")) {
                hideMe.hide();
            } else {
                w.d.wrap.hide();
            }
        },
        style_mainHead: function(text, themeBar, themeButton) {
            return "<div class='" + themeBar + "'>" + text + "<a href='#' class='dbCloser'><span>" + this.icons.getIcon.call(this, themeButton[0]) + "</span></a></div>";
        },
        style_subHead: function(text) {
            return $("<div class='dbHeader'>" + "<h4>" + text + "</h4>" + "</div>");
        },
        style_pnHead: function(txt, prevBtn, nextBtn, prevCtl, nextCtl) {
            var returnVal = $("<div>");
            $(this.style_btn([ prevBtn[0], prevBtn[1] + " " + prevCtl ])).appendTo(returnVal);
            $("<h4 style='display:inline'>" + txt + "</h4>").appendTo(returnVal);
            $(this.style_btn([ nextBtn[0], nextBtn[1] + " " + nextCtl ])).appendTo(returnVal);
            return returnVal;
        },
        style_picker: function(ranges, theme, monthCtl, yearCtl) {
            var returnVal = "";
            returnVal += "<div>";
            returnVal += "<div style='padding:0; margin:0; display:inline;'>";
            returnVal += this._stdSel(ranges.month, monthCtl, theme);
            returnVal += "</div>";
            returnVal += "<div style='padding:0; margin:0; display:inline;'>";
            returnVal += this._stdSel(ranges.year, yearCtl, theme);
            returnVal += "</div>";
            returnVal += "</div>";
            return $(returnVal);
        },
        style_dateList: function(listLabel, list, theme, ctlCls) {
            var returnVal = "", newList = list.slice();
            newList.unshift([ false, listLabel, true ]);
            returnVal += "<div>";
            returnVal += this._stdSel(newList, ctlCls, theme);
            returnVal += "</div>";
            return $(returnVal);
        },
        style_calGrid: function() {
            return $("<div>" + "<table class='dbCalGrid'>" + "</table></div>");
        },
        style_calRow: function() {
            return $("<tr>");
        },
        style_calBtn: function(data, totalElements) {
            var style = totalElements !== undefined ? " style='width: " + 100 / totalElements + "%'" : "", disable = data.bad ? "disabled='disabled'" : "", cls = "class='dbEvent " + data.theme + (data.bad ? " disabled" : "") + "'";
            return $("<td " + style + ">" + "<a href='#' " + cls + " " + disable + ">" + data.displayText + "</a>" + "</td>");
        },
        style_calTxt: function(text, header, totalElements) {
            var style = totalElements !== undefined ? " style='width: " + 100 / totalElements + "%'" : "";
            return $("<td " + style + ">" + text + "</td>");
        },
        style_dboxCtr: function() {
            return $("<table style='width:100%'>");
        },
        style_dboxRow: function() {
            return $("<tr>");
        },
        style_dboxCtrl: function(prevBtn, nextBtn, mainCls, label) {
            var returnVal = "";
            returnVal += "<td><div class='dbBox" + mainCls + "'>";
            returnVal += this.style_btn([ nextBtn[0], nextBtn[1] + " dbBoxNext" ]);
            if (label !== null) {
                returnVal += "<div class='' " + "style='height:auto'>" + label + "</div>";
            }
            returnVal += "<input type='text' ";
            returnVal += "class='' ";
            returnVal += "style='width:100%'>";
            returnVal += this.style_btn([ prevBtn[0], prevBtn[1] + " dbBoxPrev" ]);
            returnVal += "</div></td>";
            return $(returnVal);
        },
        style_slideGrid: function() {
            return $("<div>" + "<table style='width:100%' class='dbSlideGrid'>" + "</table></div>");
        },
        style_slideRow: function() {
            return $("<tr>");
        },
        style_slideBtn: function(data) {
            var style = " style='width: " + 100 / 8 + "%'", disable = data.bad ? "disabled='disabled'" : "", cls = "class='dbEventS " + data.theme + (data.bad ? " disabled" : "") + "'";
            return $("<td " + style + ">" + "<a href='#' " + cls + " " + disable + ">" + "<small>" + this.__("daysOfWeekShort")[data.dateObj.getDay()] + "</small><br>" + data.dateObj.getDate() + "</a>" + "</td>");
        },
        style_slideCtrl: function(eventCls, theme) {
            var style = " style='width: " + 100 / 8 / 2 + "%'", cls = "class='" + theme[1] + " " + eventCls + "'";
            return $("<td" + style + ">" + "<a href='#' " + cls + ">" + this.icons.getIcon.call(this, theme[0]) + "</a></td>");
        },
        style_fboxCtr: function(size) {
            return $("<div style='height: " + size + "; overflow: hidden; padding: 5px;'>");
        },
        style_fboxDurLbls: function() {
            return $("<div style='padding: 0 5px;'>");
        },
        style_fboxDurLbl: function(text, items) {
            return $("<div style='display: inline-block; width: " + 100 / items + "%'>" + text + "</div>");
        },
        style_fboxRollCtr: function(items) {
            return $("<div style='float: left; width: " + 100 / items + "%'>");
        },
        style_fboxRollPrt: function() {
            return $("<ul>");
        },
        style_fboxRollCld: function(text, cls) {
            return $("<li class='" + cls + "'" + " style='padding: 10px 0;'>" + text + "</li>");
        },
        style_fboxLens: function() {
            return $("<div style='margin: 0px 2px; box-shadow: 0 .5rem 1rem rgba(0,0,0,.15); " + "border: 1px solid black; height: 35px;'>");
        },
        style_fboxPos: function() {
            var fullRoller, firstItem, height_Roller, intended_Top, w = this, o = this.options, height_Outside = w.d.intHTML.find(".dbRollerV").outerHeight(true), height_Container = w.d.intHTML.find(".dbRollerV").height(), theLens = w.d.intHTML.find(".dbLens").first(), height_Lens = theLens.outerHeight();
            if (height_Container < 1) {
                return true;
            }
            intended_Top = -1 * (height_Outside / 2 + height_Lens / 2);
            theLens.css({
                top: intended_Top,
                marginBottom: -1 * height_Lens
            });
            w.d.intHTML.find(".dbRoller").each(function() {
                fullRoller = $(this);
                firstItem = fullRoller.children().first();
                height_Roller = fullRoller.outerHeight(true);
                if (firstItem.css("marginTop") === "0px") {
                    intended_Top = -1 * (height_Roller / 2) + height_Container / 2;
                    if (o.flipboxLensAdjust !== false) {
                        intended_Top += o.flipboxLensAdjust;
                    }
                    firstItem.css("margin-top", intended_Top);
                }
            });
        },
        _dbox_run_update: function(shortRun) {
            var w = this, o = this.options, dur = o.mode === "durationbox" ? true : false;
            if (dur) {
                w._getCleanDur();
            }
            if (shortRun !== true && dur !== true) {
                w._check();
                if (o.mode === "datebox" || o.mode === "datetimebox") {
                    w.d.intHTML.find(".dbHeader").childern().first().text(w._formatter(w.__("headerFormat"), w.theDate));
                }
                if (o.useSetButton) {
                    if (w.dateOK === false) {
                        w.setBut.addClass(o.disabledState);
                    } else {
                        w.setBut.removeClass(o.disabledState);
                    }
                }
            }
            w.d.intHTML.find("input").each(function() {
                switch ($(this).data("field")) {
                  case "y":
                    $(this).val(w.theDate.get(0));
                    break;

                  case "m":
                    $(this).val(w.theDate.get(1) + 1);
                    break;

                  case "d":
                    $(this).val(dur ? w.lastDurationA[0] : w.theDate.get(2));
                    break;

                  case "h":
                    if (dur) {
                        $(this).val(w.lastDurationA[1]);
                    } else {
                        if (w.__("timeFormat") === 12) {
                            $(this).val(w.theDate.get12hr());
                        } else {
                            $(this).val(w.theDate.get(3));
                        }
                    }
                    break;

                  case "i":
                    if (dur) {
                        $(this).val(w.lastDurationA[2]);
                    } else {
                        $(this).val(w._zPad(w.theDate.get(4)));
                    }
                    break;

                  case "M":
                    $(this).val(w.__("monthsOfYearShort")[w.theDate.get(1)]);
                    break;

                  case "a":
                    $(this).val(w.__("meridiem")[w.theDate.get(3) > 11 ? 1 : 0]);
                    break;

                  case "s":
                    if (dur) {
                        $(this).val(w.lastDurationA[3]);
                    } else {
                        $(this).val(w._zPad(w.theDate.get(5)));
                    }
                    break;
                }
            });
            if (w.__("useArabicIndic") === true) {
                w._doIndic();
            }
        },
        _dbox_enter: function(item) {
            var tmp, cleanVal = parseInt(item.val(), 10), w = this, t = 0;
            if (this.options.mode === "durationbox") {
                w.d.intHTML.find("input").each(function() {
                    cleanVal = parseInt($(this).val(), 10);
                    switch ($(this).data("field")) {
                      case "d":
                        t += 60 * 60 * 24 * cleanVal;
                        break;

                      case "h":
                        t += 60 * 60 * cleanVal;
                        break;

                      case "i":
                        t += 60 * cleanVal;
                        break;

                      case "s":
                        t += cleanVal;
                        break;
                    }
                });
                w.theDate.setTime(w.initDate.getTime() + t * 1e3);
            } else {
                if (item.data("field") === "M") {
                    tmp = w.__("monthsOfYearShort").indexOf(item.val());
                    if (tmp > -1) {
                        w.theDate.setMonth(tmp);
                    }
                }
                if (item.val() !== "" && item.val().toString().search(/^[0-9]+$/) === 0) {
                    switch (item.data("field")) {
                      case "y":
                        w.theDate.setD(0, cleanVal);
                        break;

                      case "m":
                        w.theDate.setD(1, cleanVal - 1);
                        break;

                      case "d":
                        w.theDate.setD(2, cleanVal);
                        break;

                      case "h":
                        w.theDate.setD(3, cleanVal);
                        break;

                      case "i":
                        w.theDate.setD(4, cleanVal);
                        break;

                      case "s":
                        w.theDate.setD(5, cleanVal);
                        break;
                    }
                }
            }
            setTimeout(function() {
                w.refresh();
            }, 150);
        }
    });
})(jQuery);

(function($) {
    $(document).ready(function() {
        $("[data-role='datebox']").each(function() {
            $(this).datebox();
        });
    });
})(jQuery);