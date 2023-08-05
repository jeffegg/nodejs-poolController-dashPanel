(function ($) {
    $.widget("pic.valveManager", {
        options: { socket: null },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initLogs();
            el[0].reset = function () { self._reset(); };
        },
        _createControllerPanel: function (data) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picController').each(function () { this.initController(data); });
        },
        _clearPanels: function () {
            var self = this, o = self.options, el = self.element;
            el.find('div.picController').each(function () { this.initController(); });
        },
        _reset: function () {
            var self = this, o = self.options, el = self.element;
            if (o.socket && typeof o.socket !== 'undefined' && o.socket.connected) {
                o.socket.close();
            }
            o.socket = null;
            self._initLogs();
        },

        _initLogs: function () {
            var self = this, o = self.options, el = self.element;
            console.log('initializing state');
            $.getLocalService('/config/serviceUri', null, function (cfg, status, xhr) {
                console.log(cfg);
                o.apiServiceUrl = cfg.protocol + cfg.ip + (typeof cfg.port !== 'undefined' && !isNaN(cfg.port) ? ':' + cfg.port : '');
                o.useProxy = makeBool(cfg.useProxy);
                $('body').attr('data-apiserviceurl', o.apiServiceUrl);
                $('body').attr('data-apiproxy', o.useProxy);
                $.getApiService('/state/all', null, function (state, status, xhr) {
                    $('body').attr('data-controllertype', state.equipment.controllerType);
                    self._createControllerPanel(state);
                    self._initSockets();
                    console.log(state);
                    self._createControllerPanel(state);
                })
                    .done(function (status, xhr) { console.log('Done:' + status); })
                    .fail(function (xhr, status, error) { console.log('Failed:' + error); self._clearPanels(); });
                $.getApiService('/config/options/valves', null, `Loading Options...`, function (opts, status, xhr) {
                    console.log(opts);
                    var valves = opts.valves;

                    //$('<table class="queue-list-header"><tbody><tr><td></td><td>Name</td><td>ID</td><td>Type</td><td>Address</td><td>UUID</td><td></td></tr></tbody></table>').appendTo(div);
                    var div = el.find('div.queue-send-list');

                    for (var i = 0; i < valves.length; i++) {
                        $('<span></span>').appendTo(div).addClass('queued-message-name').text(valves[i].name).appendTo(div);
                        $('<span></span>').appendTo(div).addClass('queued-message-id').text(valves[i].id).appendTo(div);
                        $('<span></span>').appendTo(div).addClass('queued-message-type').text(valves[i].type).appendTo(div);
                        $('<span></span>').appendTo(div).addClass('queued-message-address').text(valves[i].address).appendTo(div);
                        $('<span></span>').appendTo(div).addClass('queued-message-uuid').text(valves[i].UUID).appendTo(div);
                        $('<div></div>').appendTo(div);
                        //$('<div></div>').appendTo(pnl).pnlValveConfig({ valveTypes: opts.valveTypes, maxValves: opts.maxValves, circuits: opts.circuits, servers: opts.servers })[0].dataBind(valves[i]);
                    }



                    var pnl = $('<div></div>').addClass('pnlValves').appendTo(el);
                    var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(el);
                    $('<div id="btnAddValve"></div>').appendTo(btnPnl).actionButton({ text: 'Add Valve', icon: '<i class="fas fa-plus"></i>' })
                        .on('click', function (e) {
                            var id = 0;
                            // el.find('input[data-bind=isVirtual]').each(function () {
                            //     if ($(this).val()) id++;
                            // });
                            var acc = $('<div></div>').appendTo(pnl).pnlValveConfig({ valveTypes: opts.valveTypes, maxValves: opts.maxValves, circuits: opts.circuits, servers: opts.servers });
                            acc[0].dataBind({
                                isIntake: false,
                                isReturn: false,
                                // isVirtual: true,
                                isActive: true,
                                master: 1,
                                type: 0,
                                id: -1,
                                name: 'Valve V' + (id + 1),
                                circuit: 256,
                                address: 179,
                                fwVersion: 0,
                                fwDate: 0,
                                did: 0,
                                rid: 0,
                                fwTag: 0,
                                fwBranch: 0,
                                UUID: [],
                                resetReason: "Unknown"
                            });
                            acc.find('div.picAccordian')[0].expanded(true);
                        });
                    btnSave.on('click', function (e) {
                        var p = $(e.target).parents('div.picAccordian-contents:first');
                        var v = dataBinder.fromElement(p);
                        console.log(v);
                        if (dataBinder.checkRequired(p)) {
                            $.putApiService('/config/valve', v, 'Saving Valve: ' + v.name + '...', function (data, status, xhr) {
                                console.log({ data: data, status: status, xhr: xhr });
                                self.dataBind(data);
                            });
                        }
                    });
                });

            });

        },
        _initSockets: function () {
            var self = this, o = self.options, el = self.element;
            if (!o.useProxy) {
                console.log({ msg: 'Checking Url', url: o.apiServiceUrl });
                o.socket = io(o.apiServiceUrl, { reconnectionDelay: 2000, reconnection: true, reconnectionDelayMax: 20000, upgrade: true });
            }
            else {
                let path = window.location.pathname.replace(/[^/]*$/, '') + 'socket.io';
                console.log({ msg: 'Connecting socket through proxy', url: window.location.origin.toString(), path: path });
                o.socket = io(window.location.origin.toString(), { path: path, reconnectionDelay: 2000, reconnection: true, reconnectionDelayMax: 20000, upgrade: true });
            }
            o.socket.on('controller', function (data) {
                console.log({ evt: 'controller', data: data });
                $('div.picController').each(function () {
                    console.log('setting controller');
                    this.setControllerState(data);
                });
            });
            o.socket.on('equipment', function (data) {
                console.log({ evt: 'equipment', data: data });
                $('body').attr('data-controllertype', data.controllerType);
                $('div.picController').each(function () {
                    this.setEquipmentState(data);
                });
            });
            o.socket.on('logMessage', function (data) {
                //console.log({ evt: 'logMessage', data: data });
                $('div.picMessages').each(function () {
                    this.addMessage(data);
                });
                var evt = $.Event('messageReceived');
                evt.message = data;
                el.trigger(evt);
            });
            o.socket.on('connect_error', function (data) {
                console.log('connection error:' + data);
                o.isConnected = false;
                $('div.picController').each(function () {
                    this.setConnectionError({ status: { val: 255, name: 'error', desc: 'Connection Error' } });
                });
                el.find('div.picControlPanel').each(function () {
                    //$(this).addClass('picDisconnected');
                    $('div.picMessages').each(function () {
                        //this.receivingMessages(false);
                    });
                });

            });
            o.socket.on('connect_timeout', function (data) {
                console.log('connection timeout:' + data);
            });
            o.socket.on('reconnect', function (data) {
                console.log('reconnect:' + data);
            });
            o.socket.on('reconnect_attempt', function (data) {
                console.log('reconnect attempt:' + data);
            });
            o.socket.on('reconnecting', function (data) {
                console.log('reconnecting:' + data);
            });
            o.socket.on('reconnect_failed', function (data) {
                console.log('reconnect failed:' + data);
            });
            o.socket.on('connect', function (sock) {
                console.log({ msg: 'socket connected:', sock: sock });
                o.isConnected = true;
                el.find('div.picControlPanel').each(function () {
                    $(this).removeClass('picDisconnected');
                });
                // Find out if we should be receiving messages and
                // reconnect if so.
                self.receiveLogMessages($('div.picMessages:first')[0].receivingMessages());
                //self.receiveLogMessages(o.receiveLogMessages);
            });
            o.socket.on('close', function (sock) {
                console.log({ msg: 'socket closed:', sock: sock });
                o.isConnected = false;
            });
        }
    });
    $.widget("pic.sendMessageQueue", {
        options: {},
        msgQueue: [],
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el[0].bindQueue = function (queue) { self.bindQueue(queue); };
            el[0].newQueue = function () { self.newQueue(); };
            el[0].addMessage = function (msg) { self.addMessage(msg); };
            el[0].saveMessage = function (msg) { self.saveMessage(msg); };
            el[0].saveQueue = function () { self.saveQueue(); };
            el[0].loadQueue = function (id) { self.loadQueue(id); };
            self._initQueue();
        },
        _fromWindow: function(showError) {
            var self = this, o = self.options, el = self.element;
            var queue = dataBinder.fromElement(el);
            queue.messages = [];
            el.find('div.queue-send-list > div.queued-message').each(function () {
                queue.messages.push($(this).data('message'));
            });
            return queue;
        },
        _initQueue: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            div = $('<div class="picMessageListTitle picControlPanelTitle control-panel-title"></div>').appendTo(el);
            $('<span>Valve List</span>').appendTo(div);
            div = $('<div class="queue-detail-panel"></div>').appendTo(el);

            var line = $('<div class="dataline"></div>').appendTo(div);

            $('<input type="hidden" data-datatype="int" data-bind="id"></input>').appendTo(line);
            $('<label>Name:</label>').appendTo(line);
            $('<span data-bind="name"></span>').appendTo(line).attr('data-bind', 'name');
            line = $('<div class="dataline"></div>').appendTo(div);
            $('<label>Description:</label>').appendTo(line);
            $('<span data-bind="description"></span>').appendTo(line).attr('data-bind', 'description');

            // Header for the queue list.
            div = $('<div class="queue-list-header"></div>').appendTo(el);
            $('<table class="queue-list-header"><tbody><tr><td></td><td>Name</td><td>ID</td><td>Type</td><td>Address</td><td>UUID</td><td></td></tr></tbody></table>').appendTo(div);
            div = $('<div class="queue-send-list"></div>').appendTo(el);



            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(el);

            el.on('click', 'div.queued-message-remove', function (evt) {
                if (el.hasClass('processing')) return;
                $(evt.currentTarget).parents('div.queued-message:first').remove();
            });
            el.on('click', 'div.picLoadQueue', function (evt) {
                var pnl = $(evt.currentTarget).parents('div.picSendMessageQueue');
                var divPopover = $('<div></div>');
                divPopover.appendTo(el.parent().parent());
                divPopover.on('initPopover', function (e) {
                    $('<div></div>').appendTo(e.contents()).loadQueue();
                    e.stopImmediatePropagation();
                });
                divPopover.popover({ autoClose: false, title: 'Load Saved Queue', popoverStyle: 'modal', placement: { target: $('div.picMessageListTitle:first') } });
                divPopover[0].show($('div.picMessageListTitle:first'));
                evt.preventDefault();
                evt.stopImmediatePropagation();

            });
            el.on('click', 'div.queued-message-edit', function (evt) {
                if (el.hasClass('processing')) return;
                var row = $(evt.currentTarget).parents('div.queued-message:first');
                var msg = row.data('message');
                row.addClass('selected');
                var divPopover = $('<div></div>');
                divPopover.appendTo(el.parent().parent());
                divPopover.on('initPopover', function (e) {
                    $('<div></div>').appendTo(e.contents()).editMessage({ msgNdx: row[0].rowIndex, message: msg });
                    e.stopImmediatePropagation();
                });
                divPopover.on('beforeClose', function (e) {
                    row.removeClass('selected');
                });
                divPopover.popover({ autoClose: false, title: 'Edit Message', popoverStyle: 'modal', placement: { target: $('div.picMessageListTitle:first') } });
                divPopover[0].show($('div.picMessageListTitle:first'));
                evt.preventDefault();
                evt.stopImmediatePropagation();
            });
            el.on('click', 'div.picEditQueue', function (evt) {
                self._openEditQueue();
                evt.preventDefault();
                evt.stopImmediatePropagation();
            });
            el.on('click', 'div.picSaveQueue', function (evt) {
                var queue = self._fromWindow();
                console.log(queue);
                if (typeof queue.id === 'number' && !isNaN(queue.id) && queue.id > 0)
                    self.saveQueue();
                else
                    self._openEditQueue();
            });
            el.on('click', 'div.picClearQueue', function (evt) { self.newQueue(); });
            self.newQueue();
        },
        _openEditQueue: function () {
            var self = this, o = self.options, el = self.element;
            var q = dataBinder.fromElement(el);
            var divPopover = $('<div></div>');
            divPopover.appendTo(el.parent().parent());
            divPopover.on('initPopover', function (e) {
                $('<div></div>').appendTo(e.contents()).editQueue({ queue: q });
                e.stopImmediatePropagation();
            });
            divPopover.popover({ autoClose: false, title: 'Edit Queue', popoverStyle: 'modal', placement: { target: $('div.picMessageListTitle:first') } });
            divPopover[0].show($('div.picMessageListTitle:first'));
        },
        bindQueue: function (queue) {
            var self = this, o = self.options, el = self.element;
            var pnl = el.find('div.queue-detail-panel');
            dataBinder.bind(pnl, queue);
            if (typeof queue.messages !== 'undefined') {
                // Bind up all the messages.
                el.find('div.queue-send-list').empty();
                for (var i = 0; i < queue.messages.length; i++) {
                    self.addMessage(queue.messages[i]);
                }
            }
            if (queue.type === 'testModule') {
                el.find('div.queue-list-header').hide();
                el.find('div.queue-send-list').hide();
                el.find('#btnRunTests').hide();
                el.find('#btnAddMessage').hide();
                el.find('#btnSendQueue').hide();
                el.find('#btnReplayQueue').hide();
                el.find('div.picEditQueue').hide();
                el.find('div.picSaveQueue').hide();
                //$('script#scriptTestModule').remove();
                if (typeof outModule !== 'undefined') delete typeof outModule;
                $.getScript('scripts/messages/testModules/' + queue._fileName, // + '?ver=' + new Date().getTime(),
                    function (data, status, xhr) {
                        console.log({ outModule: outModule, data: data, status: status, xhr: xhr });
                        el.find('#btnRunTests').show();
                    });
                //var script = $('<script></script>')
                //    .attr('id', 'scriptTestModule')
                //    .attr('src', 'scripts/messages/testModules/' + queue._fileName)
                //    .attr('type', 'text/javascript');
                //script.on('load', function (evt) {
                //    console.log(evt);
                //    el.find('#btnRunTests').show();
                //});
                //script.appendTo(document.head);
            }
            else {
                //$('script#scriptTestModule').remove();
                if (typeof outModule !== 'undefined') delete typeof outModule;
                el.find('div.queue-list-header').show();
                el.find('div.queue-send-list').show();
                el.find('#btnRunTests').hide();
                el.find('#btnAddMessage').show();
                el.find('#btnSendQueue').show();
                el.find('#btnReplayQueue').show();
                el.find('div.picEditQueue').show();
                el.find('div.picSaveQueue').show();
            }
        },
        saveQueue: function () {
            var self = this, o = self.options, el = self.element;
            var queue = self._fromWindow(true);
            $.putLocalService('/messages/queue', queue, 'Saving Queue...', function (data, status, xhr) {
                self.bindQueue(data);
            });
        },
        newQueue: function () { this.bindQueue({ id: 0, name: '', description: '', messages: [] }); },
        addMessage: function (msg) { this.saveMessage(msg); },
        saveMessage: function (msg) {
            var self = this, o = self.options, el = self.element;
            // Clean up the message and deal with a copy.  We wany the reference to be new
            // so that edits aren't changing the original message.
            msg = $.extend(true, {}, msg);
            msg.direction = 'out';
            delete msg.isValid;
            delete msg.packetCount;
            delete msg.complete;
            delete msg.timestamp;
            delete msg._complete;
            if (typeof msg.delay === 'undefined') msg.delay = 0;

            var list = el.find('div.queue-send-list');
            var div = list.find('div.queued-message.selected');
            if (div.length === 0) div = $('<div class="queued-message"></div>').appendTo(list);
            div.empty();
            $('<div class="queued-message-edit mmgrButton"><i class="fas fa-edit"></i></div>').appendTo(div);
            $('<span></span>').appendTo(div).addClass('queued-message-proto').text(msg.protocol).appendTo(div);
            $('<span></span>').appendTo(div).addClass('queued-message-srcdest').text(mhelper.mapSourceByte(msg) + ',' + mhelper.mapDestByte(msg)).appendTo(div);
            $('<span></span>').appendTo(div).addClass('queued-message-action').text(mhelper.mapActionByte(msg)).appendTo(div);
            $('<span></span>').appendTo(div).addClass('queued-message-payload').text(msg.payload.join(',')).appendTo(div);
            $('<span></span>').appendTo(div).addClass('queued-message-delay').text(msg.delay || 0).appendTo(div);
            $('<div class="queued-message-remove mmgrButton"><i class="fas fa-trash-alt"></i></div>').appendTo(div);
            div.data('message', msg);
        },
        loadQueue: function (id) {
            var self = this, o = self.options, el = self.element;
            $.getLocalService('/messages/queue/' + id, undefined, function (data, status, xhr) {
                console.log(data);
                self.bindQueue(data);
            });
        },
        sendQueue: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('processing');
            // Send out the messages on the interval.
            el.find('div.queued-message').each(function () {
                self.msgQueue.push(this);
            });
            o.messagesToSend = self.msgQueue.length;
            o.messagesSent = 0;
            el.find('div.picMessageListTitle:first > span').text('Sending Messages...');

            self.processNextMessage();
        },
        replayQueue: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('processing');
            // Send out the messages on the interval.
            el.find('div.queued-message').each(function () {
                self.msgQueue.push(this);
            });
            o.messagesToSend = self.msgQueue.length;
            o.messagesSent = 0;
            el.find('div.picMessageListTitle:first > span').text('Sending Messages...');

            self.processNextMessage(true);
        },
        processNextMessage: function (toApp) {
            var self = this, o = self.options, el = self.element;
            var mm = $('div.picMessageManager')[0];
            if (self.msgQueue.length > 0) {
                var elMsg = $(self.msgQueue.shift());
                if (elMsg) {
                    var msg = elMsg.data('message');
                    el.find('div.queued-message').removeClass('sending');
                    elMsg.addClass('sending');
                    if (msg) {
                        setTimeout(function () {
                            o.messagesSent++;
                            elMsg.addClass('sent');
                            if (toApp){
                                mm.sendInboundMessage(msg);
                                self.processNextMessage(true);
                            }
                            else {
                                mm.sendOutboundMessage(msg);
                                self.processNextMessage();
                            }
                        }, (msg.delay || 0));
                    }
                }
            }
            else {
                el.find('div.queued-message').removeClass('sending').removeClass('sent');
                el.removeClass('processing');
                el.find('div.picMessageListTitle:first > span').text('Send Message Queue');
                $('<div></div>').appendTo(el.find('div.picMessageListTitle:first > span')).fieldTip({
                    message: `${o.messagesSent} of ${o.messagesToSend} queued messages sent` });
            }
        }
    });
})(jQuery);
(function ($) {
    $.widget('pic.pnlValveConfig', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('picConfigCategory cfgValve');
            var binding = '';
            var acc = $('<div></div>').appendTo(el).accordian({
                columns: [{ binding: 'name', glyph: 'fas fa-compass', style: { width: '9rem' } }, { binding: 'type', style: { width: '14rem', textAlign: 'center' } }, { binding: 'circuit', style: { width: '8rem' } } ]
            });
            var pnl = acc.find('div.picAccordian-contents');
            var line = $('<div></div>').appendTo(pnl);
            $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'id').appendTo(line);
            $('<input type="hidden" data-datatype="bool"></input>').attr('data-bind', 'isIntake').appendTo(line);
            $('<input type="hidden" data-datatype="bool"></input>').attr('data-bind', 'isReturn').appendTo(line);
            // $('<input type="hidden" data-datatype="bool"></input>').attr('data-bind', 'isVirtual').appendTo(line);
            $('<div></div>').appendTo(line).inputField({ required: true, labelText: 'Name', binding: binding + 'name', inputAttrs: { maxlength: 16 }, labelAttrs: { style: { marginLeft: '.25rem', width:'3rem' } } });
            $('<div></div>').appendTo(line).pickList({
                required: true, bindColumn: 0, displayColumn: 2, labelText: 'Type', binding: binding + 'type',
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: true, text: 'Code', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Valve Type', style: { whiteSpace: 'nowrap' } }],
                items: o.valveTypes, inputAttrs: { style: { width: '7rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
            });
            $('<div></div>').appendTo(line).pickList({
                required: true, bindColumn: 0, displayColumn: 1, labelText: 'Circuit', binding: binding + 'circuit',
                columns: [{ binding: 'id', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Circuit', style: { whiteSpace: 'nowrap' } }],
                items: o.circuits, inputAttrs: { style: { width: '9rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
            });
            line = $('<div></div>').appendTo(pnl);
            $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Pin Id', binding: binding + 'pinId', min: 0, max: 100, step: 1, units: '', inputAttrs: { maxlength: 5 }, labelAttrs: { style: { marginLeft: '.25rem', width: '3rem'  } } });
            line = $('<div></div>').appendTo(pnl);

            // Add Intellivalve panel
            var iValveAllFWPnl = $('<div></div>').addClass('pnlIValveAllFW').appendTo(pnl).hide();
            line = $('<div></div>').appendTo(iValveAllFWPnl);
            $('<div></div>').appendTo(iValveAllFWPnl).staticField({
                labelText: 'FW Type:',
                binding: binding + 'fwType',
                inputAttrs: {style: {width: '5rem', textAlign: 'left'}},
                labelAttrs: {style: {marginLeft: '.5rem', width: '3rem', fontWeight: 'bold'}}
            }).css({fontSize: '10pt', lineHeight: '1'});
            $('<div></div>').appendTo(iValveAllFWPnl).staticField({
                labelText: 'UUID:',
                binding: binding + 'UUID',
                inputAttrs: {style: {width: '5rem', textAlign: 'left'}},
                labelAttrs: {style: {marginLeft: '.5rem', width: '3rem', fontWeight: 'bold'}}
            }).css({fontSize: '10pt', lineHeight: '1'});
            var iValvePnl = $('<div></div>').addClass('pnlIValve').appendTo(pnl).hide();
            //line = $('<div></div>').appendTo(iValvePnl);
            $('<div></div>').appendTo(iValvePnl).valueSpinner({
                labelText: 'RS485 Address',
                binding: binding + 'address',
                min: 160,
                max: 180,
                step: 1,
                units: '',
                inputAttrs: {maxlength: 5},
                labelAttrs: {style: {marginLeft: '.25rem', width: '7.25rem'}}
            });
            $('<div></div>').appendTo(iValvePnl).valueSpinner({
                labelText: 'ID',
                binding: binding + 'id',
                min: 160,
                max: 180,
                step: 1,
                units: '',
                inputAttrs: {maxlength: 5},
                labelAttrs: {style: {marginLeft: '.25rem', width: '7.25rem'}}
            });
            $('<div></div>').appendTo(iValvePnl).valueSpinner({
                labelText: 'Endstop 0',
                binding: binding + 'endstop0Value',
                min: 0,
                max: 48,
                step: 1,
                units: '',
                inputAttrs: {maxlength: 5},
                labelAttrs: {style: {marginLeft: '1rem', width: '5.25rem'}}
            });
            $('<div></div>').appendTo(iValvePnl).valueSpinner({
                labelText: 'Endstop 24',
                binding: binding + 'endstop24Value',
                min: 0,
                max: 48,
                step: 1,
                units: '',
                inputAttrs: {maxlength: 5},
                labelAttrs: {style: {marginLeft: '1rem', width: '5.25rem'}}
            });
            line = $('<div></div>').appendTo(iValvePnl);
            $('<div></div>').appendTo(iValvePnl).staticField({
                labelText: 'Selected Endstop:',
                binding: binding + 'selectedEndstop',
                inputAttrs: {style: {width: '5rem', textAlign: 'left'}},
                labelAttrs: {style: {marginLeft: '.5rem', width: '8rem', fontWeight: 'bold'}}
            }).css({fontSize: '10pt', lineHeight: '1'});
            $('<div></div>').appendTo(iValvePnl).staticField({
                labelText: 'Valve Mode:',
                binding: binding + 'currentMode',
                inputAttrs: {style: {width: '5rem', textAlign: 'left'}},
                labelAttrs: {style: {marginLeft: '.5rem', width: '8rem', fontWeight: 'bold'}}
            }).css({fontSize: '10pt', lineHeight: '1'});
            $('<div></div>').appendTo(iValvePnl).staticField({
                labelText: 'Valve Position:',
                binding: binding + 'currentPosition',
                dataType: 'number',
                fmtMask: '#,##0.0#',
                emptyMask: '----',
                units: '&deg',
                inputAttrs: {style: {width: '5rem', textAlign: 'left'}},
                labelAttrs: {style: {marginLeft: '.5rem', width: '8rem', fontWeight: 'bold'}}
            }).css({fontSize: '10pt', lineHeight: '1'});

            line = $('<div></div>').appendTo(iValvePnl);
            $('<div></div>').appendTo(iValvePnl).staticField({
                labelText: 'FW Tag:',
                binding: binding + 'fwTag',
                inputAttrs: {style: {width: '5rem', textAlign: 'left'}},
                labelAttrs: {style: {marginLeft: '.5rem', width: '5.5rem', fontWeight: 'bold'}}
            }).css({fontSize: '10pt', lineHeight: '1'});
            $('<div></div>').appendTo(iValvePnl).staticField({
                labelText: 'FW Branch:',
                binding: binding + 'fwBranch',
                inputAttrs: {style: {width: '5rem', textAlign: 'left'}},
                labelAttrs: {style: {marginLeft: '.5rem', width: '5.5rem', fontWeight: 'bold'}}
            }).css({fontSize: '10pt', lineHeight: '1'});
            $('<div></div>').appendTo(iValvePnl).staticField({
                labelText: 'GIT Hash:',
                binding: binding + 'fwVersion',
                dataType: 'number',
                fmtMask: '0x',
                emptyMask: '----',
                units: '',
                inputAttrs: {style: {width: '5rem', textAlign: 'left'}},
                labelAttrs: {style: {marginLeft: '.5rem', width: '5.5rem', fontWeight: 'bold'}}
            }).css({fontSize: '10pt', lineHeight: '1'});
            $('<div></div>').appendTo(iValvePnl).staticField({
                labelText: 'FW Date:',
                binding: binding + 'fwDate',
                dataType: 'number',
                fmtMask: '0xDate',
                emptyMask: '----',
                units: '',
                inputAttrs: {style: {width: '5rem', textAlign: 'left'}},
                labelAttrs: {style: {marginLeft: '.5rem', width: '4rem', fontWeight: 'bold'}}
            }).css({fontSize: '10pt', lineHeight: '1'});
            line = $('<div></div>').appendTo(iValvePnl);
            $('<div></div>').appendTo(iValvePnl).staticField({
                labelText: 'DID:',
                binding: binding + 'did',
                dataType: 'number',
                fmtMask: '0x',
                emptyMask: '----',
                units: '',
                inputAttrs: {style: {width: '5rem', textAlign: 'left'}},
                labelAttrs: {style: {marginLeft: '.5rem', width: '2rem', fontWeight: 'bold'}}
            }).css({fontSize: '10pt', lineHeight: '1'});
            $('<div></div>').appendTo(iValvePnl).staticField({
                labelText: 'RID:',
                binding: binding + 'rid',
                dataType: 'number',
                fmtMask: '0x',
                emptyMask: '----',
                units: '',
                inputAttrs: {style: {width: '5rem', textAlign: 'left'}},
                labelAttrs: {style: {marginLeft: '.5rem', width: '2rem', fontWeight: 'bold'}}
            }).css({fontSize: '10pt', lineHeight: '1'});
            line = $('<div></div>').appendTo(iValvePnl);
            $('<div></div>').appendTo(iValvePnl).staticField({
                labelText: 'Last Reset Reason:',
                binding: binding + 'resetReason',
                inputAttrs: {style: {width: '5rem', textAlign: 'left'}},
                labelAttrs: {style: {marginLeft: '.5rem', width: '8rem', fontWeight: 'bold'}}
            }).css({fontSize: '10pt', lineHeight: '1'});

            $('<hr></hr>').appendTo(iValvePnl).css({ margin: '3px' });
            var tabs = $('<div></div>').appendTo(iValvePnl).tabBar();
            var tab = tabs[0].addTab({ id: 'tabValveCircuits', text: 'Circuits' });

            var pnlCircuits = $('<div class="cfgValve-pnlCircuits" style="text-align:right;"></div>').appendTo(tab);
            line = $('<div class="picCircuitsList-btnPanel"></div>').appendTo(pnlCircuits);
            $('<div><span>Valve Circuits</span></div>').appendTo(line);
            var btnCPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(line);
            var btnAddCircuit = $('<div></div>').appendTo(btnCPnl).actionButton({ text: 'Add Circuit', icon: '<i class="fas fa-plus" ></i>' });
            btnAddCircuit.on('click', function (e) {
                self.addCircuit({});
            });

            var clist = $('<div class="picCircuitsList-list" style="min-width:25rem;"></div>').appendTo(pnlCircuits);
            clist.on('click', 'i.picRemoveOption', function (e) {
                $(e.target).parents('div.picCircuitOption:first').remove();
                var rgx = /\[[0-9]\]/g;
                el.find('div.picCircuitsList-list:first > div.picCircuitOption').each(function (ndx) {
                    $(this).find('*[data-bind^="circuits["]').each(function () {
                        var bind = $(this).attr('data-bind');
                        $(this).attr('data-bind', bind.replace(rgx, '[' + ndx + ']'));
                    });
                });
            });
            clist.on('selchanged', 'div.picPickList[data-bind$=units]', function (e) {
                if (typeof e.oldItem !== 'undefined') {
                    var pmp = dataBinder.fromElement(el);
                    self.dataBind(pmp);
                }
            });

            tabs[0].showTab('tabValveCircuits', true);


            line = $('<div></div>').appendTo(iValvePnl);
            var bindpnl = $('<div></div>').addClass('pnlDeviceBinding').REMBinding({ servers: o.servers }).appendTo(pnl).hide();
            $('<hr></hr>').prependTo(bindpnl);


            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(pnl);
            var btnSave = $('<div id="btnSaveValve"></div>').appendTo(btnPnl).actionButton({ text: 'Save Valve', icon: '<i class="fas fa-save"></i>' });
            btnSave.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                console.log(v);
                if (dataBinder.checkRequired(p)) {
                    $.putApiService('/config/valve', v, 'Saving Valve: ' + v.name + '...', function (data, status, xhr) {
                        console.log({ data: data, status: status, xhr: xhr });
                        self.dataBind(data);
                    });
                }
            });
            var btnDelete = $('<div id="btnDeleteValve"></div>').appendTo(btnPnl).actionButton({ text: 'Delete Valve', icon: '<i class="fas fa-trash"></i>' });
            btnDelete.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                console.log(v);
                $.pic.modalDialog.createConfirm('dlgConfirmDeleteValve', {
                    message: 'Are you sure you want to delete Valve ' + v.name + '?',
                    width: '350px',
                    height: 'auto',
                    title: 'Confirm Delete Valve',
                    buttons: [{
                        text: 'Yes', icon: '<i class="fas fa-trash"></i>',
                        click: function () {
                            $.pic.modalDialog.closeDialog(this);
                            if (v.id <= 0) p.parents('div.picConfigCategory.cfgValve:first').remove();
                            else {
                                console.log('Deleting Valve');
                                $.deleteApiService('/config/valve', v, 'Deleting Valve...', function (c, status, xhr) {
                                    p.parents('div.picConfigCategory.cfgValve:first').remove();
                                });
                            }
                        }
                    },
                        {
                            text: 'No', icon: '<i class="far fa-window-close"></i>',
                            click: function () { $.pic.modalDialog.closeDialog(this); }
                        }]
                });
            });

        },
        addCircuit: function (circ) {
            var self = this, o = self.options, el = self.element;
            var clist = el.find('div.picCircuitsList-list:first');
            var circuits = clist.find('div.picCircuitOption');
            var line = $('<div class="picCircuitOption"></div>').appendTo(clist);
            var binding = 'circuits[' + circuits.length + '].';

            $('<div></div>').appendTo(line).pickList({
                required: true,
                labelText: 'Circuit', binding: binding + 'circuit', value: circ.circuit,
                columns: [{ binding: 'id', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Circuit', style: { whiteSpace: 'nowrap' } }],
                style: {marginLeft: '.25rem'},
                items: o.circuits, inputAttrs: { style: { width: '9rem' } }, labelAttrs: { style: { marginLeft: '.25rem', display: 'none' } }
            });


            $('<div></div>').appendTo(line).valueSpinner({
                labelText: 'Endstop 0',

                binding: binding + 'endstop0Value',
                min: 0,
                max: 48,
                step: 1,
                units: '',
                inputAttrs: {maxlength: 5},
                labelAttrs: {style: {marginLeft: '1rem', width: '5.25rem'}},
                canEdit: true
            });


            $('<div></div>').appendTo(line).valueSpinner({
                labelText: 'Endstop 24',
                binding: binding + 'endstop24Value',

                min: 0,
                max: 48,
                step: 1,
                units: '',
                inputAttrs: {maxlength: 5},
                labelAttrs: {style: {marginLeft: '1rem', width: '5.25rem'}},
                canEdit: true
            });
            $('<i class="fas fa-trash picRemoveOption" style="margin-left:.25rem"></i>').appendTo(line);
        },
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            var acc = el.find('div.picAccordian:first');
            var cols = acc[0].columns();
            var type = o.valveTypes.find(elem => elem.val === obj.type);
            var circuit = o.circuits.find(elem => elem.id === obj.circuit);
            cols[0].elText().text(obj.name);
            cols[1].elText().text(type.desc);
            var ddCircuit = el.find('div.picPickList[data-bind$=circuit]');
            var fldName = el.find('div.picInputField[data-bind$=name]');
            if (makeBool(obj.isIntake) || makeBool(obj.isReturn)) {
                ddCircuit.hide()[0].required(false);
                fldName[0].disabled(true);
                cols[2].elText().text('Pool/Spa');
                //el.find('div.picBtnPanel').hide();
            }
            else {
                ddCircuit.show()[0].required(true);
                fldName[0].disabled(false);
                if (typeof circuit !== 'undefined')
                    cols[2].elText().text(circuit.name);
                else
                    cols[2].elText().text('');
            }
            el.find('div.picBtnPanel').show();
            if ((obj.type === 1)) el.find('div.pnlIValveAllFW').show();
            if ((obj.type === 1) && obj.fwType === "Eggys IVFW") el.find('div.pnlIValve').show();
            else el.find('div.pnlIValve').hide();

            if (obj.master === 1) el.find('div.pnlDeviceBinding').show();
            else el.find('div.pnlDeviceBinding').hide();

            if (makeBool(obj.isIntake)) el.find('div.picAccordian-titlecol:first > i:first').attr('class', 'fas fa-arrow-circle-right').css('color', 'red');
            else if (makeBool(obj.isReturn)) el.find('div.picAccordian-titlecol:first > i:first').attr('class', 'fas fa-arrow-circle-left').css('color', 'red');
            else if (makeBool(obj.isVirtual) || obj.master === 1) el.find('div.picAccordian-titlecol:first > i:first').attr('class', 'far fa-compass').css('color', '');
            else el.find('div.picAccordian-titlecol:first > i:first').attr('class', 'fas fa-compass').css('color', '');
            if (obj.isVirtual || obj.master === 1) {
                el.find('div.picValueSpinner[data-bind=pinId]').show();
                el.find('div.picActionButton#btnDeleteValve').show();
            }
            else {
                el.find('div.picValueSpinner[data-bind=pinId]').hide();
                el.find('div.picActionButton#btnDeleteValve').hide();
            }
            if (obj.isVirtual || obj.master === 1) {
                el.find('div.picValueSpinner[data-bind=address]').show();
                el.find('div.picActionButton#btnDeleteValve').show();
            }
            else {
                el.find('div.picValueSpinner[data-bind=address]').hide();
                el.find('div.picActionButton#btnDeleteValve').hide();
            }

            dataBinder.bind(el, obj);
        }
    });
})(jQuery); // Valve Panel